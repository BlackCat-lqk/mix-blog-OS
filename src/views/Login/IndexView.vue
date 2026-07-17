<!--
  Login IndexView — 登录页主入口
  全屏暗色背景 + 毛玻璃卡片 + 登录表单
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useUserInfoStore } from "@/stores/userInfo.ts";
import logoIcon from "@/assets/icons/logo-light.svg";
import { Message } from "@/utils/message";
import { loginUserApi } from "@/server/user.ts";
import iconAccount from "@/assets/icons/account-light.svg";
import iconPassword from "@/assets/icons/password-light.svg";
import LoginInput from "./components/LoginInput.vue";
const emit = defineEmits(["loginStatus"]);

const userInfoStore = useUserInfoStore();
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
const validate = (): boolean => {
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
};
// ---- 表单提交 ----
const handleSubmit = async () => {
  if (!validate()) return;

  loading.value = true;
  serverError.value = "";

  try {
    const data = await loginUserApi({
      email: account.value.trim(),
      password: password.value,
    });
    const res = data.data;
    if (res.code === 200 && res.data) {
      userInfoStore.setUserInfo(res.data);
      userInfoStore.setAuthStatus(true);
      Message.success(res.message, {
        duration: 3000,
        position: "top",
        maxToasts: 1,
      });
      emit("loginStatus", true);
    } else {
      serverError.value = res.message || "登录失败，请重试";
      Message.error(serverError.value, {
        duration: 5000,
        position: "top",
        maxToasts: 3,
      });
      userInfoStore.removeUserInfo();
      emit("loginStatus", false);
    }
  } catch (e) {
    const error = e as Error;
    Message.error(error.message || "网络异常，请稍后再试", {
      duration: 5000,
      position: "top",
      maxToasts: 3,
    });
    userInfoStore.removeUserInfo();
    emit("loginStatus", false);
  } finally {
    loading.value = false;
  }
};

// ---- 键盘事件 ----
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !loading.value) {
    e.preventDefault();
    handleSubmit();
  }
};

// ---- 按钮是否可点击 ----
const canSubmit = computed(
  () => !loading.value && account.value.trim().length > 0 && password.value.length > 0,
);
</script>

<template>
  <div class="login-card">
    <!-- 品牌区域 -->
    <div class="login-card__brand">
      <!-- Logo：抽象 OS 图标 -->
      <div class="login-card__logo" aria-hidden="true">
        <img :src="logoIcon" alt="logo" />
      </div>
    </div>
    <!-- 表单 -->
    <div class="login-card__body">
      <form class="login-form" @submit.prevent="handleSubmit" @keydown="onKeydown" novalidate>
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
          v-loading="loading"
          type="submit"
          class="login-form__submit"
          :class="{ 'login-form__submit--loading': loading }"
          :disabled="!canSubmit"
        >
          <span v-show="!loading" :class="{ 'login-form__text--hidden': loading }">登 录</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 公共变量
$card-bg: rgba(0, 0, 0, 0.85);
$card-border: rgba(255, 255, 255, 0.1);
$card-shadow:
  0 0 0 1px rgba(255, 255, 255, 0.05),
  0 4px 24px rgba(0, 0, 0, 0.3),
  0 0 80px rgba(0, 103, 192, 0.08);
$text-primary: #f1f5f9;
$text-secondary: #94a3b8;
$divider: rgba(255, 255, 255, 0.08);
$mainRadius: 20px;
$primary: #0067c0;
$primary-hover: #0053a0;
$primary-active: #004080;
$primary-glow: rgba(0, 103, 192, 0.3);
$text: #e5e7eb;
$spinner-color: rgba(255, 255, 255, 0.3);
$spinner-accent: #fff;
$radius: 10px;

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 36px 32px 32px;
  border-radius: $mainRadius;
  border: 1px solid $card-border;
  background: $card-bg;
  backdrop-filter: blur(40px) saturate(1.5);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  box-shadow: $card-shadow;

  // ---- 品牌区域 ----
  &__brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  // ---- Logo ----
  &__logo {
    width: 128px;
    color: #60a5fa;
    margin-bottom: 4px;
  }
  // ---- 表单区域 ----
  &__body {
    width: 100%;
  }
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;

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
  }
}
</style>
