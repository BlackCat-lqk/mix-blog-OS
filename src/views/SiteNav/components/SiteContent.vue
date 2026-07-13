<template>
  <main class="site-content">
    <!-- 搜索框（装饰，暂不实现搜索） -->
    <div class="site-content__search">
      <div class="search-input">
        <img class="search-input__icon" :src="searchIcon" alt="" />
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索站点..."
          class="search-input__field"
        />
      </div>
    </div>

    <!-- 无数据 -->
    <div v-if="filteredCategories.length === 0" class="site-content__empty">
      <img :src="emptyIcon" alt="" class="empty-icon" />
      <p>暂无站点数据</p>
      <p class="empty-hint">点击左侧「添加站点」开始</p>
    </div>

    <!-- 分类 + 卡片 -->
    <div
      v-for="(category, cIdx) in filteredCategories"
      :key="cIdx"
      class="site-section"
    >
      <h3 class="site-section__title">{{ category.secondaryCategory }}</h3>
      <div class="site-section__grid">
        <SiteCard
          v-for="(site, sIdx) in category.data"
          :key="sIdx"
          :site="site"
          :show-delete="showDelete"
          @delete="$emit('delete-site', $event)"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SiteCard from './SiteCard.vue'
import type { PrimaryItem } from './SiteCategory.vue'

const props = defineProps<{
  categories: PrimaryItem[]
  showDelete: boolean
}>()

defineEmits<{
  'delete-site': [_id: string]
}>()

const searchText = ref('')

const searchIcon = new URL('@/assets/iMusic/icons/Search.svg', import.meta.url).href
const emptyIcon = new URL('@/assets/iMusic/icons/musicAlbum.svg', import.meta.url).href

const filteredCategories = computed(() => {
  if (!searchText.value.trim()) {
    return props.categories
  }
  const q = searchText.value.toLowerCase()
  return props.categories
    .map((cat) => ({
      ...cat,
      data: cat.data.filter(
        (s) =>
          s.siteName.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q) ||
          s.secondaryCategory.toLowerCase().includes(q),
      ),
    }))
    .filter((cat) => cat.data.length > 0)
})
</script>

<style lang="scss" scoped>
.site-content {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8ecf1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - 160px);

  &__search {
    padding: 16px 20px 0;
    display: flex;
    justify-content: center;
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 15px;
    gap: 4px;

    .empty-icon {
      width: 48px;
      height: 48px;
      opacity: 0.4;
      margin-bottom: 8px;
    }

    .empty-hint {
      font-size: 13px;
      color: #c8cdd5;
      margin: 0;
    }
  }
}

.search-input {
  position: relative;
  width: 50%;
  transition: width 0.3s ease;
  min-width: 200px;

  &:focus-within {
    width: 60%;
  }

  &__icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    opacity: 0.4;
    pointer-events: none;
  }

  &__field {
    width: 100%;
    padding: 9px 12px 9px 34px;
    border: 1px solid #e8ecf1;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: #f8fafc;
    color: #1e293b;
    transition: border-color 0.15s;
    font-family: inherit;

    &:focus {
      border-color: #0078d4;
      box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.08);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }
}

// ---- 分类区域 ----
.site-section {
  padding: 20px 20px 0;

  &__title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 14px;
    line-height: 1.3;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding-bottom: 8px;
  }
}

// 内层滚动
.site-content__scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 40px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
}
</style>
