<template>
  <div class="message-info">
    <img v-show="props.type === 'error'" src="@/assets/iMusic/icons/error.svg" alt="error" />
    <img v-show="props.type === 'success'" src="@/assets/iMusic/icons/success.svg" alt="success" />
    <span>{{ props.message }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  type: string;
  message: string;
}>();
</script>

<style scoped lang="scss">
.message-info {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: rgba(3, 53, 1, 0.5);
  backdrop-filter: blur(15px);
  gap: 5px;
  padding: 10px 20px;
  border-radius: 15px;
  animation: fadeIn 0.5s ease-in-out;
  z-index: var(--z-page-toast);
  img {
    width: 26px;
    height: 26px;
  }
  span {
    color: #fff;
  }
}
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
