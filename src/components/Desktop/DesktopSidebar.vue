<script setup lang="ts">
import { ref } from 'vue'
import desktopIcon from '@/assets/icons/desktop.svg'
import appsIcon from '@/assets/icons/apps.svg'
import type { SidebarApp, WindowBounds } from '@/tsInterface/index'

defineProps<{ apps: SidebarApp[]; activeWindowId?: string; applicationsOpen: boolean }>()
const emit = defineEmits<{
  desktop: []
  applications: []
  activate: [id: string]
  personalize: []
}>()
const appButtons = ref<HTMLButtonElement[]>([])
const getAppBounds = (id: string): WindowBounds | undefined => {
  const rect = appButtons.value
    .find((button) => button.dataset.appId === id)
    ?.getBoundingClientRect()
  if (!rect?.width || !rect.height) return
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}
defineExpose({ getAppBounds })
</script>

<template>
  <aside class="desktop-sidebar" aria-label="桌面状态栏">
    <nav class="desktop-sidebar__shortcuts" aria-label="快捷操作">
      <button
        class="desktop-sidebar__button"
        type="button"
        title="返回桌面"
        aria-label="返回桌面"
        :aria-pressed="!activeWindowId && !applicationsOpen"
        @click="emit('desktop')"
      >
        <img :src="desktopIcon" alt="" width="32" height="32" />
      </button>
      <button
        class="desktop-sidebar__button"
        :class="{ 'desktop-sidebar__button--active': applicationsOpen }"
        type="button"
        title="全部应用"
        aria-label="全部应用"
        :aria-pressed="applicationsOpen"
        @click="emit('applications')"
      >
        <img :src="appsIcon" alt="" width="32" height="32" />
      </button>
    </nav>

    <nav class="desktop-sidebar__apps" aria-label="已打开的应用">
      <button
        v-for="app in apps"
        :key="app.id"
        ref="appButtons"
        :data-app-id="app.id"
        class="desktop-sidebar__button desktop-sidebar__app"
        :class="{
          'desktop-sidebar__button--active': activeWindowId === app.id,
          'desktop-sidebar__app--minimized': app.minimized,
        }"
        type="button"
        :title="app.name + (app.minimized ? '（已最小化）' : '')"
        :aria-label="
          app.name +
          (app.minimized ? '，恢复窗口' : activeWindowId === app.id ? '，最小化窗口' : '，切换窗口')
        "
        :aria-pressed="activeWindowId === app.id"
        @click="emit('activate', app.id)"
      >
        <img v-if="app.icon" :src="app.icon" alt="" width="32" height="32" />
        <span v-else class="desktop-sidebar__initial" aria-hidden="true">{{
          app.name.slice(0, 1)
        }}</span>
        <span class="desktop-sidebar__running" aria-hidden="true" />
      </button>
    </nav>

    <nav class="desktop-sidebar__utilities" aria-label="功能设置">
      <button
        class="desktop-sidebar__button"
        type="button"
        title="个性化设置"
        aria-label="个性化设置"
        @click="emit('personalize')"
      >
        <svg class="desktop-sidebar__palette" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3a9 9 0 1 0 0 18h1.3a2.5 2.5 0 0 0 1.9-4.1 1.5 1.5 0 0 1 1.1-2.4H18a3 3 0 0 0 3-3C21 6.8 17 3 12 3Z"
            fill="currentColor"
          />
          <circle cx="7.5" cy="10" r="1.3" fill="#a892d0" />
          <circle cx="11" cy="6.9" r="1.3" fill="#a892d0" />
          <circle cx="15.5" cy="7.8" r="1.3" fill="#a892d0" />
          <circle cx="6.9" cy="14.7" r="1.3" fill="#a892d0" />
        </svg>
      </button>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.desktop-sidebar {
  position: fixed;
  inset: 8px auto 8px var(--desktop-sidebar-offset, 8px);
  z-index: 1000;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: var(--desktop-sidebar-width, 60px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  background: rgba(134, 164, 179, .05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 18px rgba(35, 24, 63, 0.12);
  overflow: hidden;
  color: #fff;
  user-select: none;

  &__shortcuts,
  &__utilities {
    padding: 10px 0;
  }

  &__shortcuts {
    border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  }

  &__utilities {
    border-top: 1px solid rgba(255, 255, 255, 0.16);
  }

  &__apps {
    min-height: 0;
    padding: 8px 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.4) transparent;
  }

  &__button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
    padding: 8px;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.13);
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: -4px;
      border-radius: 6px;
    }

    &--active {
      background: rgba(255, 255, 255, 0.16);

      &::before {
        content: '';
        position: absolute;
        inset: 6px auto 6px 0;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: #49b7ff;
      }
    }

    img {
      flex-shrink: 0;
      object-fit: contain;
    }
  }

  &__app--minimized img,
  &__app--minimized .desktop-sidebar__initial {
    opacity: 0.55;
  }

  &__running {
    position: absolute;
    bottom: 3px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.85);
  }

  &__initial {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
  }

  &__palette {
    width: 30px;
    height: 30px;
  }
}
</style>
