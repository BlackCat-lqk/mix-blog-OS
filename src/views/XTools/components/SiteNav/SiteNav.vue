<template>
  <div class="site-nav">
    <!-- 左侧：分类面板 -->
    <SiteCategory
      :form-visible="formVisible"
      :user-categories="userCategories"
      :blog-categories="blogCategories"
      @toggle-form="toggleForm"
      @create-site="handleCreateSite"
      @select-category="handleSelectCategory"
    />

    <!-- 右侧：内容区 -->
    <SiteContent
      :categories="displayCategories"
      :show-delete="showDelete"
      @delete-site="handleDeleteSite"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@/utils/message'
import { useUserInfoStore } from '@/stores/iMusic/userInfo'
import SiteCategory from './components/SiteCategory.vue'
import SiteContent from './components/SiteContent.vue'
import type { SiteFormData } from './components/SiteForm.vue'
import type { PrimaryItem, BlogGroup, SiteItem } from './components/SiteCategory.vue'

// ============================================================================
// Store & State
// ============================================================================
const userInfoStore = useUserInfoStore()

const formVisible = ref(false)
const showDelete = ref(false)
const userCategories = ref<PrimaryItem[]>([])
const blogCategories = ref<BlogGroup[]>([])
const displayCategories = ref<PrimaryItem[]>([])

// ============================================================================
// 生成唯一 ID
// ============================================================================
let _idCounter = Date.now()
function genId(): string {
  return 'site_' + (++_idCounter).toString(36)
}

// ============================================================================
// Mock 数据（作为 API 未实现时的占位）
// ============================================================================
function getMockData() {
  return {
    user: [
      {
        primaryCategory: 'mysite',
        primaryItem: [],
      },
    ],
    blog: [
      {
        primaryCategory: '开发工具',
        primaryItem: [
          {
            secondaryCategory: '前端框架',
            data: [
              { _id: genId(), siteName: 'Vue.js', link: 'https://vuejs.org', desc: '渐进式 JavaScript 框架', icon: '', secondaryCategory: '前端框架' },
              { _id: genId(), siteName: 'React', link: 'https://react.dev', desc: '用于构建 Web 和原生用户界面的库', icon: '', secondaryCategory: '前端框架' },
              { _id: genId(), siteName: 'Svelte', link: 'https://svelte.dev', desc: '编译时框架，无虚拟 DOM', icon: '', secondaryCategory: '前端框架' },
            ],
          },
          {
            secondaryCategory: '构建工具',
            data: [
              { _id: genId(), siteName: 'Vite', link: 'https://vitejs.dev', desc: '下一代前端构建工具', icon: '', secondaryCategory: '构建工具' },
              { _id: genId(), siteName: 'Turbopack', link: 'https://turbo.build', desc: 'Rust 驱动的增量打包工具', icon: '', secondaryCategory: '构建工具' },
            ],
          },
        ],
      },
      {
        primaryCategory: '设计资源',
        primaryItem: [
          {
            secondaryCategory: '图标库',
            data: [
              { _id: genId(), siteName: 'Lucide', link: 'https://lucide.dev', desc: '精美的一致性图标库', icon: '', secondaryCategory: '图标库' },
              { _id: genId(), siteName: 'Heroicons', link: 'https://heroicons.com', desc: 'Tailwind 团队出品的 SVG 图标', icon: '', secondaryCategory: '图标库' },
            ],
          },
          {
            secondaryCategory: '配色工具',
            data: [
              { _id: genId(), siteName: 'Coolors', link: 'https://coolors.co', desc: '快速配色方案生成器', icon: '', secondaryCategory: '配色工具' },
            ],
          },
        ],
      },
    ],
  }
}

// ============================================================================
// 数据加载
// ============================================================================
async function loadSiteData() {
  // TODO: 替换为真实 API 调用
  // const result = await getSiteApi({ userId: ... })
  const data = getMockData()

  const userFirst = data.user?.[0]
  if (userFirst && userFirst.primaryItem.length > 0) {
    userCategories.value = userFirst.primaryItem
    displayCategories.value = userFirst.primaryItem
    showDelete.value = true
  }

  blogCategories.value = data.blog

  const blogFirst = data.blog?.[0]
  if (displayCategories.value.length === 0 && blogFirst) {
    displayCategories.value = blogFirst.primaryItem
    showDelete.value = false
  }
}

onMounted(() => {
  loadSiteData()
})

// ============================================================================
// 交互处理
// ============================================================================
function toggleForm() {
  // if (!userInfoStore.data.token) {
  //   Message.warning('请先登录')
  //   return
  // }
  formVisible.value = !formVisible.value
}

function handleCreateSite(formData: SiteFormData) {
  const newSite: SiteItem = {
    _id: genId(),
    siteName: formData.siteName,
    link: formData.link,
    desc: formData.desc,
    icon: '',
    secondaryCategory: formData.secondaryCategory,
  }

  // 查找是否已有该分类
  const existing = userCategories.value.find(
    (c) => c.secondaryCategory === formData.secondaryCategory,
  )

  if (existing) {
    existing.data.push(newSite)
  } else {
    const newCategory: PrimaryItem = {
      secondaryCategory: formData.secondaryCategory,
      data: [newSite],
    }
    userCategories.value.push(newCategory)
  }

  displayCategories.value = [...userCategories.value]
  showDelete.value = true
  formVisible.value = false
  Message.success('站点添加成功')
}

function handleSelectCategory(item: PrimaryItem, type: 'user' | 'blog') {
  displayCategories.value = [item]
  showDelete.value = type === 'user'
}

function handleDeleteSite(siteId: string) {
  // 从 userCategories 中移除
  for (const cat of userCategories.value) {
    const idx = cat.data.findIndex((s) => s._id === siteId)
    if (idx !== -1) {
      cat.data.splice(idx, 1)
      break
    }
  }

  // 清理空分类
  userCategories.value = userCategories.value.filter((c) => c.data.length > 0)

  // 同步更新显示
  displayCategories.value = [...userCategories.value]
  Message.success('站点已删除')
}
</script>

<style lang="scss" scoped>
.site-nav {
  display: flex;
  gap: 16px;
  padding: 24px;
  height: calc(100vh - 120px);
  min-width: 640px;
  max-width: 1480px;
  margin: 0 auto;
  background: #f0f2f5;
  border-radius: 8px;
}
</style>
