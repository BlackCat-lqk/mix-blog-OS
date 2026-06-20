<template>
  <aside class="site-category">
    <!-- 添加按钮 -->
    <button class="add-btn" @click="$emit('toggle-form')">
      <img
        v-if="!formVisible"
        class="add-btn__icon"
        :src="addIcon"
        alt="添加"
      />
      <img
        v-else
        class="add-btn__icon"
        :src="closeIcon"
        alt="收起"
      />
      <span>添加站点</span>
    </button>

    <!-- 添加表单 -->
    <SiteForm
      :visible="formVisible"
      @submit="$emit('create-site', $event)"
      @cancel="$emit('toggle-form')"
    />

    <!-- 分类折叠面板 -->
    <div class="category-panel">
      <!-- "我的" 分类 -->
      <div class="category-group">
        <button class="category-group__header" @click="toggleGroup('own')">
          <img
            class="category-group__chevron"
            :class="{ 'is-open': openGroups.has('own') }"
            :src="chevronIcon"
            alt=""
          />
          <span>我的</span>
        </button>
        <div v-show="openGroups.has('own')" class="category-group__items">
          <button
            v-for="(item, idx) in userCategories"
            :key="idx"
            class="category-item"
            :class="{ 'category-item--active': activeKey === 'user-' + idx }"
            @click="selectCategory(item, 'user', idx)"
          >
            {{ item.secondaryCategory }}
          </button>
          <p v-if="userCategories.length === 0" class="category-empty">暂无站点</p>
        </div>
      </div>

      <!-- Blog 分类 -->
      <div
        v-for="(group, gIdx) in blogCategories"
        :key="gIdx"
        class="category-group"
      >
        <button class="category-group__header" @click="toggleGroup('blog-' + gIdx)">
          <img
            class="category-group__chevron"
            :class="{ 'is-open': openGroups.has('blog-' + gIdx) }"
            :src="chevronIcon"
            alt=""
          />
          <span>{{ group.primaryCategory }}</span>
        </button>
        <div v-show="openGroups.has('blog-' + gIdx)" class="category-group__items">
          <button
            v-for="(item, idx) in group.primaryItem"
            :key="idx"
            class="category-item"
            :class="{ 'category-item--active': activeKey === 'blog-' + gIdx + '-' + idx }"
            @click="selectCategory(item, 'blog', gIdx, idx)"
          >
            {{ item.secondaryCategory }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SiteForm from './SiteForm.vue'
import type { SiteFormData } from './SiteForm.vue'

export interface PrimaryItem {
  secondaryCategory: string
  data: SiteItem[]
}

export interface BlogGroup {
  primaryCategory: string
  primaryItem: PrimaryItem[]
}

export interface SiteItem {
  _id: string
  siteName: string
  link: string
  desc: string
  icon: string
  secondaryCategory: string
}

const props = defineProps<{
  formVisible: boolean
  userCategories: PrimaryItem[]
  blogCategories: BlogGroup[]
}>()

const emit = defineEmits<{
  'toggle-form': []
  'create-site': [data: SiteFormData]
  'select-category': [item: PrimaryItem, type: 'user' | 'blog']
}>()

const openGroups = ref(new Set<string>())
const activeKey = ref<string>('')

// 图标资源 — 使用项目已有图标
const addIcon = new URL('@/assets/iMusic/icons/add.svg', import.meta.url).href
const closeIcon = new URL('@/assets/iMusic/icons/close.svg', import.meta.url).href
const chevronIcon = new URL('@/assets/iMusic/icons/Right.svg', import.meta.url).href

function toggleGroup(key: string) {
  if (openGroups.value.has(key)) {
    openGroups.value.delete(key)
  } else {
    openGroups.value.add(key)
  }
  // 触发响应式更新
  openGroups.value = new Set(openGroups.value)
}

function selectCategory(item: PrimaryItem, type: 'user' | 'blog', gIdx?: number, idx?: number) {
  activeKey.value = type === 'user' ? 'user-' + gIdx : 'blog-' + gIdx + '-' + idx
  emit('select-category', item, type)
}

// 默认展开第一个可用分组
if (props.userCategories.length > 0) {
  openGroups.value.add('own')
} else if (props.blogCategories.length > 0) {
  openGroups.value.add('blog-0')
}
</script>

<style lang="scss" scoped>
.site-category {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  height: calc(100vh - 160px);
  overflow-y: auto;
  border: 1px solid #e8ecf1;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
}

// ---- 添加按钮 ----
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 9px 0;
  border: 1px solid #0078d4;
  border-radius: 8px;
  background: #fff;
  color: #0078d4;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;

  &:hover {
    background: #0078d4;
    color: #fff;

    .add-btn__icon {
      filter: brightness(0) invert(1);
    }
  }

  &__icon {
    width: 16px;
    height: 16px;
    transition: filter 0.15s;
  }
}

// ---- 分类面板 ----
.category-panel {
  display: flex;
  flex-direction: column;
}

.category-group {
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 10px 6px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.12s;
    border-radius: 6px;

    &:hover {
      background: #f8fafc;
    }
  }

  &__chevron {
    width: 14px;
    height: 14px;
    transition: transform 0.2s ease;
    flex-shrink: 0;

    &.is-open {
      transform: rotate(90deg);
    }
  }

  &__items {
    display: flex;
    flex-direction: column;
    padding: 2px 0 6px 22px;
  }
}

.category-item {
  padding: 7px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  color: #475569;
  text-align: left;
  cursor: pointer;
  transition: all 0.12s;
  font-family: inherit;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  &--active {
    background: rgba(0, 120, 212, 0.08);
    color: #0078d4;
    font-weight: 500;
  }
}

.category-empty {
  font-size: 13px;
  color: #9ca3af;
  padding: 6px 10px;
  margin: 0;
}
</style>
