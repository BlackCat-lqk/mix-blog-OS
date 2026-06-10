<script lang="ts" setup>
import { ref } from "vue";
import { _copyToClipboard } from "@/utils/publickFun";

// ---- 类型 ----

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  count: number;
  percentage: number;
}

// ---- 状态 ----

const imageSrc = ref<string | null>(null);
const imageName = ref("");
const extractedColors = ref<ExtractedColor[]>([]);
const isProcessing = ref(false);
const isDragOver = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);

// ---- 文件选择 ----

function openFileDialog() {
  fileInputRef.value?.click();
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) processFile(file);
  // 重置以便再次选择同一文件时也能触发 change
  input.value = "";
}

// ---- 拖拽支持 ----

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = true;
}

function onDragLeave() {
  isDragOver.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) processFile(file);
}

// ---- 文件处理 & 颜色提取 ----

function processFile(file: File) {
  if (!file.type.startsWith("image/")) {
    alert("请选择图片文件（PNG / JPG / WebP / GIF / BMP 等）");
    return;
  }

  imageName.value = file.name;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target?.result as string;
    imageSrc.value = dataUrl;
    extractColors(dataUrl);
  };
  reader.readAsDataURL(file);
}

function extractColors(dataUrl: string) {
  isProcessing.value = true;

  const img = new Image();
  img.onload = () => {
    // 缩放以提升解析性能（长边不超过 200px）
    const maxDim = 200;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data; // [r,g,b,a, …]

    // 颜色量化 + 频率统计
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
    const STEP = 32; // 量化步长：32 → ≈512 种候选色，兼顾精度与归类

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      const a = pixels[i + 3] ?? 0;
      if (a < 128) continue; // 跳过透明 / 半透明像素

      const qr = Math.round(r / STEP) * STEP;
      const qg = Math.round(g / STEP) * STEP;
      const qb = Math.round(b / STEP) * STEP;

      const key = `${qr},${qg},${qb}`;
      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { r: qr, g: qg, b: qb, count: 1 });
      }
    }

    const totalPixels = [...colorMap.values()].reduce((s, c) => s + c.count, 0);

    // 按面积（像素数）降序，取前 6
    const sorted = [...colorMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((c) => ({
        hex: rgbToHex(c.r, c.g, c.b),
        rgb: { r: c.r, g: c.g, b: c.b },
        count: c.count,
        percentage: totalPixels > 0 ? Math.round((c.count / totalPixels) * 1000) / 10 : 0,
      }));

    extractedColors.value = sorted;
    isProcessing.value = false;
  };

  img.onerror = () => {
    isProcessing.value = false;
    alert("图片加载失败，请重试");
  };

  img.src = dataUrl;
}

/** RGB → HEX */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
</script>

<template>
  <div class="image-colors">
    <!-- ====== 上传区域 ====== -->
    <div
      class="image-colors__drop"
      :class="{ 'image-colors__drop--over': isDragOver }"
      @click="openFileDialog"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <template v-if="!imageSrc">
        <div class="image-colors__drop-icon">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <p class="image-colors__drop-text">点击选择图片 或拖拽到此处</p>
        <p class="image-colors__drop-hint">支持 PNG / JPG / WebP / GIF / BMP</p>
      </template>
      <template v-else>
        <img class="image-colors__preview" :src="imageSrc" :alt="imageName" />
        <div class="image-colors__preview-overlay">
          <span>点击更换图片</span>
        </div>
      </template>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="image-colors__file-input"
        @change="onFileSelected"
      />
    </div>

    <!-- ====== 处理中 ====== -->
    <div v-if="isProcessing" class="image-colors__processing">
      <span class="image-colors__spinner"></span>
      <span>正在提取颜色…</span>
    </div>

    <!-- ====== 提取结果 ====== -->
    <div v-if="extractedColors.length > 0 && !isProcessing" class="image-colors__result">
      <h3 class="image-colors__title">提取的颜色（按面积排序）</h3>

      <div v-for="(color, idx) in extractedColors" :key="color.hex" class="image-colors__row">
        <!-- 色块 -->
        <div class="image-colors__swatch" :style="{ backgroundColor: color.hex }"></div>

        <!-- 排名 -->
        <span class="image-colors__rank">#{{ idx + 1 }}</span>

        <!-- HEX 值 -->
        <code class="image-colors__hex">{{ color.hex }}</code>

        <!-- 占比条 -->
        <div class="image-colors__bar-wrap">
          <div
            class="image-colors__bar"
            :style="{ width: color.percentage + '%', backgroundColor: color.hex }"
          ></div>
        </div>

        <!-- 百分比 -->
        <span class="image-colors__percent">{{ color.percentage }}%</span>

        <!-- 复制 -->
        <img
          class="image-colors__copy"
          src="@/assets/uiColors/icons/copy.svg"
          @click.stop="_copyToClipboard(color.hex)"
          :title="`复制 ${color.hex}`"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$border-color: #d0d0d0;
$text-color: #222;

.image-colors {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px 16px;
  font-family: "Mulish", "PingFang SC", "Microsoft YaHei", sans-serif;
  user-select: none;
  height: 100%;
}

// ====== 上传 / 预览区域 ======
.image-colors__drop {
  width: 320px;
  height: 200px;
  border: 2px dashed #bbb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: #fafafa;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;

  &:hover {
    border-color: #888;
    background: #f5f5f5;
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.04);
  }

  &--over {
    border-color: #0078d4;
    background: rgba(0, 120, 212, 0.06);
    box-shadow: 0 0 0 6px rgba(0, 120, 212, 0.1);
  }
}

.image-colors__file-input {
  display: none;
}

.image-colors__drop-icon {
  color: #999;
}

.image-colors__drop-text {
  font-size: 15px;
  font-weight: 600;
  color: #555;
  margin: 0;
}

.image-colors__drop-hint {
  font-size: 12px;
  color: #aaa;
  margin: 0;
}

// ----- 已选图片预览 -----
.image-colors__preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
}

.image-colors__preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
  border-radius: 10px;

  span {
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .image-colors__drop:hover & {
    opacity: 1;
  }
}

// ====== 处理中 ======
.image-colors__processing {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 14px;
}

.image-colors__spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid #ddd;
  border-top-color: #0078d4;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ====== 结果列表 ======
.image-colors__result {
  width: 380px;
  max-width: 100%;
}

.image-colors__title {
  font-size: 14px;
  font-weight: 600;
  color: $text-color;
  margin: 0 0 14px;
  text-align: center;
  letter-spacing: 0.5px;
}

.image-colors__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
}

.image-colors__swatch {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.image-colors__rank {
  font-size: 11px;
  color: #999;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.image-colors__hex {
  font-family: "Consolas", "Menlo", monospace;
  font-size: 13px;
  color: $text-color;
  min-width: 70px;
  letter-spacing: 0.3px;
  background: #f3f3f3;
  padding: 2px 6px;
  border-radius: 4px;
}

.image-colors__bar-wrap {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  min-width: 40px;
}

.image-colors__bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 2px;
}

.image-colors__percent {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
  font-family: "Consolas", "Menlo", monospace;
}

.image-colors__copy {
  width: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
}
</style>
