<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppWindowProps, ContentResource } from '@/tsInterface/index'
import OsWindow from '@/components/OsWindow/index.vue'
import WindowSidebar from '@/components/OsWindow/WindowSidebar.vue'
import userIcon from '@/assets/setting/icons/user-solid.svg'
import { useUserInfoStore } from '@/stores/userInfo'
import UsersView from './components/UsersView.vue'
import ContentManager from './components/ContentManager.vue'
import musicIcon from '@/assets/icons/app/music.png'
import galleryIcon from '@/assets/icons/app/photo.png'
import navigationIcon from '@/assets/icons/app/website.png'

withDefaults(defineProps<AppWindowProps>(), { title: '控制面板', visible: true })
const minimized = defineModel<boolean>('minimized', { default: false })
const emit = defineEmits<{ activate: []; close: [] }>()
const userStore = useUserInfoStore()
const selectedMenu = ref<'users' | ContentResource>('users')
const isAdmin = computed(() => userStore.isAuthenticated && userStore.data.user.role === 'admin')
const menuItems = [
  { id: 'users', name: '用户管理', icon: userIcon },
  { id: 'music', name: '音乐管理', icon: musicIcon },
  { id: 'gallery/albums', name: '图集管理', icon: galleryIcon },
  { id: 'gallery/media', name: '媒体管理', icon: galleryIcon },
  { id: 'navigation/categories', name: '导航分类', icon: navigationIcon },
  { id: 'navigation/sites', name: '网站管理', icon: navigationIcon },
]
const accountName = computed(() => userStore.data.user.userName || userStore.data.user.email)
</script>

<template>
  <OsWindow
    v-if="isAdmin"
    v-model:minimized="minimized"
    :title="title"
    :icon="icon"
    :minimize-target="minimizeTarget"
    :visible="visible"
    @activate="emit('activate')"
    @close="emit('close')"
  >
    <template #sidebar>
      <WindowSidebar v-model="selectedMenu" :items="menuItems" label="控制面板导航">
        <template #header>
          <div class="panel-brand">
            <span class="panel-brand__icon" aria-hidden="true">▦</span>
            <div><strong>控制面板</strong><span>数据管理</span></div>
          </div>
          <div class="panel-account" :title="accountName">
            <span class="panel-account__dot" aria-hidden="true" />{{ accountName }}
          </div>
        </template>
      </WindowSidebar>
    </template>
    <UsersView v-if="selectedMenu === 'users'" :active="visible && !minimized" />
    <ContentManager v-else :key="selectedMenu" :resource="selectedMenu" :active="visible && !minimized" />
  </OsWindow>
</template>

<style scoped lang="scss">
.panel-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 8px 18px;
  color: var(--app-window-color);

  &__icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: #0067c0;
    color: white;
    font-size: 24px;
  }

  strong {
    display: block;
    font-size: 14px;
  }
  div > span {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    opacity: 0.55;
  }
}

.panel-account {
  overflow: hidden;
  margin: 0 8px 24px;
  color: var(--app-window-color);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &__dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 6px;
    border-radius: 50%;
    background: #25a36f;
  }
}
</style>
