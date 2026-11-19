<!--
  Login IndexView — 登录页主入口
  全屏暗色遮罩 + 登录 / 注册表单
-->
<template>
  <Teleport to="body">
    <div v-if="props.visible" class="login-modal__overlay" @keydown.esc="close">
      <div
        class="login-modal__card-wrapper"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <!-- 关闭按钮 -->
        <button
          class="login-modal__close"
          type="button"
          :disabled="loading"
          aria-label="关闭弹窗"
          @click="close"
        >
          <img :src="closeIcon" />
        </button>
        <div class="login-card" :class="{ 'login-card--register': isRegister }">
          <!-- 品牌区域 -->
          <div class="login-card__brand">
            <!-- Logo：抽象 OS 图标 -->
            <div class="login-card__logo" aria-hidden="true">
              <img :src="logoIcon" alt="logo" />
            </div>
          </div>
          <!-- 表单 -->
          <div class="login-card__body">
            <h2 :id="titleId" class="login-card__title">
              {{ isRegister ? "用户注册" : "用户登录" }}
            </h2>
            <form class="login-form" @submit.prevent="handleSubmit" novalidate>
              <!-- 帐号 -->
              <LoginInput
                v-model="form.email"
                label="邮箱账号"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="请输入邮箱帐号"
                :error="errors.email"
                :disabled="loading"
                :icon="iconAccount"
                @blur="validateField('email')"
                @update:model-value="revalidateField('email')"
              />
              <LoginInput
                v-if="isRegister"
                v-model="form.userName"
                label="用户名"
                autocomplete="username"
                placeholder="仅支持中文、英文和数字"
                :error="errors.userName"
                :disabled="loading"
                :icon="iconAccount"
                @blur="validateField('userName')"
                @update:model-value="revalidateField('userName')"
              />
              <!-- 密码 -->
              <LoginInput
                v-model="form.password"
                label="密码"
                type="password"
                :autocomplete="isRegister ? 'new-password' : 'current-password'"
                placeholder="至少 4 位，支持英文、数字和半角特殊字符"
                :error="errors.password"
                :disabled="loading"
                :icon="iconPassword"
                @blur="validateField('password')"
                @update:model-value="revalidateField('password')"
              />
              <LoginInput
                v-if="isRegister"
                v-model="form.invitationCode"
                label="邀请码"
                inputmode="numeric"
                placeholder="请输入 6 位数字邀请码"
                :error="errors.invitationCode"
                :disabled="loading"
                :icon="iconPassword"
                @blur="validateField('invitationCode')"
                @update:model-value="revalidateField('invitationCode')"
              />
              <p v-if="submitError" class="login-form__error" role="alert">{{ submitError }}</p>
              <p v-if="successMessage" class="login-form__success" role="status">
                {{ successMessage }}
              </p>
              <div class="login-register">
                <!-- 注册按钮 -->
                <button
                  type="button"
                  class="login-form__register"
                  :disabled="loading"
                  @click.stop="switchMode"
                >
                  {{ isRegister ? "返回登录" : "注 册" }}
                </button>
                <!-- 提交按钮 -->
                <button
                  type="submit"
                  class="login-form__submit"
                  :class="{ 'login-form__submit--loading': loading }"
                  :disabled="loading"
                >
                  {{ loading ? "提交中…" : isRegister ? "注 册" : "登 录" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, reactive, useId, watch } from "vue";
import { useUserInfoStore } from "@/stores/userInfo.ts";
import logoIcon from "@/assets/icons/logo-light.svg";
import { loginUserApi, registerUserApi } from "@/server/user.ts";
import iconAccount from "@/assets/icons/account-light.svg";
import iconPassword from "@/assets/icons/password-light.svg";
import LoginInput from "./components/LoginInput.vue";
import closeIcon from "@/assets/icons/close-light.svg";
import {
  validateEmail,
  validateUserName,
  validatePassword,
  validateInvitationCode,
} from "@/utils/validation";
const emit = defineEmits(["loginStatus", "update:visible", "close"]);

const props = defineProps({
  // 显隐
  visible: {
    type: Boolean,
    default: false,
  },
});
const userInfoStore = useUserInfoStore();
const titleId = useId();
// ---- 表单状态 ----
const isRegister = ref(false);
const form = reactive({ email: "", userName: "", password: "", invitationCode: "" });
const errors = reactive({ email: "", userName: "", password: "", invitationCode: "" });
type FormField = keyof typeof form;
const loading = ref(false);
const submitError = ref("");
const successMessage = ref("");

// ---- 验证规则 ----
const validators = {
  email: validateEmail,
  userName: validateUserName,
  password: validatePassword,
  invitationCode: validateInvitationCode,
};
const validateField = (field: FormField) => {
  errors[field] = validators[field](form[field]);
  return !errors[field];
};
const revalidateField = (field: FormField) => {
  if (errors[field]) validateField(field);
  submitError.value = "";
  successMessage.value = "";
};
const validate = (): boolean => {
  const fields: FormField[] = isRegister.value
    ? ["email", "userName", "password", "invitationCode"]
    : ["email", "password"];
  return fields.map(validateField).every(Boolean);
};
// ---- 表单提交 ----
const handleSubmit = async () => {
  if (loading.value || !validate()) return;

  loading.value = true;
  submitError.value = "";
  successMessage.value = "";

  try {
    if (isRegister.value) {
      const data = await registerUserApi({ ...form, email: form.email.trim() });
      if (data.data.code !== 200) {
        submitError.value = data.data.message || "注册失败，请稍后重试";
        return;
      }
      switchMode();
      form.password = "";
      form.userName = "";
      form.invitationCode = "";
      successMessage.value = "注册成功，请登录";
      return;
    }
    const data = await loginUserApi({
      email: form.email.trim(),
      password: form.password,
    });
    const res = data.data;
    if (res.code === 200 && res.data) {
      userInfoStore.setUserInfo(res.data);
      userInfoStore.setAuthStatus(true);
      emit("loginStatus", true);
      emit("update:visible", false);
      emit("close", false);
    } else {
      submitError.value = res.message || "登录失败，请稍后重试";
      userInfoStore.removeUserInfo();
      emit("loginStatus", false);
    }
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : "提交失败，请稍后重试";
    if (!isRegister.value) {
      userInfoStore.removeUserInfo();
      emit("loginStatus", false);
    }
  } finally {
    loading.value = false;
  }
};

const clearErrors = () => {
  for (const field of Object.keys(errors) as FormField[]) errors[field] = "";
  submitError.value = "";
  successMessage.value = "";
};
const switchMode = () => {
  isRegister.value = !isRegister.value;
  clearErrors();
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) return;
    isRegister.value = false;
    for (const field of Object.keys(form) as FormField[]) form[field] = "";
    clearErrors();
  },
);

const close = () => {
  if (loading.value) return;
  emit("update:visible", false);
  emit("close", false);
};
</script>
<style scoped lang="scss">
// 公共变量
$card-bg: #181818;
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
  &__title {
    margin: 12px 0 24px;
    color: $text-primary;
    font-size: 20px;
    text-align: center;
  }
  &--register {
    padding-top: 24px;

    .login-card__logo {
      width: 80px;
    }

    .login-form {
      gap: 20px;
    }
  }
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  &__error,
  &__success {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  &__error {
    color: #f87171;
  }
  &__success {
    color: #86efac;
  }
  // ---- 提交按钮 ----
  &__submit,
  &__register {
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

    &:hover:not(:disabled) {
      background: $primary-hover;
      box-shadow: 0 4px 20px $primary-glow;
    }

    &:active:not(:disabled) {
      background: $primary-active;
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
  &__register {
    background-color: #00361a;
  }
}
.login-register {
  display: flex;
  gap: 20px;
}
.login-modal {
  // ---- overlay ----
  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    overflow-y: auto;
    scrollbar-width: thin;
    background: rgba(0, 0, 0, 0.55);
  }

  // ---- card wrapper ----
  &__card-wrapper {
    position: relative;
    width: 100%;
    max-width: 420px;
    max-height: 100%;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 20px;
  }

  // ---- 关闭按钮 ----
  &__close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    img {
      width: 24px;
      height: 24px;
    }
  }
}
</style>
