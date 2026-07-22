<!-- * @description: 转换结果展示 — 生成文件预览与批量下载 -->
<script setup lang="ts">
import { computed, watch, onUnmounted, ref } from "vue";
import {
  type ConvertResult,
  formatFileSize,
  downloadBlob,
} from "@/utils/imageConvert";

const props = defineProps<{
  results: ConvertResult[];
}>();

const emit = defineEmits<{
  clear: [];
}>();

interface DisplayItem {
  result: ConvertResult;
  previewUrl: string;
  compressionRatio: string;
  sizeDiff: string;
  isSmaller: boolean;
  isError: boolean;
}

const displayItems = computed<DisplayItem[]>(() =>
  props.results.map((r) => {
    const isError = r.ext === "error" || r.convertedSize === 0;
    const previewUrl = isError ? "" : URL.createObjectURL(r.blob);
    const ratio = r.originalSize > 0
      ? ((1 - r.convertedSize / r.originalSize) * 100)
      : 0;
    const isSmaller = ratio > 0;
    const sign = isSmaller ? "↓ " : ratio < 0 ? "↑ " : "";
    const compressionRatio = `${sign}${Math.abs(ratio).toFixed(1)}%`;
    const diff = formatFileSize(Math.abs(r.convertedSize - r.originalSize));
    const sizeDiff = isSmaller ? `节省 ${diff}` : ratio < 0 ? `增加 ${diff}` : "无变化";

    return {
      result: r,
      previewUrl,
      compressionRatio,
      sizeDiff,
      isSmaller,
      isError,
    };
  }),
);

// Track created blob URLs for cleanup
const createdUrls = ref<string[]>([]);

// Revoke old blob URLs whenever displayItems recomputes
watch(displayItems, (items) => {
  // Revoke all previously tracked URLs
  createdUrls.value.forEach((url) => URL.revokeObjectURL(url));
  // Track the new URLs
  createdUrls.value = items
    .filter((d) => !d.isError)
    .map((d) => d.previewUrl);
});

onUnmounted(() => {
  createdUrls.value.forEach((url) => URL.revokeObjectURL(url));
  createdUrls.value = [];
});

const downloadOne = (item: DisplayItem) => {
  if (item.isError) return;
  downloadBlob(item.result.blob, item.result.fileName);
}

const downloadAll = () => {
  const valid = displayItems.value.filter((d) => !d.isError);
  valid.forEach((d) => downloadBlob(d.result.blob, d.result.fileName));
}
</script>

<template>
  <div v-if="results.length > 0" class="result">
    <div class="result__header">
      <h3 class="result__title">转换结果</h3>
      <div class="result__header-actions">
        <button class="result__btn result__btn--primary" @click="downloadAll">下载全部</button>
        <button class="result__btn result__btn--ghost" @click="emit('clear')">清空结果</button>
      </div>
    </div>

    <div class="result__grid">
      <div
        v-for="item in displayItems"
        :key="item.result.originalName"
        class="result-card"
        :class="{ 'result-card--error': item.isError }"
      >
        <div class="result-card__preview">
          <img
            v-if="!item.isError"
            :src="item.previewUrl"
            :alt="item.result.fileName"
            class="result-card__img"
          />
          <div v-else class="result-card__error-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>转换失败</span>
          </div>
        </div>

        <div class="result-card__body">
          <p class="result-card__name" :title="item.result.fileName">{{ item.result.fileName }}</p>

          <div class="result-card__row">
            <span class="result-card__label">原始</span>
            <span class="result-card__val">{{ formatFileSize(item.result.originalSize) }}</span>
            <span class="result-card__badge result-card__badge--orig">
              {{ item.result.originalFormat.toUpperCase() }}
            </span>
          </div>

          <div v-if="!item.isError" class="result-card__row">
            <span class="result-card__label">转换后</span>
            <span class="result-card__val">{{ formatFileSize(item.result.convertedSize) }}</span>
            <span class="result-card__badge result-card__badge--conv">
              {{ item.result.ext.toUpperCase() }}
            </span>
          </div>

          <div v-if="!item.isError" class="result-card__row">
            <span
              class="result-card__delta"
              :class="item.isSmaller ? 'result-card__delta--good' : 'result-card__delta--bad'"
            >
              {{ item.compressionRatio }}
            </span>
            <span class="result-card__diff">{{ item.sizeDiff }}</span>
          </div>

          <div class="result-card__row result-card__dim">
            <span>{{ item.result.width }} × {{ item.result.height }}</span>
          </div>

          <button
            v-if="!item.isError"
            class="result-card__download"
            @click="downloadOne(item)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            下载
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.result {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #101828;
  }

  &__header-actions {
    display: flex;
    gap: 8px;
  }

  &__btn {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;

    &--primary {
      background: #3b82f6;
      color: #fff;
      border-color: #3b82f6;

      &:hover {
        background: #2563eb;
      }
    }

    &--ghost {
      background: #fff;
      color: #6b7280;
      border-color: #d0d5dd;

      &:hover {
        background: #f9fafb;
      }
    }
  }

  &__grid {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.result-card {
  width: 200px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  }

  &--error {
    border-color: #fecaca;
    background: #fef2f2;
  }

  &__preview {
    width: 100%;
    height: 120px;
    background: #f3f4f6;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__error-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #ef4444;
    font-size: 12px;
  }

  &__body {
    padding: 10px 12px 12px;
  }

  &__name {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: #344054;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 3px;
    font-size: 11px;
  }

  &__label {
    color: #98a2b3;
    width: 40px;
    flex-shrink: 0;
  }

  &__val {
    color: #344054;
    font-weight: 500;
  }

  &__badge {
    margin-left: auto;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;

    &--orig {
      background: #6b7280;
    }

    &--conv {
      background: #3b82f6;
    }
  }

  &__delta {
    width: 40px;
    flex-shrink: 0;
    font-weight: 700;

    &--good {
      color: #16a34a;
    }

    &--bad {
      color: #ef4444;
    }
  }

  &__diff {
    color: #6b7280;
    font-size: 10px;
  }

  &__dim {
    color: #98a2b3;
    font-size: 10px;
    margin-top: 2px;
  }

  &__download {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    margin-top: 10px;
    padding: 6px 0;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    background: #f9fafb;
    color: #344054;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }
  }
}
</style>
