<!-- * @description: 图片转换应用 — 批量格式转换、缩放、质量调节 -->
<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import DropZone from "./components/DropZone.vue";
import ImagePreviewList from "./components/ImagePreviewList.vue";
import ConvertPanel from "./components/ConvertPanel.vue";
import ConvertResult from "./components/ConvertResult.vue";
import FaviconMaker from "./components/FaviconMaker.vue";
import {
  convertImages,
  type OutputFormat,
  type ConvertResult as ConvertResultType,
} from "@/utils/imageConvert";

// ---- Tab 切换 ----
const activeTab = ref(0);
const tabs = [
  { name: "格式转换", desc: "7 种格式 · 批量处理" },
  { name: "Favicon 制作", desc: "多尺寸 · 一键导出" },
];

const MAX_FILES = 5;

// ---- 格式转换模块 ----
interface PreviewItem {
  file: File;
  url: string;
  id: string;
}

const previewItems = ref<PreviewItem[]>([]);
let idCounter = 0;

const targetFormat = ref<OutputFormat>("image/webp");
const quality = ref(85);
const batchMode = ref(true);
const converting = ref(false);
const results = ref<ConvertResultType[]>([]);

const handleFiles = (files: File[]) => {
  const remaining = MAX_FILES - previewItems.value.length;
  if (remaining <= 0) return;

  const toAdd = files.slice(0, remaining);
  for (const file of toAdd) {
    if (previewItems.value.some((p) => p.file.name === file.name && p.file.size === file.size)) {
      continue;
    }
    const url = URL.createObjectURL(file);
    previewItems.value.push({ file, url, id: String(++idCounter) });
  }
}

const removeItem = (id: string) => {
  const item = previewItems.value.find((p) => p.id === id);
  if (item) URL.revokeObjectURL(item.url);
  previewItems.value = previewItems.value.filter((p) => p.id !== id);
}

const clearAll = () => {
  for (const item of previewItems.value) {
    URL.revokeObjectURL(item.url);
  }
  previewItems.value = [];
}

const doConvert = async () => {
  if (previewItems.value.length === 0 || converting.value) return;
  converting.value = true;
  results.value = [];

  const files = previewItems.value.map((p) => p.file);
  const converted = await convertImages(files, {
    format: targetFormat.value,
    quality: quality.value,
  });

  results.value = converted;
  converting.value = false;
}

const clearResults = () => {
  results.value = [];
}

onUnmounted(() => {
  clearAll();
});
</script>

<template>
  <OverlayScrollbarsComponent
    defer
    style="height: 100%"
    :options="{
      scrollbars: {
        autoHide: 'move',
        autoHideDelay: 100,
      },
    }"
  >
    <div class="img-app">
      <!-- 顶部：品牌 + 标题 -->
      <div class="img-app__header">
        <div class="img-app__brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span class="img-app__title">图片工具</span>
        </div>
      </div>

      <!-- Tab 切换按钮 -->
      <div class="img-app__tabs">
        <button
          v-for="(tab, idx) in tabs"
          :key="idx"
          class="img-app__tab"
          :class="{ 'img-app__tab--active': activeTab === idx }"
          @click="activeTab = idx"
        >
          <span class="img-app__tab-name">{{ tab.name }}</span>
          <span class="img-app__tab-desc">{{ tab.desc }}</span>
        </button>
      </div>

      <!-- ====== 格式转换模块 ====== -->
      <div v-show="activeTab === 0" class="img-app__module">
        <!-- 拖拽上传区 -->
        <section class="img-app__section">
          <DropZone @files="handleFiles" />
        </section>

        <!-- 已选图片预览 -->
        <section class="img-app__section">
          <ImagePreviewList
            :items="previewItems"
            :max-files="MAX_FILES"
            @remove="removeItem"
            @clear="clearAll"
          />
        </section>

        <!-- 转换设置 + 执行 -->
        <section class="img-app__section">
          <ConvertPanel
            :format="targetFormat"
            :quality="quality"
            :batch-mode="batchMode"
            :file-count="previewItems.length"
            :converting="converting"
            @update:format="targetFormat = $event"
            @update:quality="quality = $event"
            @update:batch-mode="batchMode = $event"
            @convert="doConvert"
          />
        </section>

        <!-- 转换结果 -->
        <section class="img-app__section">
          <ConvertResult
            :results="results"
            @clear="clearResults"
          />
        </section>
      </div>

      <!-- ====== Favicon 制作模块 ====== -->
      <div v-show="activeTab === 1" class="img-app__module">
        <FaviconMaker />
      </div>
    </div>
  </OverlayScrollbarsComponent>
</template>

<style scoped lang="scss">
.img-app {
  padding: 24px 28px 36px;
  max-width: 840px;
  margin: 0 auto;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 60px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: #101828;
  }

  // Tab 按钮组
  &__tabs {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 22px;
    background: linear-gradient(
      to right,
      transparent 0%,
      transparent 1%,
      rgba(255, 255, 255, 0.95) 10%,
      rgba(255, 255, 255, 0.95) 90%,
      transparent 99%,
      transparent 100%
    );
    padding: 6px 0;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  &__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 24px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
    min-width: 140px;

    &:hover {
      border-color: #93c5fd;
      background: #f8faff;
    }

    &--active {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #2563eb;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  &__tab-name {
    font-size: 14px;
    font-weight: 700;
  }

  &__tab-desc {
    font-size: 11px;
    color: #98a2b3;
    .img-app__tab--active & {
      color: #60a5fa;
    }
  }

  &__section {
    margin-bottom: 18px;
  }
}
</style>
