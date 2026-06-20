<!-- * @description: 文件预览器 — 基于 @open-file-viewer 的多格式文件预览组件 -->
<script lang="ts" setup>
import { OpenFileViewer } from "@open-file-viewer/vue";
import {
  imagePlugin,
  videoPlugin,
  audioPlugin,
  textPlugin,
  pdfPlugin,
  epubPlugin,
  xpsPlugin,
  officePlugin,
  ofdPlugin,
  archivePlugin,
  emailPlugin,
  drawingPlugin,
  cadPlugin,
  model3dPlugin,
  gisPlugin,
  assetPlugin,
  fallbackPlugin,
} from "@open-file-viewer/core";
import "@open-file-viewer/core/style.css";
import "prismjs/themes/prism.min.css";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

const props = defineProps<{
  file: File;
  fileName: string;
  height: number;
}>();

const plugins = [
  pdfPlugin({ workerSrc, useSystemFonts: true }),
  officePlugin(),
  ofdPlugin(),
  epubPlugin(),
  xpsPlugin(),
  imagePlugin(),
  videoPlugin(),
  audioPlugin(),
  archivePlugin(),
  emailPlugin(),
  drawingPlugin(),
  cadPlugin(),
  model3dPlugin(),
  gisPlugin(),
  textPlugin(),
  assetPlugin(),
  fallbackPlugin(),
];
</script>

<template>
  <OpenFileViewer
    :file="props.file"
    :file-name="props.fileName"
    :height="`${props.height}px`"
    toolbar
    :plugins="plugins"
  />
</template>
