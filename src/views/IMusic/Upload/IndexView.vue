<template>
  <div class="upload-page">
    <div class="upload-page-content">
      <template v-if="userStore.data.token">
        <header class="upload-page-header">
          <h1 class="upload-title">上传音乐</h1>
          <p class="upload-subtitle">
            填写歌曲信息并选择音频、封面与歌词文件，单个文件建议不超过服务端限制。
          </p>
        </header>
        <UploadForm inline />
      </template>
      <template v-else>
        <p class="hint">请先登录后再上传音乐</p>
      </template>
    </div>
    <UserLogin v-model:visible="visibleLogin" title="Login" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import UploadForm from '@/views/common/UploadForm.vue'
import UserLogin from '@/views/common/UserLogin.vue'
import { useUserInfoStore } from '@/stores/userInfo'

const visibleLogin = ref(false)
const userStore = useUserInfoStore()

onMounted(() => {
  if (!userStore.data.token) {
    visibleLogin.value = true
  }
})

watch(
  () => userStore.data.token,
  (token) => {
    if (token) {
      visibleLogin.value = false
    }
  },
)
</script>

<style scoped lang="scss">
.upload-page {
  width: 100%;
  min-height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.upload-page-content {
  margin-top: 72px;
  width: calc(100% - 40px);
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
}
.hint {
  color: #b0b0b0;
  text-align: center;
  line-height: 1.5;
  font-size: 14px;
}
.upload-page-header {
  display: block;
  margin-bottom: 20px;
  padding-bottom: 4px;
}
.upload-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 650;
  color: #f5f5f5;
  letter-spacing: 0.02em;
}
.upload-subtitle {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #9ca3af;
  max-width: 52rem;
}
.upload-page {
  align-items: stretch;
}
.upload-page-content {
  margin-top: 72px;
  width: 100%;
  max-width: min(920px, calc(100% - 48px));
  margin-left: auto;
  margin-right: auto;
  padding: 20px 24px 48px;
}
</style>
