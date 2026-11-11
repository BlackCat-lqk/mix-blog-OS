<script setup lang="ts">
import { useRouter } from 'vue-router'
import Login from './IndexView.vue'

const router = useRouter()
const returnToDesktop = () => router.replace({ name: 'home' })
</script>

<template>
  <main class="login-page" aria-label="账号登录">
    <Login :visible="true" @close="returnToDesktop" />
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #282334;
}
</style>
