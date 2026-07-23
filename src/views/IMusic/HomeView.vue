<template>
  <div class="main-home">
    <div class="main-home--header">
      <HeaderView></HeaderView>
    </div>
  </div>
</template>
<script setup lang="ts">
import HeaderView from "./components/HeaderView.vue";
</script>
<style scoped lang="scss">
.main-home {
  display: flex;
  flex-direction: column;
  justify-content: center;
  &--header {
  }
}
</style>
