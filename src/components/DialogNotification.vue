<!-- * @description: 弹窗通知组件 — 模态对话框，支持标题、内容插槽、关闭回调 -->
<template>
  <div class="container-dialog" :class="{ 'container-dialog--inline': props.inline }">
    <div v-if="props.visible" class="container-dialog-overlay">
      <div class="container-dialog-item">
        <div :style="{ width: props.width, height: props.height, position: 'absolute' }">
          <slot name="header">
            <div v-if="!props.showHeader" class="dialog-header">
              <h3>{{ props.title }}</h3>
              <button v-if="!props.closeBtn" class="close-btn" @click.stop="handleClose">
                <img src="@/assets/icons/close.svg" />
              </button>
            </div>
          </slot>
          <div class="dialog-body">
            <slot name="content"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  // 显隐
  visible: {
    type: Boolean,
    default: false,
  },
  // 是否显示关闭
  closeBtn: {
    type: Boolean,
    default: false,
  },
  // 是否不显示头部
  showHeader: {
    type: Boolean,
    default: false,
  },
  // 标题
  title: {
    type: String,
    default: "",
  },
  // 弹窗宽
  width: {
    type: String,
    default: "50%",
  },
  // 弹窗高
  height: {
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
$borderRadius: 10px;
.container-dialog {
  width: 100%;
  height: 100%;
}
.container-dialog-overlay {
  max-width: 100%;
  max-height: 100%;
  height: 100%;
  .container-dialog-item {
    position: relative;
    background-color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    width: 100%;
    height: 100%;
    & > div {
      height: calc(100% - 32px);
      border-radius: $borderRadius;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: auto;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 12px;
    height: 32px;
    h3 {
      font-size: 14px;
      font-weight: 500;
      color: #000;
    }
    .close-btn {
      border-radius: 0 10px 0 0;
      background: none;
      border: none;
      font-size: 24px;
      color: #dcdcdc;
      cursor: pointer;
      padding: 0;
      margin: 0;
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
    padding: 12px;
    border-radius: 10px;
    height: calc(100% - 32px);
    overflow-y: auto;
  }
}
</style>
