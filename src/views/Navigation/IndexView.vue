<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppWindowProps } from '@/tsInterface/index'
import OsWindow from '@/components/OsWindow/index.vue'
import { categories } from './data'

withDefaults(defineProps<AppWindowProps>(), {
  title: '导航',
  visible: true,
})
const minimized = defineModel<boolean>('minimized', { default: false })
const emit = defineEmits<{ activate: []; close: [] }>()
const selectedId = ref(categories[0]?.children[0]?.id ?? '')
const selectedCategory = computed(() =>
  categories.find((category) => category.children.some((child) => child.id === selectedId.value)),
)
const selectedSubcategory = computed(() =>
  selectedCategory.value?.children.find((child) => child.id === selectedId.value),
)
const failedIcons = ref(new Set<string>())
</script>

<template>
  <OsWindow
    v-model:minimized="minimized"
    :title="title"
    :icon="icon"
    :minimize-target="minimizeTarget"
    :visible="visible"
    @activate="emit('activate')"
    @close="emit('close')"
  >
    <template #sidebar>
      <nav class="navigation-sidebar" aria-label="网站分类">
        <div class="navigation-sidebar__title">网站分类</div>
        <details v-for="category in categories" :key="category.id" class="category" open>
          <summary class="category__title">{{ category.title }}</summary>
          <div class="category__children">
            <button
              v-for="child in category.children"
              :key="child.id"
              type="button"
              class="category__item"
              :class="{ 'category__item--active': selectedId === child.id }"
              :aria-current="selectedId === child.id ? 'page' : undefined"
              @click="selectedId = child.id"
            >
              <span>{{ child.title }}</span>
              <span class="category__count">{{ child.sites.length }}</span>
            </button>
          </div>
        </details>
      </nav>
    </template>

    <section class="navigation-content" aria-label="分类网站">
      <header class="navigation-content__header">
        <span class="navigation-content__parent">{{ selectedCategory?.title }}</span>
        <div class="navigation-content__heading">
          <h1>{{ selectedSubcategory?.title }}</h1>
          <span>{{ selectedSubcategory?.sites.length ?? 0 }} 个网站</span>
        </div>
      </header>
      <div :key="selectedId" class="website-grid">
        <a
          v-for="site in selectedSubcategory?.sites"
          :key="site.id"
          class="website-card"
          :href="site.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="website-card__header">
            <div class="website-card__icon">
              <img
                v-if="!failedIcons.has(site.id)"
                :src="site.icon"
                alt=""
                width="32"
                height="32"
                loading="lazy"
                decoding="async"
                @error="failedIcons.add(site.id)"
              />
              <span v-else aria-hidden="true">{{ site.title.slice(0, 1) }}</span>
            </div>
            <h2 :title="site.title">{{ site.title }}</h2>
          </div>
          <p class="website-card__description" :title="site.description">{{ site.description }}</p>
        </a>
        <p v-if="!selectedSubcategory?.sites.length" class="navigation-content__empty">
          该分类下暂无网站
        </p>
      </div>
    </section>
  </OsWindow>
</template>

<style scoped lang="scss">
.navigation-sidebar {
  flex: 0 0 clamp(112px, 22%, 180px);
  min-width: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  color: var(--app-window-color);
  padding: 16px 4px 8px;

  &__title {
    margin: 0 10px 20px;
    font-size: 15px;
    font-weight: 600;
  }
}

.category {
  margin-bottom: 14px;

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
    &::-webkit-details-marker {
      display: none;
    }
    &::before {
      content: '';
      width: 5px;
      height: 5px;
      flex-shrink: 0;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(-45deg);
    }
  }

  &[open] &__title::before {
    transform: rotate(45deg);
  }

  &__children {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 10px 12px 10px 24px;
    border: 0;
    border-radius: 8px;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: var(--app-window-header-option-bg);
    }

    &--active,
    &--active:hover {
      background: #e5efff;
      color: #005cc8;
    }
  }

  &__count {
    font-size: 11px;
    opacity: 0.65;
  }
}

.navigation-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
  scrollbar-width: thin;
  color: #1e293b;

  &__header {
    margin-bottom: 24px;
  }

  &__parent {
    color: #64748b;
    font-size: 12px;
  }

  &__heading {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;

    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }

    > span {
      color: #64748b;
      font-size: 12px;
    }
  }

  &__empty {
    color: #64748b;
    font-size: 13px;
  }
}

.website-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 16px;
}

.website-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: inherit;
  background: #fff;
  text-decoration: none;

  &:hover {
    border-color: #93b8ed;
    background: #f8fbff;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;

    h2 {
      flex: 1;
      min-width: 0;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 14px;
      font-weight: 600;
    }
  }

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 36px;
    height: 36px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #005cc8;
    font-weight: 600;

    img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
  }

  &__description {
    display: -webkit-box;
    min-width: 0;
    min-height: 40px;
    margin: 0;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow-wrap: anywhere;
    color: #64748b;
    font-size: 13px;
    line-height: 20px;
  }
}

.category__title:focus-visible,
.category__item:focus-visible,
.website-card:focus-visible {
  outline: 2px solid #0067c0;
  outline-offset: -2px;
}
</style>
