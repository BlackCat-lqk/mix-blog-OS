<!--
  ToastMessage — 消息通知组件（配合 message.ts 命令式调用）
  动画：GSAP 驱动，丝滑的入场/退场
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import gsap from "gsap";

// ---- 项目图标 ----
import iconSuccess from "@/assets/icons/success.svg";
import iconError   from "@/assets/icons/error.svg";
import iconWarning from "@/assets/icons/waring.svg";

// ============================================================================
// Types
// ============================================================================

export type ToastType = "success" | "error" | "warning";

export type ToastPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

// ============================================================================
// Props
// ============================================================================

const props = withDefaults(
  defineProps<{
    type: ToastType;
    message: string;
    position: ToastPosition;
    duration: number;
  }>(),
  {
    type: "success",
    message: "",
    position: "top",
    duration: 3000,
  },
);

const emit = defineEmits<{ destroy: [] }>();

// ============================================================================
// State
// ============================================================================

const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;
let remainingTime = 0;
let pauseTime = 0;

// ============================================================================
// 动画起始位移方向
// ============================================================================

const animOffset = computed<{ x: number; y: number }>(() => {
  const DIST = 24;
  switch (props.position) {
    case "top":          return { x: 0,  y: -DIST };
    case "bottom":       return { x: 0,  y:  DIST };
    case "left":         return { x: -DIST, y: 0 };
    case "right":        return { x:  DIST, y: 0 };
    case "top-left":     return { x: -DIST, y: -DIST };
    case "top-right":    return { x:  DIST, y: -DIST };
    case "bottom-left":  return { x: -DIST, y:  DIST };
    case "bottom-right": return { x:  DIST, y:  DIST };
    default:             return { x: 0,  y: -DIST };
  }
});

// ============================================================================
// Icons
// ============================================================================

const iconSrc = computed(() => {
  switch (props.type) {
    case "success": return iconSuccess;
    case "error":   return iconError;
    case "warning": return iconWarning;
    default:        return iconSuccess;
  }
});

// ============================================================================
// Timer
// ============================================================================

function startTimer() {
  if (props.duration <= 0) return;
  clearTimer();
  remainingTime = props.duration;
  timer = setTimeout(() => close(), remainingTime);
}

function clearTimer() {
  if (timer !== null) { clearTimeout(timer); timer = null; }
}

function onMouseEnter() {
  if (props.duration <= 0) return;
  pauseTime = Date.now();
  clearTimer();
}

function onMouseLeave() {
  if (props.duration <= 0) return;
  remainingTime = Math.max(0, remainingTime - (Date.now() - pauseTime));
  if (remainingTime > 0) {
    timer = setTimeout(() => close(), remainingTime);
  } else {
    close();
  }
}

// ============================================================================
// Close & destroy
// ============================================================================

function close() {
  clearTimer();
  visible.value = false;
}

function onAfterLeave() {
  emit("destroy");
}

// ============================================================================
// GSAP 动画钩子（配合 Transition）
// ============================================================================

function onEnter(el: Element, done: () => void) {
  const { x, y } = animOffset.value;
  gsap.fromTo(el,
    { opacity: 0, scale: 0.88, x, y },
    { opacity: 1, scale: 1,   x: 0, y: 0,
      duration: 0.45,
      ease: "power3.out",
      onComplete: done,
    },
  );
}

function onLeave(el: Element, done: () => void) {
  const { x, y } = animOffset.value;
  // 退场方向取反向偏移的 40%，更快更轻
  gsap.to(el, {
    opacity: 0,
    scale: 0.94,
    x: x * -0.4,
    y: y * -0.4,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done,
  });
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  requestAnimationFrame(() => {
    visible.value = true;
    startTimer();
  });
});

onUnmounted(() => clearTimer());
</script>

<template>
  <Transition
    :css="false"
    @enter="onEnter"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <div
      v-if="visible"
      class="toast"
      :class="`toast--${type}`"
      role="alert"
      aria-live="assertive"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <img class="toast__icon" :src="iconSrc" alt="" aria-hidden="true" />
      <p class="toast__text">{{ message }}</p>
      <button
        class="toast__close"
        type="button"
        aria-label="关闭通知"
        @click="close"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
// ============================================================================
// 按类型配色
// ============================================================================

$text:    #1e293b;
$muted:   #94a3b8;
$radius:  12px;

// ============================================================================
// Toast card
// ============================================================================

.toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: 380px;
  min-width: 240px;
  padding: 14px 16px;
  border-radius: $radius;
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 12px 40px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  word-break: break-word;

  // ---- 类型色底 ----
  &--success {
    background: rgba(240, 253, 244, 0.88);
    .toast__text { color: #065f46; }
  }
  &--error {
    background: rgba(254, 242, 242, 0.88);
    .toast__text { color: #991b1b; }
  }
  &--warning {
    background: rgba(255, 251, 235, 0.88);
    .toast__text { color: #92400e; }
  }
}

// ---- 图标 ----
.toast__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
}

// ---- 文本 ----
.toast__text {
  flex: 1;
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: $text;
  min-width: 0;
}

// ---- 关闭按钮 ----
.toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: $muted;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;

  svg { width: 14px; height: 14px; }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: $text;
  }

  &:focus-visible {
    opacity: 1;
    outline: 2px solid #3b82f6;
    outline-offset: 1px;
  }
}

.toast:hover .toast__close,
.toast:focus-within .toast__close {
  opacity: 1;
}
</style>

<!-- ================================================ -->
<!-- 全局容器（非 scoped — message.ts 动态创建） -->
<!-- ================================================ -->
<style lang="scss">
.toast-container {
  position: fixed;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-height: 100vh;
  overflow: visible;

  > .toast-item-wrapper { pointer-events: auto; }

  &--top          { top: 24px; left: 50%; transform: translateX(-50%); align-items: center; }
  &--bottom       { bottom: 24px; left: 50%; transform: translateX(-50%); align-items: center; }
  &--top-left     { top: 24px; left: 24px; align-items: flex-start; }
  &--top-right    { top: 24px; right: 24px; align-items: flex-end; }
  &--bottom-left  { bottom: 24px; left: 24px; align-items: flex-start; }
  &--bottom-right { bottom: 24px; right: 24px; align-items: flex-end; }
  &--left         { top: 50%; left: 24px; transform: translateY(-50%); align-items: flex-start; }
  &--right        { top: 50%; right: 24px; transform: translateY(-50%); align-items: flex-end; }
}
</style>
