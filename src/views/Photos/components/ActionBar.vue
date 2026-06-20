<template>
  <div class="action-bar" role="toolbar" aria-label="选择操作">
    <!-- 左侧：已选数量 + 取消 -->
    <div class="action-bar__left">
      <span class="action-bar__count">{{ selectedCount }} 张已选择</span>
      <button class="action-bar__cancel" @click="$emit('cancelSelection')">取消</button>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="action-bar__actions">
      <button class="action-bar__btn" aria-label="分享" @click="$emit('share')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>分享</span>
      </button>
      <button class="action-bar__btn" aria-label="收藏" @click="$emit('favoriteSelected')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        <span>收藏</span>
      </button>
      <button class="action-bar__btn action-bar__btn--danger" aria-label="删除" @click="$emit('deleteSelected')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
        <span>删除</span>
      </button>
    </div>
  </div>
</template>

<!-- * @description: 操作栏 — 选中计数、批量删除、取消选择 -->
<script setup lang="ts">
defineProps<{
  selectedCount: number;
}>();

defineEmits<{
  share: [];
  favoriteSelected: [];
  deleteSelected: [];
  cancelSelection: [];
}>();
</script>

<style scoped lang="scss">
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__count {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  }

  &__cancel {
    padding: 4px 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: transparent;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &__actions {
    display: flex;
    gap: 4px;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    &--danger {
      color: #ff453a;

      &:hover {
        background: rgba(255, 69, 58, 0.15);
      }
    }
  }
}
</style>
