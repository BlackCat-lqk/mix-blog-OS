<script setup lang="ts">
import { computed } from "vue";
import { formatFileSize } from "@/utils/imageConvert";

interface PreviewItem {
  file: File;
  url: string;
  id: string;
}

const props = defineProps<{
  items: PreviewItem[];
  maxFiles: number;
}>();

const emit = defineEmits<{
  remove: [id: string];
  clear: [];
}>();

const countText = computed(() => `${props.items.length} / ${props.maxFiles} 张图片`);

function getFormatLabel(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ext.toUpperCase();
}

function getFormatColor(ext: string): string {
  const map: Record<string, string> = {
    png: "#16a34a",
    jpg: "#ea580c",
    jpeg: "#ea580c",
    webp: "#2563eb",
    gif: "#9333ea",
    bmp: "#0891b2",
    svg: "#db2777",
    avif: "#4f46e5",
    ico: "#65a30d",
    tiff: "#ca8a04",
    tif: "#ca8a04",
  };
  return map[ext] || "#6b7280";
}
</script>

<template>
  <div v-if="items.length > 0" class="preview-list">
    <div class="preview-list__header">
      <span class="preview-list__count">{{ countText }}</span>
      <button class="preview-list__clear" @click="emit('clear')">清空全部</button>
    </div>
    <div class="preview-list__grid">
      <div v-for="item in items" :key="item.id" class="preview-card">
        <div class="preview-card__img-wrap">
          <img :src="item.url" :alt="item.file.name" class="preview-card__img" />
          <button class="preview-card__remove" @click="emit('remove', item.id)" title="移除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="preview-card__info">
          <p class="preview-card__name" :title="item.file.name">{{ item.file.name }}</p>
          <div class="preview-card__meta">
            <span class="preview-card__size">{{ formatFileSize(item.file.size) }}</span>
            <span
              class="preview-card__format"
              :style="{ backgroundColor: getFormatColor(getFormatLabel(item.file)) }"
            >
              {{ getFormatLabel(item.file) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-list {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__count {
    font-size: 13px;
    font-weight: 600;
    color: #344054;
  }

  &__clear {
    padding: 0;
    border: none;
    background: transparent;
    font-size: 12px;
    color: #ef4444;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: #dc2626;
    }
  }

  &__grid {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.preview-card {
  width: 120px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &__img-wrap {
    position: relative;
    width: 100%;
    height: 90px;
    background: #f3f4f6;
    overflow: hidden;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;

    .preview-card__img-wrap:hover & {
      opacity: 1;
    }
  }

  &__info {
    padding: 6px 8px 8px;
  }

  &__name {
    margin: 0 0 4px;
    font-size: 11px;
    color: #344054;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__size {
    font-size: 10px;
    color: #98a2b3;
  }

  &__format {
    margin-left: auto;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
}
</style>
