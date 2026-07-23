<template>
  <div class="upload-page">
    <div class="upload-page-content">
      <UploadForm inline />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import UploadForm from "./UploadForm.vue";
import { useUserInfoStore } from "@/stores/userInfo";

const visibleLogin = ref(false);
const userStore = useUserInfoStore();

onMounted(() => {
  if (!userStore.data.token) {
    visibleLogin.value = true;
  }
});

watch(
  () => userStore.data.token,
  (token) => {
    if (token) {
      visibleLogin.value = false;
    }
  },
);
</script>

<style scoped lang="scss">
.upload-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.upload-page-content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  box-sizing: border-box;
}
</style>
