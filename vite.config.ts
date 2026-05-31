import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/music': {
        target: 'http://localhost:3001', // 代理目标地址
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:3001', // 代理目标地址
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001', // 代理目标地址
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
})
