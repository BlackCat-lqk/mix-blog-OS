<!-- * @description: UI 取色器 — 示例色板、图片取色、自定义颜色编辑 -->
<script lang="ts" setup>
import { ref } from "vue";
import colorshapes from "@/assets/uiColors/icons/colorshapes.svg";
import colorsCreate from "@/assets/uiColors/icons/colorsCreate.svg";
import imageColorsIcon from "@/assets/uiColors/icons/imageColors.svg";
import ExampleColors from "./components/ExampleColors.vue";
import CustomColors from "./components/CustomColors.vue";
import ImageColors from "./components/ImageColors.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

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
    icon: imageColorsIcon,
  },
];

// hoisted constants (module-level via <script setup> compilation)
const activeOption = ref(0);
</script>

<template>
  <OverlayScrollbarsComponent
    defer
    style="height: 100%"
    :options="{
      scrollbars: {
        autoHide: 'move',
        autoHideDelay: 100,
      },
    }"
  >
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
      <div class="index--content">
        <ExampleColors v-show="activeOption === 0"></ExampleColors>
        <CustomColors v-show="activeOption === 1"></CustomColors>
        <ImageColors v-show="activeOption === 2"></ImageColors>
      </div>
    </div>
  </OverlayScrollbarsComponent>
</template>

<style scoped lang="scss">
$header-height: 60px;
.index {
  height: calc(100% - $header-height);
  &--option-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    background: linear-gradient(
      to right,
      transparent 0%,
      transparent 1%,
      rgba(255, 255, 255, 0.95) 10%,
      rgba(255, 255, 255, 0.95) 90%,
      transparent 99%,
      transparent 100%
    );
    height: $header-height;
    position: fixed;
    width: 100%;
    top: 36px;
    z-index: 1;
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
    min-height: 100%;
    height: 100%;
    margin-top: $header-height;
  }
}
</style>
