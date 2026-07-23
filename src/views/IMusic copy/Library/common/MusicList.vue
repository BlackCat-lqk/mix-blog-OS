<template>
  <div v-show="props.type === 'playlist'" class="music-list-main-box">
    <div v-for="(songsItem, groupIdx) in songsData" :key="groupIdx" class="result-box">
      <div class="result-items-box" @click="handleSongsDetail(groupIdx)">
        <div class="songs-cover-box">
          <img :src="songsItem.songs[0]?.coverUrl" alt="cover" />
        </div>
        <div class="result-title">
          <span>{{ songsItem.title }} </span>
          <span>{{ songsItem.songs.length }}首</span>
        </div>
      </div>
      <div v-show="showSongsDetail && moreGroupOptionIdx == groupIdx">
        <div
          v-for="(item, idx) in songsItem.songs"
          :key="idx"
          class="result-item-box"
          @click="hanleSongDetail(idx)"
        >
          <div class="cover-box">
            <img :src="item.coverUrl" />
          </div>
          <div class="inform-box">
            <span class="music-name">{{ item.title }}</span>
            <span class="author">{{ item.artist }}</span>
          </div>
          <div class="more-box">
            <img src="@/assets/icon/more.svg" alt="mroe" @click="handleMoreOption(groupIdx, idx)" />
            <div
              v-if="moreOption && moreOptionIdx == idx && moreGroupOptionIdx == groupIdx"
              class="more-option-box"
              @click="remove(item, songsItem.title || '未知歌单')"
            >
              <div>
                <span>删除</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-show="props.type != 'playlist'" class="music-list-main-box liked-music-list-main-box">
    <div style="width: 100%">
      <div
        v-for="(item, idx) in songsData[0]?.songs"
        :key="idx"
        class="result-item-box"
        @click="hanleSongDetail(idx)"
      >
        <div class="cover-box">
          <img :src="item.coverUrl" />
        </div>
        <div class="inform-box">
          <span class="music-name">{{ item.title }}</span>
          <span class="author">{{ item.artist }}</span>
        </div>
        <div class="more-box">
          <img src="@/assets/icon/more.svg" alt="mroe" @click="likedMoreOption(idx)" />
          <div
            v-if="moreOption && moreOptionIdx == idx"
            class="more-option-box"
            @click="remove(item, songsData[0]?.title || '未知歌单')"
          >
            <div>
              <span>删除</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { useEventStore } from '@/stores/eventStore'
const eventStore = useEventStore()
import { removeFavoritesApi, removeLikesApi } from '@/server/userHttp'
const userInfoStore = useUserInfoStore()
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
const props = defineProps<{
  type: string
  data: Array<SongsItem>
}>()
const songsData = ref<SongsItem[]>([])
const moreOption = ref(false)
const moreOptionIdx = ref(-1)
const moreGroupOptionIdx = ref(-1)
const showSongsDetail = ref(false)

// 分组歌曲详情
const handleSongsDetail = (groupIdx: number) => {
  showSongsDetail.value = !showSongsDetail.value
  moreGroupOptionIdx.value = groupIdx
}
// 歌曲详情
const hanleSongDetail = (idx: number) => {
  eventStore.setShow(true)
  eventStore.setCurrentIndex(idx)
  if (props.type === 'playlist') {
    const groupData = songsData.value[moreGroupOptionIdx.value]
    if (groupData) {
      eventStore.setData(groupData.songs)
    }
  } else {
    const liked = songsData.value[0]
    if (liked?.songs) {
      eventStore.setData(liked.songs)
    }
  }
  eventStore.controlPlay(true)
  eventStore.outControlPlay(true)
}
const handleMoreOption = (grouipIdx: number, idx: number) => {
  moreOption.value = !moreOption.value
  moreGroupOptionIdx.value = grouipIdx
  moreOptionIdx.value = idx
}
const likedMoreOption = (idx: number) => {
  moreOption.value = !moreOption.value
  moreOptionIdx.value = idx
}
const remove = async (item: MusicItem, playlistTitle: string) => {
  const params = {
    userId: userInfoStore.data.user.id,
    musicInfo: item,
    playlistTitle,
  }
  if (props.type == 'playlist') {
    removeFavoritesApi(params)
  } else {
    removeLikesApi(params)
  }
}
watch(
  () => props.data,
  (newValue) => {
    songsData.value = newValue
  },
  { deep: true },
)
</script>

<style lang="scss" scoped>
.music-list-main-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  width: 100%;
  padding: 10px;
  .create-library-box {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 15px 0;
    background-color: rgb(4, 36, 24);
    border-radius: 15px;
    img {
      width: 20px;
      height: 20px;
    }
    span {
      font-size: 14px;
      color: #fff;
      font-weight: 400;
    }
  }
  .result-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
    width: 100%;
    background-color: rgba(81, 123, 98, 0.8);
    border-radius: 5px;
    .result-items-box {
      display: flex;
      align-items: center;
      background-color: rgba(0, 61, 25, 0.8);
      padding: 5px;
      border-radius: 5px;
      .songs-cover-box {
        width: 50px;
        height: 50px;
        img {
          width: 100%;
          height: 100%;
          border-radius: 5px;
        }
      }
    }
    .result-title {
      display: flex;
      flex-direction: column;
      gap: 5px;
      span {
        text-align: left;
        padding-left: 10px;
        font-size: 14px;
        color: #fff;
        padding-bottom: 5px;
        letter-spacing: 2px;
      }
      span:last-child {
        font-size: 12px;
        color: #c9c9c9;
      }
    }
  }
  .result-item-box {
    display: flex;
    gap: 10px;
    border-radius: 15px;
    padding: 8px 10px;
    box-shadow: 0 3px 4px 1px rgba(0, 0, 0, 0.1);
    .cover-box {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
    }
    .inform-box {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      .music-name {
        color: #fff;
        font-size: 14px;
      }
      .author {
        color: #c9c9c9;
        font-size: 12px;
      }
    }
    .more-box {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      img {
        width: 20px;
      }
      position: relative;
      .more-option-box {
        position: absolute;
        right: 0;
        bottom: 100%;
        div {
          padding: 5px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          span {
            color: #fff;
            font-size: 12px;
          }
        }
      }
    }
  }
}
.liked-music-list-main-box {
  background-color: rgba(81, 123, 98, 0.8);
  border-radius: 15px;
}

@media (min-width: 900px) {
  .music-list-main-box {
    align-items: stretch;
    padding: 0;
    margin-top: 12px;
    width: 100%;
  }

  .result-box {
    margin-top: 14px;
    background: transparent;
    border-radius: 0;
    gap: 8px;
    width: 100%;

    &:first-of-type {
      margin-top: 0;
    }

    .result-items-box {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 16px 20px;
      border-radius: 14px;
      background: linear-gradient(145deg, rgba(28, 40, 33, 0.95) 0%, rgba(18, 28, 22, 0.98) 100%);
      border: 1px solid rgba(255, 255, 255, 0.07);
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.04) inset,
        0 12px 40px rgba(0, 0, 0, 0.22);
      cursor: pointer;
      transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;

      &:hover {
        border-color: rgba(62, 232, 106, 0.3);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.06) inset,
          0 16px 48px rgba(0, 0, 0, 0.28);
        transform: translateY(-2px);
      }

      .songs-cover-box {
        width: 72px;
        height: 72px;
        flex-shrink: 0;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);

        img {
          border-radius: 10px;
          object-fit: cover;
        }
      }
    }

    .result-title {
      flex: 1;
      min-width: 0;
      padding-left: 4px;
      gap: 6px;

      span {
        padding-left: 16px !important;
        padding-bottom: 0 !important;
      }

      span:first-child {
        font-size: 16px;
        font-weight: 650;
        letter-spacing: 0.02em;
        color: #f4f4f5;
      }

      span:last-child {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 400;
        letter-spacing: 0.06em;
      }
    }
  }

  .result-item-box {
    gap: 14px;
    padding: 12px 18px;
    border-radius: 12px;
    background: rgba(15, 23, 18, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: none;
    align-items: center;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      background: rgba(31, 186, 45, 0.09);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .cover-box {
      width: 48px;
      height: 48px;
      border-radius: 8px;

      img {
        border-radius: 8px;
      }
    }

    .inform-box {
      flex: 1;
      min-width: 0;

      .music-name {
        font-size: 15px;
        font-weight: 500;
      }

      .author {
        font-size: 13px;
        color: #a1a1aa;
      }
    }

    .more-box img {
      width: 22px;
      opacity: 0.85;
      padding: 6px;
      border-radius: 8px;
      transition: background 0.15s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .more-option-box div {
      background: rgba(28, 36, 31, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
  }

  .liked-music-list-main-box {
    background: transparent;
    border-radius: 0;
    margin-top: 8px;
    padding: 0;

    > div {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .result-item-box:first-child {
      margin-top: 0;
    }
  }
}
</style>
