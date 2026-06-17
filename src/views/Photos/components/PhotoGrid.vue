<template>
  <div class="photo-grid" role="region" aria-label="照片网格">
    <div
      v-if="photos.length === 0"
      class="photo-grid__empty"
    >
      暂无照片
    </div>
    <div
      v-else
      class="photo-grid__container"
      :style="gridStyle"
    >
      <PhotoCard
        v-for="(photo, idx) in photos"
        :key="photo.id"
        :photo="photo"
        :selected="selectedIds.has(photo.id)"
        :selection-mode="selectionMode"
        :style="getRowSpan(photo)"
        @click="$emit('openViewer', idx)"
        @select-toggle="$emit('toggleSelect', photo.id)"
      />
    </div>
  </div>
</template>

<!-- * @description: 图片瀑布流网格 — 自适应行高布局 -->
<script setup lang="ts">
import { computed } from "vue";
import PhotoCard from "./PhotoCard.vue";
import type { PhotoItem } from "./types";

const props = defineProps<{
  photos: PhotoItem[];
  columnCount: number;
  selectedIds: Set<string>;
  selectionMode: boolean;
}>();

defineEmits<{
  toggleSelect: [id: string];
  openViewer: [index: number];
}>();

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columnCount}, 1fr)`,
  gap: "2px",
}));

/**
 * 根据照片宽高比计算 row span，创造类似 Apple Photos 的可变高度拼贴效果。
 * 横向照片 span 1，纵向/方正照片 span 2，超宽照片正常 span 1。
 */
const getRowSpan = (photo: PhotoItem): Record<string, string> => {
  const ratio = (photo.width && photo.height) ? photo.width / photo.height : 1;
  if (ratio < 0.75) {
    // 纵向照片，占 2 行
    return { gridRowEnd: "span 2" };
  }
  return {};
}
</script>

<style scoped lang="scss">
.photo-grid {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &__empty {
    color: rgba(255, 255, 255, 0.3);
    font-size: 14px;
  }

  &__container {
    display: grid;
    grid-auto-rows: 120px;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    align-content: start;
    padding: 2px;

    // 隐藏滚动条但保留滚动功能
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
