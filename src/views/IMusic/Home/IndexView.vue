<template>
  <div class="home-box">
    <OverlayScrollbarsComponent
      defer
      style="flex: 1"
      :options="{
        scrollbars: {
          autoHide: 'move',
          autoHideDelay: 100,
        },
      }"
    >
      <div class="home-content">
        <header class="home-page-header">
          <h1 class="home-title">发现音乐</h1>
        </header>
        <div class="banner-box">
          <!-- <img src="@/assets/iMusic/images/banner.jpg" /> -->
        </div>
        <PlayList />
      </div>
    </OverlayScrollbarsComponent>
    <OverlayScrollbarsComponent
      defer
      :options="{
        scrollbars: {
          autoHide: 'move',
          autoHideDelay: 100,
        },
      }"
    >
      <SongStatus></SongStatus>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
import PlayList from "./common/PlayList.vue";
import SongStatus from "../common/SongStatus.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
</script>

<style scoped lang="scss">
$text-color: #000;
.home-box {
  display: flex;
  width: 100%;
  .home-content {
    padding: 30px 10% 110px 10%;
    border-radius: 15px 0 0 0;
    overflow: auto;
    flex: 1;
    .home-page-header {
      display: block;
      width: 100%;
      margin-bottom: 20px;
      padding-top: 4px;
    }
    .banner-box {
      img {
        border-radius: 8px;
        aspect-ratio: 1 / 0.44;
        object-fit: cover;
      }
    }
  }
}
</style>
