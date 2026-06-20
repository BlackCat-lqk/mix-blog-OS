<!-- * @description: 预设渐变色板 — 180+ 精选渐变色，一键复制 CSS -->
<script lang="ts" setup>
import { _copyToClipboard } from "@/utils/publickFun";
import { exampleColors } from "./exampleColorsData";

const handleCopy = (code: string) => {
  const isCopy = _copyToClipboard(code);
  if (!isCopy) {
    console.log("复制失败");
  }
};
</script>

<template>
  <div class="colors-list">
    <div v-for="(color, idx) in exampleColors" :key="idx" class="colors-list--item">
      <div class="header">
        <span>{{ color.title }}</span>
      </div>
      <div class="preview-box">
        <div class="preview-color" :style="color.code"></div>
      </div>
      <div class="bottom">
        <div class="t-colors">
          {{ color.colors.join("→") }}
        </div>
        <div @click="handleCopy(color.code)" class="copy-css">Copy Css</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$text-color: #333435;
.colors-list {
  display: grid;
  // 自动填充列，每列最小280px，剩余空间由各列均分
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: clamp(16px, 2.5vw, 50px);
  padding: clamp(10px, 1.5vw, 20px);
  &--item {
    background-color: #fff;
    box-shadow: 0 6px 15px #24252614;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(12px, 1.5vw, 20px);
    padding: clamp(12px, 1.5vw, 20px) 0;
    cursor: pointer;
    transition:
      box-shadow 0.25s,
      transform 0.25s;
    &:hover {
      box-shadow: 5px 12px 20px #24252621;
      transform: translateY(-2px);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      letter-spacing: 0.03em;
      font-size: 0.8125em;
      color: $text-color;
    }
    .preview-box {
      padding: clamp(4px, 0.8vw, 10px) clamp(16px, 3.5vw, 60px);
      .preview-color {
        // 圆形容器随窗口等比缩放
        width: clamp(140px, 16vw, 220px);
        aspect-ratio: 1;
        height: auto;
        border-radius: 50%;
      }
    }

    .bottom {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 clamp(10px, 1.5vw, 20px);
      letter-spacing: 0.03em;
      font-size: 0.8125em;
      color: $text-color;
      .copy-css {
        position: relative;
        &::before {
          content: "";
          position: absolute;
          width: 30%;
          border: 1px solid #333435;
          bottom: -4px;
          left: 0;
          transition: width 0.25s;
        }
        &:hover::before {
          width: 100%;
        }
      }
    }
  }
}
</style>
