import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import * as Vue from 'vue'

const loadPackage = createRequire(import.meta.url)
const testDirectory = path.dirname(fileURLToPath(import.meta.url))

// 测试真实播放逻辑，仅替换 Node 环境中不存在的浏览器媒体设备。
class MockAudio extends EventTarget {
  constructor() {
    super()
    this.paused = true
    this.currentTime = 0
    this.duration = NaN
    this.src = ''
    this.volume = 1
    this.playCount = 0
    this.handlers = new Map()
    MockAudio.latest = this
  }
  addEventListener(event, handler) {
    super.addEventListener(event, handler)
    this.handlers.set(event, handler)
  }
  removeEventListener(event, handler) {
    super.removeEventListener(event, handler)
    this.handlers.delete(event)
  }
  fire(event) {
    this.dispatchEvent(new Event(event))
  }
  load() {
    this.currentTime = 0
  }
  removeAttribute(name) {
    if (name === 'src') this.src = ''
  }
  play() {
    this.playCount++
    if (this.playResult) return this.playResult()
    this.paused = false
    this.fire('play')
    this.fire('playing')
    return Promise.resolve()
  }
  pause() {
    if (!this.paused) {
      this.paused = true
      this.fire('pause')
    }
  }
  metadata(duration) {
    this.duration = duration
    this.fire('loadedmetadata')
  }
}

const originals = { Audio: global.Audio, create: URL.createObjectURL, revoke: URL.revokeObjectURL }
let nextUrl = 0
const created = new Set()
const revoked = new Set()
before(() => {
  global.Audio = MockAudio
  URL.createObjectURL = () => {
    const url = `blob:music-test-${++nextUrl}`
    created.add(url)
    return url
  }
  URL.revokeObjectURL = (url) => revoked.add(url)
})
after(() => {
  global.Audio = originals.Audio
  URL.createObjectURL = originals.create
  URL.revokeObjectURL = originals.revoke
  assert.deepEqual(revoked, created, '每个本地对象 URL 都应在关闭时释放')
})

const cache = new Map()
function loadTs(filename) {
  filename = path.resolve(filename)
  if (!path.extname(filename)) filename += '.ts'
  if (cache.has(filename)) return cache.get(filename).exports
  const module = { exports: {} }
  cache.set(filename, module)
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const localRequire = (name) =>
    name.startsWith('.') ? loadTs(path.join(path.dirname(filename), name)) : loadPackage(name)
  vm.runInThisContext(`(function(require,module,exports){\n${source}\n})`, { filename })(
    localRequire,
    module,
    module.exports,
  )
  return module.exports
}
const { useMusicPlayer } = loadTs(path.join(testDirectory, '../src/views/Music/useMusicPlayer.ts'))
const { parseLyrics, findLyricIndex, formatTime } = loadTs(
  path.join(testDirectory, '../src/views/Music/lyrics.ts'),
)
const renderer = Vue.createRenderer({
  createComment: () => ({}),
  insert() {},
  remove() {},
  parentNode: () => null,
  nextSibling: () => null,
})
function fixture(t) {
  let player
  const app = renderer.createApp({
    setup() {
      player = useMusicPlayer()
      return () => null
    },
  })
  app.config.warnHandler = (message) => assert.fail(message)
  app.mount({})
  t.after(() => app.unmount())
  return { player, audio: MockAudio.latest, app }
}
const file = (name, content = 'audio', type = 'audio/mpeg') =>
  new File([content], name, { type, lastModified: 1 })
const flush = async () => {
  await Promise.resolve()
  await Vue.nextTick()
}

test('解析多时间标签、偏移、空行和纯文本，并查找当前歌词', () => {
  const lyrics = parseLyrics(
    '[ti:测试]\n[00:01.50][01:02.125]第一句\n[00:03.00][和声]\n[00:05.00]\n[offset:500]',
  )
  assert.deepEqual(lyrics.lines, [
    { time: 1, text: '第一句' },
    { time: 2.5, text: '[和声]' },
    { time: 4.5, text: '' },
    { time: 61.625, text: '第一句' },
  ])
  assert.equal(findLyricIndex(lyrics.lines, 0), -1)
  assert.equal(findLyricIndex(lyrics.lines, 2.5), 1)
  assert.equal(findLyricIndex(lyrics.lines, 99), 3)
  assert.equal(findLyricIndex([], 1), -1)
  assert.equal(parseLyrics('第一行\n第二行').text, '第一行\n第二行')
  assert.deepEqual(parseLyrics('[00:65.0]错误时间').lines, [])
  assert.equal(formatTime(125.9), '2:05')
  assert.equal(formatTime(Infinity), '0:00')
})

test('批量导入自动匹配同名封面和歌词，重复音频不重复添加', async (t) => {
  const { player, audio } = fixture(t)
  const song = file('歌手 - 歌名.mp3')
  await player.importFiles([
    file('歌手 - 歌名.LRC', '[00:01]你好', 'text/plain'),
    file('歌手 - 歌名.jpg', 'image', 'image/jpeg'),
    song,
    song,
  ])
  assert.equal(player.tracks.value.length, 1)
  assert.equal(player.currentTrack.value.title, '歌名')
  assert.equal(player.currentTrack.value.artist, '歌手')
  assert.equal(player.currentTrack.value.source, 'local')
  assert.ok(player.currentTrack.value.coverUrl.startsWith('blob:'))
  assert.deepEqual(player.currentTrack.value.lyrics.lines, [{ time: 1, text: '你好' }])
  assert.equal(audio.paused, true, '导入默认不自动播放')
  assert.equal(audio.playCount, 0)
  audio.metadata(123)
  assert.equal(player.duration.value, 123)
  assert.equal(player.currentTrack.value.duration, 123)
})

test('支持先导入配套文件，并保留随后为歌曲单独选择的歌词与封面', async (t) => {
  const { player } = fixture(t)
  await player.importFiles([
    file('Song.lrc', '[00:01]自动歌词', 'text/plain'),
    file('Song.png', 'image', 'image/png'),
  ])
  await player.importFiles([file('Song.mp3')])
  assert.equal(player.currentTrack.value.lyrics.lines[0].text, '自动歌词')
  await player.attachLyrics(file('custom.lrc', '[00:02]自选歌词', 'text/plain'))
  player.attachCover(file('custom.webp', 'new image', 'image/webp'))
  const cover = player.currentTrack.value.coverUrl
  await player.importFiles([file('Another.mp3')])
  assert.equal(player.currentTrack.value.lyrics.lines[0].text, '自选歌词')
  assert.equal(player.currentTrack.value.coverUrl, cover)
})

test('播放暂停、时间事件、进度与音量均和真实音频状态一致', async (t) => {
  const { player, audio } = fixture(t)
  player.togglePlayback()
  assert.equal(audio.playCount, 0)
  await player.importFiles([file('A.mp3')])
  audio.metadata(120)
  player.togglePlayback()
  await flush()
  assert.equal(player.isPlaying.value, true)
  assert.equal(player.loading.value, false)
  audio.currentTime = 32.5
  audio.fire('timeupdate')
  assert.equal(player.currentTime.value, 32.5)
  audio.fire('waiting')
  assert.equal(player.loading.value, true)
  audio.fire('playing')
  assert.equal(player.loading.value, false)
  player.seek(999)
  assert.equal(audio.currentTime, 120)
  player.seek(-1)
  assert.equal(audio.currentTime, 0)
  player.setVolume(2)
  assert.equal(audio.volume, 1)
  player.setVolume(-2)
  assert.equal(audio.volume, 0)
  player.togglePlayback()
  assert.equal(audio.paused, true)
  assert.equal(player.isPlaying.value, false)
})

test('列表循环首尾衔接，单曲循环仅影响自动切歌', async (t) => {
  const { player, audio } = fixture(t)
  await player.importFiles([file('A.mp3'), file('B.mp3'), file('C.mp3')])
  const [a, b, c] = player.tracks.value
  player.previous()
  assert.equal(player.currentId.value, c.id)
  audio.fire('ended')
  assert.equal(player.currentId.value, a.id)
  player.next()
  assert.equal(player.currentId.value, b.id)
  player.cycleMode()
  assert.equal(player.mode.value, 'single')
  audio.metadata(100)
  audio.currentTime = 100
  audio.fire('ended')
  assert.equal(player.currentId.value, b.id)
  assert.equal(audio.currentTime, 0)
  player.next()
  assert.equal(player.currentId.value, c.id)
  player.previous()
  assert.equal(player.currentId.value, b.id)
})

test('随机播放一轮不重复，上一首与下一首可沿已播放记录往返', async (t) => {
  const { player } = fixture(t)
  await player.importFiles([file('A.mp3'), file('B.mp3'), file('C.mp3'), file('D.mp3')])
  player.cycleMode()
  player.cycleMode()
  assert.equal(player.mode.value, 'shuffle')
  const visited = [player.currentId.value]
  for (let i = 0; i < 3; i++) {
    player.next()
    visited.push(player.currentId.value)
  }
  assert.equal(new Set(visited).size, 4)
  player.previous()
  assert.equal(player.currentId.value, visited[2])
  player.next()
  assert.equal(player.currentId.value, visited[3])
  player.next()
  assert.notEqual(player.currentId.value, visited[3])
  player.cycleMode()
  assert.equal(player.mode.value, 'loop')
})

test('仅一首歌曲时，三种播放模式均可继续播放', async (t) => {
  const { player, audio } = fixture(t)
  await player.importFiles([file('Only.mp3')])
  const id = player.currentId.value
  for (let i = 0; i < 3; i++) {
    audio.metadata(10)
    audio.currentTime = 10
    audio.fire('ended')
    assert.equal(player.currentId.value, id)
    assert.equal(audio.currentTime, 0)
    player.previous()
    assert.equal(player.currentId.value, id)
    player.cycleMode()
  }
})

test('快速暂停或切歌后，较早的播放失败不会覆盖最新状态', async (t) => {
  const { player, audio } = fixture(t)
  await player.importFiles([file('A.mp3'), file('B.mp3')])
  let rejectPlay
  audio.playResult = () =>
    new Promise((resolve, reject) => {
      rejectPlay = reject
    })
  player.togglePlayback()
  assert.equal(player.loading.value, true)
  player.togglePlayback()
  assert.equal(player.loading.value, false)
  rejectPlay(new Error('late failure'))
  await flush()
  assert.equal(player.error.value, '')
  player.togglePlayback()
  const rejectOld = rejectPlay
  audio.playResult = undefined
  player.next()
  rejectOld(new Error('old track failed'))
  await flush()
  assert.equal(player.isPlaying.value, true)
  assert.equal(player.error.value, '')
  audio.fire('error')
  assert.equal(player.isPlaying.value, false)
  assert.ok(player.error.value)
})

test('异步歌词读取不会将过期结果覆盖到新选择上', async (t) => {
  const { player } = fixture(t)
  await player.importFiles([file('A.mp3')])
  let resolveOld
  const oldFile = file('old.lrc', '', 'text/plain')
  oldFile.arrayBuffer = () =>
    new Promise((resolve) => {
      resolveOld = resolve
    })
  const pending = player.attachLyrics(oldFile)
  await player.attachLyrics(file('new.lrc', '[00:02]新歌词', 'text/plain'))
  resolveOld(new TextEncoder().encode('[00:01]旧歌词').buffer)
  await pending
  assert.equal(player.currentTrack.value.lyrics.lines[0].text, '新歌词')
})

test('关闭应用停止音频、移除监听并释放全部文件 URL', async (t) => {
  const { player, audio, app } = fixture(t)
  await player.importFiles([file('A.mp3'), file('A.png', 'image', 'image/png')])
  player.togglePlayback()
  const urls = [player.currentTrack.value.url, player.currentTrack.value.coverUrl]
  app.unmount()
  assert.equal(audio.paused, true)
  assert.equal(audio.src, '')
  assert.equal(audio.handlers.size, 0)
  urls.forEach((url) => assert.ok(revoked.has(url)))
  const count = created.size
  await player.importFiles([file('After-close.mp3')])
  assert.equal(created.size, count)
})
