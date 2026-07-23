<template>
  <div class="message-box">
    <div>
      <img :src="qz" />
    </div>
    <span>IKUN MUSIC</span>
    <span class="version">version：0.2.0</span>
  </div>
</template>

<script setup lang="ts">
import qz from "@/assets/iMusic/icons/qz.svg";
</script>

<style scoped lang="scss">
.message-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  img {
    width: 30px;
    height: 30px;
  }
  span {
    color: #000;
    font-size: 14px;
  }
  .version {
    font-size: 12px;
    color: #000;
  }
}
</style>
