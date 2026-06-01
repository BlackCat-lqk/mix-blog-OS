<template>
  <Teleport to=".app-main">
    <div v-if="props.visible" class="message-dialog-overlay">
      <div class="message-dialog">
        <div class="dialog-header">
          <h3>{{ props.title }}</h3>
          <button class="close-btn" @click="handleClose">
            <img src="@/assets/icons/close.svg" />
          </button>
        </div>
        <div class="dialog-body">
          <slot name="content"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
});
const emit = defineEmits(["update:visible", "closeDialog"]);
// 关闭弹窗
const handleClose = () => {
  emit("update:visible", false);
  emit("closeDialog");
};
</script>

<style lang="scss" scoped>
.message-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: 20px;
  height: 100vh;
  max-height: 100vh;
  animation: fadeIn 0.3s ease;

  .message-dialog {
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideUp 0.3s ease;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #242424;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #dcdcdc;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;

    &:hover {
      background-color: #ffffff;
      color: #666;
    }
  }
}

.dialog-body {
  padding: 24px;
  height: 100%;
}
</style>
