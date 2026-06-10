<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  files: [files: File[]];
}>();

const isDragOver = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,image/tiff,image/x-icon,image/vnd.microsoft.icon";

function onDragEnter(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = true;
}
function onDragOver(e: DragEvent) {
  e.preventDefault();
}
function onDragLeave(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
}
function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
  if (e.dataTransfer?.files) {
    handleFiles(Array.from(e.dataTransfer.files));
  }
}

function onInputChange() {
  if (inputRef.value?.files) {
    handleFiles(Array.from(inputRef.value.files));
  }
}

function handleFiles(files: File[]) {
  const imageFiles = files.filter((f) => f.type.startsWith("image/") || f.name.match(/\.(svg|ico|tiff?)$/i));
  if (imageFiles.length === 0) return;
  emit("files", imageFiles);
  // Reset input so same file can be re-selected
  if (inputRef.value) inputRef.value.value = "";
}

function onClick() {
  inputRef.value?.click();
}
</script>

<template>
  <div
    class="drop-zone"
    :class="{ 'drop-zone--active': isDragOver }"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="onClick"
  >
    <input
      ref="inputRef"
      type="file"
      :accept="ACCEPT"
      multiple
      hidden
      @change="onInputChange"
    />
    <div class="drop-zone__icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
    <p class="drop-zone__title">拖拽图片到此处，或<span class="drop-zone__link">点击选择</span></p>
    <p class="drop-zone__hint">支持 JPEG / PNG / WebP / GIF / BMP / SVG / TIFF / ICO / AVIF 格式，最多 5 张</p>
  </div>
</template>

<style scoped lang="scss">
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 20px;
  border: 2px dashed #d0d5dd;
  border-radius: 12px;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  color: #667085;

  &:hover {
    border-color: #98a2b3;
    background: #f3f4f6;
  }

  &--active {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #3b82f6;

    .drop-zone__link {
      color: #2563eb;
    }
  }

  &__icon {
    opacity: 0.6;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #344054;
  }

  &__link {
    color: #3b82f6;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  &__hint {
    margin: 0;
    font-size: 12px;
    color: #98a2b3;
  }
}
</style>
