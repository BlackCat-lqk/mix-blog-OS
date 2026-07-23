<template>
  <div v-if="props.show" class="delete-main-box">
    <div class="delete-inner-box">
      <header class="delete-header">
        <button type="button" class="back-btn" aria-label="返回" @click="close">
          <img src="@/assets/icon/back.svg" alt="" />
        </button>
        <h2 class="delete-title">删除歌曲</h2>
        <span class="delete-header-spacer" aria-hidden="true" />
      </header>
      <p class="delete-desc">从曲库中移除曲目，操作不可恢复，请谨慎操作。</p>
      <div class="delete-toolbar">
        <label class="delete-search" :class="{ focused: searchFocused }">
          <img class="delete-search-icon" src="@/assets/icon/Search.svg" alt="" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            class="delete-search-input"
            placeholder="搜索歌名或歌手"
            @keydown.esc.prevent="clearSearch"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
          />
          <button
            v-if="searchQuery.trim()"
            type="button"
            class="delete-search-clear"
            aria-label="清空搜索"
            @click="clearSearch"
          >
            ×
          </button>
        </label>
        <p v-if="searchQuery.trim() && filteredMusicList.length > 0" class="delete-filter-hint">
          找到 {{ filteredMusicList.length }} 首
        </p>
      </div>
      <div class="delete-song-list-box">
        <div class="delete-song-item" v-for="(item, idx) in filteredMusicList" :key="idx">
          <div class="song-info">
            <div class="song-cover">
              <img :src="item.coverUrl" alt="" />
            </div>
            <div class="song-info-box">
              <div class="song-name">{{ item.title }}</div>
              <div class="song-singer">{{ item.artist }}</div>
            </div>
          </div>
          <button
            type="button"
            class="delete-song-btn"
            @click="handleDelete(item)"
            aria-label="删除"
          >
            <img src="@/assets/icon/delete.svg" alt="" />
          </button>
        </div>
        <p v-if="musicList.length === 0" class="delete-empty">暂无可管理的曲目</p>
        <p v-else-if="searchQuery.trim() && filteredMusicList.length === 0" class="delete-empty">
          没有匹配的歌曲，试试其他关键词
        </p>
      </div>
    </div>
  </div>
  <DialogNotification
    v-if="notificationVisible"
    :visible="notificationVisible"
    title="Info"
    @closeDialog="handleCloseTip"
  >
    <template #content>
      <div style="display: flex; justify-content: center; align-items: center; padding: 20px">
        <span v-if="!uploadLoading" style="color: #fff">{{ inforMsg }}</span>
        <span v-else style="color: #fff">UPLOADING...</span>
      </div>
    </template>
  </DialogNotification>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { getMusicApi, deleteMusicApi } from '@/server/musicHttp'
import DialogNotification from '@/views/common/DialogNotification.vue'

const emit = defineEmits(['update:show'])
const notificationVisible = ref(false)

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

interface MusicItem {
  id: string
  title: string
  artist?: string
  audioUrl?: string
  duration?: number
  coverUrl?: string
  lyricsUrl?: string
}

interface listData {
  data: Array<MusicItem>
  total: number
  currentPage: number
  pageSize: number
  totalPages: number
}

const musicList = ref<Array<MusicItem>>([])
const searchQuery = ref('')
const searchFocused = ref(false)

const filteredMusicList = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return musicList.value

  return musicList.value.filter((item) => {
    const title = (item.title || '').toLowerCase()
    const artist = (item.artist || '').toLowerCase()
    return title.includes(keyword) || artist.includes(keyword)
  })
})

const close = () => {
  emit('update:show', false)
  searchQuery.value = ''
}

const clearSearch = () => {
  searchQuery.value = ''
}

const handleCloseTip = () => {
  notificationVisible.value = false
}

const getMusicList = async () => {
  const params = {
    page: 1,
    limit: 100,
  }
  const res: { data: listData } = await getMusicApi(params)
  musicList.value = res.data.data
}

const inforMsg = ref('')
const uploadLoading = ref(false)

const handleDelete = async (item: MusicItem) => {
  notificationVisible.value = true
  try {
    const res = await deleteMusicApi({ id: item.id })
    if (res.data) {
      inforMsg.value = '删除成功'
    } else {
      inforMsg.value = '删除失败, token已过期或请先登录'
    }
  } catch (error) {
    console.log(error)
    inforMsg.value = '删除失败, token已过期或请先登录'
    return
  } finally {
    notificationVisible.value = true
    uploadLoading.value = false
    getMusicList()
    return
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      getMusicList()
    } else {
      searchQuery.value = ''
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.delete-main-box {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  z-index: var(--z-drawer-stack);
  padding: 0;
  backdrop-filter: blur(10px);
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.72);
  box-shadow: inset 0 0 10px 1px rgba(255, 255, 255, 0.2);
}

.delete-inner-box {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 16px 0 24px;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(22, 32, 26, 0.98) 0%, rgba(15, 23, 18, 0.99) 100%);
}

.delete-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.back-btn {
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 24px;
    height: 24px;
  }
}

.delete-title {
  margin: 0;
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 650;
  color: #f5f5f5;
}

.delete-header-spacer {
  width: 40px;
  flex-shrink: 0;
}

.delete-desc {
  display: none;
  margin: 0;
  padding: 12px 16px 0;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
}

.delete-toolbar {
  padding: 12px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delete-search {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 2px 4px 2px 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.delete-search.focused {
  border-color: rgba(74, 222, 111, 0.45);
  box-shadow: 0 0 0 1px rgba(74, 222, 111, 0.2);
}

.delete-search-icon {
  width: 18px;
  height: 18px;
  opacity: 0.55;
  flex-shrink: 0;
}

.delete-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 10px 12px 10px 0;
  font-size: 15px;
  color: #f3f4f6;
  outline: none;
}

.delete-search-input::placeholder {
  color: #6b7280;
}

.delete-search-clear {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #e5e7eb;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-filter-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  padding-left: 4px;
}

.delete-song-list-box {
  margin-top: 12px;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 0 12px;
  box-sizing: border-box;
}

.delete-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 32px 16px;
}

.delete-song-item {
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(26, 38, 30, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-sizing: border-box;

  .song-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;

    .song-cover img {
      width: 46px;
      height: 46px;
      border-radius: 8px;
      object-fit: cover;
    }

    .song-info-box {
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;

      .song-name {
        font-size: 15px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .song-singer {
        font-size: 12px;
        color: #b0b0b0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .delete-song-btn {
    flex-shrink: 0;
    padding: 10px;
    border: none;
    border-radius: 10px;
    background: rgba(180, 60, 60, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;

    img {
      width: 20px;
      height: 20px;
    }

    &:active {
      background: rgba(180, 60, 60, 0.35);
    }
  }
}

@media (min-width: 900px) {
  .delete-main-box {
    left: var(--imusic-pc-sidebar-width);
    right: 0;
    top: 0;
    bottom: 0;
    width: auto;
    height: auto;
    padding: 0;
    background: rgba(12, 14, 13, 0.94);
    backdrop-filter: none;
    box-shadow: none;
    align-items: stretch;
  }

  .delete-inner-box {
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: none;
    border-right: none;
    padding: 28px 32px 40px;
    background: linear-gradient(180deg, rgba(24, 36, 29, 0.98) 0%, rgba(13, 20, 16, 0.99) 100%);
    box-shadow: none;
  }

  .delete-header {
    padding: 0 0 20px;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .back-btn {
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .delete-title {
    font-size: 22px;
    text-align: left;
    padding-left: 8px;
  }

  .delete-header-spacer {
    width: 0;
  }

  .delete-desc {
    display: block;
    padding: 16px 0 12px;
  }

  .delete-toolbar {
    padding: 12px 0 0;
  }

  .delete-search-clear:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .delete-song-list-box {
    margin-top: 8px;
    padding: 0;
    gap: 8px;
  }

  .delete-song-item {
    padding: 12px 18px;
    min-height: 64px;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      background: rgba(31, 186, 45, 0.08);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .song-info .song-cover img {
      width: 52px;
      height: 52px;
      border-radius: 10px;
    }

    .song-info .song-info-box {
      .song-name {
        font-size: 15px;
      }

      .song-singer {
        font-size: 13px;
      }
    }

    .delete-song-btn {
      &:hover {
        background: rgba(220, 80, 80, 0.35);
      }
    }
  }
}
</style>
