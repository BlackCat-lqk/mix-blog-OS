<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MusicSource, MusicTrack } from '@/tsInterface/index'
import MusicIcon from './MusicIcon.vue'
import { formatTime } from '../lyrics'

const props = defineProps<{
  source: MusicSource
  tracks: readonly MusicTrack[]
  currentId: string
  isPlaying: boolean
}>()
const emit = defineEmits<{ import: [files: File[]]; play: [id: string] }>()
const fileInput = ref<HTMLInputElement>()
const query = ref('')
const filteredTracks = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return props.tracks.filter((track) =>
    `${track.title} ${track.artist} ${track.fileName}`.toLowerCase().includes(keyword),
  )
})
const onFiles = (event: Event) => {
  const input = event.target as HTMLInputElement
  emit('import', Array.from(input.files ?? []))
  input.value = ''
}
</script>

<template>
  <section class="music-library" :aria-label="source === 'local' ? '本地音乐' : '在线音乐'">
    <header class="music-library__header">
      <div>
        <h1>{{ source === 'local' ? '本地音乐' : '在线音乐' }}</h1>
        <p>{{ source === 'local' ? `${tracks.length} 首歌曲` : '发现更多好音乐' }}</p>
      </div>
      <button
        v-if="source === 'local'"
        class="music-library__add"
        type="button"
        @click="fileInput?.click()"
      >
        <MusicIcon name="plus" />
        添加音乐
      </button>
      <input
        ref="fileInput"
        class="music-library__file"
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.webm,.lrc,.txt,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp"
        aria-label="选择本地音乐、歌词和封面"
        @change="onFiles"
      />
    </header>

    <template v-if="source === 'local'">
      <label class="music-library__search">
        <MusicIcon name="search" />
        <input
          v-model="query"
          type="search"
          placeholder="搜索歌曲、歌手"
          aria-label="搜索本地歌曲"
          :spellcheck="false"
        />
      </label>
      <div v-if="!tracks.length" class="music-library__empty">
        <MusicIcon name="music" />
        <h2>把喜欢的音乐带进来</h2>
        <p>点击「添加音乐」选择本地音频。</p>
        <p>可同时选择同名歌词和封面，自动匹配。</p>
      </div>
      <p v-else-if="!filteredTracks.length" class="music-library__empty" role="status">
        没有找到相关歌曲
      </p>
      <ol v-else class="music-library__list" aria-label="歌曲列表">
        <li v-for="(track, index) in filteredTracks" :key="track.id">
          <button
            class="music-library__track"
            :class="{ 'music-library__track--current': currentId === track.id }"
            type="button"
            :aria-label="`播放 ${track.title}`"
            :aria-current="currentId === track.id ? 'true' : undefined"
            @click="emit('play', track.id)"
          >
            <span class="music-library__number">
              <MusicIcon v-if="currentId === track.id && isPlaying" name="volume" />
              <span v-else>{{ String(index + 1).padStart(2, '0') }}</span>
            </span>
            <img
              v-if="track.coverUrl"
              class="music-library__cover"
              :src="track.coverUrl"
              alt=""
              width="40"
              height="40"
            />
            <span v-else class="music-library__cover music-library__cover--empty"
              ><MusicIcon name="music"
            /></span>
            <span class="music-library__track-info">
              <span class="music-library__title">{{ track.title }}</span>
              <span class="music-library__artist">{{ track.artist }}</span>
            </span>
            <span class="music-library__duration">{{
              track.duration ? formatTime(track.duration) : '--:--'
            }}</span>
          </button>
        </li>
      </ol>
      <p class="music-library__hint">文件仅在本地播放，关闭音乐应用后需重新添加。</p>
    </template>
    <div v-else class="music-library__empty">
      <MusicIcon name="cloud" />
      <h2>在线音乐，敬请期待</h2>
      <p>在线服务接入后，可在这里搜索和播放。</p>
      <p>现在可以先听听本地音乐。</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.music-library {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 24px 16px 16px;
  border-right: 1px solid #eeedf3;
  background: #fff;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;

    h1 {
      color: #292536;
      font-size: 20px;
      font-weight: 650;
    }
    p {
      margin-top: 4px;
      color: #8b8797;
      font-size: 12px;
    }
  }

  &__add {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 7px 10px;
    border: 0;
    border-radius: 8px;
    background: #eee9fc;
    color: #6b4fc2;
    font-size: 12px;
    cursor: pointer;
    svg {
      width: 16px;
      height: 16px;
    }
    &:hover {
      background: #e5ddfa;
    }
  }

  &__file {
    display: none;
  }

  &__search {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding: 8px 10px;
    border: 1px solid #e9e6f0;
    border-radius: 8px;
    color: #9993a7;
    svg {
      width: 16px;
      height: 16px;
    }
    &:focus-within {
      border-color: #8b70d5;
      outline: 1px solid #8b70d5;
    }
    input {
      width: 100%;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: #302b3e;
      font-size: 12px;
    }
  }

  &__list {
    flex: 1;
    min-height: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
    scrollbar-width: thin;
  }

  &__track {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 6px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: #81798f;
    text-align: left;
    cursor: pointer;
    &:hover {
      background: #f8f6fc;
    }
    &--current {
      background: #f0ebfb;
      color: #7854cb;
    }
  }

  &__number {
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    width: 20px;
    font-size: 11px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
  &__cover {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    &--empty {
      display: grid;
      place-items: center;
      background: #eee9f7;
      color: #9c89c2;
    }
  }
  &__track-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  &__title {
    overflow: hidden;
    color: #332d40;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__artist {
    overflow: hidden;
    color: #91899e;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__duration {
    flex-shrink: 0;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  &__hint {
    flex-shrink: 0;
    margin-top: 12px;
    color: #a09aa9;
    font-size: 10px;
  }

  &__empty {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 8px;
    color: #948b9f;
    text-align: center;
    font-size: 12px;
    svg {
      width: 36px;
      height: 36px;
      margin-bottom: 8px;
      color: #b4a2d5;
    }
    h2 {
      margin-bottom: 4px;
      color: #5c506d;
      font-size: 14px;
      font-weight: 500;
    }
  }

  button:focus-visible {
    outline: 2px solid #8b70d5;
    outline-offset: -2px;
  }
}
</style>
