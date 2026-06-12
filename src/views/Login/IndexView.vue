<!--
  Login IndexView — 登录页主入口
  全屏暗色背景 + 毛玻璃卡片 + 登录表单
-->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import LoginCard from "./components/LoginCard.vue";
import LoginForm from "./components/LoginForm.vue";

// 控制卡片入场动画
const showCard = ref(false);

onMounted(() => {
  // 下一帧触发入场动画，保证 Transition 正常播放
  requestAnimationFrame(() => {
    showCard.value = true;
  });
});
</script>

<template>
  <div class="login-page">
    <!-- 装饰性背景光晕 -->
    <div class="login-page__glow login-page__glow--1" aria-hidden="true"></div>
    <div class="login-page__glow login-page__glow--2" aria-hidden="true"></div>

    <!-- 卡片区域 -->
    <div class="login-page__center">
      <Transition name="card">
        <LoginCard v-if="showCard" title="MIX OS" subtitle="欢迎回来，请登录您的帐号">
          <LoginForm />
        </LoginCard>
      </Transition>
    </div>

    <!-- 底部品牌信息 -->
    <footer class="login-page__footer">
      <span>© 2024 MIX OS · 登录页</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
// ---- tokens ----
$bg-primary: #0b1121;
$bg-secondary: #111827;
$glow-1: rgba(59, 130, 246, 0.18);
$glow-2: rgba(99, 102, 241, 0.1);
$footer-text: #475569;
$transition-ease: 400ms cubic-bezier(0.16, 1, 0.3, 1);

// ---- reduced-motion ----
@media (prefers-reduced-motion: reduce) {
  .card-enter-active,
  .card-leave-active {
    transition: none !important;
  }
}

.login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #1a2340 0%, $bg-primary 60%);
  overflow: hidden;

  // ---- 装饰光晕 ----
  &__glow {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(80px);

    &--1 {
      width: 600px;
      height: 400px;
      background: $glow-1;
      top: -15%;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0.7;
    }

    &--2 {
      width: 400px;
      height: 500px;
      background: $glow-2;
      bottom: -20%;
      right: -10%;
      opacity: 0.5;
    }
  }

  // ---- 居中容器 ----
  &__center {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex: 1;
  }

  // ---- 底部 ----
  &__footer {
    position: relative;
    z-index: 1;
    padding: 16px 0;
    font-size: 12px;
    color: $footer-text;
    flex-shrink: 0;
  }
}

// ---- 卡片入场动画 ----
.card-enter-active {
  transition:
    opacity $transition-ease,
    transform $transition-ease;
}

.card-leave-active {
  transition:
    opacity 200ms ease-in,
    transform 200ms ease-in;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
}

// ---- 小屏适配 ----
@media (max-width: 460px) {
  .login-page {
    padding: 16px;
  }
}

// ---- 移动端横屏适配 ----
@media (max-height: 600px) {
  .login-page {
    justify-content: flex-start;
    padding-top: 40px;
    gap: 20px;
  }

  .login-page__center {
    flex: unset;
  }

  .login-page__footer {
    padding: 8px 0;
  }
}
</style>
