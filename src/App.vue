<!-- 根组件负责桌面总览及应用的打开、恢复、层级与关闭。 -->
<template>
  <main
    class="home"
    :style="{
      '--desktop-inset-left': `${sidebarInset}px`,
      '--desktop-sidebar-offset': `${sidebarOffset}px`,
      '--desktop-sidebar-width': `${sidebarWidth}px`,
      '--desktop-wallpaper': store.initialized && store.current ? `url(${store.current})` : 'none',
    }"
  >
    <div class="desktop" :inert="applicationsOpen">
      <div class="desktop-app">
        <button
          v-for="app in appConfig"
          :key="app.enName"
          class="app-item"
          type="button"
          @dblclick="openApp(app)"
          @keydown.enter.prevent="openApp(app)"
          @keydown.space.prevent="openApp(app)"
        >
          <img :src="app.icon" alt="" width="36" height="36" />
          <span class="app-item__title">{{ app.zhName }}</span>
        </button>
      </div>
    </div>

    <div class="desktop-windows" :inert="applicationsOpen">
      <component
        :is="app.component"
        v-for="app in activeApps"
        :key="app.enName"
        :minimized="app.window.minimized || applicationsOpen"
        :title="app.zhName"
        :icon="app.icon"
        :navigation="app.enName === 'Setting' ? settingsNavigation : undefined"
        :style="{ zIndex: app.window.zIndex }"
        @update:minimized="setMinimized(app.enName, $event)"
        @activate="activateWindow(app.enName)"
        @close="closeWindow(app.enName)"
      />
    </div>

    <ApplicationsOverview
      v-if="applicationsOpen"
      :apps="appConfig"
      @close="applicationsOpen = false"
      @launch="launchApp"
    />

    <DesktopSidebar
      :apps="sidebarApps"
      :active-window-id="applicationsOpen ? undefined : activeWindowId"
      :applications-open="applicationsOpen"
      @desktop="returnToDesktop"
      @applications="applicationsOpen = !applicationsOpen"
      @activate="activateApp"
      @personalize="openPersonalization"
    />
  </main>
</template>
<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent, onMounted, onUnmounted, provide } from 'vue'
import appConfig from '@/config/index'
import type { AppItem, SettingsNavigation } from '@/tsInterface/index'
import { useWallpaperStore } from '@/stores/wallpaper'
import defaultWallpaper1 from '@/assets/setting/images/wallpaper/default-wallpaper1.jpg'
import DesktopSidebar from '@/components/Desktop/DesktopSidebar.vue'
import { useDesktopWindows } from '@/components/Desktop/useDesktopWindows'
import { windowBoundsKey } from '@/components/OsWindow/windowBounds'

const store = useWallpaperStore()
const applicationsOpen = ref(false)
const sidebarOffset = 8
const sidebarWidth = 52
const sidebarInset = sidebarOffset + sidebarWidth
const ApplicationsOverview = defineAsyncComponent(
  () => import('@/components/Desktop/ApplicationsOverview.vue'),
)
const {
  windows,
  activeWindowId,
  activateWindow,
  openWindow,
  setMinimized,
  toggleWindow,
  closeWindow,
  showDesktop,
} = useDesktopWindows()
const settingsNavigation = ref<SettingsNavigation>()

const activeApps = computed(() =>
  windows.value.flatMap((window) => {
    const app = appConfig.find((item) => item.enName === window.id)
    return app ? [{ ...app, window }] : []
  }),
)
const sidebarApps = computed(() =>
  activeApps.value.map((app) => ({
    id: app.enName,
    name: app.zhName || app.enName,
    icon: app.icon,
    minimized: app.window.minimized,
  })),
)

// 公共窗口只接收可用工作区边界，不依赖桌面状态栏的具体布局。
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })
const updateViewport = () => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}
provide(
  windowBoundsKey,
  computed(() => ({
    left: sidebarInset,
    top: 0,
    width: Math.max(0, viewport.value.width - sidebarInset),
    height: viewport.value.height,
  })),
)
onMounted(() => window.addEventListener('resize', updateViewport))
onUnmounted(() => window.removeEventListener('resize', updateViewport))

const openApp = (app: AppItem) => {
  applicationsOpen.value = false
  openWindow(app.enName)
}

const activateApp = (id: string) => {
  if (applicationsOpen.value) {
    applicationsOpen.value = false
    openWindow(id)
  } else {
    toggleWindow(id)
  }
}

const returnToDesktop = () => {
  applicationsOpen.value = false
  showDesktop()
}

const launchApp = (id: string) => {
  const app = appConfig.find((item) => item.enName === id)
  if (!app) return
  openApp(app)
}

const openPersonalization = () => {
  const app = appConfig.find((item) => item.enName === 'Setting')
  if (!app) return
  settingsNavigation.value = { section: 'personalization' }
  openApp(app)
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
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: #1e1e1e var(--desktop-wallpaper) center / cover no-repeat;
}

.desktop {
  position: relative;
  height: 100%;
  padding-left: var(--desktop-inset-left);
  overflow: hidden;
}

.desktop-windows {
  position: absolute;
  inset: 0;
  z-index: 1;
  isolation: isolate;
  pointer-events: none;

  > :deep(.os-window) {
    pointer-events: auto;
  }
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
