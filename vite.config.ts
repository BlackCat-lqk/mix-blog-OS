import { fileURLToPath, URL } from "node:url";
import { fileViewerRenderers } from "@file-viewer/vite-plugin";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    fileViewerRenderers({ copyAssets: true }),
    // Gzip 预压缩（nginx 可直接 serve .gz 文件）
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240, // 10KB 以上才压缩
    }),
    // Bundle 大小分析（构建后在 dist/stats.html 查看 treemap）
    visualizer({
      open: false,
      gzipSize: true,
      filename: "dist/stats.html",
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // 代理目标地址
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
