<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MusicPlayMode, MusicTrack } from '@/tsInterface/index'
import { findLyricIndex, formatTime } from '../lyrics'
import MusicIcon from './MusicIcon.vue'

const props = defineProps<{
  track?: MusicTrack
  isPlaying: boolean
  loading: boolean
  currentTime: number
  duration: number
  volume: number
  mode: MusicPlayMode
  error: string
  visible: boolean
}>()
const emit = defineEmits<{
  toggle: []
  next: []
  previous: []
  mode: []
  seek: [time: number]
  volume: [value: number]
  lyrics: [file: File]
  cover: [file: File]
}>()
const coverInput = ref<HTMLInputElement>()
const lyricInput = ref<HTMLInputElement>()
const lyricsBody = ref<HTMLElement>()
const modeLabels: Record<MusicPlayMode, string> = {
  loop: '列表循环',
  single: '单曲循环',
  shuffle: '随机播放',
}
const activeLyric = computed(() =>
  findLyricIndex(props.track?.lyrics.lines ?? [], props.currentTime),
)
const onAsset = (event: Event, kind: 'lyrics' | 'cover') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (kind === 'lyrics') emit('lyrics', file)
    else emit('cover', file)
  }
  input.value = ''
}
watch(
  [activeLyric, () => props.track?.id, () => props.visible],
  () => {
    if (!props.visible) return
    const body = lyricsBody.value
    const active = body?.querySelector<HTMLElement>('[aria-current="true"]')
    if (body && active)
      body.scrollTop = active.offsetTop - body.clientHeight / 2 + active.offsetHeight / 2
    else if (body) body.scrollTop = 0
  },
  { flush: 'post' },
)
</script>

<template>
  <section class="now-playing" aria-label="正在播放">
    <header class="now-playing__song">
      <button
        class="now-playing__cover"
        type="button"
        :disabled="!track"
        title="选择当前歌曲的封面"
        aria-label="选择当前歌曲的封面"
        @click="coverInput?.click()"
      >
        <img v-if="track?.coverUrl" :src="track.coverUrl" alt="歌曲封面" width="96" height="96" />
        <MusicIcon v-else name="music" />
        <span v-if="track" class="now-playing__cover-label">更换封面</span>
      </button>
      <input
        ref="coverInput"
        class="now-playing__file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
        aria-label="选择封面图片"
        @change="onAsset($event, 'cover')"
      />
      <div class="now-playing__info">
        <span class="now-playing__eyebrow">{{ isPlaying ? '正在播放' : '当前歌曲' }}</span>
        <h2>{{ track?.title || '等待一首好音乐' }}</h2>
        <p>{{ track?.artist || '添加本地音乐，开始聆听' }}</p>
      </div>
    </header>

    <div class="now-playing__lyrics-header">
      <span>歌词</span>
      <button type="button" :disabled="!track" @click="lyricInput?.click()">导入歌词</button>
      <input
        ref="lyricInput"
        class="now-playing__file"
        type="file"
        accept=".lrc,.txt"
        aria-label="选择当前歌曲的歌词"
        @change="onAsset($event, 'lyrics')"
      />
    </div>
    <div ref="lyricsBody" class="now-playing__lyrics" aria-label="歌曲歌词">
      <template v-if="track?.lyrics.lines.length">
        <button
          v-for="(line, index) in track.lyrics.lines"
          :key="index"
          class="now-playing__lyric"
          :class="{ 'now-playing__lyric--active': activeLyric === index }"
          type="button"
          :aria-current="activeLyric === index ? 'true' : undefined"
          :aria-label="`跳转到 ${formatTime(line.time)}，${line.text || '间奏'}`"
          @click="emit('seek', line.time)"
        >
          {{ line.text || '♪' }}
        </button>
      </template>
      <p v-else-if="track?.lyrics.text" class="now-playing__plain">{{ track.lyrics.text }}</p>
      <div v-else class="now-playing__no-lyrics">
        <p>{{ track ? '在旋律里，慢慢听' : '音乐与歌词，即将在这里相遇' }}</p>
        <span>{{ track ? '导入 LRC 歌词，跟随音乐同步显示' : '从左侧添加一首喜欢的歌曲' }}</span>
      </div>
    </div>

    <div class="now-playing__player">
      <p v-if="error" class="now-playing__error" role="alert">{{ error }}</p>
      <p v-else-if="loading" class="now-playing__status" role="status">正在准备播放…</p>
      <label class="now-playing__progress">
        <span class="now-playing__sr-only">播放进度</span>
        <input
          type="range"
          min="0"
          :max="duration || 1"
          step="0.1"
          :value="currentTime"
          :disabled="!track || duration <= 0"
          :aria-valuetext="`${formatTime(currentTime)} / ${formatTime(duration)}`"
          @input="emit('seek', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <div class="now-playing__times">
        <span>{{ formatTime(currentTime) }}</span
        ><span>{{ formatTime(duration) }}</span>
      </div>
      <div class="now-playing__controls">
        <button
          class="now-playing__control"
          type="button"
          :disabled="!track"
          aria-label="上一首"
          title="上一首"
          @click="emit('previous')"
        >
          <MusicIcon name="previous" />
        </button>
        <button
          class="now-playing__play"
          type="button"
          :disabled="!track"
          :aria-label="isPlaying || loading ? '暂停' : '播放'"
          :title="isPlaying || loading ? '暂停' : '播放'"
          @click="emit('toggle')"
        >
          <MusicIcon :name="isPlaying || loading ? 'pause' : 'play'" />
        </button>
        <button
          class="now-playing__control"
          type="button"
          :disabled="!track"
          aria-label="下一首"
          title="下一首"
          @click="emit('next')"
        >
          <MusicIcon name="next" />
        </button>
      </div>
      <div class="now-playing__options">
        <button
          class="now-playing__mode"
          type="button"
          :aria-label="`播放模式：${modeLabels[mode]}，点击切换`"
          :title="`播放模式：${modeLabels[mode]}，点击切换`"
          @click="emit('mode')"
        >
          <MusicIcon :name="mode" /><span>{{ modeLabels[mode] }}</span>
        </button>
        <label class="now-playing__volume"
          ><MusicIcon name="volume" /><input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            aria-label="音量"
            :aria-valuetext="`${Math.round(volume * 100)}%`"
            @input="emit('volume', Number(($event.target as HTMLInputElement).value))"
        /></label>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.now-playing {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 24px 20px 20px;
  background: linear-gradient(145deg, #faf8ff, #f4f6fc);
  color: #42374f;

  &__song {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
  &__cover {
    position: relative;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 96px;
    height: 96px;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 16px;
    background: linear-gradient(135deg, #d4c4f3, #b8bceb);
    color: #fff;
    cursor: pointer;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    svg {
      width: 42px;
      height: 42px;
    }
    &:disabled {
      opacity: 1;
      cursor: default;
    }
    &:hover .now-playing__cover-label,
    &:focus-visible .now-playing__cover-label {
      opacity: 1;
    }
  }
  &__cover-label {
    position: absolute;
    inset: auto 0 0;
    padding: 4px;
    background: #0008;
    color: #fff;
    font-size: 10px;
    opacity: 0;
  }
  &__file {
    display: none;
  }
  &__info {
    min-width: 0;
    h2 {
      display: -webkit-box;
      overflow: hidden;
      margin: 6px 0;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow-wrap: anywhere;
      font-size: 17px;
      font-weight: 600;
    }
    p {
      overflow: hidden;
      color: #93879d;
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  &__eyebrow {
    color: #9e8bb5;
    font-size: 10px;
    letter-spacing: 1px;
  }
  &__lyrics-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    margin-top: 22px;
    color: #9686a4;
    font-size: 11px;
    button {
      padding: 2px 0;
      border: 0;
      background: transparent;
      color: #8a71b9;
      cursor: pointer;
      font-size: 11px;
    }
  }
  &__lyrics {
    position: relative;
    flex: 1;
    min-height: 48px;
    margin: 10px 0 12px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #d5cbe2 transparent;
  }
  &__lyric {
    display: block;
    width: 100%;
    padding: 10px 4px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #a79aaf;
    text-align: center;
    font-size: 12px;
    line-height: 1.8;
    cursor: pointer;
    &--active {
      color: #7751bf;
      font-weight: 600;
    }
    &:hover {
      background: #ece6f6;
    }
  }
  &__plain {
    padding: 12px 4px;
    color: #8e7d9e;
    font-size: 12px;
    line-height: 2.4;
    text-align: center;
    white-space: pre-wrap;
  }
  &__no-lyrics {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    min-height: 48px;
    gap: 10px;
    text-align: center;
    p {
      color: #9682aa;
      font-size: 12px;
    }
    span {
      color: #b0a2bc;
      font-size: 10px;
    }
  }
  &__player {
    flex-shrink: 0;
  }
  &__error {
    margin-bottom: 8px;
    color: #b44357;
    font-size: 11px;
  }
  &__status {
    margin-bottom: 8px;
    color: #9682aa;
    font-size: 11px;
  }
  &__progress {
    display: block;
    input {
      display: block;
      width: 100%;
      height: 12px;
      margin: 0;
    }
  }
  &__times {
    display: flex;
    justify-content: space-between;
    margin: 4px 0 12px;
    color: #a195ac;
    font-size: 10px;
    font-variant-numeric: tabular-nums;
  }
  &__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 22px;
  }
  &__control,
  &__play {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #827091;
    cursor: pointer;
  }
  &__control:hover {
    background: #eae3f4;
  }
  &__play {
    width: 48px;
    height: 48px;
    background: #8a66c4;
    color: #fff;
    svg {
      width: 23px;
      height: 23px;
    }
    &:hover {
      background: #7a56b3;
    }
  }
  &__options {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
  }
  &__mode {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border: 0;
    background: transparent;
    color: #94829f;
    font-size: 10px;
    cursor: pointer;
    svg {
      width: 16px;
      height: 16px;
    }
  }
  &__volume {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #a494af;
    svg {
      width: 16px;
      height: 16px;
    }
    input {
      width: 64px;
      height: 12px;
    }
  }
  &__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  input[type='range'] {
    accent-color: #9673ce;
    cursor: pointer;
  }
  button:disabled,
  input:disabled {
    cursor: default;
    opacity: 0.4;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid #8b70d5;
    outline-offset: 2px;
  }
}

@container (max-width: 300px) {
  .now-playing {
    padding-inline: 12px;
    &__song {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }
    &__cover {
      width: 64px;
      height: 64px;
    }
    &__controls {
      gap: 10px;
    }
  }
}
</style>
