import { computed, onUnmounted, ref } from 'vue'
import type { MusicPlayMode, MusicTrack, OnlineMusic } from '@/tsInterface/index'
import { parseLyrics } from './lyrics'

const audioExtension = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm|mp4|aiff?)$/i
const imageExtension = /\.(jpe?g|png|webp|gif|avif|bmp)$/i
const lyricExtension = /\.(lrc|txt)$/i
const baseName = (name: string) => name.replace(/\.[^.]+$/, '').trim()
const assetKey = (name: string) => baseName(name).toLowerCase()
const shuffled = (ids: string[]) => {
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  }
  return ids
}

/** 音频和对象 URL 仅在应用存活期间保留，最小化不影响播放。 */
export function useMusicPlayer() {
  const tracks = ref<MusicTrack[]>([])
  const currentId = ref('')
  const currentTrack = computed(() => tracks.value.find((track) => track.id === currentId.value))
  const isPlaying = ref(false)
  const loading = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.7)
  const mode = ref<MusicPlayMode>('loop')
  const error = ref('')
  const lyricsLoading = ref(false)
  const lyricsError = ref('')
  const audio = new Audio()
  audio.preload = 'metadata'
  audio.volume = volume.value

  const ownedUrls = new Set<string>()
  const coverFiles = new Map<string, string>()
  const lyricFiles = new Map<string, File>()
  const lyricRequests = new Map<string, File>()
  let nextId = 0
  let playRequest = 0
  let disposed = false
  let shuffleBag: string[] = []
  let history: string[] = []
  let historyIndex = -1
  let lyricsController: AbortController | undefined
  const queue = computed(() => tracks.value.filter((track) => track.source === currentTrack.value?.source))

  const loadOnlineLyrics = async (track = currentTrack.value) => {
    lyricsController?.abort()
    lyricsLoading.value = false
    lyricsError.value = ''
    if (!track?.lyricsUrl || track.source !== 'online' || disposed) return
    const controller = new AbortController()
    lyricsController = controller
    lyricsLoading.value = true
    try {
      const response = await fetch(track.lyricsUrl, { signal: controller.signal })
      if (!response.ok) throw new Error('歌词加载失败，请重试')
      const text = await response.text()
      const target = tracks.value.find((item) => item.id === track.id && item.lyricsUrl === track.lyricsUrl)
      if (!disposed && !controller.signal.aborted && target) target.lyrics = parseLyrics(text)
    } catch (cause) {
      if (!disposed && !controller.signal.aborted) lyricsError.value = cause instanceof Error ? cause.message : '歌词加载失败，请重试'
    } finally {
      if (!disposed && !controller.signal.aborted) lyricsLoading.value = false
    }
  }

  const createUrl = (file: File) => {
    const url = URL.createObjectURL(file)
    ownedUrls.add(url)
    return url
  }

  const play = async () => {
    if (!currentTrack.value || disposed) return
    const request = ++playRequest
    loading.value = true
    error.value = ''
    try {
      await audio.play()
    } catch (cause) {
      if (disposed || request !== playRequest) return
      loading.value = false
      isPlaying.value = false
      if (cause instanceof Error && cause.name === 'AbortError') return
      error.value =
        cause instanceof Error && cause.name === 'NotAllowedError'
          ? '浏览器暂未允许播放，请再次点击播放。'
          : '无法播放这首歌曲，请确认文件完整且格式受浏览器支持。'
    }
  }

  const pause = () => {
    ++playRequest
    audio.pause()
    isPlaying.value = false
    loading.value = false
  }

  const remember = (id: string) => {
    if (mode.value !== 'shuffle') return
    shuffleBag = shuffleBag.filter((item) => item !== id)
    if (history[historyIndex] === id) return
    history = [...history.slice(0, historyIndex + 1), id]
    historyIndex = history.length - 1
  }

  const selectTrack = (id: string, autoplay = true, record = true) => {
    const track = tracks.value.find((item) => item.id === id)
    if (!track || disposed) return
    if (currentTrack.value && currentTrack.value.source !== track.source) { history = []; historyIndex = -1; shuffleBag = [] }
    if (record) remember(id)
    if (currentId.value !== id) {
      pause()
      currentId.value = id
      currentTime.value = 0
      duration.value = track.duration
      error.value = ''
      audio.src = track.url
      audio.load()
      lyricsController?.abort()
      lyricsLoading.value = false
      lyricsError.value = ''
      shuffleBag = shuffleBag.filter((item) => queue.value.some((entry) => entry.id === item))
      if (track.source === 'online' && !track.lyrics.text) void loadOnlineLyrics(track)
    }
    if (autoplay) void play()
  }

  const seek = (time: number) => {
    if (!currentTrack.value || !Number.isFinite(time) || duration.value <= 0) return
    audio.currentTime = Math.max(0, Math.min(duration.value, time))
    currentTime.value = audio.currentTime
  }

  const step = (direction: 1 | -1) => {
    if (!queue.value.length) return
    let target: string | undefined
    let record = true
    if (mode.value === 'shuffle') {
      const previousIndex = historyIndex + direction
      if (previousIndex >= 0 && previousIndex < history.length) {
        historyIndex = previousIndex
        target = history[historyIndex]
        record = false
      } else if (direction === -1) {
        target = currentId.value
      } else {
        if (!shuffleBag.length) {
          shuffleBag = shuffled(
            queue.value.map((track) => track.id).filter((id) => id !== currentId.value),
          )
        }
        target = shuffleBag.pop() ?? currentId.value
      }
    } else {
      const index = queue.value.findIndex((track) => track.id === currentId.value)
      const targetIndex = (index + direction + queue.value.length) % queue.value.length
      target = queue.value[targetIndex]?.id
    }
    if (!target) return
    if (target === currentId.value) seek(0)
    selectTrack(target, true, record)
  }

  const cycleMode = () => {
    const modes: MusicPlayMode[] = ['loop', 'single', 'shuffle']
    mode.value = modes[(modes.indexOf(mode.value) + 1) % modes.length]!
    history = currentId.value ? [currentId.value] : []
    historyIndex = history.length - 1
    shuffleBag = shuffled(
      queue.value.map((track) => track.id).filter((id) => id !== currentId.value),
    )
  }

  const setVolume = (value: number) => {
    if (!Number.isFinite(value)) return
    volume.value = Math.max(0, Math.min(1, value))
    audio.volume = volume.value
  }

  const attachLyrics = async (file: File, id = currentId.value) => {
    const track = tracks.value.find((item) => item.id === id)
    if (!track || !lyricExtension.test(file.name) || disposed) return
    lyricRequests.set(id, file)
    try {
      const buffer = await file.arrayBuffer()
      let text: string
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
      } catch {
        text = new TextDecoder('gb18030').decode(buffer)
      }
      if (!disposed && lyricRequests.get(id) === file) track.lyrics = parseLyrics(text)
    } catch {
      if (!disposed && lyricRequests.get(id) === file)
        error.value = '歌词文件读取失败，请重新选择。'
    }
  }

  const attachCover = (file: File, id = currentId.value) => {
    const track = tracks.value.find((item) => item.id === id)
    if (!track || !imageExtension.test(file.name) || disposed) return
    track.coverUrl = createUrl(file)
  }

  const importFiles = async (files: File[]) => {
    if (disposed) return
    const added: string[] = []
    const changedCovers = new Set<string>()
    const changedLyrics = new Set<string>()
    const knownFiles = new Set(tracks.value.map((track) => track.fileKey))
    let supported = 0
    for (const file of files) {
      const key = assetKey(file.name)
      if (file.type.startsWith('audio/') || audioExtension.test(file.name)) {
        supported++
        const fileKey = `${file.name}:${file.size}:${file.lastModified}`
        if (knownFiles.has(fileKey)) continue
        knownFiles.add(fileKey)
        const name = baseName(file.name)
        const separator = name.indexOf(' - ')
        const id = `local-${++nextId}`
        tracks.value.push({
          id,
          source: 'local',
          fileKey,
          fileName: file.name,
          title: separator > 0 ? name.slice(separator + 3) : name,
          artist: separator > 0 ? name.slice(0, separator) : '本地音乐',
          url: createUrl(file),
          lyrics: { lines: [], text: '' },
          duration: 0,
        })
        added.push(id)
      } else if (lyricExtension.test(file.name)) {
        supported++
        lyricFiles.set(key, file)
        changedLyrics.add(key)
      } else if (imageExtension.test(file.name)) {
        supported++
        coverFiles.set(key, createUrl(file))
        changedCovers.add(key)
      }
    }
    if (!supported && files.length) error.value = '请选择音频、LRC 歌词或封面图片。'
    else if (supported) error.value = ''
    if (!currentTrack.value || currentTrack.value.source === 'local') shuffleBag = shuffled([...shuffleBag, ...added])
    if (!currentId.value && tracks.value[0]) selectTrack(tracks.value[0].id, false)
    const lyrics: Promise<void>[] = []
    for (const track of tracks.value) {
      if (track.source !== 'local') continue
      const key = assetKey(track.fileName)
      const cover = coverFiles.get(key)
      if (cover && (!track.coverUrl || changedCovers.has(key))) track.coverUrl = cover
      const lyric = lyricFiles.get(key)
      if (lyric && (added.includes(track.id) || changedLyrics.has(key)))
        lyrics.push(attachLyrics(lyric, track.id))
    }
    await Promise.all(lyrics)
  }

  const setOnlineTracks = (items: OnlineMusic[]) => {
    if (disposed) return
    const previous = new Map(tracks.value.filter((track) => track.source === 'online').map((track) => [track.id, track]))
    const playing = currentTrack.value
    const online: MusicTrack[] = items.map((item) => ({
      id: item.id, source: 'online', fileName: item.fileName, title: item.title, artist: item.artist,
      url: item.url, coverUrl: item.coverUrl, lyricsUrl: item.lyricsUrl, duration: item.duration,
      lyrics: previous.get(item.id)?.lyricsUrl === item.lyricsUrl ? previous.get(item.id)!.lyrics : { lines: [], text: '' },
    }))
    // Keep the current song playing when searching or paging to a different result set.
    if (playing?.source === 'online' && !online.some((item) => item.id === playing.id)) online.unshift(playing)
    tracks.value = [...tracks.value.filter((track) => track.source === 'local'), ...online]
    const ids = new Set(queue.value.map((track) => track.id))
    history = history.filter((id) => ids.has(id))
    historyIndex = history.lastIndexOf(currentId.value)
    shuffleBag = shuffled([...ids].filter((id) => id !== currentId.value))
    if (playing?.source === 'online') {
      const updated = currentTrack.value
      if (updated?.url !== playing.url) {
        const resume = isPlaying.value
        pause()
        currentId.value = ''
        selectTrack(playing.id, resume)
      } else if (updated?.lyricsUrl !== playing.lyricsUrl) void loadOnlineLyrics(updated)
    }
  }

  const updateDuration = () => {
    duration.value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
    if (currentTrack.value) currentTrack.value.duration = duration.value
  }
  const events = {
    play: () => {
      isPlaying.value = true
    },
    playing: () => {
      isPlaying.value = true
      loading.value = false
    },
    pause: () => {
      isPlaying.value = false
      loading.value = false
    },
    waiting: () => {
      if (!audio.paused) loading.value = true
    },
    timeupdate: () => {
      currentTime.value = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
    },
    loadedmetadata: updateDuration,
    durationchange: updateDuration,
    ended: () => {
      isPlaying.value = false
      if (mode.value === 'single') {
        seek(0)
        void play()
      } else step(1)
    },
    error: () => {
      ++playRequest
      isPlaying.value = false
      loading.value = false
      error.value = '无法播放这首歌曲，请确认文件完整且格式受浏览器支持。'
    },
  }
  for (const [event, handler] of Object.entries(events)) audio.addEventListener(event, handler)

  onUnmounted(() => {
    disposed = true
    lyricsController?.abort()
    pause()
    for (const [event, handler] of Object.entries(events)) audio.removeEventListener(event, handler)
    audio.removeAttribute('src')
    audio.load()
    ownedUrls.forEach((url) => URL.revokeObjectURL(url))
    ownedUrls.clear()
    coverFiles.clear()
    lyricFiles.clear()
    lyricRequests.clear()
  })

  return {
    tracks,
    currentTrack,
    currentId,
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    mode,
    error,
    lyricsLoading,
    lyricsError,
    importFiles,
    attachLyrics,
    attachCover,
    selectTrack,
    setOnlineTracks,
    retryLyrics: () => void loadOnlineLyrics(),
    seek,
    setVolume,
    cycleMode,
    togglePlayback: () => (isPlaying.value || loading.value ? pause() : void play()),
    next: () => step(1),
    previous: () => step(-1),
  }
}
