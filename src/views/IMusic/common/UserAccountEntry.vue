<template>
  <div ref="rootRef" class="user-account-entry" :data-variant="variant">
    <button type="button" class="user-account-trigger">
      <span class="avatar-wrap">
        <img v-if="userInfoStore.data.token" src="@/assets/iMusic/icons/avatar.svg" alt="" />
        <img v-else src="@/assets/iMusic/icons/defaultAvatar.svg" @click="requestLogin" />
      </span>
      <span class="user-label">
        <template v-if="userInfoStore.data.token">{{ userInfoStore.data.user.username }}</template>
        <template v-else>
          <span @click="requestLogin">去登录</span>
        </template>
      </span>
    </button>

    <Transition name="account-menu">
      <div
        v-show="menuOpen"
        class="user-account-menu"
        role="menu"
        aria-label="账户操作"
        @click.stop
      >
        <template v-if="userInfoStore.data.token">
          <button type="button" class="menu-item" role="menuitem" @click="onSwitchAccount">
            切换账户
          </button>
          <button
            type="button"
            class="menu-item menu-item--danger"
            role="menuitem"
            @click="onLogout"
          >
            退出登录
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useUserInfoStore } from "@/stores/iMusic/userInfo";

withDefaults(
  defineProps<{
    variant: "rail" | "sidebar";
  }>(),
  { variant: "sidebar" },
);

const emit = defineEmits<{
  needLogin: [];
}>();

const userInfoStore = useUserInfoStore();
const menuOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

// 只发事件，overlay 由 HeaderBar 统一管理
const requestLogin = () => {
  emit("needLogin");
};

const closeMenu = () => {
  menuOpen.value = false;
};

const onSwitchAccount = () => {
  userInfoStore.removeUserInfo();
  closeMenu();
  emit("needLogin");
};

const onLogout = () => {
  userInfoStore.removeUserInfo();
  closeMenu();
};

const onDocClick = (e: MouseEvent) => {
  const el = rootRef.value;
  if (!el || !menuOpen.value) return;
  if (!el.contains(e.target as Node)) {
    closeMenu();
  }
};

onMounted(() => {
  document.addEventListener("click", onDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});
</script>

<style scoped lang="scss">
$text-color: #000;
.user-account-entry {
  position: relative;
  width: 100%;
}

.user-account-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.avatar-wrap {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #d8d8d8;
  background-color: #d8d8d8;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 60%;
    height: 60%;
    object-fit: cover;
  }
}

.user-label {
  font-size: 13px;
  color: $text-color;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.user-account-menu {
  position: absolute;
  padding: 10px;
  border-radius: 15px;
  background: rgba(0, 0, 0, 1);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.menu-item {
  display: block;
  width: 100%;
  padding: 11px 14px;
  margin: 2px 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #e5e5e5;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.menu-item--danger {
  color: #fca5a5;

  &:hover {
    background: rgba(220, 80, 80, 0.2);
  }
}

.account-menu-enter-active,
.account-menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.account-menu-enter-from,
.account-menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* PC 菜单在入口下方展开 */
.user-account-entry[data-variant="rail"] {
  padding: 12px 10px;
  border-radius: 8px;
  transition: background 0.15s ease;
  box-sizing: border-box;

  .user-account-trigger {
    padding: 0;
  }

  .user-account-menu {
    left: 0;
    top: 100%;
  }
}
</style>
