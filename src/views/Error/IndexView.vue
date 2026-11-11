<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { ErrorStatusCode } from '@/tsInterface/index'

const props = defineProps<{ code: ErrorStatusCode }>()
const router = useRouter()
const pages = {
  403: {
    title: '暂无访问权限',
    description: '你暂时无法访问此页面，请确认当前账号是否具备相应权限。',
  },
  404: {
    title: '页面不存在',
    description: '页面可能已经被移动或删除，也可以检查一下访问地址是否正确。',
  },
  500: { title: '服务暂时不可用', description: '服务遇到了一点问题，请稍后重试，或先返回桌面。' },
}
const page = computed(() => pages[props.code])
const canGoBack = computed(() => Boolean(router.options.history.state.back))
</script>

<template>
  <main class="error-page" aria-labelledby="error-title">
    <section class="error-page__card">
      <p class="error-page__code">{{ code }}</p>
      <h1 id="error-title">{{ page.title }}</h1>
      <p class="error-page__description">{{ page.description }}</p>
      <nav class="error-page__actions" aria-label="页面导航">
        <RouterLink class="error-page__home" :to="{ name: 'home' }" replace>返回桌面</RouterLink>
        <button v-if="canGoBack" type="button" @click="router.back()">返回上一页</button>
      </nav>
    </section>
  </main>
</template>

<style scoped lang="scss">
.error-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px 20px;
  background: linear-gradient(140deg, #f6f3fc, #edf3fb);
  color: #342d45;

  &__card {
    width: min(540px, 100%);
    padding: 48px 28px;
    border: 1px solid #fff;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 16px 48px rgba(71, 51, 111, 0.06);
    text-align: center;
  }

  &__code {
    margin-bottom: 20px;
    color: #9270cd;
    font-size: clamp(80px, 16vw, 128px);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  h1 {
    font-size: 24px;
    font-weight: 600;
  }

  &__description {
    margin-top: 16px;
    color: #8a8198;
    font-size: 14px;
    line-height: 1.8;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 32px;
  }

  a,
  button {
    padding: 10px 20px;
    border: 1px solid #e4ddeb;
    border-radius: 10px;
    background: #fff;
    color: #746185;
    font: inherit;
    font-size: 13px;
    text-decoration: none;
    cursor: pointer;
    &:hover {
      background: #f4effb;
    }
    &:focus-visible {
      outline: 2px solid #8d6ac6;
      outline-offset: 3px;
    }
  }

  a.error-page__home {
    border-color: #8b68c3;
    background: #8b68c3;
    color: #fff;
    &:hover {
      background: #7956b1;
    }
  }
}
</style>
