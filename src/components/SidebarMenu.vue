/* * @Description: 窗口侧边栏菜单组件 */
<script lang="ts" setup>
import { ref } from "vue";
defineProps<{ menuList: { name: string; icon: string }[] }>();
const emit = defineEmits(["clickMenu"]);
// 聚焦菜单项
const focusMenuIdx = ref(0);
const focusMenuItem = ref("");
// 菜单点击事件
const handleMenu = (menu: { name: string; icon: string }, index: number) => {
  focusMenuItem.value = menu.name;
  focusMenuIdx.value = index;
  emit("clickMenu", menu, index);
};
</script>

<template>
  <div class="menu-list">
    <div
      class="menu-item"
      v-for="(menu, idx) in menuList"
      :key="idx"
      :class="{ 'active-item': focusMenuIdx == idx }"
      @click="handleMenu(menu, idx)"
    >
      <img :src="menu.icon" alt="icon" />
      <span>{{ menu.name }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
$menu-item-hover-color: #eaeaea;
$menu-item-active-color: #0067c0;
.menu-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  .menu-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px;
    border-radius: 8px;
    &:hover {
      cursor: pointer;
      background-color: $menu-item-hover-color;
    }
  }
  .active-item {
    position: relative;
    background-color: $menu-item-hover-color;
    &::before {
      content: "";
      position: absolute;
      width: 3px;
      height: 50%;
      top: 0;
      left: 0;
      background-color: $menu-item-active-color;
      border-radius: 8px;
      transform: translateY(50%);
    }
  }
}
</style>
