<template>
  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="visible"
        class="photo-viewer"
        role="dialog"
        aria-label="照片查看器"
        aria-modal="true"
        @wheel.prevent="handleWheel"
      >
        <!-- 顶部栏 -->
        <div class="photo-viewer__top">
          <button class="photo-viewer__close" aria-label="关闭查看器" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span class="photo-viewer__counter">{{ currentIndex + 1 }} / {{ total }}</span>
          <div class="photo-viewer__spacer"></div>
        </div>

        <!-- 图片区域 -->
        <div
          class="photo-viewer__body"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
          @click.self="close"
        >
          <!-- 左箭头 -->
          <button
            v-if="total > 1"
            class="photo-viewer__arrow photo-viewer__arrow--left"
            aria-label="上一张"
            @click.stop="prev"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <!-- 照片 -->
          <img
            :key="currentPhoto?.id"
            :src="currentPhoto?.url"
            :alt="currentPhoto?.name || '照片'"
            class="photo-viewer__img"
            draggable="false"
          />

          <!-- 右箭头 -->
          <button
            v-if="total > 1"
            class="photo-viewer__arrow photo-viewer__arrow--right"
            aria-label="下一张"
            @click.stop="next"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <!-- 底部操作栏 -->
        <div class="photo-viewer__bottom">
          <button class="photo-viewer__action" aria-label="收藏" @click="toggleFavorite">
            <svg width="20" height="20" viewBox="0 0 24 24" :fill="currentPhoto?.favorite ? '#ff453a' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
          <button class="photo-viewer__action" aria-label="删除" @click="deletePhoto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from "vue";
import type { PhotoItem } from "./types";

const props = defineProps<{
  photos: PhotoItem[];
  currentIndex: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  navigate: [index: number];
  deletePhoto: [index: number];
  toggleFavorite: [index: number];
}>();

const total = computed(() => props.photos.length);

const currentPhoto = computed(() => {
  return props.photos[props.currentIndex] ?? null;
});

function close() {
  emit("close");
}

function prev() {
  if (total.value <= 1) return;
  const newIdx = props.currentIndex > 0 ? props.currentIndex - 1 : total.value - 1;
  emit("navigate", newIdx);
}

function next() {
  if (total.value <= 1) return;
  const newIdx = props.currentIndex < total.value - 1 ? props.currentIndex + 1 : 0;
  emit("navigate", newIdx);
}

function toggleFavorite() {
  emit("toggleFavorite", props.currentIndex);
}

function deletePhoto() {
  emit("deletePhoto", props.currentIndex);
}

// --- 键盘支持 ---
function onKeydown(e: KeyboardEvent) {
  if (!props.visible) return;
  switch (e.key) {
    case "Escape":
      e.preventDefault();
      close();
      break;
    case "ArrowLeft":
      e.preventDefault();
      prev();
      break;
    case "ArrowRight":
      e.preventDefault();
      next();
      break;
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});

// --- 触摸滑动 ---
let touchStartX = 0;

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
}

function onTouchEnd(e: TouchEvent) {
  const delta = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 50) {
    if (delta < 0) {
      next();
    } else {
      prev();
    }
  }
}

// --- 滚轮缩放（预留，当前仅阻止默认） ---
function handleWheel(_e: WheelEvent) {
  // 预留：后续可实现滚轮缩放
}
</script>

<style scoped lang="scss">
.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.97);
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;

  // ---- 顶部栏 ----
  &__top {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
    flex-shrink: 0;
    z-index: 1;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &__counter {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }

  &__spacer {
    flex: 1;
  }

  // ---- 中间主体 ----
  &__body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 0;
  }

  &__img {
    max-width: 95%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 2px;
    // 切入动画
    animation: viewer-img-in 0.25s ease-out;
  }

  @keyframes viewer-img-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  // ---- 左右箭头 ----
  &__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    cursor: pointer;
    transition: background 0.15s ease;
    z-index: 2;

    &:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    &--left {
      left: 12px;
    }

    &--right {
      right: 12px;
    }
  }

  // ---- 底部操作栏 ----
  &__bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 16px;
    flex-shrink: 0;
    z-index: 1;
  }

  &__action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.18);
    }
  }
}

// ---- Vue Transition ----
.viewer-enter-active {
  transition: opacity 0.25s ease;

  .photo-viewer__img {
    animation: viewer-img-in 0.25s ease-out;
  }
}

.viewer-leave-active {
  transition: opacity 0.2s ease;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}
</style>
