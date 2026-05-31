<script setup lang="ts">
import { ref, watch } from "vue";
import appConfig from "@/config/index";
import OsWindow from "./components/OsWindow.vue";
import Setting from "@/views/Setting/IndexView.vue";
import IMusic from "@/views/IMusic/IndexView.vue";
import type { AppItem } from "./types/interface.ts";
import { useWallpaperStore } from "@/stores/wallpaper";
import defaultWallpaper1 from "@/assets/setting/images/wallpaper/default-wallpaper1.png";

const store = useWallpaperStore();

const showWindow = ref(false);
const activeApp = ref<Array<AppItem>>([]);
const focusWindow = ref<string | number>("");
const minimizeWindow = ref<Array<string | number>>([]);
const closingAppNames = ref<Array<string | number>>([]);

const toggleMinimized = (app: AppItem) => {
  minimizeWindow.value = minimizeWindow.value.filter((item) => item != app.enName);
};

// 双击应用
const handleClickApp = (app: AppItem) => {
  // 取消正在进行的关闭动画
  closingAppNames.value = closingAppNames.value.filter((n) => n !== app.enName);

  // 应用是否已打开
  if (activeApp.value.some((item) => item.enName === app.enName)) {
    return;
  }
  activeApp.value.push(app);
  showWindow.value = true;
};

// 点击应用的窗口
const clickWindow = (app: AppItem) => {
  focusWindow.value = app.enName;
};

// 关闭应用：先触发关闭动画，后移除
const handleCloseApp = (app: AppItem) => {
  closingAppNames.value.push(app.enName);
  setTimeout(() => {
    if (closingAppNames.value.includes(app.enName)) {
      activeApp.value = activeApp.value.filter((item) => item.enName !== app.enName);
      closingAppNames.value = closingAppNames.value.filter((n) => n !== app.enName);
    }
  }, 200);
};

// 最小化应用
const handleMinimize = (app: AppItem) => {
  minimizeWindow.value.push(app.enName);
};

watch(
  () => store.initialized,
  (ready) => {
    if (ready && !store.current) {
      store.setDefaultWallpaper(defaultWallpaper1);
    }
  },
);
</script>

<template>
  <div
    class="home"
    :style="store.initialized && store.current ? { backgroundImage: `url(${store.current})` } : {}"
  >
    <!-- 桌面区域 -->
    <div class="desktop">
      <div class="desktop-app">
        <div
          v-for="(app, idx) in appConfig"
          :key="idx"
          class="app-item"
          @dblclick="handleClickApp(app)"
        >
          <img :src="app.icon" alt="" />
          <span class="app-item__title">{{ app.zhName }}</span>
        </div>
      </div>
    </div>

    <OsWindow
      v-for="(app, idx) in activeApp"
      :key="idx"
      @minimize="handleMinimize(app)"
      :title="app.zhName"
      :icon="app.icon"
      @close="handleCloseApp(app)"
      @click="clickWindow(app)"
      @mousedown="clickWindow(app)"
      :style="focusWindow === app.enName ? 'z-index: 999;' : 'z-index: unset;'"
      v-show="!minimizeWindow.includes(app.enName)"
    >
      <Setting v-if="app.enName === 'Setting'" />
      <IMusic v-else-if="app.enName === 'iMusic'" />
    </OsWindow>

    <!-- 底部任务栏 -->
    <div class="taskbar">
      <div class="taskbar__left">
        <span class="taskbar__start">Mix Blog OS</span>
      </div>
      <div class="taskbar__center">
        <button
          v-for="(app, idx) in activeApp"
          :key="idx"
          class="taskbar__item"
          @click="toggleMinimized(app)"
          ref="dockItems"
        >
          <div class="taskbar__item-icon">
            <img :src="app.icon" alt="icon" />
          </div>
        </button>
      </div>
      <div class="taskbar__right"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ---- variables ----
$taskbar-h: 44px;
$primary: #0078d4;
$bg-dark: #1e1e1e;
$taskbar-bg: rgba(26, 26, 46, 0.8);
$text-color: #fff;
$item-h: 80px;
$gap: 20px;

.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: $bg-dark;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

// ---- 桌面 ----
.desktop {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.desktop-app {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: start;
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
  height: $item-h;
  padding: 4px;
  border: 1px solid transparent;
  cursor: default;
  user-select: none;
  will-change: transform;
  cursor: pointer;
  img {
    width: 46px;
    height: 46px;
    pointer-events: none;
  }

  &__title {
    color: $text-color;
    font-size: 12px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    padding: 0 4px;
    border-radius: 2px;
    pointer-events: none;
    // 文字阴影保证在浅色壁纸下可读
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
}

// ---- 任务栏 ----
.taskbar {
  display: flex;
  align-items: center;
  height: $taskbar-h;
  padding: 0 12px;
  background: $taskbar-bg;
  border-top: 1px solid #2a2a3e;
  flex-shrink: 0;
  user-select: none;
  backdrop-filter: blur(20px);
  &__left {
    width: 160px;
    flex-shrink: 0;
  }

  &__center {
    flex: 1;
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  &__right {
    width: 100px;
    text-align: right;
    flex-shrink: 0;
  }
}

.taskbar__start {
  color: $primary;
  font-size: 13px;
  font-weight: 600;
}

.taskbar__item {
  padding: 4px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: #ccc;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  &--active {
    background: rgba(0, 120, 212, 0.3);
    color: #fff;
  }

  &--minimized {
    opacity: 0.6;
  }
}

.taskbar__item-icon {
  width: 24px;
  img {
    width: 100%;
    height: 100%;
  }
}

.taskbar__item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
