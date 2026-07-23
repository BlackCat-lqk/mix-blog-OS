<template>
  <div class="library-music-box">
    <HeaderBar use-back />
    <div class="library-music-content">
      <h2 class="library-heading">我的音乐</h2>
      <p v-if="showEmptyHint" class="empty-hint">暂无歌单或喜欢内容，去发现音乐页逛逛吧。</p>
      <div class="music-list-box">
        <div class="tabs-box" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="activeIdx === 0"
            :class="activeIdx == 0 ? 'tab-box active' : 'tab-box'"
            @click="selectActive(0)"
          >
            <span class="tab-label-cn">收藏歌单</span>
            <span class="tab-label-en">Collections</span>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeIdx === 1"
            :class="activeIdx == 1 ? 'tab-box active' : 'tab-box'"
            @click="selectActive(1)"
          >
            <span class="tab-label-cn">我喜欢的</span>
            <span class="tab-label-en">Liked</span>
          </button>
        </div>
        <MusicList :type="typeVal" :data="data"></MusicList>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import HeaderBar from '@/views/common/HeaderBar.vue'
import MusicList from './common/MusicList.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { queryLikesFavoriteApi } from '@/server/userHttp'

interface MusicItem {
  id?: number | string
  title: string
  artist?: string
  audioUrl?: string
  duration?: number
  coverUrl?: string
  lyricsUrl?: string
}

interface SongsItem {
  title: string
  songs: Array<MusicItem>
}

interface LikesFavorite {
  collections: Array<SongsItem>
  favorites: Array<SongsItem>
}

const userInfoStore = useUserInfoStore()

const activeIdx = ref(0)
const typeVal = ref('playlist')
const data = ref<SongsItem[]>([])
const resData = ref<LikesFavorite>({
  collections: [],
  favorites: [],
})
const hasFetched = ref(false)

const showEmptyHint = computed(
  () =>
    hasFetched.value &&
    userInfoStore.data.token &&
    data.value.length === 0,
)

const selectActive = (idx: number) => {
  activeIdx.value = idx
  if (idx == 0) {
    typeVal.value = 'playlist'
    data.value = resData.value.collections
  } else {
    typeVal.value = 'liked'
    data.value = resData.value.favorites
  }
}

const getLikesFavorite = async () => {
  const res = await queryLikesFavoriteApi({
    userId: userInfoStore.data.user.id,
  })
  const result = res.data
  if (result.code == 200) {
    resData.value = result.data
    updateData()
  }
  hasFetched.value = true
}

const updateData = () => {
  if (typeVal.value == 'playlist') {
    data.value = resData.value.collections
  } else if (typeVal.value == 'liked') {
    data.value = resData.value.favorites
  }
}

onMounted(() => {
  if (!userInfoStore.data.token || !userInfoStore.data.user.id) return
  getLikesFavorite()
})
</script>

<style scoped lang="scss">
.library-music-box {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.library-heading {
  margin: 0 0 16px;
  width: 100%;
  font-size: 18px;
  font-weight: 650;
  color: #f5f5f5;
  letter-spacing: 0.03em;
}

.empty-hint {
  margin: 0 0 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

.library-music-content {
  width: calc(100% - 40px);
  margin-top: 60px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 10px;
  box-sizing: border-box;
}

.music-list-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .tabs-box {
    width: calc(100% - 10px);
    display: flex;
    align-items: center;
    background-color: rgb(4, 36, 24);
    padding: 5px;
    border-radius: 15px;
    gap: 4px;
    box-sizing: border-box;

    .tab-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      border-radius: 12px;
      line-height: 1.2;
      padding: 8px 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: inherit;

      .tab-label-cn {
        font-size: 13px;
        color: #e5e5e5;
        font-weight: 500;
      }

      .tab-label-en {
        display: none;
        font-size: 11px;
        color: #94a3b8;
        margin-top: 2px;
      }

      span {
        font-size: 14px;
        color: #fff;
      }
    }

    .active {
      background-color: rgb(7, 58, 34);

      .tab-label-cn {
        color: #fff;
      }
    }
  }
}

@media (min-width: 900px) {
  .library-music-box {
    align-items: stretch;
  }

  .library-heading {
    font-size: 22px;
    margin-bottom: 18px;
    max-width: min(960px, calc(100% - 48px));
    margin-left: auto;
    margin-right: auto;
    padding-left: 24px;
    padding-right: 24px;
    box-sizing: border-box;
  }

  .library-music-box .library-music-content {
    width: 100%;
    max-width: min(960px, calc(100% - 48px));
    margin-left: auto;
    margin-right: auto;
    margin-top: 72px;
    padding: 8px 24px 40px;
    flex: 1;
    box-sizing: border-box;
  }

  .empty-hint {
    text-align: left;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(26, 38, 30, 0.55);
  }

  .music-list-box .tabs-box {
    width: 100%;
    max-width: 400px;
    padding: 6px;
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(12, 48, 32, 0.95) 0%, rgba(8, 36, 24, 0.98) 100%);
    border: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: 8px;
    align-self: flex-start;

    .tab-box {
      padding: 12px 16px;
      border-radius: 10px;
      transition: background 0.15s ease;

      .tab-label-cn {
        font-size: 14px;
      }

      .tab-label-en {
        display: block;
      }

      &:hover:not(.active) {
        background: rgba(255, 255, 255, 0.04);
      }
    }

    .active {
      background: linear-gradient(135deg, rgba(31, 186, 45, 0.25) 0%, rgba(20, 128, 40, 0.2) 100%) !important;
      box-shadow: 0 0 0 1px rgba(62, 232, 106, 0.25);

      .tab-label-en {
        color: #86efac;
      }
    }
  }
}
</style>
