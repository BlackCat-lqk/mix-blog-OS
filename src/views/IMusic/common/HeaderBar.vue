<template>
  <div class="header-bar-box" :class="{ 'header-bar-box--back': useBack }">
    <div class="left-bar">
      <div class="pc-rail-logo">
        <img class="logo-mark" src="@/assets/iMusic/images/music.webp" />
        <span class="logo-text">iMusic</span>
      </div>
      <button type="button" class="meun-box" @click="onLeftClick">
        <img v-if="useBack" src="@/assets/iMusic/icons/back.svg" alt="返回" />
        <img v-else src="@/assets/iMusic/icons/meun.svg" alt="菜单" />
      </button>
    </div>
    <div class="mid-box">
      <div class="search-box">
        <img src="@/assets/iMusic/icons/Search.svg" alt="" class="search-icon" />
        <input type="text" class="search-input" placeholder="搜索歌曲、歌手…" v-model="keyword" />
        <button
          v-show="keyword.length > 0"
          type="button"
          class="search-clear"
          aria-label="清除搜索"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="middle-box">
        <span>News Feed</span>
        <span>Shuffle Play</span>
      </div>
    </div>
    <div class="right-bar">
      <img src="@/assets/iMusic/icons/inform.svg" @click="visibleMessage = !visibleMessage" />
      <div class="avatar-info">
        <UserAccountEntry variant="rail" @need-login="visibleLogin = true" />
      </div>
      <img
        ref="rootRef"
        src="@/assets/iMusic/icons/more_opration.svg"
        @click="menuOpen = !menuOpen"
      />
      <Transition name="header-menu">
        <div v-show="menuOpen" class="box-header-menu" role="menu" @click.stop>
          <button type="button" class="menu-item" @click="goUpload">
            <img src="@/assets/iMusic/icons/UploadFill.svg" alt="" class="pc-rail-icon" />
            <span>上传音乐</span>
          </button>
          <button type="button" class="menu-item" @click="handleSetting">
            <img src="@/assets/iMusic/icons/setting.svg" alt="" class="pc-rail-icon" />
            <span>设置</span>
          </button>
        </div>
      </Transition>
    </div>
  </div>
  <MessageNotification v-model:visible="visibleMessage" title="通知">
    <template #content>
      <div class="message-box">
        <div>
          <img src="@/assets/iMusic/icons/qz.svg" />
        </div>
        <span>iMusic</span>
        <span class="version">version：0.0.2</span>
      </div>
    </template>
  </MessageNotification>
  <!-- <UserLogin v-model:visible="visibleLogin" title="Login" /> -->
  <SeetingView v-model:show="visibleSetting" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import UserAccountEntry from "./UserAccountEntry.vue";
import MessageNotification from "./DialogNotification.vue";
// import UserLogin from "./UserLogin.vue";
import { useUserInfoStore } from "@/stores/iMusic/userInfo";
import { useEventStore } from "@/stores/iMusic/eventStore";
import SeetingView from "@/views/Setting/IndexView.vue";

const eventStore = useEventStore();
const userInfoStore = useUserInfoStore();
const visibleMessage = ref(false);
const visibleLogin = ref(false);
const visibleSetting = ref(false);
const menuOpen = ref(false);
const pendingUploadAfterLogin = ref(false);
const keyword = ref("");

const rootRef = ref<HTMLElement>();

const props = withDefaults(
  defineProps<{
    /** 为 true 时左侧为返回首页，且不挂载侧栏（用于曲库等二级页） */
    useBack?: boolean;
  }>(),
  { useBack: false },
);

const router = useRouter();
const route = useRoute();
const showSideBar = ref(false);

const onLeftClick = () => {
  if (props.useBack) {
    router.push("/");
  } else {
    showSideBar.value = true;
  }
};

const handleSetting = () => {
  if (!userInfoStore.data.token) {
    visibleLogin.value = true;
    return;
  }
  eventStore.initPlay();
  visibleSetting.value = !visibleSetting.value;
  closeMenu();
};

// 上传音乐
const goUpload = () => {
  if (!userInfoStore.data.token) {
    pendingUploadAfterLogin.value = true;
    visibleLogin.value = true;
    return;
  }
  eventStore.initPlay();
  visibleSetting.value = false;
  pendingUploadAfterLogin.value = false;
  router.push("/upload");
  closeMenu();
};

watch(
  () => userInfoStore.data.token,
  (token) => {
    if (token && pendingUploadAfterLogin.value) {
      pendingUploadAfterLogin.value = false;
      router.push("/upload");
    }
  },
);

watch(
  () => route.path,
  () => {
    // Route switch should always dismiss setting overlay.
    visibleSetting.value = false;
  },
);

const closeMenu = () => {
  menuOpen.value = false;
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
.header-bar-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 15px;
  backdrop-filter: blur(8px);
  box-sizing: border-box;
  width: 100%;
  z-index: 2;

  .left-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    .meun-box {
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      img {
        width: 100%;
        height: 100%;
      }
    }
    .nav-name {
      color: #fff;
      font-weight: bold;
    }
  }
  .pc-rail-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    .logo-mark {
      width: 32px;
      height: 32px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: #f5f5f5;
      letter-spacing: 0.02em;
    }
  }
  .mid-box {
    display: flex;
    justify-content: center;
    color: #fff;
    gap: 30px;
  }
  .right-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    img {
      min-width: 16px;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .avatar-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}
.message-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  padding: 30px 0;
  img {
    width: 30px;
    height: 30px;
  }
  span {
    color: #fff;
  }
  .version {
    font-size: 12px;
    color: #ccc;
  }
}
.box-header-menu {
  position: absolute;
  top: 100%;
  right: 8px;
  padding: 10px;
  border-radius: 15px;
  background: rgba(0, 0, 0, 1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  .menu-item {
    display: flex;
    gap: 5px;
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
    .pc-rail-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      opacity: 0.95;
      filter: brightness(1.1);
    }
  }
}
@media (min-width: 900px) {
  .header-bar-box {
    border-radius: 0;
    padding: 38px;
    height: 80px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, transparent 100%);
    backdrop-filter: none;
    box-sizing: border-box;
    backdrop-filter: blur(8px);
  }

  .header-bar-box:not(.header-bar-box--back) .meun-box {
    display: none;
  }

  .header-bar-box--back .meun-box {
    display: flex;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    img {
      width: 22px;
      height: 22px;
    }
  }

  .mid-box {
    position: static;
    transform: none;
    .search-box {
      display: flex;
      align-items: center;
      border-radius: 15px;
      justify-content: space-between;
      border: 1px solid #383838;
      padding: 5px 10px;
      gap: 8px;
      width: calc(100% - 60px);
      box-sizing: border-box;

      .search-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        opacity: 0.9;
      }

      .search-input {
        flex: 1;
        min-width: 0;
        background-color: transparent;
        border: none;
        color: #fff;
        font-size: 14px;
      }

      .search-input:focus {
        outline: none;
      }

      .search-input::placeholder {
        color: #959595;
      }

      .search-clear {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.85);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
        transition:
          background 0.15s ease,
          color 0.15s ease;

        span {
          display: block;
          margin-top: -2px;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        &:focus-visible {
          outline: 2px solid rgba(62, 232, 106, 0.55);
          outline-offset: 2px;
        }
      }
    }
    .middle-box {
      display: flex;
      gap: 20px;
      span {
        color: #959595;
        font-size: 14px;
        display: flex;
        cursor: pointer;
        white-space: nowrap;
        align-items: center;
      }
    }
  }
}
</style>
