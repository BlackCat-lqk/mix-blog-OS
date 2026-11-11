<!-- 设置应用负责业务状态，通过公共窗口组合导航、内容与登录弹窗。 -->
<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import OsWindow from '@/components/OsWindow/index.vue'
import WindowSidebar from '@/components/OsWindow/WindowSidebar.vue'
import type { AppWindowProps, SettingsNavigation, WindowSidebarItem } from '@/tsInterface/index'
import personalizationIcon from '@/assets/setting/icons/personalization.svg'
import accountIcon from '@/assets/setting/icons/user-solid.svg'
import PersonalizationView from './components/PersonalizationView.vue'
import { useUserInfoStore } from '@/stores/userInfo.ts'
import userIcon from '@/assets/icons/user.svg'

const props = withDefaults(defineProps<AppWindowProps & { navigation?: SettingsNavigation }>(), {
  visible: true,
})
const emit = defineEmits<{ close: []; activate: [] }>()
const minimized = defineModel<boolean>('minimized', { default: false })
const userStore = useUserInfoStore()
const username = computed(() => userStore.data?.user?.userName || '未登录')
const showLoginModal = ref(false)
const Login = defineAsyncComponent(() => import('@/views/Login/IndexView.vue'))
const selectedMenu = ref('personalization')

const menuList = computed<WindowSidebarItem[]>(() => {
  const items = [{ id: 'personalization', name: '个性化', icon: personalizationIcon }]
  if (userStore.data?.user.isLogin) {
    items.push({ id: 'account', name: '账户', icon: accountIcon })
  }
  return items
})

watch(
  () => userStore.data?.user.isLogin,
  (loggedIn) => {
    selectedMenu.value = loggedIn ? 'account' : 'personalization'
  },
  { immediate: true },
)

watch(
  () => props.navigation,
  (navigation) => {
    if (navigation && menuList.value.some((item) => item.id === navigation.section)) {
      selectedMenu.value = navigation.section
    }
  },
  { immediate: true },
)
</script>

<template>
  <OsWindow
    v-model:minimized="minimized"
    :title="title"
    :icon="icon"
    :minimize-target="minimizeTarget"
    :visible="visible"
    @activate="emit('activate')"
    @close="emit('close')"
  >
    <template #sidebar>
      <WindowSidebar v-model="selectedMenu" :items="menuList" label="设置导航">
        <template #header>
          <button
            class="setting-account"
            type="button"
            aria-label="打开登录窗口"
            @click="showLoginModal = true"
          >
            <span class="setting-account__avatar">
              <img :src="userStore.data?.user?.avatar || userIcon" alt="" />
            </span>
            <span class="setting-account__username">{{ username }}</span>
          </button>
        </template>
      </WindowSidebar>
    </template>

    <div class="setting-content">
      <PersonalizationView v-if="selectedMenu === 'personalization'" />
    </div>
    <Login
      v-if="showLoginModal && !minimized && visible"
      :visible="showLoginModal"
      @login-status="showLoginModal = !$event"
      @close="showLoginModal = false"
    />
  </OsWindow>
</template>

<style scoped lang="scss">
.setting-content {
  flex: 1;
  min-height: 0;
  padding: 10px;
  overflow: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

.setting-account {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px 5px;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &:focus-visible {
    outline: 2px solid #0067c0;
    outline-offset: 1px;
  }

  &__avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid #ddd;
    background: #fff;
    overflow: hidden;
    padding: 5px;

    img {
      width: 32px;
      height: 32px;
    }
  }

  &__username {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
