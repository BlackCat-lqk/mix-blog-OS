<template>
  <div class="home-box">
    <div class="home-content">
      <header class="home-page-header">
        <h1 class="home-title">发现音乐</h1>
        <p class="home-subtitle">搜索曲目或在下方浏览推荐播放列表</p>
      </header>

      <div class="search-box">
        <img src="@/assets/iMusic/icons/Search.svg" alt="" class="search-icon" />
        <input
          type="text"
          class="search-input"
          placeholder="搜索歌曲、歌手…"
          v-model="keyword"
          @input="searchSongs"
        />
        <button
          v-show="keyword.length > 0"
          type="button"
          class="search-clear"
          aria-label="清除搜索"
          @click="clearSearch"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div v-show="searchMusicData.length > 0" class="search-result">
        <div class="title-header">搜索结果</div>
        <div class="list-box">
          <div
            v-for="(item, idx) in searchMusicData"
            :key="idx"
            class="item-box"
            @click="hanleSongDetail(idx)"
          >
            <div class="cover">
              <img :src="item.coverUrl" alt="" />
            </div>
            <div class="inform">
              <span class="title">{{ item.title }}</span>
              <span class="artist">{{ item.artist }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="search-empty" v-if="searchTip">
        <span>暂无匹配结果</span>
      </div>
      <LoadingView v-if="loading" />
      <div class="banner-box">
        <img src="@/assets/iMusic/images/banner.jpg" />
      </div>
      <PlayList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchMusicApi } from '@/server/iMusic/musicHttp'
import { _debounce } from '@/utils/publickFun'
import PlayList from './common/PlayList.vue'
import { useEventStore } from '@/stores/iMusic/eventStore'
import LoadingView from '../common/LoadingView.vue'

const eventStore = useEventStore()
const keyword = ref('')
const searchTip = ref(false)
const loading = ref(false)
const searchMusicData = ref([] as MusicItem[])

interface MusicItem {
  id?: number
  title: string
  artist?: string
  audioUrl?: string
  duration?: number
  coverUrl?: string
  lyricsUrl?: string
}

const searchSongs = _debounce(async () => {
  if (keyword.value.length < 1) {
    searchMusicData.value = []
    searchTip.value = false
    return
  }
  loading.value = true
  const response = await searchMusicApi({ keyword: keyword.value })
  const res = response.data
  if (res.length > 0) {
    searchTip.value = false
    searchMusicData.value = res
  } else {
    searchTip.value = true
    searchMusicData.value = []
  }
  loading.value = false
}, 600)

const clearSearch = () => {
  keyword.value = ''
  searchMusicData.value = []
  searchTip.value = false
  loading.value = false
}

const hanleSongDetail = (idx: number) => {
  eventStore.setShow(true)
  eventStore.setCurrentIndex(idx)
  eventStore.setData(searchMusicData.value)
  eventStore.controlPlay(true)
  eventStore.outControlPlay(true)
}
</script>

<style scoped lang="scss">
.home-box {
  width: 100%;
  height: calc(100vh - 80px);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home-page-header {
  display: none;
}

.home-content {
  overflow-y: auto;
  scrollbar-width: none;
  width: calc(100% - 20px);
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding-bottom: 24px;
  .banner-box {
    height: 380px;
    aspect-ratio: 1 / 0.44;
    border-radius: 40px;
    -webkit-mask-image:
      linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 92%, rgba(0, 0, 0, 0) 100%),
      linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 92%, rgba(0, 0, 0, 0) 100%);
    -webkit-mask-composite: source-in;
    mask-image:
      linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 92%, rgba(0, 0, 0, 0) 100%),
      linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 92%, rgba(0, 0, 0, 0) 100%);
    mask-composite: intersect;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 40px;
    }
  }
}

.search-box {
  display: flex;
  align-items: center;
  background-color: rgb(4, 36, 24);
  border-radius: 15px;
  justify-content: space-between;
  gap: 8px;
  width: calc(100% - 60px);
  padding: 8px 16px;
  box-sizing: border-box;

  .search-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    opacity: 0.9;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    height: 36px;
    background-color: transparent;
    border: none;
    color: #fff;
    font-size: 14px;
  }

  .search-input:focus {
    outline: none;
  }

  .search-input::placeholder {
    color: #889889;
  }

  .search-clear {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
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

.search-result {
  display: flex;
  flex-direction: column;
  padding: 10px;
  width: calc(100% - 20px);

  .title,
  .title-header {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #fff;
    letter-spacing: 2px;
  }

  .title-header {
    margin: 20px 0 12px;
    padding-left: 5px;
  }

  .list-box {
    display: flex;
    flex-direction: column;

    .item-box {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      background-color: #1a261e;
      border-radius: 15px;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.15s ease;

      &:active {
        background-color: #243628;
      }

      .cover {
        width: 46px;
        height: 46px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }
      }

      .inform {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;

        .title {
          font-size: 14px;
          color: #fff;
        }

        .artist {
          font-size: 12px;
          color: #b0b0b0;
        }
      }
    }
  }
}

.search-empty {
  padding: 16px 0;
  text-align: center;

  span {
    color: #9ca3af;
    font-size: 14px;
  }
}

@media (min-width: 900px) {
  .home-box {
    align-items: stretch;
  }

  .home-page-header {
    display: block;
    width: 100%;
    margin-bottom: 20px;
    padding-top: 4px;
  }

  .home-title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 650;
    color: #f5f5f5;
    letter-spacing: 0.03em;
  }

  .home-subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: #9ca3af;
    max-width: 36rem;
  }

  .home-content {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding: 30px 10% 80px 10%;
    border-radius: 15px 0 0 0;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
    max-width: 480px;
    align-self: flex-start;
    padding: 12px 18px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(12, 48, 32, 0.95) 0%, rgba(8, 36, 24, 0.98) 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
    margin-bottom: 8px;

    .search-icon {
      width: 22px;
      height: 22px;
    }

    .search-input {
      height: 40px;
      font-size: 15px;
    }

    .search-clear {
      width: 30px;
      height: 30px;
      font-size: 24px;
    }

    &:focus-within {
      border-color: rgba(62, 232, 106, 0.35);
      box-shadow:
        0 0 0 1px rgba(31, 186, 45, 0.2),
        0 12px 32px rgba(0, 0, 0, 0.22);
    }
  }

  .search-result {
    width: 100%;
    padding: 12px 0;

    .title-header {
      font-size: 17px;
      margin: 8px 0 14px;
      padding-left: 0;
      letter-spacing: 0.06em;
    }

    .list-box .item-box {
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(26, 38, 30, 0.75);

      &:hover {
        background: rgba(31, 186, 45, 0.1);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .cover {
        width: 52px;
        height: 52px;
      }

      .inform .title {
        font-size: 15px;
      }

      .inform .artist {
        font-size: 13px;
      }
    }
  }

  .search-empty span {
    font-size: 13px;
  }
}
</style>
