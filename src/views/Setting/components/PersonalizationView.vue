<!-- * @description: 个性化设置 — 壁纸上传与预览 -->
<script lang="ts" setup>
import { ref, onUnmounted } from "vue";
import { useWallpaperStore } from "@/stores/wallpaper";
import defaultWallpaper1 from "@/assets/setting/images/wallpaper/default-wallpaper1.jpg";
import defaultWallpaper2 from "@/assets/setting/images/wallpaper/default-wallpaper2.png";
import defaultWallpaper3 from "@/assets/setting/images/wallpaper/default-wallpaper3.png";
import defaultWallpaper4 from "@/assets/setting/images/wallpaper/default-wallpaper4.png";
import defaultWallpaper5 from "@/assets/setting/images/wallpaper/default-wallpaper5.jpg";
import defaultWallpaper6 from "@/assets/setting/images/wallpaper/default-wallpaper6.jpg";
import defaultWallpaper7 from "@/assets/setting/images/wallpaper/default-wallpaper7.jpg";

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
</script>

<template>
  <div class="index-personalozation__view">
    <div class="index-personalozation--preview">
      <img v-if="store.current" :src="store.current" alt="preview" />
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
      <div class="title">默认壁纸</div>
      <div class="list">
        <div class="item" @click="store.selectWallpaper(defaultWallpaper1)">
          <img :src="defaultWallpaper1" alt="item" />
        </div>
        <div class="item" @click="store.selectWallpaper(defaultWallpaper2)">
          <img :src="defaultWallpaper2" alt="item" />
        </div>
        <div class="item" @click="store.selectWallpaper(defaultWallpaper3)">
          <img :src="defaultWallpaper3" alt="item" />
        </div>
        <div class="item" @click="store.selectWallpaper(defaultWallpaper4)">
          <img :src="defaultWallpaper4" alt="item" />
        </div>
        <div class="item" @click="store.selectWallpaper(defaultWallpaper5)">
          <img :src="defaultWallpaper5" alt="item" />
        </div>
        <div class="item" @click="store.selectWallpaper(defaultWallpaper6)">
          <img :src="defaultWallpaper6" alt="item" />
        </div>
        <div class="item" @click="store.selectWallpaper(defaultWallpaper7)">
          <img :src="defaultWallpaper7" alt="item" />
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
          <img :src="img" alt="" />
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
    <!-- 选择主题 -->
    <div>
      <span>选择主题</span>
      <button>浅色</button>
      <button>深色</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.index-personalozation {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
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
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(5px);
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
    padding: 10px 0;
    .list {
      width: 80%;
      max-width: 768px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .item {
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
  }
  &--history {
    width: 80%;
    max-width: 768px;
    padding: 10px 0;
    &--list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    &--item {
      width: 90px;
      height: 90px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 4px;
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
    padding: 10px 0;
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
}
</style>
