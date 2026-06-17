<template>
  <div
    class="photo-card"
    :class="{
      'photo-card--selected': selected,
      'photo-card--selection-mode': selectionMode,
    }"
    :style="{ aspectRatio: aspectRatio }"
    role="button"
    :aria-label="`照片: ${photo.name || '未命名'}${selected ? '，已选中' : ''}`"
    @click="handleClick"
  >
    <img
      :src="photo.url"
      :alt="photo.name || '照片缩略图'"
      class="photo-card__img"
      loading="lazy"
      draggable="false"
    />

    <!-- hover 叠加层 -->
    <div class="photo-card__overlay"></div>

    <!-- 选中标记 -->
    <div
      class="photo-card__check"
      :class="{ 'photo-card__check--checked': selected }"
      aria-hidden="true"
    >
      <svg v-if="selected" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PhotoItem } from "./types";

const props = defineProps<{
  photo: PhotoItem;
  selected: boolean;
  selectionMode: boolean;
}>();

const emit = defineEmits<{
  (e: "click"): void;
  (e: "selectToggle"): void;
}>();

const aspectRatio = computed(() => {
  const { width, height } = props.photo;
  if (!width || !height) return "1 / 1";
  return `${width} / ${height}`;
});

function handleClick() {
  if (props.selectionMode) {
    emit("selectToggle");
  } else {
    emit("click");
  }
}
</script>

<style scoped lang="scss">
.photo-card {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  background: #1c1c1e;
  transition: transform 0.2s ease;

  // aspect-ratio 由 inline style 动态设置

  &:hover {
    transform: scale(1.02);
    z-index: 1;

    .photo-card__overlay {
      opacity: 1;
    }
  }

  &__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }

  // hover 时白色半透明叠加层
  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.08);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  // 选中标记圆圈
  &__check {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease;

    &--checked {
      opacity: 1;
      transform: scale(1);
      background: #007aff;
      border-color: #007aff;
    }
  }

  // 选择模式下始终显示勾选圆圈
  &--selection-mode {
    .photo-card__check {
      opacity: 1;
      transform: scale(1);
    }
  }

  // 选中状态的边框高亮
  &--selected {
    outline: 3px solid #007aff;
    outline-offset: -1px;
  }
}
</style>
