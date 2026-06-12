<template>
  <div
    ref="triggerRef"
    class="tooltip-anchor"
    @mouseenter="onShow"
    @mouseleave="onHide"
    @focusin="onShow"
    @focusout="onHide"
  >
    <slot />
  </div>

  <Teleport to="body">
    <Transition :name="transitionName">
      <div
        v-if="isVisible"
        ref="tooltipRef"
        class="tooltip"
        :class="tooltipClasses"
        :style="tooltipStyle"
        role="tooltip"
        @mouseenter="onTooltipEnter"
        @mouseleave="onTooltipLeave"
      >
        <div class="tooltip__arrow" :style="arrowStyle" />
        <div class="tooltip__content">
          <slot name="content">{{ content }}</slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// ============================================================================
// 组件名称：ToolTip
// 描述：轻量级文字提示组件，支持多方向定位、亮/暗主题、hover/manual 触发模式。
//
// 特性：
// - hover / focus 触发，或通过 visible prop 手动控制
// - 6 个方向：top、top-left、top-right、bottom、bottom-left、bottom-right
// - light / dark 双主题，带毛玻璃背景
// - 自适应视口边界裁剪，不溢出屏幕
// - 滚动时自动隐藏（避免鼠标未移动但 tooltip 常驻的问题）
// - 鼠标移入 tooltip 本身可停留，便于复制内容
// - 支持 Reduced motion 无障碍偏好
//
// Props：
//   content     - 提示文本（简写，也可用 slot）
//   position    - 方向：top | top-left | top-right | bottom | bottom-left | bottom-right
//   theme       - 主题：light | dark
//   duration    - 进出场动画时长 (ms)
//   offset      - 与触发元素的间距 (px)
//   hideDelay   - 离开后延迟隐藏时间 (ms)
//   disabled    - 是否禁用
//   trigger     - 触发方式：hover | manual
//   visible     - manual 模式下控制显隐
//   customClass - 附加自定义类名
//
// 插槽：
//   default - 触发区域
//   content - 提示内容（富文本用）
//
// 基础用法：
//   <ToolTip content="用户名至少 6 位" position="top" theme="dark">
//     <input placeholder="请输入用户名" />
//   </ToolTip>
// ============================================================================

import { ref, computed, watch, onUnmounted, nextTick, type CSSProperties } from "vue";

// ---- types ----

type TooltipPosition =
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right";

type TooltipTheme = "light" | "dark";

type TooltipTrigger = "hover" | "manual";

// ---- props ----

const props = withDefaults(
  defineProps<{
    content?: string;
    position?: TooltipPosition;
    theme?: TooltipTheme;
    duration?: number;
    customClass?: string;
    visible?: boolean;
    trigger?: TooltipTrigger;
    offset?: number;
    disabled?: boolean;
    hideDelay?: number;
  }>(),
  {
    content: "",
    position: "top",
    theme: "dark",
    duration: 200,
    customClass: "",
    visible: undefined,
    trigger: "hover",
    offset: 8,
    disabled: false,
    hideDelay: 100,
  },
);

// ---- refs ----

const triggerRef = ref<HTMLElement>();
const tooltipRef = ref<HTMLElement>();

// ---- state ----

const isVisible = ref(false);
const tooltipPos = ref({ left: 0, top: 0 });
const arrowPos = ref({ left: "50%", top: "" });

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let isHoveringTooltip = false;

// ---- computed ----

const isTop = computed(() => props.position.startsWith("top"));

const transitionName = computed(() => (isTop.value ? "tooltip-top" : "tooltip-bottom"));

const tooltipClasses = computed(() => [
  `tooltip--${props.theme}`,
  `tooltip--${props.position}`,
  props.customClass,
]);

const tooltipStyle = computed<CSSProperties>(() => ({
  left: `${tooltipPos.value.left}px`,
  top: `${tooltipPos.value.top}px`,
  "--tooltip-duration": `${props.duration}ms`,
} as CSSProperties));

const arrowStyle = computed<CSSProperties>(() => ({
  left: arrowPos.value.left,
  top: arrowPos.value.top,
}));

// ---- methods ----

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function onScroll() {
  isVisible.value = false;
}

function onShow() {
  if (props.trigger === "manual") return;
  clearHideTimer();
  isVisible.value = true;
  showTooltip();
}

function onHide() {
  if (props.trigger === "manual") return;
  clearHideTimer();
  hideTimer = setTimeout(() => {
    if (!isHoveringTooltip) {
      isVisible.value = false;
    }
  }, props.hideDelay);
}

function onTooltipEnter() {
  if (props.trigger === "manual") return;
  isHoveringTooltip = true;
  clearHideTimer();
}

function onTooltipLeave() {
  if (props.trigger === "manual") return;
  isHoveringTooltip = false;
  onHide();
}

function calcPosition() {
  const triggerEl = triggerRef.value;
  const tooltipEl = tooltipRef.value;
  if (!triggerEl || !tooltipEl) return;

  const triggerRect = triggerEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const gap = props.offset;

  let left: number;
  let top: number;
  const triggerCX = triggerRect.left + triggerRect.width / 2;

  // Calculate position based on placement
  switch (props.position) {
    case "top":
      left = triggerCX - tooltipRect.width / 2;
      top = triggerRect.top - tooltipRect.height - gap;
      break;
    case "top-left":
      left = triggerRect.left;
      top = triggerRect.top - tooltipRect.height - gap;
      break;
    case "top-right":
      left = triggerRect.right - tooltipRect.width;
      top = triggerRect.top - tooltipRect.height - gap;
      break;
    case "bottom":
      left = triggerCX - tooltipRect.width / 2;
      top = triggerRect.bottom + gap;
      break;
    case "bottom-left":
      left = triggerRect.left;
      top = triggerRect.bottom + gap;
      break;
    case "bottom-right":
      left = triggerRect.right - tooltipRect.width;
      top = triggerRect.bottom + gap;
      break;
    default:
      left = triggerCX - tooltipRect.width / 2;
      top = triggerRect.top - tooltipRect.height - gap;
  }

  // Clamp within viewport
  const minX = 8;
  const maxX = viewW - tooltipRect.width - 8;
  const minY = 8;
  const maxY = viewH - tooltipRect.height - 8;

  left = Math.max(minX, Math.min(left, maxX));
  top = Math.max(minY, Math.min(top, maxY));

  tooltipPos.value = { left, top };

  // Arrow position — point toward trigger center, clamped within tooltip
  let arrowLeft = triggerCX - left;
  const arrowMinX = 12;
  const arrowMaxX = tooltipRect.width - 12;
  arrowLeft = Math.max(arrowMinX, Math.min(arrowLeft, arrowMaxX));

  arrowPos.value = isTop.value
    ? { left: `${arrowLeft}px`, top: "" }
    : { left: `${arrowLeft}px`, top: "" };
}

async function showTooltip() {
  await nextTick();
  calcPosition();
}

// ---- watchers ----

watch(
  () => props.visible,
  (v) => {
    if (props.trigger !== "manual") return;
    if (v) {
      isVisible.value = true;
      showTooltip();
    } else {
      isVisible.value = false;
    }
  },
);

watch(isVisible, (v) => {
  if (v) {
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", calcPosition);
  } else {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", calcPosition);
    isHoveringTooltip = false;
  }
});

// ---- cleanup ----

onUnmounted(() => {
  clearHideTimer();
  window.removeEventListener("scroll", onScroll, true);
  window.removeEventListener("resize", calcPosition);
});
</script>

<style scoped lang="scss">
// ---- tokens ----
$arrow-size: 8px;

// ---- light theme ----
$bg-light: rgba(255, 255, 255, 0.95);
$border-light: rgba(0, 0, 0, 0.08);
$text-light: #1a1a2e;
$shadow-light: 0 4px 24px rgba(0, 0, 0, 0.12);
$arrow-bg-light: rgba(255, 255, 255, 0.95);

// ---- dark theme ----
$bg-dark: rgba(20, 20, 40, 0.95);
$border-dark: rgba(255, 255, 255, 0.1);
$text-dark: #e8e8ed;
$shadow-dark: 0 4px 24px rgba(0, 0, 0, 0.4);
$arrow-bg-dark: rgba(20, 20, 40, 0.95);

// ---- shared ----
$radius: 8px;

// ==========================================
// Anchor
// ==========================================
.tooltip-anchor {
  display: inline-flex;
}

// ==========================================
// Tooltip base (teleported to body)
// ==========================================
.tooltip {
  position: fixed;
  z-index: 9999;
  max-width: 280px;
  padding: 8px 14px;
  border-radius: $radius;
  font-size: 13px;
  line-height: 1.5;
  pointer-events: auto;
  box-sizing: border-box;
  word-break: break-word;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  // ---- theme: light ----
  &--light {
    background: $bg-light;
    border: 1px solid $border-light;
    color: $text-light;
    box-shadow: $shadow-light;
  }

  // ---- theme: dark ----
  &--dark {
    background: $bg-dark;
    border: 1px solid $border-dark;
    color: $text-dark;
    box-shadow: $shadow-dark;
  }
}

// ==========================================
// Content
// ==========================================
.tooltip__content {
  position: relative;
  z-index: 1;
}

// ==========================================
// Arrow
// ==========================================
.tooltip__arrow {
  position: absolute;
  width: $arrow-size;
  height: $arrow-size;
  transform: rotate(45deg);
  z-index: 0;

  .tooltip--light & {
    background: $arrow-bg-light;
    border: 1px solid $border-light;
    border-top: none;
    border-left: none;
  }

  .tooltip--dark & {
    background: $arrow-bg-dark;
    border: 1px solid $border-dark;
    border-top: none;
    border-left: none;
  }

  // top positions → arrow at bottom
  .tooltip--top &,
  .tooltip--top-left &,
  .tooltip--top-right & {
    bottom: -4px;
  }

  // bottom positions → arrow at top
  .tooltip--bottom &,
  .tooltip--bottom-left &,
  .tooltip--bottom-right & {
    top: -4px;
  }
}

// ==========================================
// Transitions
// ==========================================

// Shared active state
.tooltip-top-enter-active,
.tooltip-top-leave-active,
.tooltip-bottom-enter-active,
.tooltip-bottom-leave-active {
  transition:
    opacity var(--tooltip-duration, 200ms) cubic-bezier(0.16, 1, 0.3, 1),
    transform var(--tooltip-duration, 200ms) cubic-bezier(0.16, 1, 0.3, 1);
}

// Top positions: enter from below
.tooltip-top-enter-from,
.tooltip-top-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

// Bottom positions: enter from above
.tooltip-bottom-enter-from,
.tooltip-bottom-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .tooltip-top-enter-active,
  .tooltip-top-leave-active,
  .tooltip-bottom-enter-active,
  .tooltip-bottom-leave-active {
    transition-duration: 0ms !important;
  }
}
</style>
