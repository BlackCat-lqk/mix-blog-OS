<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AppItem } from '@/tsInterface/index'

const props = defineProps<{ apps: readonly Pick<AppItem, 'enName' | 'zhName' | 'icon'>[] }>()
const emit = defineEmits<{ close: []; launch: [id: string] }>()
const overview = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()
const query = ref('')
const previousFocus = document.activeElement as HTMLElement | null
const filteredApps = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return props.apps.filter((app) =>
    `${app.zhName ?? ''} ${app.enName}`.toLowerCase().includes(keyword),
  )
})

const onSearchKeydown = (event: KeyboardEvent) => {
  const firstApp = filteredApps.value[0]
  if (event.key === 'Enter' && !event.isComposing && firstApp) {
    event.preventDefault()
    emit('launch', firstApp.enName)
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !event.isComposing) {
    event.preventDefault()
    emit('close')
  }
}

onMounted(() => {
  searchInput.value?.focus({ preventScroll: true })
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (overview.value?.contains(document.activeElement) && previousFocus?.isConnected) {
    previousFocus.focus({ preventScroll: true })
  }
})
</script>

<template>
  <section
    ref="overview"
    class="applications-overview"
    aria-label="全部应用"
    @click.self="emit('close')"
  >
    <div class="applications-overview__content" @click.self="emit('close')">
      <label class="applications-overview__search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="7.5" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          placeholder="搜索应用"
          aria-label="搜索应用"
          autocomplete="off"
          :spellcheck="false"
          @keydown="onSearchKeydown"
        />
      </label>

      <div class="applications-overview__grid" aria-label="应用列表" @click.self="emit('close')">
        <button
          v-for="app in filteredApps"
          :key="app.enName"
          class="applications-overview__item"
          type="button"
          @click="emit('launch', app.enName)"
        >
          <img v-if="app.icon" :src="app.icon" alt="" width="64" height="64" />
          <span v-else class="applications-overview__initial" aria-hidden="true">
            {{ (app.zhName || app.enName).slice(0, 1) }}
          </span>
          <span>{{ app.zhName || app.enName }}</span>
        </button>
        <p v-if="!filteredApps.length" class="applications-overview__empty" role="status">
          未找到相关应用
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.applications-overview {
  position: absolute;
  inset: 0;
  z-index: 2;
  isolation: isolate;
  overflow: hidden;
  color: #fff;

  // 仅模糊静态壁纸，避免对正在运行的应用使用全屏背景滤镜。
  &::before {
    content: '';
    position: absolute;
    inset: -24px;
    z-index: -1;
    background: #1e1e1e var(--desktop-wallpaper, none) center / cover no-repeat;
    filter: blur(20px) brightness(0.5);
    pointer-events: none;
  }

  &__content {
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-left: var(--desktop-inset-left, 72px);
    padding: clamp(28px, 7vh, 80px) clamp(16px, 5vw, 120px) 24px;
  }

  &__search {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 12px;
    width: min(480px, 100%);
    height: 56px;
    margin-inline: auto;
    padding: 0 16px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);

    &:focus-within {
      outline: 2px solid rgba(255, 255, 255, 0.65);
      outline-offset: 2px;
    }

    svg {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    input {
      width: 100%;
      min-width: 0;
      height: 100%;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 15px;
      color-scheme: dark;

      &::placeholder {
        color: rgba(255, 255, 255, 0.65);
      }
    }
  }

  &__grid {
    display: grid;
    flex: 1;
    align-content: start;
    grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));
    gap: 24px clamp(12px, 2vw, 40px);
    width: 100%;
    max-width: 1800px;
    min-height: 0;
    margin: clamp(28px, 5vh, 56px) auto 0;
    padding: 4px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.35) transparent;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    min-width: 0;
    padding: 16px 8px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    overflow-wrap: anywhere;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    img {
      object-fit: contain;
    }
  }

  &__initial {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.16);
    font-size: 28px;
  }

  &__empty {
    grid-column: 1 / -1;
    padding-top: 32px;
    color: rgba(255, 255, 255, 0.75);
    text-align: center;
    font-size: 14px;
  }
}
</style>
