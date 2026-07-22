<template>
  <div
    class="site-card"
    :class="{ 'site-card--hovered': hovered }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click="handleClick"
  >
    <a class="site-card__link" @click.prevent="handleClick">
      <h3 class="site-card__title">
        <div class="site-card__icon">
          <img
            :src="site.icon || defaultIcon"
            :alt="site.siteName + ' icon'"
            @error="onIconError"
          />
        </div>
        <span>{{ site.siteName }}</span>
      </h3>
      <p class="site-card__desc">{{ site.desc }}</p>
    </a>

    <!-- 删除按钮 -->
    <div v-if="showDelete" class="site-card__delete" :class="{ 'is-visible': hovered }">
      <button
        class="site-card__delete-btn"
        title="删除站点"
        @click.stop="emitDelete"
      >
        <img :src="deleteIcon" alt="删除" />
      </button>
    </div>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="confirmVisible" class="confirm-overlay" @click.self="confirmVisible = false">
          <div class="confirm-box">
            <p>确认删除「{{ site.siteName }}」吗？</p>
            <div class="confirm-box__actions">
              <button class="btn btn--secondary" @click="confirmVisible = false">取消</button>
              <button class="btn btn--danger" @click="onConfirm">确认删除</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface SiteItem {
  _id: string
  siteName: string
  link: string
  desc: string
  icon: string
  secondaryCategory: string
}

const props = defineProps<{
  site: SiteItem
  showDelete?: boolean
}>()

const emit = defineEmits<{
  delete: [_id: string]
}>()

const hovered = ref(false)
const confirmVisible = ref(false)

// 使用项目已有的图标作为替代
const defaultIcon = new URL('@/assets/iMusic/icons/music.svg', import.meta.url).href
const deleteIcon = new URL('@/assets/iMusic/icons/delete.svg', import.meta.url).href

function onIconError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = defaultIcon
  img.onerror = null
}

function handleClick() {
  // 外部链接跳转倒计时
  let count = 3
  const confirmed = window.confirm(`将在 ${count} 秒后访问外部站点：${props.site.link}`)
  if (confirmed) {
    window.open(props.site.link, '_blank')
  }
}

function emitDelete() {
  confirmVisible.value = true
}

function onConfirm() {
  confirmVisible.value = false
  emit('delete', props.site._id)
}
</script>

<style lang="scss" scoped>
.site-card {
  position: relative;
  width: 220px;
  max-width: 220px;
  height: 78px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  cursor: pointer;
  transform: translateY(0);
  transition: all 0.2s ease-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: #c8cdd5;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  &__link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
    margin: 0 0 6px;
    color: #1e293b;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 6px;
    padding: 4px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__desc {
    font-size: 12px;
    color: #64748b;
    line-height: 18px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__delete {
    position: absolute;
    right: 6px;
    top: 6px;
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;

    &.is-visible {
      opacity: 1;
      pointer-events: auto;
    }
  }

  &__delete-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.08);
    cursor: pointer;
    padding: 4px;
    transition: background 0.15s;

    &:hover {
      background: rgba(239, 68, 68, 0.15);
    }

    img {
      width: 14px;
      height: 14px;
    }
  }
}

// ---------- confirm dialog ----------
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.confirm-box {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-width: 300px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

  p {
    font-size: 15px;
    color: #1e293b;
    margin: 0 0 20px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

.btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.15s;

  &--secondary {
    background: #f1f5f9;
    color: #475569;

    &:hover {
      background: #e2e8f0;
    }
  }

  &--danger {
    background: #ef4444;
    color: #fff;

    &:hover {
      background: #dc2626;
    }
  }
}

// ---------- transitions ----------
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
