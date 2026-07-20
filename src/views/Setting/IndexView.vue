<!-- * @description: 系统设置 — 个性化壁纸、用户登录、侧边栏导航 -->
<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import SideMenu from "@/components/SidebarMenu.vue";
import personalizationIcon from "@/assets/setting/icons/personalization.svg";
import accountIcon from "@/assets/setting/icons/user-solid.svg";
import PersonalizationView from "./components/PersonalizationView.vue";
import AccountView from "./components/AccountView.vue";
import Login from "@/views/Login/IndexView.vue";
import { useUserInfoStore } from "@/stores/userInfo.ts";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import closeIcon from "@/assets/icons/close-light.svg";
import logoAvatar from "@/assets/icons/logo-dark.svg";
interface MenuList {
  name: string;
  icon: string;
}
const menuList = ref<MenuList[]>([]);

const userStore = useUserInfoStore();

// 从 store 读取用户名，取首字母作头像缩写
const username = computed(() => {
  const u = userStore.data?.user?.userName;
  return u || "未登录";
});

// ---- 登录弹窗 ----
const showLoginModal = ref(false);

const openLoginModal = () => {
  showLoginModal.value = true;
};

const closeLoginModal = () => {
  showLoginModal.value = false;
};

// ---- 菜单 ----
const focusMenuIdx = ref(0);

const clickMenu = (item: { name: string; icon: string }, index: number) => {
  focusMenuIdx.value = index;
};

// 登录状态
const loginStatus = (status: boolean) => {
  showLoginModal.value = !status;
};

// 监听账户状态
watch(
  () => userStore.data?.user.isLogin,
  (val) => {
    if (!val) {
      menuList.value = [
        {
          name: "个性化",
          icon: personalizationIcon,
        },
      ];
      focusMenuIdx.value = 0;
    } else {
      menuList.value = [
        {
          name: "个性化",
          icon: personalizationIcon,
        },
        {
          name: "账户",
          icon: accountIcon,
        },
      ];
      focusMenuIdx.value = 1;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="index__view">
    <div class="index__view--menu">
      <!-- 帐号区域：点击弹出登录 -->
      <div
        class="index__view--account"
        @click="openLoginModal"
        role="button"
        tabindex="0"
        aria-label="打开登录窗口"
        @keydown.enter="openLoginModal"
        @keydown.space.prevent="openLoginModal"
      >
        <div class="index__view--avatar">
          <img :src="userStore.data?.user?.avatar || logoAvatar" />
        </div>
        <span class="index__view--username">{{ username }}</span>
      </div>
      <!-- 侧边菜单栏 -->
      <SideMenu :menuList="menuList" @clickMenu="clickMenu"></SideMenu>
    </div>
    <!-- 右侧内容区域 -->
    <div class="index__view--content">
      <OverlayScrollbarsComponent
        defer
        style="flex: 1"
        :options="{
          scrollbars: {
            autoHide: 'move',
            autoHideDelay: 100,
          },
        }"
      >
        <PersonalizationView v-if="focusMenuIdx == 0"></PersonalizationView>
        <AccountView v-else-if="focusMenuIdx == 1"></AccountView>
      </OverlayScrollbarsComponent>
    </div>

    <!-- 登录弹窗 -->
    <Teleport to="body">
      <Transition name="login-modal">
        <div v-if="showLoginModal" class="login-modal__overlay">
          <div class="login-modal__card-wrapper">
            <!-- 关闭按钮 -->
            <button class="login-modal__close" @click="closeLoginModal" type="button">
              <img :src="closeIcon" />
            </button>
            <Login @login-status="loginStatus"></Login>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.index__view {
  display: flex;
  height: 100%;
  gap: 20px;
  padding-left: 10px;

  &--menu {
    width: 200px;
    min-width: 200px;
    height: 100%;
  }

  // ---- 帐号区域 ----
  &--account {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    transition: background 150ms ease;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    &:focus-visible {
      outline: 2px solid #0067c0;
      outline-offset: 1px;
    }
  }

  // ---- 头像 ----
  &--avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid #ddd;
    background: #fff;
    overflow: hidden;
    padding: 5px;
  }

  // ---- 用户名 ----
  &--username {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--content {
    flex: 1;
    height: calc(100% - 20px);
    display: flex;
    justify-content: center;
    overflow: auto;
    padding: 10px;
  }
}

// ============================================================================
// 登录弹窗
// ============================================================================

.login-modal {
  // ---- overlay ----
  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  // ---- card wrapper ----
  &__card-wrapper {
    position: relative;
    width: 100%;
    max-width: 420px;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 20px;
  }

  // ---- 关闭按钮 ----
  &__close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transform: rotate(-90deg);
    transition:
      background 150ms ease,
      color 150ms ease,
      transform 150ms ease;
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: rotate(90deg);
      transition: 0.2s all;
    }
    img {
      width: 24px;
      height: 24px;
    }
  }
}
</style>
