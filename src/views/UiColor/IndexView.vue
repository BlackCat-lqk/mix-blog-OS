<script lang="ts" setup>
import { ref } from "vue";
import colorshapes from "@/assets/uiColors/icons/colorshapes.svg";
import colorsCreate from "@/assets/uiColors/icons/colorsCreate.svg";
import imageColors from "@/assets/uiColors/icons/imageColors.svg";

const optionBtn = [
  {
    name: "示例",
    icon: colorshapes,
  },
  {
    name: "创造",
    icon: colorsCreate,
  },
  {
    name: "图片提取",
    icon: imageColors,
  },
];

const activeOption = ref(0);
</script>

<template>
  <div class="index">
    <div class="index--option-btn">
      <div
        class="item"
        v-for="(item, idx) in optionBtn"
        :key="idx"
        @click="activeOption = idx"
        :class="{ active: activeOption === idx }"
      >
        <img :src="item.icon" />
        <span>{{ item.name }}</span>
      </div>
    </div>
    <div class="index--content"></div>
  </div>
</template>

<style scoped lang="scss">
$header-height: 60px;
.index {
  height: 100%;
  overflow: auto;
  &--option-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    background: linear-gradient(
      to right,
      transparent 0%,
      transparent 1%,
      rgba(255, 255, 255, 0.8) 20%,
      rgba(255, 255, 255, 0.8) 77%,
      transparent 99%,
      transparent 100%
    );
    height: $header-height;
    position: fixed;
    width: 100%;
    .item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #000;
      font-size: 14px;
      font-weight: 400;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 8px;
      img {
        width: 32px;
      }
      &:hover {
        transition: 0.7s ease;
        box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.2);
      }
    }
    .active {
      box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.2);
    }
  }
  &--content {
    width: 100%;
    height: calc(100% - $header-height);
    background-color: #fff;
    margin-top: $header-height;
  }
}
</style>
