<!-- * @description: 图库空状态 — 无图片时的引导占位 -->
<template>
  <div class="empty-state" role="region" aria-label="空状态">
    <div class="empty-state__icon">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="8" y="12" width="64" height="56" rx="6" stroke="currentColor" stroke-width="2" />
        <circle cx="28" cy="32" r="8" stroke="currentColor" stroke-width="2" />
        <path d="M8 54L26 36L36 46L48 34L72 54" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      </svg>
    </div>
    <h2 class="empty-state__title">无照片</h2>
    <p class="empty-state__desc">将照片拖放到此处，或点击下方按钮导入</p>
    <button class="empty-state__btn" @click="$emit('import')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      导入照片
    </button>
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="empty-state__input"
      @change="$emit('import')"
    />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  import: [];
}>();
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
  user-select: none;

  &__icon {
    opacity: 0.5;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
  }

  &__desc {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    max-width: 240px;
    line-height: 1.5;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    background: #007aff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: #0066d6;
    }

    &:active {
      background: #0055b3;
    }
  }

  &__input {
    display: none;
  }
}
</style>
