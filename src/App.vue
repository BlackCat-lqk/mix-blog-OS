<!-- * @description: 根组件 — 桌面、应用窗口管理、任务栏 -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { Message } from "@/utils/message";
import appConfig from "@/config/index";
import OsWindow from "./components/OsWindow.vue";
import Setting from "@/views/Setting/IndexView.vue";
import IMusic from "@/views/IMusic/IndexView.vue";
import UiColor from "@/views/UiColor/IndexView.vue";
import ImageConverter from "@/views/ImageConverter/IndexView.vue";
import MixAi from "@/views/MixAi/IndexView.vue";
import FilePreview from "@/views/FilePreview/IndexView.vue";
import Photos from "@/views/Photos/IndexView.vue";
import ToolTip from "@/components/ToolTip.vue";
import type { AppItem } from "./types/interface.ts";
import { useWallpaperStore } from "@/stores/wallpaper";
import defaultWallpaper1 from "@/assets/setting/images/wallpaper/default-wallpaper1.png";

const store = useWallpaperStore();

const showWindow = ref(false);
const activeApp = ref<Array<AppItem>>([]);
const focusWindow = ref<string | number>("");
const minimizeWindow = ref<Array<string | number>>([]);
// 记录每个应用任务栏图标的屏幕坐标，用于最小化动画目标
const minimizeTarget = ref<Record<string, { x: number; y: number }>>({});

const toggleMinimized = (app: AppItem) => {
  // 是否已经显示，已经显示就给最小化，没有就取消
  if (minimizeWindow.value.includes(app.enName)) {
    minimizeWindow.value = minimizeWindow.value.filter((item) => item != app.enName);
  } else {
    // 只有当focusWindow==app.enName时，才会最小化，否则将只是移到最顶层
    if (focusWindow.value == app.enName) {
      minimizeWindow.value.push(app.enName);
    } else {
      focusWindow.value = app.enName;
    }
  }
};

// 双击应用
const handleClickApp = (app: AppItem) => {
  // 应用是否已打开
  if (activeApp.value.some((item) => item.enName === app.enName)) {
    if (minimizeWindow.value.includes(app.enName)) {
      // 应用处于最小化状态
      toggleMinimized(app);
    } else {
      // 应用处于活跃状态
      focusWindow.value = app.enName;
    }
    return;
  }
  activeApp.value.push(app);
  // 焦点窗口设置为最新打开的窗口，保持层级最大
  focusWindow.value = app.enName;
  showWindow.value = true;
};

// 点击应用的窗口
const clickWindow = (app: AppItem) => {
  focusWindow.value = app.enName;
};

// 关闭应用：先触发关闭动画，后移除
const handleCloseApp = (app: AppItem) => {
  activeApp.value = activeApp.value.filter((item) => item.enName !== app.enName);
};

// 最小化应用
const handleMinimize = (app: AppItem) => {
  // 记录任务栏图标位置，用于窗口向图标收缩的动画
  const dockEl = document.querySelector(`[data-app-dock="${app.enName}"]`);
  if (dockEl) {
    const rect = dockEl.getBoundingClientRect();
    minimizeTarget.value[app.enName] = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }
  minimizeWindow.value.push(app.enName);
};
const handelTest = () => {
  Message.warning("成功点击", { position: "top-right", duration: 3000 });
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
      :style="{ zIndex: focusWindow === app.enName ? 999 : undefined }"
      :minimized="minimizeWindow.includes(app.enName)"
      :minimize-target="minimizeTarget[app.enName]"
    >
      <Setting v-if="app.enName === 'Setting'" />
      <IMusic v-else-if="app.enName === 'iMusic'" />
      <UiColor v-else-if="app.enName === 'uiColor'" />
      <ImageConverter v-else-if="app.enName === 'imageConverter'"></ImageConverter>
      <MixAi v-else-if="app.enName === 'MIXAI'"></MixAi>
      <FilePreview v-else-if="app.enName === 'filePreview'"></FilePreview>
      <Photos v-else-if="app.enName === 'Photos'" />
    </OsWindow>

    <!-- 底部任务栏 -->
    <div class="taskbar">
      <div class="taskbar__left">
        <ToolTip content="提示文字" position="top" theme="dark">
          <span class="taskbar__start" @click="handelTest">MIX OS</span>
        </ToolTip>
      </div>
      <div class="taskbar__center">
        <button
          v-for="(app, idx) in activeApp"
          :key="idx"
          class="taskbar__item"
          :data-app-dock="app.enName"
          @click="toggleMinimized(app)"
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
$taskbar-bg: rgba(255, 255, 255, 0.7);
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
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border-radius: 8px;
  }
}

// ---- 任务栏 ----
.taskbar {
  display: flex;
  align-items: center;
  height: $taskbar-h;
  padding: 0 12px;
  background: $taskbar-bg;
  border-top: 1px solid #a0a4a8;
  flex-shrink: 0;
  user-select: none;
  backdrop-filter: blur(10px);
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
  background: rgba(0, 0, 0, 0.06);
  color: #ccc;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.12);
  }

  &--active {
    background: rgba(0, 120, 212, 1);
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
