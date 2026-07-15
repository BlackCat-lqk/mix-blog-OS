<!--
  LoginInput — 登录表单输入组件
  支持：文本/密码、图标前缀、密码可见切换、错误状态
-->
<script setup lang="ts">
import { ref, computed, useId } from "vue";
import eyeOpen from "@/assets/icons/eye-open-light.svg";
import eyeClose from "@/assets/icons/eye-close-light.svg";
const uid = useId();

const props = withDefaults(
  defineProps<{
    /** v-model 绑定值 */
    modelValue: string;
    /** 输入框标签（无障碍必需） */
    label: string;
    /** 输入类型 */
    type?: "text" | "password";
    /** 占位提示 */
    placeholder?: string;
    /** 错误信息（非空时显示错误状态） */
    error?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 左侧图标 SVG 路径（可选） */
    icon?: string;
  }>(),
  {
    type: "text",
    placeholder: "",
    error: "",
    disabled: false,
    icon: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// ---- 密码可见切换 ----
const showPassword = ref(false);
const inputType = computed(() => {
  if (props.type === "password" && showPassword.value) return "text";
  return props.type;
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// ---- 计算状态 ----
const hasError = computed(() => !!props.error);

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <div
    class="login-input"
    :class="{
      'login-input--error': hasError,
      'login-input--disabled': disabled,
    }"
  >
    <!-- 标签 -->
    <label class="login-input__label" :for="`login-input-${uid}`">
      {{ label }}
    </label>

    <!-- 输入区域 -->
    <div class="login-input__wrapper">
      <!-- 左侧图标 -->
      <span v-if="icon" class="login-input__icon" aria-hidden="true">
        <img :src="icon" />
      </span>

      <input
        :id="`login-input-${uid}`"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? `login-input-error-${uid}` : undefined"
        class="login-input__field"
        @input="onInput"
      />

      <!-- 密码可见切换 -->
      <button
        v-if="type === 'password'"
        type="button"
        class="login-input__toggle"
        :aria-label="showPassword ? '隐藏密码' : '显示密码'"
        :aria-pressed="showPassword"
        @click="togglePassword"
      >
        <!-- 眼睛关闭图标 -->
        <img v-if="!showPassword" :src="eyeClose" />
        <!-- 眼睛开启图标 -->
        <img v-else :src="eyeOpen" />
      </button>
    </div>

    <!-- 错误信息 -->
    <p v-if="hasError" :id="`login-input-error-${uid}`" class="login-input__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped lang="scss">
// ---- tokens ----
$bg: rgba(255, 255, 255, 0.06);
$border: rgba(255, 255, 255, 0.12);
$focus-ring: #0067c0;
$focus-ring-glow: rgba(0, 103, 192, 0.25);
$text: #e5e7eb;
$text-secondary: #9ca3af;
$placeholder: #6b7280;
$error-color: #f87171;
$error-bg: rgba(239, 68, 68, 0.08);
$disabled-opacity: 0.4;
$radius: 10px;
$field-h: 48px;

.login-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  position: relative;
  // ---- label ----
  &__label {
    font-size: 13px;
    font-weight: 500;
    color: $text-secondary;
    user-select: none;
  }

  // ---- wrapper ----
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
    height: $field-h;
    border: 1px solid $border;
    border-radius: $radius;
    background: $bg;
    overflow: hidden;
  }

  // ---- icon prefix ----
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 100%;
    color: $text-secondary;

    img {
      width: 18px;
      height: 18px;
    }
  }

  // ---- input field ----
  &__field {
    flex: 1;
    height: 100%;
    padding-right: 14px;
    border: none;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    background: unset;
    color: $text;
    &::placeholder {
      color: $placeholder;
    }

    &:disabled {
      opacity: $disabled-opacity;
    }
  }

  // ---- focus state ----
  &__wrapper:focus-within {
    border-color: $focus-ring;
    box-shadow: 0 0 0 1px $focus-ring-glow;
  }

  // ---- password toggle ----
  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: $text-secondary;
    cursor: pointer;

    img {
      width: 18px;
      height: 18px;
    }

    &:hover {
      color: $text;
      background: rgba(255, 255, 255, 0.06);
    }

    &:focus-visible {
      outline: 2px solid $focus-ring;
      outline-offset: -2px;
      border-radius: 4px;
    }
  }

  // ---- error state ----
  &--error {
    .login-input__wrapper {
      border-color: $error-color;
      box-shadow: 0 0 0 3px $error-bg;
    }

    .login-input__label {
      color: $error-color;
    }
  }

  // ---- disabled state ----
  &--disabled {
    opacity: $disabled-opacity;
    pointer-events: none;
  }

  // ---- error message ----
  &__error {
    position: absolute;
    bottom: -20px;
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
    color: $error-color;
  }
}
</style>
