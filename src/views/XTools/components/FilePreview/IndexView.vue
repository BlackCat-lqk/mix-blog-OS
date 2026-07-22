<!-- * @description: 文件预览器 — 基于 @open-file-viewer 的多格式文件预览组件 -->
<template>
  <div v-if="showVal" ref="viewerRef" class="preview-body">
    <file-viewer
      :url="filePath"
      :options="{
        locale: currentLang,
        theme: isLight ? 'light' : 'dark',
        search: true,
        ai: { collectText: true },
        toolbar: {
          position: 'auto',
          download: true,
          print: true,
          exportHtml: true,
        },
        watermark: {
          text: watermarkConfig.content,
          opacity: watermarkConfig.opacity,
          rotate: watermarkConfig.rotate,
          color: watermarkConfig.color,
          gapX: watermarkConfig.gapX,
          gapY: watermarkConfig.gapY,
          width: watermarkConfig.width,
          height: watermarkConfig.height,
        },
        archive: {
          cache: true,
          workerTimeoutMs: 30000,
          maxArchiveSize: 320 * 1024 * 1024,
          maxEntryPreviewSize: 64 * 1024 * 1024,
        },

        pdf: {
          toolbar: true,
          thumbnails: true,
          streaming: 'same-origin',
          rangeChunkSize: 64 * 1024,
        },
      }"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { FileViewer } from "@file-viewer/vue3";

const currentLang = ref("zh-CN");
const showVal = ref(false);
const filePath = ref("");
const isLight = ref(true);

const props = defineProps({
  previewPath: {
    type: String,
    default: "",
  },
  showPreview: {
    type: Boolean,
    default: false,
  },
});
// 水印配置
const watermarkConfig = ref({
  content: "内部资料111",
  rotate: -30, // 旋转角度
  opacity: 0.1, // 透明度
  color: "#1f7a58", // 文字颜色
  gapX: 150,
  gapY: 150,
  width: undefined,
  height: undefined,
});

watch(
  () => props.showPreview,
  () => {
    showVal.value = props.showPreview;
  },
);

// 初始化预览
const initPreview = () => {};

onMounted(() => {
  initPreview();
});
</script>

<style lang="scss" scoped></style>
