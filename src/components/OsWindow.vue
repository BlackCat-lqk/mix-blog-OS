/* * os-window * @description: 窗口组件 */

<!-- ====== 模块级状态：所有 OsWindow 实例共享 ====== -->
<script lang="ts">
let cascadeIndex = 0;
const CASCADE_OFFSET = 30;
const CASCADE_MAX = 10; // 超过 10 个窗口后回到初始位置

export function getCascadeOffset(): number {
  const offset = (cascadeIndex % CASCADE_MAX) * CASCADE_OFFSET;
  cascadeIndex++;
  return offset;
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide, reactive, nextTick } from "vue";
import type { VNode, Component } from "vue";
import DialogNotification from "@/components/DialogNotification.vue";
import minimize from "@/assets/icons/minimize.svg";
import close from "@/assets/icons/close.svg";
import maximize from "@/assets/icons/maximize.svg";
import maximizeDefalut from "@/assets/icons/maximize-defalut.svg";

const props = defineProps<{
  title?: string;
  icon?: string;
  /** 任务栏图标屏幕坐标，用于最小化时窗口飞向图标 */
  minimizeTarget?: { x: number; y: number };
}>();

const emit = defineEmits<{ close: []; minimize: [] }>();

const isMinimized = defineModel<boolean>("minimized", { default: false });

// 首次打开入场动画
const isEntering = ref(true);

// ---- overlay 弹窗系统 ----
// 子组件通过 inject 获取此对象，设置 visible/title/content 来在窗口内显示弹窗
const osOverlay = reactive<{
  visible: boolean;
  title: string;
  content: (() => VNode) | Component | null;
  /** 点击遮罩层是否关闭弹窗，默认 true */
  closeOnMask: boolean;
}>({
  visible: false,
  title: "",
  content: null,
  closeOnMask: true,
});

const onOverlayMaskClick = () => {
  if (osOverlay.closeOnMask) {
    osOverlay.visible = false;
  }
};
provide("osOverlay", osOverlay);

const MIN_WIDTH = 350;
const MIN_HEIGHT = 320;
const MIN_VISIBLE = 150;

// ---- window state ----
const isMaximized = ref(false);

// ---- position & size ----
const left = ref(100);
const top = ref(100);
const width = ref(960);
const height = ref(540);
const savedRect = ref({ left: 100, top: 100, width: 960, height: 540 });

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
const rs = ref({
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  n: false,
  s: false,
  e: false,
  w: false,
});

// ---- clamp helpers ----
const clampLeft = (value: number) => {
  const minLeft = -width.value + MIN_VISIBLE;
  const maxLeft = window.innerWidth - MIN_VISIBLE;
  return Math.max(minLeft, Math.min(maxLeft, value));
};

const clampTop = (value: number) => Math.max(0, value);

// ---- computed ----
const windowStyle = computed(() => {
  if (isMaximized.value) {
    return {
      left: "0",
      top: "0",
      width: "100vw",
      height: "100vh",
    };
  }
  return {
    left: `${left.value}px`,
    top: `${top.value}px`,
    width: `${width.value}px`,
    height: `${height.value}px`,
  };
});

const windowClass = computed(() => ({
  "os-window": true,
  "os-window--enter": isEntering.value && !isMinimized.value,
  "os-window--minimized": isMinimized.value,
  "os-window--maximized": isMaximized.value,
  "os-window--dragging": dragging.value,
  "os-window--resizing": resizing.value,
}));

// 最小化动画方向：通过 CSS 变量精确指向任务栏对应图标
const minimizeVars = computed(() => {
  if (!isMinimized.value || !props.minimizeTarget) return {};

  const winCenterX = left.value + width.value / 2;
  const winCenterY = top.value + height.value / 2;
  const dx = Math.round(props.minimizeTarget.x - winCenterX);
  const dy = Math.round(props.minimizeTarget.y - winCenterY);

  return {
    "--min-dx": `${dx}px`,
    "--min-dy": `${dy}px`,
  };
});

// ---- minimize / maximize / close ----
const toggleMinimize = () => {
  emit("minimize");
};

const toggleMaximize = () => {
  if (isMaximized.value) {
    const s = savedRect.value;
    left.value = s.left;
    top.value = s.top;
    width.value = s.width;
    height.value = s.height;
    isMaximized.value = false;
  } else {
    savedRect.value = {
      left: left.value,
      top: top.value,
      width: width.value,
      height: height.value,
    };
    isMaximized.value = true;
  }
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
  rs.value = {
    x: e.clientX,
    y: e.clientY,
    left: left.value,
    top: top.value,
    width: width.value,
    height: height.value,
    n: dir.includes("n"),
    s: dir.includes("s"),
    e: dir.includes("e"),
    w: dir.includes("w"),
  };
  e.preventDefault();
  e.stopPropagation();
};

// ---- shared mouse handlers (bound to document) ----
let rafId = 0;
let pendingEvent: MouseEvent | null = null;

let hasMoved = false;

const onMouseMove = (e: MouseEvent) => {
  pendingEvent = e;
  if (dragging.value) {
    lastMouseY = e.clientY;
    hasMoved = true;
  }
  if (!rafId) {
    rafId = requestAnimationFrame(processMouseMove);
  }
};

const processMouseMove = () => {
  rafId = 0;
  const e = pendingEvent;
  if (!e) return;
  pendingEvent = null;

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
    left.value = clampLeft(winStartLeft.value + (e.clientX - dragStartX.value));
    top.value = clampTop(winStartTop.value + (e.clientY - dragStartY.value));
    return;
  }

  if (resizing.value) {
    const dx = e.clientX - rs.value.x;
    const dy = e.clientY - rs.value.y;
    const { n, s, e: isE, w } = rs.value;

    let nl = rs.value.left;
    let nt = rs.value.top;
    let nw = rs.value.width;
    let nh = rs.value.height;

    if (isE) nw = rs.value.width + dx;
    if (s) nh = rs.value.height + dy;
    if (w) {
      nl = rs.value.left + dx;
      nw = rs.value.width - dx;
    }
    if (n) {
      nt = rs.value.top + dy;
      nh = rs.value.height - dy;
    }

    // enforce minimum size
    if (w && nw < MIN_WIDTH) {
      nl = rs.value.left + rs.value.width - MIN_WIDTH;
      nw = MIN_WIDTH;
    }
    if (!w && nw < MIN_WIDTH) nw = MIN_WIDTH;
    if (n && nh < MIN_HEIGHT) {
      nt = rs.value.top + rs.value.height - MIN_HEIGHT;
      nh = MIN_HEIGHT;
    }
    if (!n && nh < MIN_HEIGHT) nh = MIN_HEIGHT;

    // enforce boundary: keep titlebar visible
    if (nt < 0) {
      if (n) nh += nt;
      nt = 0;
    }
    if (nl < 0) {
      if (w) nw += nl;
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
    // 鼠标拖出屏幕顶部 → 自动最大化（仅在窗口确实被拖拽移动过时触发）
    if (hasMoved && lastMouseY <= 0 && !isMaximized.value) {
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
  hasMoved = false;
};

onMounted(() => {
  // 级联偏移：每个新窗口相对上一个向右下错开，避免完全重叠
  const offset = getCascadeOffset();
  left.value = clampLeft(Math.max(0, (window.innerWidth - width.value) / 2) + offset);
  top.value = clampTop(Math.max(0, (window.innerHeight - height.value) / 2) + offset);
  savedRect.value = { left: left.value, top: top.value, width: width.value, height: height.value };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  // 首次打开：先以入场状态渲染（opacity:0 + scale），下一帧移除 class 触发过渡
  nextTick(() => {
    requestAnimationFrame(() => {
      isEntering.value = false;
    });
  });
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  dragging.value = false;
  resizing.value = false;
  pendingRestore.value = false;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <div :class="windowClass" :style="[windowStyle, minimizeVars]">
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
    <div
      class="os-window__titlebar"
      @mousedown="onTitlebarMouseDown"
      @dblclick.stop="toggleMaximize"
    >
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
          class="os-window__btn"
          @click.stop="toggleMaximize"
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

    <!-- overlay 弹窗：OsWindow 自己渲染，不用 Teleport，遮罩不盖 titlebar -->
    <div v-if="osOverlay.visible" class="os-window__overlay" @click.self="onOverlayMaskClick">
      <DialogNotification
        :visible="true"
        :title="osOverlay.title"
        inline
        @update:visible="osOverlay.visible = false"
      >
        <template #content>
          <component :is="osOverlay.content" v-if="osOverlay.content" />
        </template>
      </DialogNotification>
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
  border: 1px solid #a0a4a8;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(30px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  transition:
    left 0.15s ease-in,
    top 0.15s ease-in,
    width 0.15s ease-in,
    height 0.15s ease-in,
    border-radius 0.15s ease-in,
    border-color 0.15s ease-in,
    opacity 0.2s ease-in,
    transform 0.2s ease-in;

  // 首次打开入场：从缩小+透明过渡到正常
  &--enter {
    opacity: 0;
    transform: scale(0.85);
  }

  &--dragging,
  &--resizing {
    transition: none;
    user-select: none;
  }

  // 最小化：向任务栏图标方向收缩 + 淡出
  // --min-dx / --min-dy 由 JS 根据图标位置动态注入，未注入时退化为正下方
  &--minimized {
    opacity: 0;
    transform: translate(var(--min-dx, 0px), var(--min-dy, 120px)) scale(0.35);
    transform-origin: bottom center;
    pointer-events: none;
  }

  // 最大化：全屏铺满
  &--maximized {
    border-radius: 0;
    border-color: transparent;

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
  padding-left: 10px;
  height: $titlebar-h;
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
  height: 100%;
  align-items: flex-start;
}

.os-window__btn {
  width: 42px;
  height: 36px;
  border: none;
  background: transparent;
  color: $text-color;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.15s;
  img {
    width: 14px;
    height: 14px;
  }
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
  // padding: 10px 2px 10px 10px;
  overflow: hidden;
}

// ---- overlay（弹窗区域，从 titlebar 下方开始，不盖标题栏）----
.os-window__overlay {
  position: absolute;
  top: $titlebar-h;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
}

// ---- resize handles ----
.os-resize {
  position: absolute;
  z-index: 110;

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
