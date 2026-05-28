<script lang="ts" setup>
import { ref } from "vue";
import SideMenu from "@/components/SidebarMenu.vue";
import personalizationIcon from "@/assets/setting/icons/personalization.svg";
import accountIcon from "@/assets/setting/icons/account.svg";
import PersonalizationView from "./components/PersonalizationView.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
const menuList = [
  {
    name: "个性化",
    icon: personalizationIcon,
  },
];
const focusMenuIdx = ref(0);
const focusMenuItem = ref("");
// 菜单点击事件回调
const clickMenu = (item: { name: string; icon: string }, index: number) => {
  focusMenuIdx.value = index;
  focusMenuItem.value = item.name;
};
</script>

<template>
  <div class="index__view">
    <div class="index__view--menu">
      <div class="index__view--account">
        <img :src="accountIcon" alt="logo" />
        <span>K</span>
      </div>
      <SideMenu :menuList="menuList" @clickMenu="clickMenu"></SideMenu>
    </div>
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
      <div class="index__view--content">
        <PersonalizationView v-show="focusMenuIdx == 0"></PersonalizationView>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<style scoped lang="scss">
.index__view {
  display: flex;
  height: 100%;
  gap: 20px;
  &--menu {
    width: 200px;
    min-width: 200px;
    height: 100%;
  }
  &--account {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
    img {
      width: 56px;
      height: 56px;
      padding: 5px;
      border-radius: 50%;
      border: 1px solid #ddd;
      background: #fff;
    }
  }
  &--content {
    flex: 1;
    display: flex;
    justify-content: center;
    overflow: auto;
    padding: 0 10px;
  }
}
</style>
