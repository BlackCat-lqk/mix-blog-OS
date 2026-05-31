<template>
  <aside class="pc-rail" aria-label="主导航">
    <nav class="pc-rail-nav">
      <h3>库</h3>
      <button
        type="button"
        class="pc-rail-item"
        :class="{ active: route.path === '/' }"
        @click="goHome"
      >
        <img
          v-if="route.path === '/'"
          src="@/assets/iMusic/icons/HomeActive.svg"
          alt=""
          class="pc-rail-icon"
        />
        <img v-else src="@/assets/iMusic/icons/Home.svg" alt="" class="pc-rail-icon" />
        <span>浏览</span>
      </button>
      <button
        type="button"
        class="pc-rail-item"
        :class="{ active: isLibrary && !visibleSetting }"
        @click="goLibrary"
      >
        <img
          v-if="isLibrary && !visibleSetting"
          src="@/assets/iMusic/icons/MusicLibraryActive.svg"
          class="pc-rail-icon"
        />
        <img v-else src="@/assets/iMusic/icons/MusicLibrary.svg" class="pc-rail-icon" />
        <span>歌曲</span>
      </button>
      <button type="button" class="pc-rail-item">
        <img src="@/assets/iMusic/icons/musicAlbum.svg" alt="" class="pc-rail-icon" />
        <span>专辑</span>
      </button>
      <button type="button" class="pc-rail-item">
        <img src="@/assets/iMusic/icons/artists.svg" alt="" class="pc-rail-icon" />
        <span>艺术家</span>
      </button>
    </nav>

    <nav class="pc-rail-nav">
      <h3>我的音乐</h3>
      <button type="button" class="pc-rail-item">
        <img src="@/assets/iMusic/icons/Recents.svg" alt="" class="pc-rail-icon" />
        <span>最近播放</span>
      </button>
      <button type="button" class="pc-rail-item">
        <img src="@/assets/iMusic/icons/likeWhite.svg" alt="" class="pc-rail-icon" />
        <span>喜欢的歌曲</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/iMusic/userInfo'
import { useEventStore } from '@/stores/iMusic/eventStore'

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()
const eventStore = useEventStore()

const visibleLogin = ref(false)
const visibleSetting = ref(false)

const isLibrary = computed(() => route.path === '/library')

const goHome = () => {
  eventStore.initPlay()
  visibleSetting.value = false
  router.push('/')
}

const goLibrary = () => {
  if (!userInfoStore.data.token) {
    visibleLogin.value = true
    return
  }
  eventStore.initPlay()
  visibleSetting.value = false
  router.push('/library')
}

watch(
  () => route.path,
  () => {
    // Route switch should always dismiss setting overlay.
    visibleSetting.value = false
  },
)
</script>

<style scoped lang="scss">
.pc-rail {
  display: none;
}

@media (min-width: 900px) {
  .pc-rail {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: var(--imusic-pc-sidebar-width);
    flex-shrink: 0;
    background: #000;
    border-right: 1px solid rgba(0, 0, 0, 0.35);
  }

  .pc-rail-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 30px 24px;
    min-height: 0;
    h3 {
      color: #fff;
      padding: 0 0 30px 14px;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .pc-rail-sub {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 12px 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .pc-rail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-size: 14px;
    color: rgb(149, 149, 149);
    text-decoration: none;
    transition:
      background 0.15s ease,
      color 0.15s ease;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
    &:hover {
      color: #fff;
    }
    &.active {
      background: linear-gradient(to left, #161616 0%, rgb(55, 55, 55) 100%);
      color: #fff;
      scale: 1.05;
    }

    &.subtle {
      color: rgb(55, 55, 55);
    }
  }

  .pc-rail-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    opacity: 0.95;
    filter: brightness(1.1);
  }

  .message-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
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
}
</style>
