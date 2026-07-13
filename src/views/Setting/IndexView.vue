<!-- * @description: 系统设置 — 个性化壁纸、用户登录、侧边栏导航 -->
<script lang="ts" setup>
import { ref, computed } from "vue";
import SideMenu from "@/components/SidebarMenu.vue";
import personalizationIcon from "@/assets/setting/icons/personalization.svg";
import PersonalizationView from "./components/PersonalizationView.vue";
import LoginCard from "@/views/Login/components/LoginCard.vue";
import LoginForm from "@/views/Login/components/LoginForm.vue";
import { useUserInfoStore } from "@/stores/iMusic/userInfo";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

const menuList = [
  {
    name: "个性化",
    icon: personalizationIcon,
  },
];

const userStore = useUserInfoStore();

// 从 store 读取用户名，取首字母作头像缩写
const username = computed(() => {
  const u = userStore.data?.user?.username;
  return u || "未登录";
});

const avatarLetter = computed(() => {
  return username.value.charAt(0).toUpperCase();
});

// ---- 登录弹窗 ----
const showLoginModal = ref(false);

const openLoginModal = () => {
  showLoginModal.value = true;
};

const closeLoginModal = () => {
  showLoginModal.value = false;
};

const onLoginSuccess = () => {
  showLoginModal.value = false;
};

// ---- 菜单 ----
const focusMenuIdx = ref(0);
const focusMenuItem = ref("");

const clickMenu = (item: { name: string; icon: string }, index: number) => {
  focusMenuIdx.value = index;
  focusMenuItem.value = item.name;
};
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
          <span class="index__view--avatar-text">{{ avatarLetter }}</span>
        </div>
        <span class="index__view--username">{{ username }}</span>
      </div>
      <SideMenu :menuList="menuList" @clickMenu="clickMenu"></SideMenu>
    </div>

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
        <PersonalizationView v-show="focusMenuIdx == 0"></PersonalizationView>
      </OverlayScrollbarsComponent>
    </div>

    <!-- 登录弹窗 -->
    <Teleport to="body">
      <Transition name="login-modal">
        <div
          v-if="showLoginModal"
          class="login-modal__overlay"
          @click.self="closeLoginModal"
          @keydown.escape="closeLoginModal"
        >
          <div class="login-modal__card-wrapper">
            <!-- 关闭按钮 -->
            <button
              class="login-modal__close"
              @click="closeLoginModal"
              type="button"
              aria-label="关闭登录窗口"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              >
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            </button>

            <LoginCard title="MIX OS" subtitle="登录您的帐号">
              <LoginForm :standalone="false" @login-success="onLoginSuccess" />
            </LoginCard>
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
    flex-shrink: 0;
  }

  &--avatar-text {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
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
    z-index: 10000;
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
    color: #94a3b8;
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #f1f5f9;
    }

    &:focus-visible {
      outline: 2px solid #60a5fa;
      outline-offset: 2px;
    }
  }
}

// ---- 弹窗动画 ----
.login-modal-enter-active {
  transition: opacity 300ms ease;

  .login-modal__card-wrapper {
    transition:
      opacity 300ms ease,
      transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.login-modal-leave-active {
  transition: opacity 200ms ease;

  .login-modal__card-wrapper {
    transition:
      opacity 200ms ease,
      transform 200ms ease-in;
  }
}

.login-modal-enter-from {
  opacity: 0;

  .login-modal__card-wrapper {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
}

.login-modal-leave-to {
  opacity: 0;

  .login-modal__card-wrapper {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
}

// ---- reduced-motion ----
@media (prefers-reduced-motion: reduce) {
  .login-modal-enter-active,
  .login-modal-leave-active {
    transition: none !important;

    .login-modal__card-wrapper {
      transition: none !important;
    }
  }
}

// ---- 小屏适配 ----
@media (max-width: 460px) {
  .login-modal__overlay {
    padding: 16px;
  }
}
</style>
