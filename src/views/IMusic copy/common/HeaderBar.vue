<template>
  <div class="header-bar-box">
    <div class="mid-box">
      <div class="search-box">
        <img src="@/assets/iMusic/icons/Search.svg" alt="" class="search-icon" />
        <input type="text" class="search-input" placeholder="搜索歌曲、歌手…" v-model="keyword" />
        <img
          v-show="keyword.length > 0"
          class="close-icon"
          src="@/assets/icons/close.svg"
          @click="keyword = ''"
        />
      </div>
    </div>
    <div class="right-bar">
      <img src="@/assets/iMusic/icons/inform.svg" @click="toggleMessageOverlay" />
      <div class="avatar-info">
        <UserAccountEntry variant="rail" />
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
  <Teleport to="body">
    <div v-if="showUploadForm" class="teleport-upload-misuc">
      <UploadView></UploadView>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, inject, markRaw } from "vue";
import type { Component, VNode } from "vue";
import { useRouter, useRoute } from "vue-router";
import UserAccountEntry from "./UserAccountEntry.vue";
import NotificationContent from "./NotificationContent.vue";
import { useUserInfoStore } from "@/stores/iMusic/userInfo";
import { useEventStore } from "@/stores/iMusic/eventStore";
import UploadView from "../Upload/IndexView.vue";
// import SeetingView from "@/views/Setting/IndexView.vue";

const eventStore = useEventStore();
const userInfoStore = useUserInfoStore();
const showUploadForm = ref(false);

// 使用 OsWindow 的 overlay 系统（OsWindow 不存在时 fallback 不显示）
const osOverlay = inject("osOverlay") as
  | {
      visible: boolean;
      title: string;
      width: string;
      height: string;
      content: (() => VNode) | Component | null;
      closeOnMask: boolean;
    }
  | undefined;

const toggleMessageOverlay = () => {
  if (!osOverlay) return;
  if (osOverlay.visible) {
    osOverlay.visible = false;
  } else {
    osOverlay.title = "消息";
    osOverlay.content = markRaw(NotificationContent);
    osOverlay.visible = true;
    osOverlay.width = "300px";
    osOverlay.height = "auto";
  }
};

const visibleSetting = ref(false);
const menuOpen = ref(false);
const pendingUploadAfterLogin = ref(false);
const keyword = ref("");

const rootRef = ref<HTMLElement>();

const router = useRouter();
const route = useRoute();

const handleSetting = () => {
  if (!userInfoStore.data.token) {
    return;
  }
  eventStore.initPlay();
  visibleSetting.value = !visibleSetting.value;
  closeMenu();
};

// 上传音乐
const goUpload = () => {
  if (!osOverlay) return;
  if (osOverlay.visible) {
    osOverlay.visible = false;
  } else {
    osOverlay.title = "UPLOAD MUSIC";
    osOverlay.content = markRaw(UploadView);
    osOverlay.visible = true;
    osOverlay.width = "auto";
    osOverlay.height = "auto";
  }
  // showUploadForm.value = true;
  // if (!userInfoStore.data.token) {
  //   pendingUploadAfterLogin.value = true;
  //   visibleLogin.value = true;
  //   return;
  // }
  // eventStore.initPlay();
  // visibleSetting.value = false;
  // pendingUploadAfterLogin.value = false;
  // router.push("/upload");
  // closeMenu();
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
$text-color: #000;
$text-active-color: #0044ff;
$bg-color: rgba(255, 255, 255, 0.9);
.header-bar-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  background-color: $bg-color;
  box-sizing: border-box;
  width: 100%;
  .mid-box {
    display: flex;
    justify-content: center;
    color: $text-color;
    gap: 30px;
    .search-box {
      display: flex;
      align-items: center;
      gap: 3px;
      border: 1px solid #000;
      padding: 2px 20px 2px 10px;
      border-radius: 4px;
      position: relative;
      height: 36px;
      width: 260px;
      .search-input {
        border: unset;
        background: unset;
        display: flex;
        align-items: center;
        font-size: 12px;
        width: 100%;
        &:focus {
          outline: unset;
        }
      }
      .close-icon {
        width: 12px;
        height: 12px;
        cursor: pointer;
        position: absolute;
        right: 5px;
      }
      .search-icon {
        width: 16px;
        height: 16px;
      }
    }
  }
  .right-bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 5px;
    img {
      min-width: 18px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .avatar-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}
.box-header-menu {
  position: absolute;
  top: 100%;
  right: -10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  z-index: 1;
  .menu-item {
    display: flex;
    gap: 5px;
    width: 100%;
    padding: 11px 14px;
    border: none;
    background: transparent;
    color: $text-color;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.12s ease;
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
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
.teleport-upload-misuc {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
  height: 100vh;
  max-height: 100vh;
  animation: fadeIn 0.3s ease;
}
</style>
