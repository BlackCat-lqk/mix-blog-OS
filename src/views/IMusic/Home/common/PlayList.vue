<template>
  <div class="play-list-box">
    <div class="title-header">歌曲列表</div>
    <div class="list-box">
      <div
        v-for="(item, idx) in musicList"
        :key="idx"
        class="item-box"
        @click="hanleSongDetail(idx)"
      >
        <div class="number">
          <span>{{ idx + 1 }}</span>
        </div>
        <div class="cover">
          <img :src="item.coverUrl" />
        </div>
        <div class="inform">
          <span class="title">{{ item.title }}</span>
        </div>
        <div class="inform">
          <span class="artist">{{ item.artist }}</span>
        </div>
        <div class="inform inform-duration">
          <span class="duration">{{ formatSeconds(item.duration || 0) }}</span>
          <img src="@/assets/iMusic/icons/moreheng.svg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useEventStore } from "@/stores/iMusic/eventStore";
const eventStore = useEventStore();
import { getMusicApi } from "@/server/iMusic/musicHttp";
import { formatSeconds } from "@/utils/publickFun";

interface MusicItem {
  id?: number;
  title: string;
  artist?: string;
  audioUrl?: string;
  duration?: number;
  coverUrl?: string;
  lyricsUrl?: string;
}

interface listData {
  data: Array<MusicItem>;
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const musicList = ref<Array<MusicItem>>([]);

// 歌曲详情
const hanleSongDetail = (idx: number) => {
  eventStore.setShow(true);
  eventStore.setCurrentIndex(idx);
  eventStore.setData(musicList.value);
  // eventStore.controlPlay(true)
  // eventStore.outControlPlay(true)
};

// 获取音乐列表
const getMusicList = async () => {
  const params = {
    page: 1,
    limit: 100,
  };
  const res: { data: listData } = await getMusicApi(params);
  musicList.value = res.data.data;
  // eventStore.setData(musicList.value)
};
onMounted(() => {
  getMusicList();
});
</script>

<style scoped lang="scss">
$text-color: #000;
.play-list-box {
  display: flex;
  flex-direction: column;
  .title,
  .title-header {
    font-size: 16px;
    font-weight: 600;
    color: $text-color;
    letter-spacing: 2px;
  }
  .title-header {
    margin: 20px 0;
    padding-left: 5px;
  }
  .list-box {
    display: flex;
    flex-direction: column;
    .item-box {
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 15px;
      padding: 12px 16px;
      margin-bottom: 8px;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
      cursor: pointer;
      &:hover {
        background: linear-gradient(to right, rgba(227, 227, 227, 0.5) 0%, rgb(255, 255, 255) 100%);
      }
      .number {
        padding-right: 20px;
        span {
          font-size: 14px;
          font-weight: 500;
          color: $text-color;
          font-style: italic;
        }
      }
      .cover {
        width: 46px;
        min-width: 46px;
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
        align-items: center;
        gap: 2px;
        font-size: 14px;
        color: $text-color;
        flex: 1;
        .title {
          font-size: 15px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .artist {
          font-size: 15px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .duration {
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      .inform-duration {
        justify-content: flex-end;
        padding-right: 20px;
        gap: 30px;
        img {
          width: 16px;
          height: 16px;
        }
      }
    }
  }
}

// .play-list-box {
//   width: 100%;
//   max-width: none;
//   padding: 12px 0 16px;
//   align-self: stretch;

//   .title-header {
//     font-size: 17px;
//     margin: 20px 0 14px;
//     padding-left: 0;
//     letter-spacing: 0.06em;
//   }

//   .list-box .item-box {
//     border-radius: 12px;
//     padding: 12px 16px;
//     margin-bottom: 8px;
//     cursor: pointer;
//     transition:
//       background 0.15s ease,
//       border-color 0.15s ease;

//     &:hover {
//       background: linear-gradient(to right, rgba(227, 227, 227, 0.5) 0%, rgb(255, 255, 255) 100%);
//     }

//     .cover {
//       width: 52px;
//       height: 52px;
//     }

//     .inform .title {
//       font-size: 15px;
//     }

//     .inform .artist {
//       font-size: 15px;
//     }
//     .inform .duration {
//       font-size: 14px;
//       color: #a1a1aa;
//     }
//   }
// }
</style>
