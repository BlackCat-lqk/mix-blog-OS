<template>
  <transition name="slide" mode="out-in">
    <div
      v-show="eventStore.setPlayDetail.show"
      class="play-detail-main-box"
      :style="playDetailShellStyle"
    >
      <div class="header">
        <button type="button" class="back-icon" aria-label="收起播放页" @click="handleClose">
          <img src="@/assets/icon/down.svg" alt="" />
        </button>
        <div class="title">IKUN MUSIC</div>
        <!-- <div class="header-spacer" aria-hidden="true" /> -->
        <div ref="headerVolumeRef" class="header-volume">
          <button type="button" class="header-spacer" aria-label="音量控制" @click="toggleVolumePanel">
            <img :src="volumeBarValue > 0 ? VoiceIcon : VolumeDisableIcon" alt="" />
          </button>
          <div v-if="showVolume" class="header-volume-box">
            <input
              class="header-volume-range"
              type="range"
              min="0"
              max="100"
              :value="volumeBarValue"
              @input="changeVolume"
            />
          </div>
        </div>
      </div>
      <div class="media-stage media-stage--pc">
        <div class="cover-box cover-box-lyrics">
          <div class="lyrics-panel">
            <div
              v-if="lyricsPanelKind !== 'ok'"
              class="lyrics-placeholder"
              :class="{ 'lyrics-placeholder--error': lyricsPanelKind === 'load-error' }"
            >
              <p class="lyrics-placeholder__title">{{ lyricsPlaceholderTitle }}</p>
              <p v-if="lyricsPlaceholderHint" class="lyrics-placeholder__hint">
                {{ lyricsPlaceholderHint }}
              </p>
            </div>
            <div
              v-show="lyricsPanelKind === 'ok'"
              id="lyrics-display"
              ref="lyricsLinesRef"
              class="lyrics-container"
            ></div>
          </div>
        </div>
      </div>
      <div class="song-inform">
        <div class="song-name">
          <div class="name">{{ playList[currentSongIdx]?.title }}</div>
          <div class="singer">{{ playList[currentSongIdx]?.artist }}</div>
        </div>
      </div>
      <div class="control-box">
        <div class="control-item-box">
          <div class="add-box">
            <img src="@/assets/icon/addWhite.svg" @click="addToFavorites" />
          </div>
          <div class="shuffle" :class="{ 'mode-active': playMode === 'shuffle' }" @click="toggleShuffle">
            <img src="@/assets/icon/shuffle.svg" />
          </div>
          <div @click="prviousSong">
            <img src="@/assets/icon/previousSong.svg" />
          </div>
          <div class="play-box" @click="togglePlay">
            <img :src="isPlaying ? SuspendIcon : PlayIcon" />
          </div>
          <div @click="nextSong">
            <img src="@/assets/icon/nextSong.svg" />
          </div>
          <div class="repeat" :class="{ 'mode-active': isSingleLoop }" @click="loopControl">
            <img v-if="!isSingleLoop" src="@/assets/icon/repeat.svg" />
            <img v-else src="@/assets/icon/repeatOnce.svg" />
          </div>
          <div class="like-box">
            <img v-if="!likesFlase" src="@/assets/icon/likeWhite.svg" @click="addToLikes" />
            <img v-else src="@/assets/icon/like.svg" @click="removeLikes" />
          </div>
        </div>
      </div>
      <div class="progress-box">
        <div
          ref="progressBarRef"
          class="progress-bar"
          role="slider"
          :aria-valuenow="progressPercentUi"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuetext="`${currentTime} / ${totalTime}`"
          aria-label="播放进度"
          @pointerdown="onProgressPointerDown"
          @pointermove="onProgressPointerMove"
          @pointerup="onProgressPointerUp"
          @pointercancel="onProgressPointerUp"
        >
          <div ref="currentProgressRef" class="current-progress-bar"></div>
        </div>
        <div class="progress-time">
          <div class="current">{{ currentTime }}</div>
          <div class="total">{{ totalTime }}</div>
        </div>
      </div>
      <!-- 隐藏的音频元素，用于Web Audio API可视化 -->
      <audio
        id="imusicAudio"
        ref="audioRef"
        :src="playList[currentSongIdx]?.audioUrl"
        controls="false"
        preload="metadata"
        style="display: none"
        crossorigin="anonymous"
        :loop="isSingleLoop"
        type="mp3/ogg/aac/wav/flac"
      ></audio>
      <!-- 隐藏的图片元素，用来获取封面色值信息 -->
      <img v-show="false" ref="imgCoverRef" :src="playList[currentSongIdx]?.coverUrl" alt="" />
    </div>
  </transition>
  <LoadingView v-if="loading" />
  <MessageInfo v-if="showMessageInfo" :message="messageInfo.text" :type="messageInfo.type" />
  <UserLogin v-model:visible="visibleLogin" title="Login" />
</template>
<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { formatTime } from '@/utils/formatTime'
import { useEventStore } from '@/stores/eventStore'
import { useUserInfoStore } from '@/stores/userInfo'
import { addToFavoritesApi, addToLikesApi, queryLikeApi, removeLikesApi } from '@/server/userHttp'
const eventStore = useEventStore()
const userInfoStore = useUserInfoStore()
import PlayIcon from '@/assets/icon/play.svg'
import SuspendIcon from '@/assets/icon/suspend.svg'
import VoiceIcon from '@/assets/icon/voice.svg'
import VolumeDisableIcon from '@/assets/icon/volumeDisable.svg'
import ColorThief from 'colorthief'
import LoadingView from './LoadingView.vue'
import MessageInfo from './MessageInfo.vue'
import UserLogin from './UserLogin.vue'
import defaultCoverImg from '@/assets/images/music.webp'

const visibleLogin = ref(false)
const loading = ref(false)
const showMessageInfo = ref(false)
const messageInfo = ref({
  text: 'SUCCESS',
  type: 'success',
})

// 图片颜色
const colorPalette = ref('')
const imgCoverRef = ref<HTMLImageElement | null>(null)

// 定义歌词项接口
interface LyricItem {
  time: number
  timestamp: number
  text: string
}
interface SongInfo {
  id?: string
  title: string
  artist?: string
  audioUrl?: string
  duration?: number
  coverUrl?: string
  lyricsUrl?: string
  /** 是否为纯音乐 / 伴奏版（无歌词展示时优先用文案提示） */
  instrumental?: boolean
}
// 添加歌曲到收藏
const addToFavorites = async () => {
  const currentSong = playList.value[currentSongIdx.value]
  if (!currentSong) return
  if (!userInfoStore.data.token || !userInfoStore.data.user.id) {
    visibleLogin.value = true
    return
  }

  // 构建符合SongInfo接口的对象
  const songInfo: SongInfo = {
    id: currentSong.id?.toString() || '', // 确保id是字符串类型
    title: currentSong.title,
    artist: currentSong.artist || '',
    audioUrl: currentSong.audioUrl || '',
    coverUrl: currentSong.coverUrl || '',
    lyricsUrl: currentSong.lyricsUrl,
    duration: currentSong.duration || 0,
    instrumental: currentSong.instrumental,
  }
  try {
    loading.value = true
    const res = await addToFavoritesApi({
      userId: userInfoStore.data.user.id,
      musicInfo: songInfo,
      playlistTitle: '',
    })
    loading.value = false
    if (res.data.code === 200) {
      messageInfo.value = {
        text: '添加成功',
        type: 'success',
      }
      showMessageInfo.value = true
      setTimeout(() => {
        showMessageInfo.value = false
      }, 2000)
    } else {
      messageInfo.value = {
        text: '添加失败',
        type: 'error',
      }
      showMessageInfo.value = true
      setTimeout(() => {
        showMessageInfo.value = false
      }, 2000)
    }
  } catch (err) {
    console.log('addToFavorites err', err)
    loading.value = false
    messageInfo.value = {
      text: '添加失败',
      type: 'error',
    }
    showMessageInfo.value = true
    setTimeout(() => {
      showMessageInfo.value = false
    }, 2000)
  } finally {
    return
  }
}

// 检查歌曲的喜欢状态
const likesFlase = ref(false)
const checkLikes = async () => {
  const currentSong = playList.value[currentSongIdx.value]
  if (!currentSong) return
  const params = {
    userId: userInfoStore.data.user.id,
    musicId: currentSong.id?.toString() || '', // 确保id是字符串类型
  }
  try {
    const response = await queryLikeApi(params)
    const res = response.data
    if (res.code === 200) {
      likesFlase.value = res.data
    }
  } catch (error) {
    console.log(error)
  } finally {
    return
  }
}

// 添加歌曲到喜欢
const addToLikes = async () => {
  const currentSong = playList.value[currentSongIdx.value]
  if (!currentSong) return
  if (userInfoStore.data.user.id === '' && userInfoStore.data.token === '') {
    visibleLogin.value = true
    return
  }
  // 构建符合SongInfo接口的对象
  const songInfo: SongInfo = {
    id: currentSong.id?.toString() || '', // 确保id是字符串类型
    title: currentSong.title,
    artist: currentSong.artist || '',
    audioUrl: currentSong.audioUrl || '',
    coverUrl: currentSong.coverUrl || '',
    lyricsUrl: currentSong.lyricsUrl,
    duration: currentSong.duration || 0,
    instrumental: currentSong.instrumental,
  }
  try {
    loading.value = true
    const res = await addToLikesApi({
      userId: userInfoStore.data.user.id,
      musicInfo: songInfo,
      playlistTitle: '我喜欢的音乐',
    })
    loading.value = false
    if (res.data.code === 200) {
      likesFlase.value = true
      messageInfo.value = {
        text: '添加到喜欢成功',
        type: 'success',
      }
      showMessageInfo.value = true
      setTimeout(() => {
        showMessageInfo.value = false
      }, 2000)
    } else {
      messageInfo.value = {
        text: '添加到喜欢失败',
        type: 'error',
      }
      showMessageInfo.value = true
      setTimeout(() => {
        showMessageInfo.value = false
      }, 2000)
    }
  } catch (err) {
    console.log('addToLikes err', err)
  } finally {
    return
  }
}

// 解析LRC歌词文件的函数
const parseLrc = (lrcText: string): LyricItem[] => {
  const lines = lrcText.split('\n')
  const lyrics: LyricItem[] = []

  for (const line of lines) {
    // 匹配 [mm:ss] 或 [mm:ss.xx] 格式的时间标签
    const timeTagRegex = /\[(\d{2}):(\d{2})(\.(\d{2}))?]/g
    let match

    while ((match = timeTagRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1]!)
      const seconds = parseInt(match[2]!)
      const centiseconds = match[4] ? parseInt(match[4]!) : 0

      // 计算总时间（秒）
      const timeInSeconds = minutes * 60 + seconds + centiseconds / 100

      // 提取歌词文本（去除所有时间标签）
      const text = line.replace(/\[(\d{2}):(\d{2})(\.(\d{2}))?]/g, '').trim()

      lyrics.push({
        time: timeInSeconds,
        timestamp: timeInSeconds,
        text: text || ' ', // 如果文本为空，使用空格占位
      })
    }
  }

  // 按时间戳排序
  lyrics.sort((a, b) => a.timestamp - b.timestamp)

  return lyrics
}

// 播放详情相关变量
const isPlaying = ref(false)
const totalTime = ref('00:00')
const currentTime = ref('00:00')
const audioRef = ref<HTMLAudioElement | null>(null)
const currentProgressRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const isDraggingProgress = ref(false)
let activeProgressPointerId: number | null = null
const progressPercentUi = ref(0)
const volumeBarValue = ref(70)
const showVolume = ref(false)
const headerVolumeRef = ref<HTMLElement | null>(null)
const currentSongIdx = ref(0)
// 当前歌词行
const currentLyricIdx = ref(-1)
// 定义歌词实例为数组
let lyricsInstance: LyricItem[] | null = null

interface MusicItem {
  id?: number | string // 支持number或string类型的id
  title: string
  artist?: string
  audioUrl?: string
  duration?: number
  coverUrl?: string
  lyricsUrl?: string
  instrumental?: boolean
}

type LyricsPanelKind = 'ok' | 'loading' | 'no-file' | 'load-error' | 'instrumental' | 'empty'

const lyricsPanelKind = ref<LyricsPanelKind>('no-file')
const lyricsErrorHint = ref('')
const lyricsLinesRef = ref<HTMLElement | null>(null)

const lyricsPlaceholderTitle = computed(() => {
  switch (lyricsPanelKind.value) {
    case 'loading':
      return '歌词加载中…'
    case 'no-file':
      return '暂无歌词'
    case 'load-error':
      return '歌词加载失败'
    case 'instrumental':
      return '纯音乐'
    case 'empty':
      return '暂无歌词'
    default:
      return ''
  }
})

const lyricsPlaceholderHint = computed(() => {
  switch (lyricsPanelKind.value) {
    case 'loading':
      return ''
    case 'no-file':
      return '当前歌曲未提供歌词文件'
    case 'load-error':
      return lyricsErrorHint.value || '请检查网络或歌词文件地址'
    case 'instrumental':
      return '请欣赏'
    case 'empty':
      return '歌词文件无有效内容'
    default:
      return ''
  }
})

const playMode = computed(() => eventStore.playMode)
const isSingleLoop = computed(() => playMode.value === 'single-loop')

const isInstrumentalLyricsText = (text: string) => {
  const t = text.replace(/\s/g, ' ').trim().slice(0, 800)
  return /纯音乐|伴奏|instrumental|no\s*vocal|作曲\s*[:：]|作词\s*[:：]\s*无/i.test(t)
}
const playList = ref<Array<MusicItem>>([
  {
    title: '暂无播放',
  },
])

const playDetailShellStyle = computed(() => {
  const raw = playList.value[currentSongIdx.value]?.coverUrl ?? defaultCoverImg
  const u = typeof raw === 'string' ? raw : String(raw)
  const escaped = u.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return {
    '--play-album-tint': colorPalette.value || 'rgba(15, 23, 18, 0.2)',
    '--play-cover-bg': `url('${escaped}')`,
  }
})

// 隐藏播放详情
const handleClose = () => {
  eventStore.initPlay()
}

// 取消歌曲喜欢
const removeLikes = async () => {
  const currentSong = playList.value[currentSongIdx.value]
  if (!currentSong) return
  const params = {
    userId: userInfoStore.data.user.id,
    musicInfo: currentSong,
    playlistTitle: '我喜欢的音乐',
  }
  try {
    loading.value = true
    const response = await removeLikesApi(params)
    const res = response.data
    loading.value = false
    if (res.code === 200) {
      likesFlase.value = false
      messageInfo.value = {
        text: '取消喜欢成功',
        type: 'success',
      }
      showMessageInfo.value = true
      setTimeout(() => {
        showMessageInfo.value = false
      }, 2000)
    }
  } catch (err) {
    messageInfo.value = {
      text: '取消喜欢失败',
      type: 'error',
    }
    showMessageInfo.value = true
    setTimeout(() => {
      showMessageInfo.value = false
    }, 2000)
    console.log(err)
  } finally {
    return
  }
}

const changeVolume = (e: Event) => {
  if (audioRef.value && e.target) {
    const target = e.target as HTMLInputElement
    volumeBarValue.value = parseInt(target.value)
    audioRef.value.volume = volumeBarValue.value / 100
    eventStore.setVolume(volumeBarValue.value)
  }
}
const toggleVolumePanel = () => {
  showVolume.value = !showVolume.value
}
const handleDocumentPointerDown = (e: PointerEvent) => {
  if (!showVolume.value) return
  const target = e.target as Node | null
  if (!target) return
  if (headerVolumeRef.value?.contains(target)) return
  showVolume.value = false
}

const getRandomNextIndex = (current: number, len: number) => {
  if (len <= 1) return current
  let next = current
  while (next === current) {
    next = Math.floor(Math.random() * len)
  }
  return next
}
// 上一首回调
const prviousSong = async () => {
  const len = playList.value.length
  if (!len) return
  if (playMode.value === 'shuffle') {
    const randomIdx = getRandomNextIndex(currentSongIdx.value, len)
    eventStore.setCurrentIndex(randomIdx)
    currentSongIdx.value = randomIdx
    return
  }
  if (currentSongIdx.value <= 0) {
    eventStore.setCurrentIndex(len - 1)
    currentSongIdx.value = len - 1
  } else {
    eventStore.setCurrentIndex(currentSongIdx.value - 1)
    currentSongIdx.value -= 1
  }
}
// 下一首回调
const nextSong = async () => {
  const len = playList.value.length
  if (!len) return
  if (playMode.value === 'shuffle') {
    const randomIdx = getRandomNextIndex(currentSongIdx.value, len)
    eventStore.setCurrentIndex(randomIdx)
    currentSongIdx.value = randomIdx
    return
  }
  if (currentSongIdx.value >= len - 1) {
    eventStore.setCurrentIndex(0)
    currentSongIdx.value = 0
  } else {
    eventStore.setCurrentIndex(currentSongIdx.value + 1)
    currentSongIdx.value += 1
  }
}
// 循环控制回调
const loopControl = () => {
  const nextMode = isSingleLoop.value ? 'list-loop' : 'single-loop'
  eventStore.setPlayMode(nextMode)
}
const toggleShuffle = () => {
  const nextMode = playMode.value === 'shuffle' ? 'list-loop' : 'shuffle'
  eventStore.setPlayMode(nextMode)
}
// 切换播放状态
const togglePlay = async () => {
  eventStore.controlPlay(!eventStore.control.play)
}
// 音频的加载状态
const audioLoaded = async () => {
  totalTime.value = formatTime(audioRef.value?.duration || 0)
  if (!audioRef.value) return

  const item = playList.value[currentSongIdx.value]
  lyricsErrorHint.value = ''

  if (item?.instrumental) {
    lyricsPanelKind.value = 'instrumental'
    lyricsInstance = null
    currentLyricIdx.value = -1
    return
  }

  const lyricsUrl = item?.lyricsUrl
  if (!lyricsUrl) {
    lyricsPanelKind.value = 'no-file'
    lyricsInstance = null
    currentLyricIdx.value = -1
    return
  }

  lyricsPanelKind.value = 'loading'

  try {
    const response = await fetch(lyricsUrl)
    if (!response.ok) {
      lyricsPanelKind.value = 'load-error'
      lyricsErrorHint.value = `请求失败（${response.status}）`
      lyricsInstance = null
      currentLyricIdx.value = -1
      return
    }

    const lyricsText = await response.text()
    const parsed = parseLrc(lyricsText)
    currentLyricIdx.value = -1

    if (!parsed.length) {
      lyricsInstance = null
      lyricsPanelKind.value =
        isInstrumentalLyricsText(lyricsText) || item?.instrumental ? 'instrumental' : 'empty'
      return
    }

    lyricsInstance = parsed
    lyricsPanelKind.value = 'ok'
    void nextTick(() => updateLyricsDisplay(-1))
  } catch (error) {
    console.error('歌词加载失败:', error)
    lyricsPanelKind.value = 'load-error'
    lyricsErrorHint.value = '网络异常或文件无法访问'
    lyricsInstance = null
    currentLyricIdx.value = -1
  }
}

// 同步歌词与播放进度
const syncLyrics = () => {
  if (lyricsPanelKind.value !== 'ok' || !audioRef.value || !lyricsInstance?.length) return

  const currentSeconds = audioRef.value.currentTime
  const lyrics = lyricsInstance

  // 查找当前时间对应的歌词
  let currentIdx = -1
  for (let i = 0; i < lyrics.length; i++) {
    const lyric = lyrics[i]
    if (lyric && currentSeconds >= lyric.timestamp) {
      currentIdx = i
    } else {
      break
    }
  }

  if (currentIdx !== currentLyricIdx.value) {
    currentLyricIdx.value = currentIdx
    if (currentIdx >= 0 && lyrics[currentIdx]) {
      const lyricItem = lyrics[currentIdx]
      if (lyricItem) {
        updateLyricsDisplay(currentIdx)
      } else {
        updateLyricsDisplay(-1)
      }
    } else {
      updateLyricsDisplay(-1)
    }
  }
}

const scrollCurrentLyricToCenter = (container: HTMLElement, line: HTMLElement) => {
  const lineCenter = line.offsetTop + line.offsetHeight / 2
  const viewH = container.clientHeight
  const maxScroll = Math.max(0, container.scrollHeight - viewH)
  const target = lineCenter - viewH / 2
  const top = Math.max(0, Math.min(target, maxScroll))
  container.scrollTo({ top, behavior: 'smooth' })
}

// 更新歌词显示
const updateLyricsDisplay = (currentIndex: number) => {
  if (lyricsPanelKind.value !== 'ok') return
  const lyricsContainer =
    lyricsLinesRef.value ?? (document.querySelector('#lyrics-display') as HTMLElement | null)
  if (!lyricsContainer) return

  // 清空现有内容
  lyricsContainer.innerHTML = ''

  if (!lyricsInstance || !lyricsInstance.length) return

  const lyrics = lyricsInstance
  if (!lyrics) return

  // 创建歌词元素
  lyrics.forEach((line: LyricItem, idx: number) => {
    const p = document.createElement('p')
    p.textContent = line.text
    p.className = `lyric-line ${idx === currentIndex ? 'current' : ''}`
    p.setAttribute('data-time', line.timestamp.toString())
    lyricsContainer.appendChild(p)
  })

  if (currentIndex >= 0) {
    void nextTick(() => {
      const el = lyricsContainer as HTMLElement
      const currentLine = el.querySelector('.lyric-line.current') as HTMLElement | null
      if (currentLine) scrollCurrentLyricToCenter(el, currentLine)
    })
  }
}

// 音频播放完成
const audioEnded = () => {
  if (isSingleLoop.value) {
    audioRef.value?.play()
  } else {
    nextSong()
  }
}

// 获取当前播放进度，缓冲和播放的范围
const getProgress = () => {
  if (!audioRef.value) return
  if (isDraggingProgress.value) return
  const dur = audioRef.value.duration
  if (!Number.isFinite(dur) || dur <= 0) return
  currentTime.value = formatTime(audioRef.value.currentTime || 0)
  const progress = (audioRef.value.currentTime / dur) * 100 // 进度百分比
  progressPercentUi.value = Math.round(Math.min(100, Math.max(0, progress)))
  if (currentProgressRef.value) {
    currentProgressRef.value.style.width = `${progress}%`
  }
  // 同步歌词
  syncLyrics()
}

const applyProgressFromClientX = (clientX: number, syncLyric: boolean) => {
  const bar = progressBarRef.value
  const audio = audioRef.value
  const fill = currentProgressRef.value
  if (!bar || !audio || !fill) return
  const duration = audio.duration
  if (!Number.isFinite(duration) || duration <= 0) return
  const rect = bar.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  const t = ratio * duration
  audio.currentTime = t
  fill.style.width = `${ratio * 100}%`
  progressPercentUi.value = Math.round(ratio * 100)
  currentTime.value = formatTime(t)
  if (syncLyric) syncLyrics()
}

const onProgressPointerDown = (e: PointerEvent) => {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  const audio = audioRef.value
  const bar = progressBarRef.value
  if (!audio || !bar) return
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return
  isDraggingProgress.value = true
  activeProgressPointerId = e.pointerId
  bar.setPointerCapture(e.pointerId)
  applyProgressFromClientX(e.clientX, false)
}

const onProgressPointerMove = (e: PointerEvent) => {
  if (!isDraggingProgress.value || e.pointerId !== activeProgressPointerId) return
  applyProgressFromClientX(e.clientX, false)
}

const onProgressPointerUp = (e: PointerEvent) => {
  if (e.pointerId !== activeProgressPointerId) return
  applyProgressFromClientX(e.clientX, true)
  activeProgressPointerId = null
  isDraggingProgress.value = false
  try {
    progressBarRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}
// 获取图片颜色
const getColorPalette = async () => {
  const colorThief = new ColorThief()
  if (imgCoverRef.value) {
    const palette = colorThief.getColor(imgCoverRef.value)
    const colorData = palette.map((item) => {
      return item
    })
    colorPalette.value = `rgba(${colorData[0]}, ${colorData[1]}, ${colorData[2]}, 1)`
  }
}

// 监听播放详情显隐
watch(
  () => eventStore.setPlayDetail.show,
  (newValue) => {
    document.body.style.overflow = newValue ? 'hidden' : 'auto'
  },
)
// 监听播放详情数据
watch(
  () => eventStore.setPlayDetail.data || eventStore.setPlayDetail.currentIndex,
  (newValue, oldValue) => {
    if (newValue == oldValue) return
    nextTick(async () => {
      const musicItems: MusicItem[] = newValue as MusicItem[]
      playList.value = musicItems
      await new Promise((resolve) => setTimeout(resolve, 100))
      getColorPalette()
      checkLikes()
    })
  },
)
// 监听播放状态
watch(
  () => eventStore.control.play,
  (playing) => {
    isPlaying.value = playing
    if (playing) {
      void audioRef.value?.play().catch(() => {
        eventStore.controlPlay(false)
      })
    } else {
      audioRef.value?.pause()
    }
  },
)
watch(
  () => eventStore.volume,
  (val) => {
    volumeBarValue.value = val
    if (audioRef.value) audioRef.value.volume = val / 100
  },
  { immediate: true },
)
watch(
  () => eventStore.playMode,
  (mode) => {
    if (audioRef.value) audioRef.value.loop = mode === 'single-loop'
  },
  { immediate: true },
)
// 监听播放详情索引变化
watch(
  () => eventStore.setPlayDetail.currentIndex,
  (newValue: number, oldValue: number) => {
    currentSongIdx.value = newValue
    if (newValue == oldValue) return
    lyricsPanelKind.value = 'loading'
    lyricsInstance = null
    currentLyricIdx.value = -1
    lyricsErrorHint.value = ''
    nextTick(async () => {
      if (!audioRef.value) return
      const shouldPlay = eventStore.control.play
      audioRef.value.pause()
      audioRef.value.currentTime = 0
      currentTime.value = formatTime(0)
      progressPercentUi.value = 0
      if (currentProgressRef.value) currentProgressRef.value.style.width = '0%'
      await new Promise((resolve) => setTimeout(resolve, 100))
      audioRef.value.src = playList.value[newValue]?.audioUrl || ''
      isPlaying.value = shouldPlay
      if (shouldPlay) {
        try {
          await audioRef.value.play()
        } catch {
          eventStore.controlPlay(false)
        }
      } else {
        audioRef.value.pause()
      }
      getColorPalette()
      checkLikes()
    })
  },
)

// 监听播放状态变更的函数
const handlePlay = () => {
  isPlaying.value = true
}
const handlePause = () => {
  isPlaying.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  nextTick(() => {
    if (audioRef.value) {
      audioRef.value.volume = volumeBarValue.value / 100
      audioRef.value.loop = isSingleLoop.value
      // 监听音频加载开始
      // audioRef.value.addEventListener('loadstart', () => console.log('开始加载'))
      // 监听是否加载完成
      audioRef.value.addEventListener('loadeddata', audioLoaded)
      // 监听开始播放
      audioRef.value.addEventListener('play', handlePlay)
      // 监听暂停
      audioRef.value.addEventListener('pause', handlePause)
      // 当前时间更新
      audioRef.value.addEventListener('timeupdate', getProgress)
      // 监听播放完成
      audioRef.value.addEventListener('ended', audioEnded)
      // 发生错误
      audioRef.value.addEventListener('error', (e) => console.log('错误:', e))
    }
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  if (audioRef.value) {
    audioRef.value.removeEventListener('loadeddata', audioLoaded)
    audioRef.value.removeEventListener('timeupdate', getProgress)
    audioRef.value.removeEventListener('ended', audioEnded)
    audioRef.value.removeEventListener('error', (e) => console.log('错误:', e))
    // 移除播放和暂停事件监听器
    audioRef.value.removeEventListener('play', handlePlay)
    audioRef.value.removeEventListener('pause', handlePause)
  }
})
</script>
<style lang="scss" scoped>
@use 'sass:string';

.play-detail-main-box {
  position: fixed;
  width: 100%;
  max-height: 100vh;
  height: 100vh;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-play-detail);
  overflow: hidden;
  isolation: isolate;
  padding: 18px 36px 100px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overscroll-behavior: contain;
  box-sizing: border-box;
  background-color: var(--play-album-tint);
  background-image:
    radial-gradient(
      circle at 50% 16%,
      color-mix(in srgb, var(--play-album-tint) 24%, transparent) 0%,
      transparent 62%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--play-album-tint) 36%, transparent) 0%,
      color-mix(in srgb, var(--play-album-tint) 68%, #060708) 62%,
      color-mix(in srgb, var(--play-album-tint) 86%, #050506) 100%
    ),
    var(--play-cover-bg);
  background-repeat: no-repeat;
  background-position: center center;
  background-size:cover;
  background-blend-mode: screen, normal, normal;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--play-album-tint) 8%, transparent) 40%,
      color-mix(in srgb, var(--play-album-tint) 64%, rgba(9, 11, 15, 0.2)) 86%,
      color-mix(in srgb, var(--play-album-tint) 90%, rgba(9, 11, 15, 0.7)) 100%
    );
    mix-blend-mode: multiply;
    pointer-events: none;
  }
  > * {
    position: relative;
    z-index: 1;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    padding-bottom: 4px;
    img {
      width: 24px;
      height: 24px;
      display: block;
    }
    .back-icon {
      margin: 0;
      padding: 8px;
      border: none;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      line-height: 0;
      transition: background 0.15s ease;
      &:hover {
        background: rgba(255, 255, 255, 0.36);
      }
    }
    .title {
      color: #fff;
      line-height: 24px;
      font-weight: 500;
      letter-spacing: 0.06em;
      opacity: 0.92;
    }
    .header-spacer {
      margin: 0;
      padding: 4px;
      border: none;
      border-radius: 8px;
      background: transparent;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      cursor: pointer;
    }
    .header-volume {
      position: relative;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }
    .header-volume-box {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 180px;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      box-sizing: border-box;
      .header-volume-range {
        appearance: none;
        width: 100%;
        height: 4px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.35);
        outline: none;
      }
      .header-volume-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.12);
        background: #fff;
        cursor: pointer;
      }
      .header-volume-range::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.12);
        background: #fff;
        cursor: pointer;
      }
    }
  }
  .media-stage {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    width: 100%;
    &--pc {
      --pc-media-h: #{string.unquote('min(48vh, 100%)')};
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 36px;
      margin-top: 4px;
      padding: 0 8px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
      border: none;
      border-radius: 40px;
      box-shadow: none;
      .cover-box-lyrics {
        flex: 1;
        min-width: 0;
        height: var(--pc-media-h);
        max-height: var(--pc-media-h);
        margin-top: 0;
        border-radius: 0;
        background: transparent;
        border: none;
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        .lyrics-panel {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .lyrics-placeholder {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px 16px;
          box-sizing: border-box;
          &--error .lyrics-placeholder__title {
            color: #fecaca;
          }
          &--error .lyrics-placeholder__hint {
            color: rgba(252, 211, 211, 0.65);
          }
          &__title {
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            letter-spacing: 0.04em;
          }
          &__hint {
            margin: 0;
            max-width: 280px;
            font-size: 13px;
            line-height: 1.55;
            color: rgba(255, 255, 255, 0.45);
          }
        }
        .lyrics-container {
          flex: 1;
          min-height: 0;
          height: auto;
          box-sizing: border-box;
          border-radius: 0;
          text-align: left;
          :deep(.lyric-line) {
            padding: 8px 4px;
            font-size: 28px;
            line-height: 1.55;
            color: #555555;
            opacity: 0.8;
            text-shadow: 0px 0px 1px #fff;
            text-align: center;
            &.current {
              color: #fff;
              opacity: 0.9;
              font-size: 42px;
              font-weight: 600;
              transform: none;
              text-shadow: 0px 0px 8px #000;
            }
          }
        }
      }
    }
  }
  .cover-box {
    width: 100%;
    height: 40vh;
    border-radius: 15px;
    margin-top: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    img {
      height: 60%;
      border-radius: 15px;
      object-fit: cover;
    }

    .lyrics-panel {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .lyrics-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 28px 16px;
      box-sizing: border-box;
      &--error .lyrics-placeholder__title {
        color: #fecaca;
      }
      &--error .lyrics-placeholder__hint {
        color: rgba(252, 211, 211, 0.7);
      }
      &__title {
        margin: 0 0 10px;
        font-size: 15px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.92);
      }
      &__hint {
        margin: 0;
        max-width: 260px;
        font-size: 13px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.48);
      }
    }
    .lyrics-container {
      position: relative;
      width: 100%;
      flex: 1;
      min-height: 0;
      overflow: auto;
      scrollbar-width: none;
      padding: 20px;
      color: #fff;
      text-align: center;
      display: flex;
      flex-direction: column;
      border-radius: 15px;
      :deep(.lyric-line) {
        padding: 10px 5px;
        font-size: 32px;
        color: #ccc;
        transition: all 0.3s ease;
        &.current {
          color: #fff;
          font-size: 32px;
          font-weight: bold;
          transform: scale(1.1);
        }
      }
    }
  }
  .song-inform {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
    flex-shrink: 0;
    .song-name {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      .name {
        font-size: 48px;
        font-weight: 500;
        color: #d4d4d4;
        text-shadow: 0px 0px 8px #000;
        letter-spacing: 0.2cap;
      }
      .singer {
        font-size: 24px;
        font-weight: 400;
        color: #eeeeee;
        text-shadow: 0px 0px 8px #000;
        letter-spacing: 0.2cap;
      }
    }
  }
  .progress-box {
    position: relative;
    flex-shrink: 0;
    margin-top: 30px;
    max-width: 920px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    .progress-bar {
      width: 100%;
      height: 2px;
      background-color: #454545;
      position: relative;
      margin: 10px 0;
      border-radius: 5px;
      cursor: pointer;
      touch-action: none;
      user-select: none;
      .current-progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        width: 0%;
        height: 100%;
        background: linear-gradient(to right, #bcbcbc 0%, #fff 100%);
        transition: width 0.16s linear;
        border-radius: 5px;
        pointer-events: none;
      }
    }
    .progress-time {
      display: flex;
      justify-content: space-between;
      .current,
      .total {
        font-size: 12px;
        font-weight: 400;
        color: #fff;
        letter-spacing: 1px;
      }
    }
  }
  .control-box {
    display: flex;
    align-items: center;
    gap: 20px;
    justify-content: center;
    position: relative;
    .control-item-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      img{
        cursor: pointer;
      }
    }
    img {
      width: 50px;
      height: 50px;
    }
    .play-box {
      img {
        width: 70px;
        height: 70px;
      }
    }
    .repeat, .shuffle,
    .more-inform {
      padding: 10px;
      img {
        width: 24px;
        height: 24px;
      }
    }
    .mode-active {
      background: rgba(255, 255, 255, 0.16);
      border-radius: 50%;
    }
  }
}


.slide-enter-active {
  transition: transform 0.3s ease-in-out;
}

.slide-leave-active {
  transition: transform 0.2s ease-in-out;
}

.slide-enter-from {
  transform: translateY(100%);
}

.slide-enter-to {
  transform: translateY(0);
}

.slide-leave-from {
  transform: translateY(0);
}

.slide-leave-to {
  transform: translateY(100%);
}
</style>
