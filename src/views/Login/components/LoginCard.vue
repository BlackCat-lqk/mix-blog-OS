<!--
  LoginCard — 登录卡片容器
  毛玻璃风格卡片，包含品牌区域 + 表单插槽
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 主标题 */
    title?: string;
    /** 副标题 */
    subtitle?: string;
  }>(),
  {
    title: "MIX OS",
    subtitle: "欢迎回来，请登录您的帐号",
  },
);
</script>

<template>
  <div class="login-card">
    <!-- 品牌区域 -->
    <div class="login-card__brand">
      <!-- Logo：抽象 OS 图标 -->
      <div class="login-card__logo" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="36" height="36" rx="10" stroke="currentColor" stroke-width="1.5" />
          <circle cx="14" cy="14" r="3.5" fill="currentColor" />
          <circle cx="26" cy="14" r="3.5" fill="currentColor" />
          <rect x="13" y="23" width="14" height="8" rx="3" fill="currentColor" />
        </svg>
      </div>
      <h1 class="login-card__title">{{ title }}</h1>
      <p class="login-card__subtitle">{{ subtitle }}</p>
    </div>

    <!-- 分隔线 -->
    <div class="login-card__divider" aria-hidden="true"></div>

    <!-- 表单插槽 -->
    <div class="login-card__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
// ---- tokens ----
$card-bg: rgba(255, 255, 255, 0.07);
$card-border: rgba(255, 255, 255, 0.1);
$card-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 24px rgba(0, 0, 0, 0.3),
  0 0 80px rgba(0, 103, 192, 0.08);
$text-primary: #f1f5f9;
$text-secondary: #94a3b8;
$divider: rgba(255, 255, 255, 0.08);
$radius: 20px;

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 36px 32px 32px;
  border-radius: $radius;
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
    margin-bottom: 28px;
  }

  // ---- Logo ----
  &__logo {
    width: 48px;
    height: 48px;
    color: #60a5fa;
    margin-bottom: 4px;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  // ---- 标题 ----
  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 0.02em;
  }

  // ---- 副标题 ----
  &__subtitle {
    margin: 0;
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.5;
  }

  // ---- 分隔线 ----
  &__divider {
    height: 1px;
    background: $divider;
    margin-bottom: 24px;
  }

  // ---- 表单区域 ----
  &__body {
    width: 100%;
  }
}

// ---- 小屏适配 ----
@media (max-width: 460px) {
  .login-card {
    padding: 28px 20px 24px;
    border-radius: 16px;
  }
}
</style>
