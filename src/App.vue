<!-- 根组件只负责桌面及应用的打开、恢复、层级与关闭。 -->
<template>
  <main class="home" :style="store.initialized && store.current ? { backgroundImage: 'url(' + store.current + ')' } : {}
    ">
    <div class="desktop">
      <div class="desktop-app">
        <button v-for="app in appConfig" :key="app.enName" class="app-item" type="button"
          @dblclick="openApp(app)" @keydown.enter.prevent="openApp(app)" @keydown.space.prevent="openApp(app)">
          <img :src="app.icon" alt="" width="36" height="36" />
          <span class="app-item__title">{{ app.zhName }}</span>
        </button>
      </div>
    </div>

    <component :is="app.component" v-for="(app, index) in activeApps" :key="app.enName"
      v-model:minimized="app.minimized" :title="app.zhName" :icon="app.icon" :style="{ zIndex: index + 1 }"
      @activate="focusApp(app.enName)" @close="closeApp(app.enName)" />
  </main>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import appConfig from '@/config/index'
import type { AppItem } from "@/tsInterface/index"
import { useWallpaperStore } from '@/stores/wallpaper'
import defaultWallpaper1 from '@/assets/setting/images/wallpaper/default-wallpaper1.jpg'

const store = useWallpaperStore()
const activeApps = ref<Array<AppItem & { minimized: boolean }>>([])

// 数组顺序就是窗口层级，避免单独维护焦点和最小化名单。
const focusApp = (id: string) => {
  const index = activeApps.value.findIndex((item) => item.enName === id)
  if (index < 0 || index === activeApps.value.length - 1) return
  const [app] = activeApps.value.splice(index, 1)
  if (app) activeApps.value.push(app)
}

const openApp = (app: AppItem) => {
  const existing = activeApps.value.find((item) => item.enName === app.enName)
  if (existing) {
    existing.minimized = false
    focusApp(app.enName)
    return
  }
  activeApps.value.push({ ...app, minimized: false })
}

const closeApp = (id: string) => {
  activeApps.value = activeApps.value.filter((item) => item.enName !== id)
}

watch(
  () => store.initialized,
  (ready) => {
    if (ready && !store.current) {
      store.setDefaultWallpaper(defaultWallpaper1)
    }
  },
)
</script>

<style scoped lang="scss">
.home {
  height: 100vh;
  overflow: hidden;
  background: #1e1e1e center / cover no-repeat;
}

.desktop {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.desktop-app {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  align-content: start;
  height: 100%;
  padding: 20px;
}

.app-item {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 4px;
  width: 80px;
  height: 80px;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  user-select: none;

  img {
    width: 36px;
    height: 36px;
    pointer-events: none;
  }

  &__title {
    color: #fff;
    font-size: 12px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    padding: 0 4px;
    border-radius: 2px;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #fff;
  }
}
</style>
