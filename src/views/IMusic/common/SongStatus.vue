<template>
  <div class="song-status">
    <div class="status-head">
      <ToolTip content="Now Playing" position="top" theme="dark">
        <img src="@/assets/iMusic/icons/playing.svg" />
        <span>Now Playing</span>
      </ToolTip>
    </div>

    <div class="current-song">
      <div class="cover-wrap">
        <img :src="currentSong?.coverUrl || defaultCover" alt="当前播放歌曲封面" />
      </div>
      <div class="song-meta">
        <div class="song-name">{{ currentSong?.title || "暂无播放" }}</div>
        <div class="song-artist">{{ currentSong?.artist || " " }}</div>
        <button type="button" class="queue-btn" aria-label="打开播放详情" @click="handleOpenDetail">
          <img src="@/assets/iMusic/icons/meun.svg" alt="" />
        </button>
      </div>
    </div>
    <OverlayScrollbarsComponent
      defer
      :options="{
        scrollbars: {
          autoHide: 'move',
          autoHideDelay: 100,
        },
      }"
    >
      <div class="queue-list">
        <button
          v-for="(item, idx) in queueSongs"
          :key="item.song.id ?? `${item.song.title}-${idx}`"
          type="button"
          class="queue-item"
          @click="handlePickSong(idx)"
        >
          <div class="queue-cover">
            <img :src="item.song.coverUrl || defaultCover" alt="" />
          </div>
          <div class="queue-meta">
            <div class="queue-title">{{ item.song.title || "未知歌曲" }}</div>
            <div class="queue-artist">{{ item.song.artist || "未知歌手" }}</div>
          </div>
          <div class="queue-time">{{ formatDuration(item.song.duration) }}</div>
        </button>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEventStore } from "@/stores/iMusic/eventStore";
import defaultCover from "@/assets/iMusic/images/cover.jpg";
import { formatTime } from "@/utils/formatTime";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import ToolTip from "@/components/ToolTip.vue";
interface MusicItem {
  id?: number | string;
  title: string;
  artist?: string;
  duration?: number;
  coverUrl?: string;
}

const eventStore = useEventStore();

const playList = computed<MusicItem[]>(() => {
  return eventStore.setPlayDetail.data?.length ? eventStore.setPlayDetail.data : [];
});

const currentSongIdx = computed(() => {
  const idx = eventStore.setPlayDetail.currentIndex;
  if (idx < 0 || idx >= playList.value.length) return 0;
  return idx;
});

const currentSong = computed(() => playList.value[currentSongIdx.value]);

const queueSongs = computed(() => {
  if (!playList.value.length) return [];
  return playList.value
    .map((song, idx) => ({ song, idx }))
    .filter((item) => item.idx !== currentSongIdx.value);
});

const formatDuration = (duration?: number) => {
  if (!duration || duration <= 0) return "--:--";
  return formatTime(duration);
};

const handlePickSong = (displayIndex: number) => {
  const target = queueSongs.value[displayIndex];
  if (!target) return;
  eventStore.setCurrentIndex(target.idx);
  eventStore.controlPlay(true);
};

const handleOpenDetail = () => {
  eventStore.setShow(true);
};
</script>

<style scoped lang="scss">
$text-color: #000;
.song-status {
  display: flex;
  flex-direction: column;
  width: 260px;
  height: calc(100% - 80px);
  gap: 18px;
  min-height: 600px;
  padding: 20px;
  box-sizing: border-box;
  color: $text-color;
  background: rgba(255, 255, 255, 0.8);
  margin-right: 10px;
  border-radius: 15px;
}

.status-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 10px 0;
  img {
    width: 20px;
    height: 20px;
  }
}

.current-song {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.cover-wrap {
  width: 200px;
  aspect-ratio: 1 / 1;
  border-radius: 40px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.song-meta {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "name menu"
    "artist menu";
  row-gap: 6px;
  align-items: center;
  padding-left: 10px;
  width: 100%;
}

.song-name {
  grid-area: name;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  grid-area: artist;
  color: $text-color;
  opacity: 0.8;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-btn {
  grid-area: menu;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 20px;
  img {
    width: 20px;
    height: 20px;
  }
}

.queue-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  scrollbar-width: none;
}

.queue-item {
  width: 100%;
  border: none;
  background: transparent;
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.16s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.queue-cover {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.queue-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.queue-title {
  font-size: 16px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-artist {
  color: $text-color;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
}

.queue-time {
  color: $text-color;
  font-size: 12px;
  min-width: 48px;
  text-align: right;
  opacity: 0.8;
}
</style>
