<!--
  LoginForm — 登录表单
  包含帐号/密码输入、验证、提交、错误处理
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import LoginInput from "./LoginInput.vue";
import { loginUserApi } from "@/server/iMusic/userHttp";
import { useUserInfoStore } from "@/stores/iMusic/userInfo";
import iconAccount from "@/assets/icons/account.svg";
import iconPassword from "@/assets/icons/password.svg";

const router = useRouter();
const userStore = useUserInfoStore();

const props = withDefaults(
  defineProps<{
    /** 是否为独立登录页（true=成功后跳转首页，false=仅触发事件） */
    standalone?: boolean;
  }>(),
  {
    standalone: true,
  },
);

const emit = defineEmits<{
  "login-success": [];
}>();

// ---- 表单状态 ----
const account = ref("");
const password = ref("");
const loading = ref(false);
const serverError = ref("");

// ---- 字段级错误 ----
const accountError = ref("");
const passwordError = ref("");

// ---- 验证规则 ----
const MIN_ACCOUNT_LEN = 2;
const MIN_PASSWORD_LEN = 4;

function validate(): boolean {
  accountError.value = "";
  passwordError.value = "";
  serverError.value = "";

  let valid = true;

  if (!account.value.trim()) {
    accountError.value = "请输入帐号";
    valid = false;
  } else if (account.value.trim().length < MIN_ACCOUNT_LEN) {
    accountError.value = `帐号至少 ${MIN_ACCOUNT_LEN} 个字符`;
    valid = false;
  }

  if (!password.value) {
    passwordError.value = "请输入密码";
    valid = false;
  } else if (password.value.length < MIN_PASSWORD_LEN) {
    passwordError.value = `密码至少 ${MIN_PASSWORD_LEN} 个字符`;
    valid = false;
  }

  return valid;
}

// ---- 表单提交 ----
async function handleSubmit() {
  if (!validate()) return;

  loading.value = true;
  serverError.value = "";

  try {
    const res = await loginUserApi({
      account: account.value.trim(),
      password: password.value,
    });

    // API 返回格式: { code: 200, data: { token, user } }
    if (res.code === 200 && res.data) {
      userStore.setUserInfo(res.data);
      emit("login-success");
      // 独立登录页才跳转，嵌入模态框时由父组件控制关闭
      if (props.standalone) {
        router.push("/");
      }
    } else {
      serverError.value = res.message || "登录失败，请重试";
    }
  } catch (err: any) {
    serverError.value = err.message || "网络异常，请稍后再试";
  } finally {
    loading.value = false;
  }
}

// ---- 键盘事件 ----
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !loading.value) {
    e.preventDefault();
    handleSubmit();
  }
}

// ---- 按钮是否可点击 ----
const canSubmit = computed(
  () =>
    !loading.value &&
    account.value.trim().length > 0 &&
    password.value.length > 0,
);
</script>

<template>
  <form class="login-form" @submit.prevent="handleSubmit" @keydown="onKeydown" novalidate>
    <!-- 服务器错误 -->
    <div
      v-if="serverError"
      class="login-form__server-error"
      role="alert"
    >
      <svg
        class="login-form__server-error-icon"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.25 4.5a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3Z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{{ serverError }}</span>
    </div>

    <!-- 帐号 -->
    <LoginInput
      v-model="account"
      label="帐号"
      type="text"
      placeholder="请输入帐号"
      :error="accountError"
      :disabled="loading"
      :icon="iconAccount"
    />

    <!-- 密码 -->
    <LoginInput
      v-model="password"
      label="密码"
      type="password"
      placeholder="请输入密码"
      :error="passwordError"
      :disabled="loading"
      :icon="iconPassword"
    />

    <!-- 提交按钮 -->
    <button
      type="submit"
      class="login-form__submit"
      :class="{ 'login-form__submit--loading': loading }"
      :disabled="!canSubmit"
    >
      <!-- 加载旋转器 -->
      <span v-if="loading" class="login-form__spinner" aria-hidden="true"></span>
      <span :class="{ 'login-form__text--hidden': loading }">登 录</span>
    </button>
  </form>
</template>

<style scoped lang="scss">
// ---- tokens ----
$primary: #0067c0;
$primary-hover: #0053a0;
$primary-active: #004080;
$primary-glow: rgba(0, 103, 192, 0.3);
$text: #e5e7eb;
$error-bg: rgba(239, 68, 68, 0.1);
$error-border: rgba(239, 68, 68, 0.25);
$error-text: #fca5a5;
$spinner-color: rgba(255, 255, 255, 0.3);
$spinner-accent: #fff;
$radius: 10px;

// ---- reduced-motion ----
@media (prefers-reduced-motion: reduce) {
  .login-form__submit,
  .login-form__spinner {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;

  // ---- 服务器错误横幅 ----
  &__server-error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    border-radius: $radius;
    border: 1px solid $error-border;
    background: $error-bg;
    color: $error-text;
    font-size: 13px;
    line-height: 1.5;
  }

  &__server-error-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 1px;
    color: $error-text;
  }

  // ---- 提交按钮 ----
  &__submit {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 48px;
    margin-top: 6px;
    padding: 0 24px;
    border: none;
    border-radius: $radius;
    background: $primary;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.08em;
    cursor: pointer;
    user-select: none;
    transition:
      background 200ms ease,
      transform 150ms ease,
      box-shadow 200ms ease;

    &:hover:not(:disabled) {
      background: $primary-hover;
      box-shadow: 0 4px 20px $primary-glow;
    }

    &:active:not(:disabled) {
      background: $primary-active;
      transform: scale(0.98);
    }

    &:focus-visible {
      outline: 2px solid #60a5fa;
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    // ---- 加载中 ----
    &--loading {
      cursor: wait;
      opacity: 1 !important;
    }
  }

  // 加载时隐藏文字
  &__text--hidden {
    opacity: 0;
  }

  // ---- 加载旋转器 ----
  &__spinner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid $spinner-color;
    border-top-color: $spinner-accent;
    border-radius: 50%;
    animation: login-spin 600ms linear infinite;
  }
}

@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
