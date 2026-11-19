<!-- * @description: 个性化设置 — 壁纸上传与预览 -->
<template>
  <div class="index-personalozation__view">
    <div class="index-personalozation--preview">
      <img v-if="store.current" :src="store.current" alt="preview" decoding="async" />
      <div class="mask">
        <div class="line-box">
          <div class="line" v-for="line in 4" :key="line"></div>
        </div>
        <div class="box-btn">
          <div class="btn"></div>
        </div>
      </div>
    </div>
    <!-- 默认壁纸 -->
    <div class="index-personalozation--default">
      <div class="title">系统壁纸</div>
      <div class="list">
        <div
          v-for="wallpaper in wallpapers"
          :key="wallpaper.full"
          class="item"
          @click="store.selectWallpaper(wallpaper.full)"
        >
          <img
            :src="wallpaper.thumbnail"
            alt="item"
            width="160"
            height="90"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
    <div class="index-personalozation--history">
      <span>最近使用的图像</span>
      <div class="index-personalozation--history--list">
        <div
          v-for="(img, idx) in store.history"
          :key="idx"
          class="index-personalozation--history--item"
          :class="{ active: store.current === img }"
          @click="store.selectWallpaper(img)"
        >
          <img :src="img" alt="" width="160" height="90" loading="lazy" decoding="async" />
        </div>
        <span v-if="!store.history.length" class="index-personalozation--history--empty"
          >暂无历史记录</span
        >
      </div>
    </div>
    <!-- 上传图片 -->
    <div class="index-personalozation--upload">
      <span>选择一张照片</span>
      <button class="preview-btn" @click="triggerUpload">浏览照片</button>
      <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" hidden />
    </div>
    <!-- 必应在线壁纸 -->
    <div class="index-personalozation--bing">
      <div class="bing-description">
        <label for="bing-wallpaper">启用必应在线壁纸</label>
        <span v-if="store.bingLoading" role="status">正在加载今日壁纸…</span>
        <span v-else-if="store.bingError" role="alert">{{ store.bingError }}</span>
      </div>
      <div class="bing-controls">
        <button v-if="store.bingError" type="button" @click="store.loadBingWallpaper()">
          重试
        </button>
        <input
          id="bing-wallpaper"
          type="checkbox"
          role="switch"
          :checked="store.bingEnabled"
          :disabled="!store.initialized"
          @change="onBingChange"
        />
      </div>
    </div>
    <!-- 选择主题 -->
    <div class="index-personalozation--theme">
      <span>选择主题</span>
      <div>
        <button type="button" @click="switchTheme('light')">浅色</button>
        <button type="button" class="dark-theme-btn" @click="switchTheme('dark')">深色</button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onUnmounted } from "vue";
import { publicStore } from "@/stores/public"
import { useWallpaperStore } from "@/stores/wallpaper";
import defaultWallpaper1 from "@/assets/setting/images/wallpaper/default-wallpaper1.jpg";
import defaultWallpaper2 from "@/assets/setting/images/wallpaper/default-wallpaper2.png";
import defaultWallpaper3 from "@/assets/setting/images/wallpaper/default-wallpaper3.png";
import defaultWallpaper5 from "@/assets/setting/images/wallpaper/default-wallpaper5.jpg";
import defaultWallpaper6 from "@/assets/setting/images/wallpaper/default-wallpaper6.jpg";
import defaultWallpaper7 from "@/assets/setting/images/wallpaper/default-wallpaper7.jpg";
import thumbnail1 from "@/assets/setting/images/wallpaper/thumbnails/default-wallpaper1.jpg";
import thumbnail2 from "@/assets/setting/images/wallpaper/thumbnails/default-wallpaper2.jpg";
import thumbnail3 from "@/assets/setting/images/wallpaper/thumbnails/default-wallpaper3.jpg";
import thumbnail5 from "@/assets/setting/images/wallpaper/thumbnails/default-wallpaper5.jpg";
import thumbnail6 from "@/assets/setting/images/wallpaper/thumbnails/default-wallpaper6.jpg";
import thumbnail7 from "@/assets/setting/images/wallpaper/thumbnails/default-wallpaper7.jpg";

// 列表只解码缩略图，选中后才加载原图作为桌面壁纸。
const wallpapers = [
  { full: defaultWallpaper1, thumbnail: thumbnail1 },
  { full: defaultWallpaper2, thumbnail: thumbnail2 },
  { full: defaultWallpaper3, thumbnail: thumbnail3 },
  { full: defaultWallpaper5, thumbnail: thumbnail5 },
  { full: defaultWallpaper6, thumbnail: thumbnail6 },
  { full: defaultWallpaper7, thumbnail: thumbnail7 },
];

const store = useWallpaperStore();
const fileInput = ref<HTMLInputElement>();

const isMounted = ref(true);
let activeReader: FileReader | null = null;

onUnmounted(() => {
  isMounted.value = false;
  activeReader?.abort();
});

const triggerUpload = () => {
  fileInput.value?.click();
};

const onBingChange = (e: Event) => {
  activeReader?.abort();
  store.setBingEnabled((e.target as HTMLInputElement).checked);
};

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Abort any previous in-progress read
  activeReader?.abort();

  const reader = new FileReader();
  activeReader = reader;

  reader.onload = () => {
    if (!isMounted.value) return;
    store.setWallpaper(reader.result as string);
  };
  reader.onerror = () => {
    activeReader = null;
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const switchTheme = (val: string) => {
  document.documentElement.setAttribute('data-theme', val)
  // 持久化
  publicStore().switchTheme(val)
}
</script>
<style scoped lang="scss">
.index-personalozation {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  gap: 20px;
  &__view {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  &--preview {
    aspect-ratio: 16/9;
    width: 80%;
    max-width: 768px;
    border: 12px solid #000;
    margin: 20px 0;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .mask {
      position: absolute;
      width: 40%;
      height: 80%;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      top: 5%;
      right: 5%;
      display: flex;
      flex-direction: column;
      padding: 20px;
      justify-content: space-between;
      .line-box {
        display: flex;
        flex-direction: column;
        gap: 20px;
        .line:last-child {
          width: 60%;
        }
        .line {
          width: 100%;
          height: 2px;
          background: #000;
        }
      }
      .box-btn {
        width: 100%;
        height: 30px;
        display: flex;
        justify-content: end;
        .btn {
          width: 40%;
          background: #0067c0;
          border-radius: 4px;
        }
      }
    }
  }
  &--default {
    width: 80%;
    padding: 10px;
    background-color: #fdfafc;
    border-radius: 10px;
    max-width: 768px;
    .list {
      display: flex;
      overflow: hidden;
      gap: 10px;
      flex-wrap: wrap;
    }
    .item {
      width: 160px;
      min-width: 160px;
      height: 90px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 8px;
      overflow: hidden;
      &.active {
        border-color: #0067c0;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
  &--history {
    width: 80%;
    max-width: 768px;
    padding: 10px;
    background-color: #fdfafc;
    border-radius: 10px;
    &--list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    &--item {
      width: 160px;
      height: 90px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 8px;
      overflow: hidden;
      &.active {
        border-color: #0067c0;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    &--empty {
      color: #999;
      font-size: 12px;
    }
  }
  &--upload {
    width: 80%;
    max-width: 768px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #fdfafc;
    border-radius: 10px;
    .preview-btn {
      border: unset;
      font-size: 14px;
      padding: 5px 10px;
      cursor: pointer;
      border-radius: 4px;
      &:hover {
        background-color: #f6f6f6;
      }
    }
  }
  &--bing,
  &--theme {
    width: 80%;
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    background-color: #fdfafc;
    border-radius: 10px;
    max-width: 768px;
    & > div {
      display: flex;
      align-items: center;
      gap: 5px;
      button {
        border: unset;
        font-size: 14px;
        padding: 5px 10px;
        cursor: pointer;
        border-radius: 4px;
      }
      .dark-theme-btn {
        color: #fff;
        background-color: #000;
      }
    }
  }
  &--bing {
    .bing-description {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      span {
        font-size: 12px;
        color: #666;
      }
    }
    input {
      width: 36px;
      height: 20px;
      cursor: pointer;
      appearance: none;
      border: 1px solid #888;
      border-radius: 10px;
      background: #ddd;
      &::before {
        content: "";
        display: block;
        width: 14px;
        height: 14px;
        margin: 2px;
        border-radius: 50%;
        background: #fff;
      }
      &:checked {
        border-color: #0067c0;
        background: #0067c0;
        &::before {
          transform: translateX(16px);
        }
      }
      &:disabled {
        cursor: wait;
        opacity: 0.5;
      }
    }
  }
}
</style>
