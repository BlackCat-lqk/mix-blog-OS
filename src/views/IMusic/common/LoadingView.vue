<template>
  <div>
    <div class="loading-container">
      <div class="loading-content">
        <img src="@/assets/icon/loading.svg" alt="loading" />
        <div class="loading-text">Loading...</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="scss" scoped>
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--z-loading);
}

.loading-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 10px 0;
  gap: 5px;
  img {
    width: 24px;
    height: 24px;
    animation: loading 1s linear infinite;
  }
  .loading-text {
    color: #fff;
    font-size: 12px;
    font-weight: 400;
  }
}
@keyframes loading {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
