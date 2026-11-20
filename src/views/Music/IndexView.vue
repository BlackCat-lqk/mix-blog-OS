<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AppWindowProps, MusicSource, WindowSidebarItem } from '@/tsInterface/index'
import OsWindow from '@/components/OsWindow/index.vue'
import WindowSidebar from '@/components/OsWindow/WindowSidebar.vue'
import localIcon from '@/assets/icons/music-local.svg'
import onlineIcon from '@/assets/icons/music-online.svg'
import musicIcon from '@/assets/icons/app/music.png'
import MusicLibrary from './components/MusicLibrary.vue'
import NowPlaying from './components/NowPlaying.vue'
import { useMusicPlayer } from './useMusicPlayer'
import { useContentList } from '@/composables/useContentList'

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
  lyricsLoading,
  lyricsError,
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
  setOnlineTracks,
  retryLyrics,
} = useMusicPlayer()
const { items: onlineItems, total: onlineTotal, loading: onlineLoading, error: onlineError, query: onlineQuery, pageCount, load: loadOnline, changePage } = useContentList('music')
const libraryTracks = computed(() => source.value === 'local'
  ? tracks.value.filter((track) => track.source === 'local')
  : onlineItems.value.map((item) => tracks.value.find((track) => track.id === item.id)).filter((track) => track !== undefined))
watch(onlineItems, setOnlineTracks)
watch(source, (value) => { if (value === 'online') void loadOnline() })
function searchOnline(keyword: string) { onlineQuery.keyword = keyword.trim(); onlineQuery.page = 1; void loadOnline() }
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
          :tracks="libraryTracks"
          :current-id="currentId"
          :is-playing="isPlaying"
          :list-loading="onlineLoading"
          :list-error="onlineError"
          :total="onlineTotal"
          :page="onlineQuery.page"
          :page-count="pageCount"
          @import="importFiles"
          @play="selectTrack"
          @search="searchOnline"
          @reload="loadOnline"
          @page="changePage"
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
          :lyrics-loading="lyricsLoading"
          :lyrics-error="lyricsError"
          :visible="!minimized && visible"
          @toggle="togglePlayback"
          @next="next"
          @previous="previous"
          @mode="cycleMode"
          @seek="seek"
          @volume="setVolume"
          @lyrics="attachLyrics"
          @cover="attachCover"
          @retry-lyrics="retryLyrics"
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
