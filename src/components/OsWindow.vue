/* * os-window * @description: 窗口组件 */
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import minimize from "@/assets/icons/minimize.svg";
import close from "@/assets/icons/close.svg";
import maximize from "@/assets/icons/maximize.svg";
import maximizeDefalut from "@/assets/icons/maximize-defalut.svg";

defineProps<{ title?: string; icon?: string }>();

const emit = defineEmits<{ close: []; minimize: [] }>();

const isMinimized = defineModel<boolean>("minimized", { default: false });

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const MIN_VISIBLE = 150;

// ---- window state ----
const isMaximized = ref(false);

// ---- position & size ----
const left = ref(100);
const top = ref(100);
const width = ref(1056);
const height = ref(702);
const savedRect = ref({ left: 100, top: 100, width: 1056, height: 702 });

// ---- drag state ----
const dragging = ref(false);
const pendingRestore = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const winStartLeft = ref(0);
const winStartTop = ref(0);

const RESTORE_THRESHOLD = 10; // 向下拖拽超过此距离才退出最大化

// ---- resize state ----
const resizing = ref(false);
const resizeDir = ref("");
const rs = ref({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });

// ---- clamp helpers ----
const clampLeft = (value: number) => {
  const minLeft = -width.value + MIN_VISIBLE;
  const maxLeft = window.innerWidth - MIN_VISIBLE;
  return Math.max(minLeft, Math.min(maxLeft, value));
};

const clampTop = (value: number) => Math.max(0, value);

// ---- computed ----
const windowStyle = computed(() => {
  if (isMaximized.value) return {};
  return {
    left: `${left.value}px`,
    top: `${top.value}px`,
    width: `${width.value}px`,
    height: `${height.value}px`,
  };
});

const windowClass = computed(() => ({
  "os-window": true,
  "os-window--minimized": isMinimized.value,
  "os-window--maximized": isMaximized.value,
  "os-window--dragging": dragging.value,
  "os-window--resizing": resizing.value,
}));

// ---- minimize / maximize / close ----
const toggleMinimize = () => {
  // isMinimized.value = !isMinimized.value;
  // if (isMinimized.value) isMaximized.value = false;
  emit("minimize");
};

const toggleMaximize = () => {
  if (isMaximized.value) {
    const s = savedRect.value;
    left.value = s.left;
    top.value = s.top;
    width.value = s.width;
    height.value = s.height;
  } else {
    savedRect.value = {
      left: left.value,
      top: top.value,
      width: width.value,
      height: height.value,
    };
  }
  isMaximized.value = !isMaximized.value;
  isMinimized.value = false;
};

const onClose = () => {
  emit("close");
};

// ---- drag ----
const onTitlebarMouseDown = (e: MouseEvent) => {
  if (isMaximized.value) {
    pendingRestore.value = true;
    dragStartX.value = e.clientX;
    dragStartY.value = e.clientY;
    e.preventDefault();
    return;
  }

  dragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  winStartLeft.value = left.value;
  winStartTop.value = top.value;
  e.preventDefault();
};

// ---- resize (use data-resize attribute instead of inline arrow fns) ----
const onResizeMouseDown = (e: MouseEvent) => {
  const dir = (e.currentTarget as HTMLElement).dataset.resize;
  if (!dir || isMaximized.value) return;
  resizing.value = true;
  resizeDir.value = dir;
  rs.value = {
    x: e.clientX,
    y: e.clientY,
    left: left.value,
    top: top.value,
    width: width.value,
    height: height.value,
  };
  e.preventDefault();
  e.stopPropagation();
};

// ---- shared mouse handlers (bound to document) ----
const onMouseMove = (e: MouseEvent) => {
  if (pendingRestore.value) {
    const dy = e.clientY - dragStartY.value;
    if (dy <= RESTORE_THRESHOLD) return;

    const s = savedRect.value;
    const ratioX = dragStartX.value / window.innerWidth;

    width.value = s.width;
    height.value = s.height;
    left.value = clampLeft(dragStartX.value - s.width * ratioX);
    top.value = clampTop(dragStartY.value - 8);

    isMaximized.value = false;
    isMinimized.value = false;
    pendingRestore.value = false;
    dragging.value = true;
    winStartLeft.value = left.value;
    winStartTop.value = top.value;
    return;
  }

  if (dragging.value) {
    lastMouseY = e.clientY;
    left.value = clampLeft(winStartLeft.value + (e.clientX - dragStartX.value));
    top.value = clampTop(winStartTop.value + (e.clientY - dragStartY.value));
    return;
  }

  if (resizing.value) {
    const dx = e.clientX - rs.value.x;
    const dy = e.clientY - rs.value.y;
    const dir = resizeDir.value;

    let nl = rs.value.left;
    let nt = rs.value.top;
    let nw = rs.value.width;
    let nh = rs.value.height;

    if (dir.includes("e")) nw = rs.value.width + dx;
    if (dir.includes("s")) nh = rs.value.height + dy;
    if (dir.includes("w")) {
      nl = rs.value.left + dx;
      nw = rs.value.width - dx;
    }
    if (dir.includes("n")) {
      nt = rs.value.top + dy;
      nh = rs.value.height - dy;
    }

    // enforce minimum size
    if (dir.includes("w") && nw < MIN_WIDTH) {
      nl = rs.value.left + rs.value.width - MIN_WIDTH;
      nw = MIN_WIDTH;
    }
    if (!dir.includes("w") && nw < MIN_WIDTH) nw = MIN_WIDTH;
    if (dir.includes("n") && nh < MIN_HEIGHT) {
      nt = rs.value.top + rs.value.height - MIN_HEIGHT;
      nh = MIN_HEIGHT;
    }
    if (!dir.includes("n") && nh < MIN_HEIGHT) nh = MIN_HEIGHT;

    // enforce boundary: keep titlebar visible
    if (nt < 0) {
      if (dir.includes("n")) nh += nt;
      nt = 0;
    }
    if (nl < 0) {
      if (dir.includes("w")) nw += nl;
      nl = 0;
    }

    if (nh < MIN_HEIGHT) nh = MIN_HEIGHT;
    if (nw < MIN_WIDTH) nw = MIN_WIDTH;

    left.value = nl;
    top.value = nt;
    width.value = nw;
    height.value = nh;
  }
};

const TITLEBAR_VISIBLE = 40; // 拖到底部时保留标题栏可见高度

let lastMouseY = 0;

const onMouseUp = () => {
  if (pendingRestore.value) {
    pendingRestore.value = false;
    return;
  }

  if (dragging.value) {
    // 鼠标拖出屏幕顶部 → 自动最大化
    if (lastMouseY <= 0 && !isMaximized.value) {
      savedRect.value = {
        left: winStartLeft.value,
        top: winStartTop.value,
        width: width.value,
        height: height.value,
      };
      isMaximized.value = true;
      isMinimized.value = false;
    }
    // 拖到底部 → 弹回，保证标题栏始终可见
    const maxTop = window.innerHeight - TITLEBAR_VISIBLE;
    if (top.value > maxTop) {
      top.value = Math.max(0, maxTop);
    }
  }
  dragging.value = false;
  resizing.value = false;
};

onMounted(() => {
  left.value = Math.max(0, (window.innerWidth - width.value) / 2);
  top.value = Math.max(0, (window.innerHeight - height.value) / 2);
  savedRect.value = { left: left.value, top: top.value, width: width.value, height: height.value };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <div :class="windowClass" :style="windowStyle">
    <!-- resize handles -->
    <div class="os-resize os-resize--n" data-resize="n" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--s" data-resize="s" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--e" data-resize="e" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--w" data-resize="w" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--ne" data-resize="ne" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--nw" data-resize="nw" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--se" data-resize="se" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--sw" data-resize="sw" @mousedown="onResizeMouseDown"></div>

    <!-- titlebar -->
    <div class="os-window__titlebar" @mousedown="onTitlebarMouseDown">
      <div class="os-window__titlebar__lf">
        <div class="os-window__icon">
          <img :src="icon" alt="icon" />
        </div>
        <span class="os-window__title">{{ title }}</span>
      </div>

      <div class="os-window__controls">
        <button
          class="os-window__btn os-window__btn--minimize"
          @click="toggleMinimize"
          title="最小化"
        >
          <img :src="minimize" alt="minimize" />
        </button>
        <button
          class="os-window__btn os-window__btn--maximize"
          @click="toggleMaximize"
          :title="isMaximized ? '还原' : '最大化'"
        >
          <img :src="isMaximized ? maximizeDefalut : maximize" alt="close" />
        </button>
        <button class="os-window__btn os-window__btn--close" @click="onClose" title="关闭">
          <img :src="close" alt="close" />
        </button>
      </div>
    </div>

    <!-- body -->
    <div class="os-window__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
// ---- variables ----
$titlebar-h: 36px;
$primary: #e3e3e3;
$close-hover: #fa5959;
$text-color: #000;

.os-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  border: 1px solid $primary;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(30px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  overflow: hidden;

  &--dragging,
  &--resizing {
    transition: none;
    user-select: none;
  }

  // 最小化：整个窗口隐藏，仅任务栏保留入口
  &--minimized {
    display: none;
  }

  // 最大化：全屏铺满
  &--maximized {
    inset: 0;
    z-index: 100;
    border-radius: 0;
    border: none;

    .os-resize {
      display: none;
    }
  }
}

// ---- titlebar ----
.os-window__titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: $titlebar-h;
  background: $primary;
  color: $text-color;
  user-select: none;
  flex-shrink: 0;
  cursor: default;
}
.os-window__titlebar__lf {
  display: flex;
  align-items: center;
  gap: 8px;
}
.os-window__icon {
  width: 24px;
  min-width: 24px;
  img {
    width: 100%;
    height: 100%;
  }
}
.os-window__title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.os-window__controls {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.os-window__btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: $text-color;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.55);
  }

  &--close:hover {
    background: $close-hover;
  }
}

// ---- body ----
.os-window__body {
  flex: 1;
  padding: 8px 20px;
  overflow: auto;
}

// ---- resize handles ----
.os-resize {
  position: absolute;
  z-index: 10;

  &--n {
    top: -3px;
    left: 8px;
    right: 8px;
    height: 6px;
    cursor: n-resize;
  }

  &--s {
    bottom: -3px;
    left: 8px;
    right: 8px;
    height: 6px;
    cursor: s-resize;
  }

  &--e {
    right: -3px;
    top: 8px;
    bottom: 8px;
    width: 6px;
    cursor: e-resize;
  }

  &--w {
    left: -3px;
    top: 8px;
    bottom: 8px;
    width: 6px;
    cursor: w-resize;
  }

  &--ne {
    top: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: ne-resize;
  }

  &--nw {
    top: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: nw-resize;
  }

  &--se {
    bottom: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: se-resize;
  }

  &--sw {
    bottom: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: sw-resize;
  }
}
</style>
