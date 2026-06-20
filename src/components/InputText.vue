<!-- * @description: 输入文本公共组件 — 字数统计、自适应高度、发送回调 -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, useId } from "vue";

const uid = useId();

const props = withDefaults(
  defineProps<{
    /** v-model 绑定的文本值 */
    modelValue?: string;
    /** 输入框上方可见标签（无障碍要求：不要仅依赖 placeholder） */
    label?: string;
    /** 提示语 */
    placeholder?: string;
    /** 最大字符数，用于字数统计（不截断，仅展示） */
    maxlength?: number;
    /** 发送按钮是否禁用 */
    disabled?: boolean;
    /** 发送中状态（显示旋转器，禁用交互） */
    loading?: boolean;
    /** 是否显示字数统计 */
    showCount?: boolean;
    /** 发送按钮文本 */
    sendText?: string;
    /** 自定义类名 */
    customClass?: string;
    /** 最小行数 */
    minRows?: number;
    /** 最大行数（超出滚动） */
    maxRows?: number;
  }>(),
  {
    modelValue: "",
    label: "",
    placeholder: "请输入内容",
    maxlength: 500,
    disabled: false,
    loading: false,
    showCount: true,
    sendText: "发送",
    customClass: "",
    minRows: 1,
    maxRows: 6,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [value: string];
}>();

// ---- 内部状态 ----
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const innerValue = ref(props.modelValue);

// 同步外部 modelValue
watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val;
  },
);

// 当前字数
const charCount = computed(() => innerValue.value.length);

// 是否超过限制
const isOverLimit = computed(() => (props.maxlength ? charCount.value > props.maxlength : false));

// 剩余可输入字数
const remaining = computed(() => (props.maxlength ? props.maxlength - charCount.value : null));

// 是否可交互（未禁用且未加载中）
const isInteractive = computed(() => !props.disabled && !props.loading);

// 发送按钮是否可点击
const canSend = computed(() => {
  if (!isInteractive.value) return false;
  return innerValue.value.trim().length > 0 && !isOverLimit.value;
});

// ---- 自适应高度 ----
// Cached computed styles — line-height/padding don't change between resizes
let cachedAutoResizeStyles: { lineHeight: number; paddingTop: number; paddingBottom: number } | null = null;

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;

  // 先重置高度以获取正确的 scrollHeight
  el.style.height = "auto";

  if (!cachedAutoResizeStyles) {
    const computedStyle = getComputedStyle(el);
    cachedAutoResizeStyles = {
      lineHeight: parseFloat(computedStyle.lineHeight) || 20,
      paddingTop: parseFloat(computedStyle.paddingTop) || 0,
      paddingBottom: parseFloat(computedStyle.paddingBottom) || 0,
    };
  }
  const { lineHeight, paddingTop, paddingBottom } = cachedAutoResizeStyles;
  const minH = lineHeight * props.minRows + paddingTop + paddingBottom;
  const maxH = lineHeight * props.maxRows + paddingTop + paddingBottom;

  const scrollH = el.scrollHeight;
  const clampedH = Math.max(minH, Math.min(maxH, scrollH));

  el.style.height = `${clampedH}px`;
  el.style.overflowY = scrollH > maxH ? "auto" : "hidden";
};

// 输入变更
const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  innerValue.value = target.value;
  emit("update:modelValue", target.value);
  nextTick(autoResize);
};

// 发送逻辑
const doSend = () => {
  if (!canSend.value) return;
  const trimmed = innerValue.value.trim();
  emit("send", trimmed);
};

// 键盘事件：Enter 发送，Shift+Enter 换行
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (canSend.value) {
      doSend();
    }
  }
};

// 初始/外部值变化时调整高度
watch(
  () => props.modelValue,
  () => nextTick(autoResize),
  { immediate: true },
);
</script>

<template>
  <div
    class="input-text"
    :class="[
      customClass,
      {
        'input-text--disabled': disabled,
        'input-text--loading': loading,
        'input-text--error': isOverLimit,
      },
    ]"
  >
    <!-- 可见标签（无障碍：不依赖仅占位符） -->
    <label v-if="label" class="input-text__label" :for="`input-text-${uid}`">
      {{ label }}
    </label>

    <div class="input-text__body">
      <textarea
        :id="`input-text-${uid}`"
        ref="textareaRef"
        v-model="innerValue"
        class="input-text__textarea"
        :placeholder="placeholder"
        :disabled="!isInteractive"
        :maxlength="maxlength"
        :rows="minRows"
        :aria-label="label || placeholder"
        :aria-invalid="isOverLimit"
        :aria-describedby="isOverLimit ? `input-text-error-${uid}` : undefined"
        @input="onInput"
        @keydown="onKeydown"
      ></textarea>
    </div>

    <div class="input-text__footer">
      <!-- 字数 / 错误信息 -->
      <div class="input-text__info">
        <span
          v-if="isOverLimit"
          :id="`input-text-error-${uid}`"
          class="input-text__error-msg"
          role="alert"
        >
          已超出 {{ -remaining! }} 字
        </span>
        <span v-else-if="showCount" class="input-text__count">
          {{ charCount }}<template v-if="maxlength"> / {{ maxlength }}</template>
        </span>
        <span v-else></span>
      </div>

      <!-- 发送按钮 -->
      <button
        class="input-text__send"
        :class="{ 'input-text__send--loading': loading }"
        :disabled="!canSend"
        :aria-label="loading ? '发送中...' : sendText"
        @click="doSend"
      >
        <!-- 加载旋转器 -->
        <span v-if="loading" class="input-text__spinner" aria-hidden="true"></span>
        <span :class="{ 'input-text__send-text--hidden': loading }">{{ sendText }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ---- tokens ----
$bg: rgba(255, 255, 255, 0.7);
$bg-dark: rgba(30, 30, 30, 0.6);
$border-color: #d0d5dd;
$border-color-dark: rgba(255, 255, 255, 0.12);
$focus-ring: #0067c0;
$focus-ring-dark: #60a5fa;
$disabled-bg: #f3f4f6;
$disabled-bg-dark: rgba(255, 255, 255, 0.04);
$disabled-text: #9ca3af;
$text-color: #1f2937;
$text-color-dark: #e5e7eb;
$placeholder-color: #9ca3af;
$count-color: #6b7280;
$count-color-dark: #9ca3af;
$send-bg: #0067c0;
$send-hover: #0053a0;
$send-disabled-bg: #a0c4e8;
$send-disabled-bg-dark: rgba(96, 165, 250, 0.3);
$error-color: #ef4444;
$error-color-dark: #f87171;
$radius: 6px;

// ---- reduced-motion ----
@media (prefers-reduced-motion: reduce) {
  .input-text,
  .input-text__textarea,
  .input-text__send {
    transition-duration: 0ms !important;
  }
}

.input-text {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid $border-color;
  border-radius: $radius;
  background: $bg;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;

  // 可见标签
  &__label {
    display: block;
    padding: 10px 12px 0 12px;
    font-size: 13px;
    font-weight: 500;
    color: $text-color;
    user-select: none;
  }

  // textarea 容器（隔离 padding）
  &__body {
    display: flex;
    flex: 1;
  }

  // ---- focus: 在容器+textarea 上都可见 ----
  &:focus-within:not(.input-text--disabled):not(.input-text--loading) {
    border-color: $focus-ring;
    box-shadow: 0 0 20px 1px rgba(0, 103, 192, 0.15);
  }

  // ---- 状态修饰符 ----
  &--disabled {
    background: $disabled-bg;
    cursor: not-allowed;
    opacity: 0.6;
  }

  &--loading {
    pointer-events: none;
  }

  &--error {
    border-color: $error-color;

    &:focus-within {
      border-color: $error-color;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }

    .input-text__count {
      color: $error-color;
    }
  }

  // ---- textarea ----
  &__textarea {
    flex: 1;
    width: 100%;
    min-height: 48px;
    padding: 12px 14px;
    border: none;
    border-radius: $radius;
    font-size: 14px;
    line-height: 1.6;
    color: $text-color;
    background: transparent;
    font-family: inherit;
    resize: none;
    overflow-y: hidden;

    // 可见焦点环（不依赖 outline: none）
    &:focus {
      outline: none;
    }

    &::placeholder {
      color: $placeholder-color;
    }

    &:disabled {
      color: $disabled-text;
      cursor: not-allowed;
    }
  }

  // ---- footer ----
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 12px 7px 12px;
  }

  // ---- info 区域 ----
  &__info {
    display: flex;
    align-items: center;
    min-height: 20px;
  }

  &__count {
    font-size: 12px;
    color: $count-color;
    user-select: none;
  }

  &__error-msg {
    font-size: 12px;
    color: $error-color;
    font-weight: 500;
    user-select: none;
  }

  // ---- send button ----
  &__send {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 48px;
    height: 34px;
    padding: 0 14px;
    border: none;
    border-radius: 5px;
    background: $send-bg;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    transition:
      background 200ms ease,
      opacity 200ms ease,
      transform 150ms ease;

    &:hover:not(:disabled) {
      background: $send-hover;
    }

    &:active:not(:disabled) {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid $focus-ring;
      outline-offset: 2px;
    }

    // 禁用状态
    &:disabled {
      background: $send-disabled-bg;
      color: rgba(255, 255, 255, 0.65);
      cursor: not-allowed;
    }

    // 加载中
    &--loading {
      background: $send-bg;
      cursor: wait;
    }
  }

  // 加载时隐藏文字
  &__send-text--hidden {
    opacity: 0;
  }

  // ---- 加载旋转器 ----
  &__spinner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: input-text-spin 600ms linear infinite;
  }
}

@keyframes input-text-spin {
  to {
    transform: rotate(360deg);
  }
}

// ---- reduced-motion: 禁用旋转器动画 ----
@media (prefers-reduced-motion: reduce) {
  .input-text__spinner {
    animation: none;
    border-top-color: rgba(255, 255, 255, 0.3);
  }
}
</style>
