<template>
  <div
    style="z-index: 999"
    v-if="props.visible"
    class="message-dialog-overlay"
    :class="{ 'message-dialog-overlay--inline': props.inline }"
  >
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
  /** 内嵌模式：不做 fixed 定位，由父容器控制 */
  inline: {
    type: Boolean,
    default: false,
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
$close-hover: #fa5959;
.message-dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
  &--inline {
    position: static;
    background-color: transparent;
    backdrop-filter: none;
  }

  .message-dialog {
    background-color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    width: 100%;
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
  padding-left: 12px;
  border-bottom: 1px solid #e7e7e7;
  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #000;
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
    transition: all 0.3s;
    &:hover {
      background-color: $close-hover;
    }
  }
}

.dialog-body {
  padding: 24px;
  height: 100%;
}
</style>
