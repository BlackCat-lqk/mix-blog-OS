<!-- * @description: Favicon 制作器 — 从图片生成多尺寸图标与 .ico 文件 -->
<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import {
  resizeToPNG,
  encodeMultiSizeICO,
  type IcoEntry,
  formatFileSize,
  downloadBlob,
} from "@/utils/imageConvert";

// ---- 可选尺寸定义 ----
const ALL_SIZES = [16, 24, 32, 48, 64, 96, 128, 196, 256] as const;
type FavSize = (typeof ALL_SIZES)[number];

const sizeLabels: Record<number, string> = {
  16: "16×16 (标准)",
  24: "24×24",
  32: "32×32 (常用)",
  48: "48×48",
  64: "64×64",
  96: "96×96",
  128: "128×128",
  196: "196×196",
  256: "256×256",
};

// ---- 状态 ----
const ACCEPT = "image/jpeg,image/png,image/svg+xml";

interface UploadedFile {
  file: File;
  previewUrl: string;
}

const uploaded = ref<UploadedFile | null>(null);
const selectedSizes = ref<Set<FavSize>>(new Set([16, 32, 48]));
const generating = ref(false);

interface ResultItem {
  size: FavSize;
  pngBlob: Blob;
  previewUrl: string;
}
const results = ref<ResultItem[]>([]);
const multiIcoBlob = ref<Blob | null>(null);

const inputRef = ref<HTMLInputElement | null>(null);

// ---- 计算属性 ----
const hasFile = computed(() => uploaded.value !== null);
const hasResults = computed(() => results.value.length > 0);

const checkedSizes = computed(() =>
  ALL_SIZES.filter((s) => selectedSizes.value.has(s)),
);

// ---- 上传 ----
const onInputChange = () => {
  const files = inputRef.value?.files;
  if (files && files.length > 0) {
    setFile(files[0]);
  }
}

const setFile = (file: File) => {
  // 清理旧文件
  clearResults();
  if (uploaded.value) {
    URL.revokeObjectURL(uploaded.value.previewUrl);
  }

  uploaded.value = {
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    const valid = /\.(jpe?g|png|svg)$/i.test(file.name) || file.type.startsWith("image/");
    if (valid) setFile(file);
  }
}

const isDragOver = ref(false);
const onDragEnter = (e: DragEvent) => { e.preventDefault(); isDragOver.value = true; }
const onDragOver = (e: DragEvent) => { e.preventDefault(); }
const onDragLeave = (e: DragEvent) => { e.preventDefault(); isDragOver.value = false; }

// ---- 尺寸选择 ----
const toggleSize = (size: FavSize) => {
  const next = new Set(selectedSizes.value);
  if (next.has(size)) {
    if (next.size > 1) next.delete(size); // 至少保留一个
  } else {
    next.add(size);
  }
  selectedSizes.value = next;
}

const selectAll = () => {
  selectedSizes.value = new Set(ALL_SIZES);
}

// ---- 生成 Favicon ----
const doGenerate = async () => {
  if (!uploaded.value || generating.value) return;
  generating.value = true;
  clearResults();

  const file = uploaded.value.file;
  const sizes = checkedSizes.value;
  const items: ResultItem[] = [];
  const icoEntries: IcoEntry[] = [];

  for (const size of sizes) {
    try {
      const pngBlob = await resizeToPNG(file, size, size);
      const previewUrl = URL.createObjectURL(pngBlob);
      items.push({ size, pngBlob, previewUrl });
      icoEntries.push({ pngBlob, width: size, height: size });
    } catch (err) {
      console.error(`生成 ${size}×${size} 失败:`, err);
    }
  }

  results.value = items;

  // 生成多尺寸 ICO
  if (icoEntries.length > 0) {
    try {
      multiIcoBlob.value = await encodeMultiSizeICO(icoEntries);
    } catch (err) {
      console.error("生成多尺寸 ICO 失败:", err);
    }
  }

  generating.value = false;
}

// ---- 下载 ----
const downloadOne = (item: ResultItem) => {
  downloadBlob(item.pngBlob, `favicon-${item.size}x${item.size}.png`);
}

const downloadMultiIco = () => {
  if (multiIcoBlob.value) {
    downloadBlob(multiIcoBlob.value, "favicon.ico");
  }
}

// ---- 清空 ----
const clearAll = () => {
  clearResults();
  if (uploaded.value) {
    URL.revokeObjectURL(uploaded.value.previewUrl);
    uploaded.value = null;
  }
  // Reset input
  if (inputRef.value) inputRef.value.value = "";
}

const clearResults = () => {
  for (const item of results.value) {
    URL.revokeObjectURL(item.previewUrl);
  }
  results.value = [];
  multiIcoBlob.value = null;
}

onUnmounted(() => {
  clearAll();
});
</script>

<template>
  <div class="favicon-maker">
    <!-- ====== 上传区 ====== -->
    <section class="favicon-maker__section">
      <div
        class="favicon-upload"
        :class="{ 'favicon-upload--active': isDragOver }"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="inputRef?.click()"
      >
        <input
          ref="inputRef"
          type="file"
          :accept="ACCEPT"
          hidden
          @change="onInputChange"
        />

        <!-- 无图片：上传提示 -->
        <template v-if="!hasFile">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span class="favicon-upload__title">上传图片</span>
          <span class="favicon-upload__hint">支持 JPG / PNG / SVG，仅限单张</span>
        </template>

        <!-- 有图片：预览 -->
        <template v-else>
          <div class="favicon-upload__preview">
            <img :src="uploaded!.previewUrl" :alt="uploaded!.file.name" />
          </div>
          <div class="favicon-upload__info">
            <span class="favicon-upload__name">{{ uploaded!.file.name }}</span>
            <span class="favicon-upload__size">{{ formatFileSize(uploaded!.file.size) }}</span>
          </div>
          <button class="favicon-upload__change" @click.stop="inputRef?.click()">更换</button>
        </template>
      </div>
    </section>

    <!-- ====== 尺寸选择 ====== -->
    <section class="favicon-maker__section">
      <div class="size-selector">
        <div class="size-selector__header">
          <span class="size-selector__label">选择尺寸</span>
          <button class="size-selector__select-all" @click="selectAll">全选</button>
        </div>
        <div class="size-selector__grid">
          <label
            v-for="size in ALL_SIZES"
            :key="size"
            class="size-chip"
            :class="{ 'size-chip--checked': selectedSizes.has(size) }"
            @click="toggleSize(size)"
          >
            <span class="size-chip__check">
              <svg v-if="selectedSizes.has(size)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span class="size-chip__dims">{{ size }}×{{ size }}</span>
            <span class="size-chip__label">{{ sizeLabels[size]?.match(/\((.+)\)/)?.[1] || "" }}</span>
          </label>
        </div>

        <div class="size-selector__actions">
          <button
            class="size-selector__btn"
            :disabled="!hasFile || generating || checkedSizes.length === 0"
            @click="doGenerate"
          >
            <span v-if="generating" class="size-selector__spinner"></span>
            <span>{{ generating ? "生成中..." : `生成 Favicon (${checkedSizes.length} 个尺寸)` }}</span>
          </button>
          <button
            v-if="hasFile"
            class="size-selector__clear"
            @click="clearAll"
          >
            一键清空
          </button>
        </div>
      </div>
    </section>

    <!-- ====== 结果区 ====== -->
    <section v-if="hasResults" class="favicon-maker__section">
      <div class="favicon-result">
        <!-- 多尺寸 ICO 下载（主 CTA） -->
        <div v-if="multiIcoBlob" class="favicon-result__master">
          <div class="favicon-result__master-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div class="favicon-result__master-info">
            <span class="favicon-result__master-title">favicon.ico</span>
            <span class="favicon-result__master-desc">
              包含 {{ results.length }} 个尺寸的多分辨率图标，可直接用于网站
            </span>
          </div>
          <button class="favicon-result__btn-primary" @click="downloadMultiIco">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            下载 .ico
          </button>
        </div>

        <!-- 单尺寸卡片 -->
        <div class="favicon-result__grid">
          <div
            v-for="item in results"
            :key="item.size"
            class="favicon-card"
          >
            <div class="favicon-card__preview">
              <img :src="item.previewUrl" :alt="`${item.size}x${item.size}`" />
            </div>
            <div class="favicon-card__size">{{ item.size }}×{{ item.size }}</div>
            <div class="favicon-card__meta">{{ formatFileSize(item.pngBlob.size) }}</div>
            <button class="favicon-card__download" @click="downloadOne(item)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.favicon-maker {
  &__section {
    margin-bottom: 16px;
  }
}

// ---- 上传区 ----
.favicon-upload {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border: 2px dashed #d0d5dd;
  border-radius: 12px;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  min-height: 72px;

  &:hover {
    border-color: #98a2b3;
    background: #f3f4f6;
  }

  &--active {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #344054;
  }

  &__hint {
    font-size: 12px;
    color: #98a2b3;
    margin-left: auto;
  }

  &__preview {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    overflow: hidden;
    background: #e5e7eb;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: #101828;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__size {
    font-size: 11px;
    color: #98a2b3;
  }

  &__change {
    margin-left: auto;
    padding: 5px 12px;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    background: #fff;
    font-size: 12px;
    color: #667085;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: #f3f4f6;
    }
  }
}

// ---- 尺寸选择 ----
.size-selector {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px 20px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #344054;
  }

  &__select-all {
    padding: 0;
    border: none;
    background: transparent;
    font-size: 12px;
    color: #3b82f6;
    cursor: pointer;

    &:hover { color: #2563eb; }
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 14px;
    border-top: 1px solid #f0f1f3;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    background: #3b82f6;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;

    &:hover:not(:disabled) { background: #2563eb; }
    &:active:not(:disabled) { transform: scale(0.97); }
    &:disabled { background: #9ca3af; cursor: not-allowed; }
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  &__clear {
    padding: 0;
    border: none;
    background: transparent;
    font-size: 13px;
    color: #ef4444;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover { color: #dc2626; }
  }
}

.size-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  background: #fff;

  &:hover {
    border-color: #93c5fd;
    background: #f0f7ff;
  }

  &--checked {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &__check {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: 1.5px solid #d0d5dd;
    flex-shrink: 0;

    .size-chip--checked & {
      border-color: #3b82f6;
      background: #3b82f6;
      color: #fff;
    }
  }

  &__dims {
    font-size: 13px;
    font-weight: 600;
    color: #101828;
  }

  &__label {
    font-size: 11px;
    color: #98a2b3;
    margin-left: 2px;
  }
}

// ---- 结果区 ----
.favicon-result {
  &__master {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #eff6ff, #f0fdf4);
    border: 1.5px solid #93c5fd;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  &__master-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 10px;
    color: #3b82f6;
    flex-shrink: 0;
  }

  &__master-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  &__master-title {
    font-size: 14px;
    font-weight: 700;
    color: #101828;
  }

  &__master-desc {
    font-size: 12px;
    color: #667085;
  }

  &__btn-primary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: #3b82f6;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;

    &:hover { background: #2563eb; }
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
}

.favicon-card {
  width: 110px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  text-align: center;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  }

  &__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 72px;
    background:
      repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 16px 16px;

    img {
      max-width: 64px;
      max-height: 64px;
      image-rendering: auto;
    }
  }

  &__size {
    font-size: 12px;
    font-weight: 700;
    color: #101828;
    margin-top: 6px;
  }

  &__meta {
    font-size: 10px;
    color: #98a2b3;
    margin: 2px 0 8px;
  }

  &__download {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    padding: 6px 0;
    border: none;
    border-top: 1px solid #f0f1f3;
    background: #f9fafb;
    color: #374151;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #f3f4f6; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
