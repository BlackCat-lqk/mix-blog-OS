<script setup lang="ts">
import { ref } from 'vue'
import type { AppWindowProps, MusicSource, WindowSidebarItem } from '@/tsInterface/index'
import OsWindow from '@/components/OsWindow/index.vue'
import WindowSidebar from '@/components/OsWindow/WindowSidebar.vue'
import localIcon from '@/assets/icons/music-local.svg'
import onlineIcon from '@/assets/icons/music-online.svg'
import musicIcon from '@/assets/icons/app/music.svg'
import MusicLibrary from './components/MusicLibrary.vue'
import NowPlaying from './components/NowPlaying.vue'
import { useMusicPlayer } from './useMusicPlayer'

withDefaults(defineProps<AppWindowProps>(), {
  title: '音乐',
  icon: musicIcon,
  visible: true,
})
const minimized = defineModel<boolean>('minimized', { default: false })
const emit = defineEmits<{ activate: []; close: [] }>()
const source = ref<MusicSource>('local')
const menu: WindowSidebarItem[] = [
  { id: 'local', name: '本地音乐', icon: localIcon },
  { id: 'online', name: '在线音乐', icon: onlineIcon },
]
const {
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
  importFiles,
  attachLyrics,
  attachCover,
  selectTrack,
  seek,
  setVolume,
  cycleMode,
  togglePlayback,
  next,
  previous,
} = useMusicPlayer()
</script>

<template>
  <OsWindow
    v-model:minimized="minimized"
    :title="title"
    :icon="icon"
    :minimize-target="minimizeTarget"
    :visible="visible"
    @activate="emit('activate')"
    @close="emit('close')"
  >
    <template #sidebar>
      <WindowSidebar v-model="source" :items="menu" label="音乐来源">
      </WindowSidebar>
    </template>
    <div class="music-content">
      <div class="music-columns">
        <MusicLibrary
          :source="source"
          :tracks="tracks"
          :current-id="currentId"
          :is-playing="isPlaying"
          @import="importFiles"
          @play="selectTrack"
        />
        <NowPlaying
          :track="currentTrack"
          :is-playing="isPlaying"
          :loading="loading"
          :current-time="currentTime"
          :duration="duration"
          :volume="volume"
          :mode="mode"
          :error="error"
          :visible="!minimized && visible"
          @toggle="togglePlayback"
          @next="next"
          @previous="previous"
          @mode="cycleMode"
          @seek="seek"
          @volume="setVolume"
          @lyrics="attachLyrics"
          @cover="attachCover"
        />
      </div>
    </div>
  </OsWindow>
</template>

<style scoped lang="scss">
.music-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 8px 28px;
  > span {
    color: #4c3c63;
    font-size: 16px;
    font-weight: 600;
    span {
      display: block;
      margin-top: 2px;
      color: #b1a6bd;
      font-size: 10px;
      font-weight: 400;
    }
  }
}
.music-content {
  flex: 1;
  min-height: 0;
  container-type: inline-size;
}
.music-columns {
  display: grid;
  grid-template-columns: minmax(200px, 0.95fr) minmax(260px, 1.05fr);
  height: 100%;
  overflow: hidden;
}
@container (max-width: 519px) {
  .music-columns {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(250px, 1fr) minmax(480px, 1fr);
    overflow-y: auto;
    scrollbar-width: thin;
  }
}
</style>
