<template>
  <div class="play-window-box">
    <div class="play-window-inner">
      <div class="play-window-top">
        <div class="meta-block" role="button" tabindex="0">
          <div class="cover-box">
            <img
              :src="
                playList[currentSongIdx]?.coverUrl ? playList[currentSongIdx]?.coverUrl : autoAvatar
              "
              alt=""
            />
          </div>
          <div class="inform-box">
            <span class="music-name">{{ playList[currentSongIdx]?.title }}</span>
            <span class="author">{{ playList[currentSongIdx]?.artist || " " }}</span>
          </div>
        </div>
        <div class="control-box">
          <div class="control-item">
            <button
              type="button"
              class="ctrl-icon status-icon"
              :class="{ 'status-icon--active': playMode === 'shuffle' }"
              aria-label="随机播放"
              @click.stop="toggleShuffle"
            >
              <img src="@/assets/iMusic/icons/shuffle.svg" alt="" />
            </button>
            <button
              type="button"
              class="ctrl-icon"
              aria-label="上一首"
              :disabled="!canChangeTrack"
              @click.stop="previousSong"
            >
              <img src="@/assets/iMusic/icons/previousSong.svg" alt="" />
            </button>
            <button
              type="button"
              class="ctrl-icon ctrl-icon--play"
              :aria-label="isPlayingFlag ? '暂停' : '播放'"
              @click.stop="togglePlay"
            >
              <img :src="isPlayingFlag ? SuspendIcon : PlayIcon" alt="" />
            </button>
            <button
              type="button"
              class="ctrl-icon"
              aria-label="下一首"
              :disabled="!canChangeTrack"
              @click.stop="nextSong"
            >
              <img src="@/assets/iMusic/icons/nextSong.svg" alt="" />
            </button>
            <button
              type="button"
              class="ctrl-icon status-icon"
              :class="{ 'status-icon--active': isSingleLoop }"
              aria-label="循环模式"
              @click.stop="loopControl"
            >
              <img v-if="!isSingleLoop" src="@/assets/iMusic/icons/repeat.svg" alt="" />
              <img v-else src="@/assets/iMusic/icons/repeatOnce.svg" alt="" />
            </button>
          </div>
          <div class="mini-progress" aria-hidden="true">
            <div class="mini-progress-current" :style="{ width: `${progressPercent}%` }"></div>
          </div>
        </div>
        <div class="right-control-box">
          <button
            type="button"
            class="ctrl-icon status-icon"
            aria-label="音量控制"
            @click.stop="toggleMute"
          >
            <img :src="volumeBarValue > 0 ? VoiceIcon : VolumeDisableIcon" alt="" />
          </button>
          <input
            class="volume-range"
            type="range"
            min="0"
            max="100"
            :value="volumeBarValue"
            @input="changeVolume"
          />
          <button type="button" class="ctrl-icon status-icon" @click="handlePlayDetail">
            <img src="@/assets/iMusic/icons/full.svg" alt="" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useEventStore } from "@/stores/iMusic/eventStore";
import autoAvatar from "@/assets/iMusic/images/cover.jpg";
import PlayIcon from "@/assets/iMusic/icons/play.svg";
import SuspendIcon from "@/assets/iMusic/icons/suspend.svg";
import VoiceIcon from "@/assets/iMusic/icons/voice.svg";
import VolumeDisableIcon from "@/assets/iMusic/icons/volumeDisable.svg";

interface MusicItem {
  id?: number | string;
  title: string;
  artist?: string;
  audioUrl?: string;
  duration?: number;
  coverUrl?: string;
  lyricsUrl?: string;
}

const eventStore = useEventStore();
const isPlayingFlag = ref(false);
const currentSongIdx = ref(0);
const placeholderList: MusicItem[] = [{ title: "暂无播放" }];
const playList = ref<Array<MusicItem>>([...placeholderList]);
const progressPercent = ref(0);
const audioElRef = ref<HTMLAudioElement | null>(null);
const volumeBarValue = ref(70);
const lastVolumeBeforeMute = ref(70);

const canChangeTrack = computed(() => playList.value.length > 1);
const playMode = computed(() => eventStore.playMode);
const isSingleLoop = computed(() => playMode.value === "single-loop");

const syncAudioProgress = () => {
  const audio = audioElRef.value;
  if (!audio) {
    progressPercent.value = 0;
    return;
  }
  const duration = Number(audio.duration);
  const current = Number(audio.currentTime);
  if (!Number.isFinite(duration) || duration <= 0) {
    progressPercent.value = 0;
    return;
  }
  const percent = Math.min(100, Math.max(0, (current / duration) * 100));
  progressPercent.value = Math.round(percent * 100) / 100;
};

const detachAudioEvents = () => {
  const audio = audioElRef.value;
  if (!audio) return;
  audio.removeEventListener("timeupdate", syncAudioProgress);
  audio.removeEventListener("loadeddata", syncAudioProgress);
  audio.removeEventListener("durationchange", syncAudioProgress);
  audio.removeEventListener("seeked", syncAudioProgress);
  audio.removeEventListener("ended", syncAudioProgress);
};

const bindAudioEvents = () => {
  const el = document.getElementById("imusicAudio") as HTMLAudioElement | null;
  if (!el) return;
  if (audioElRef.value === el) {
    syncAudioProgress();
    return;
  }

  detachAudioEvents();
  audioElRef.value = el;
  el.volume = volumeBarValue.value / 100;
  el.loop = isSingleLoop.value;
  el.addEventListener("timeupdate", syncAudioProgress);
  el.addEventListener("loadeddata", syncAudioProgress);
  el.addEventListener("durationchange", syncAudioProgress);
  el.addEventListener("seeked", syncAudioProgress);
  el.addEventListener("ended", syncAudioProgress);
  syncAudioProgress();
};

const togglePlay = () => {
  eventStore.setCurrentIndex(currentSongIdx.value);
  eventStore.controlPlay(!eventStore.control.play);
};

const previousSong = () => {
  const len = playList.value.length;
  if (len < 1) return;
  if (playMode.value === "shuffle") {
    const randomIdx = getRandomNextIndex(currentSongIdx.value, len);
    eventStore.setCurrentIndex(randomIdx);
    return;
  }
  const next = currentSongIdx.value <= 0 ? len - 1 : currentSongIdx.value - 1;
  eventStore.setCurrentIndex(next);
};

const nextSong = () => {
  const len = playList.value.length;
  if (len < 1) return;
  if (playMode.value === "shuffle") {
    const randomIdx = getRandomNextIndex(currentSongIdx.value, len);
    eventStore.setCurrentIndex(randomIdx);
    return;
  }
  const next = currentSongIdx.value >= len - 1 ? 0 : currentSongIdx.value + 1;
  eventStore.setCurrentIndex(next);
};

const getRandomNextIndex = (current: number, len: number) => {
  if (len <= 1) return current;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * len);
  }
  return next;
};

const loopControl = () => {
  const nextMode = isSingleLoop.value ? "list-loop" : "single-loop";
  eventStore.setPlayMode(nextMode);
};

const toggleShuffle = () => {
  const nextMode = playMode.value === "shuffle" ? "list-loop" : "shuffle";
  eventStore.setPlayMode(nextMode);
};

const changeVolume = (e: Event) => {
  if (!e.target) return;
  const target = e.target as HTMLInputElement;
  volumeBarValue.value = Number.parseInt(target.value, 10);
  if (volumeBarValue.value > 0) {
    lastVolumeBeforeMute.value = volumeBarValue.value;
  }
  eventStore.setVolume(volumeBarValue.value);
  if (audioElRef.value) audioElRef.value.volume = volumeBarValue.value / 100;
};

const toggleMute = () => {
  if (volumeBarValue.value > 0) {
    lastVolumeBeforeMute.value = volumeBarValue.value;
    volumeBarValue.value = 0;
  } else {
    volumeBarValue.value = lastVolumeBeforeMute.value > 0 ? lastVolumeBeforeMute.value : 70;
  }
  eventStore.setVolume(volumeBarValue.value);
  if (audioElRef.value) audioElRef.value.volume = volumeBarValue.value / 100;
};

const handlePlayDetail = () => {
  eventStore.setShow(true);
  eventStore.setCurrentIndex(currentSongIdx.value);
};

watch(
  () => eventStore.control.play,
  (playing) => {
    isPlayingFlag.value = playing;
  },
  { immediate: true },
);
watch(
  () => eventStore.setPlayDetail.data,
  (newValue) => {
    playList.value = newValue?.length ? newValue : [...placeholderList];
  },
  { deep: true, immediate: true },
);
watch(
  () => eventStore.setPlayDetail.currentIndex,
  (newValue) => {
    if (typeof newValue === "number" && newValue >= 0) {
      currentSongIdx.value = newValue;
    } else {
      currentSongIdx.value = 0;
    }
  },
  { immediate: true },
);

watch(
  () => eventStore.setPlayDetail.show,
  () => {
    void nextTick(bindAudioEvents);
  },
);
watch(
  () => eventStore.volume,
  (val) => {
    volumeBarValue.value = val;
    if (val > 0) {
      lastVolumeBeforeMute.value = val;
    }
    if (audioElRef.value) audioElRef.value.volume = val / 100;
  },
  { immediate: true },
);

onMounted(() => {
  void nextTick(bindAudioEvents);
});

onBeforeUnmount(() => {
  detachAudioEvents();
  audioElRef.value = null;
});
</script>

<style scoped lang="scss">
$text-color: #000;
.play-window-box {
  width: 100%;
  padding: 0 10px;
  position: absolute;
  bottom: 0;
  background-color: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.play-window-inner {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.play-window-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-range {
  width: 160px;
  height: 4px;
  accent-color: $text-color;
}

.mini-progress {
  width: 100%;
  height: 2px;
  border-radius: 1px;
  overflow: hidden;
  background-color: rgb(75, 75, 75);
}

.mini-progress-current {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(to right, #bcbcbc 0%, #fff 100%);
  transition: width 0.16s linear;
}

.meta-block {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  width: 330px;
}

.cover-box {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.inform-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  flex: 1;

  .music-name {
    color: $text-color;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .author {
    color: $text-color;
    opacity: 0.8;
    font-size: 12px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.control-box {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  flex: 1;
  .control-item {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}

.ctrl-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: $text-color;
  cursor: pointer;
  transition:
    background 0.15s ease,
    opacity 0.15s ease;

  img {
    width: 34px;
    height: 34px;
    display: block;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgba(62, 232, 106, 0.55);
    outline-offset: 2px;
  }
}

.ctrl-icon {
  width: 44px;
  height: 44px;

  img {
    width: 32px;
    height: 32px;
  }
}

.status-icon {
  img {
    width: 16px;
    height: 16px;
  }
}

.ctrl-icon--play {
  width: 44px;
  height: 44px;

  img {
    width: 32px;
    height: 32px;
  }
}

.right-control-box {
  width: 380px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.status-icon--active {
  background: rgba(255, 255, 255, 0.18);
}
</style>
