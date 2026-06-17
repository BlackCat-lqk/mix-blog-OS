<template>
  <div class="photos-toolbar" role="toolbar" aria-label="照片工具栏">
    <!-- 左侧：标签切换 -->
    <div class="photos-toolbar__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="photos-toolbar__tab"
        :class="{ 'photos-toolbar__tab--active': activeTab === tab.key }"
        :aria-pressed="activeTab === tab.key"
        @click="$emit('update:activeTab', tab.key)"
      >
        <!-- 简单图标 -->
        <svg v-if="tab.key === 'gallery'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <svg v-else-if="tab.key === 'albums'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v15H6.5A2.5 2.5 0 004 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        <svg v-else-if="tab.key === 'search'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span class="photos-toolbar__tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- 中间：密度调节 -->
    <div class="photos-toolbar__density">
      <button
        class="photos-toolbar__density-btn"
        :disabled="columnCount <= minColumns"
        aria-label="减少列数"
        @click="decreaseColumns"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <span class="photos-toolbar__density-value">{{ columnCount }}</span>
      <button
        class="photos-toolbar__density-btn"
        :disabled="columnCount >= maxColumns"
        aria-label="增加列数"
        @click="increaseColumns"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <!-- 右侧：选择按钮 -->
    <div class="photos-toolbar__actions">
      <button class="photos-toolbar__select-btn" @click="$emit('enterSelection')">
        选择
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolbarTab } from "./types";

const props = defineProps<{
  activeTab: ToolbarTab;
  columnCount: number;
}>();

const emit = defineEmits<{
  "update:activeTab": [tab: ToolbarTab];
  "update:columnCount": [count: number];
  "enterSelection": [];
}>();

const minColumns = 2;
const maxColumns = 8;

const tabs: { key: ToolbarTab; label: string }[] = [
  { key: "gallery", label: "图库" },
  { key: "albums", label: "相册" },
  { key: "search", label: "搜索" },
];

function increaseColumns() {
  if (props.columnCount < maxColumns) {
    emit("update:columnCount", props.columnCount + 1);
  }
}

function decreaseColumns() {
  if (props.columnCount > minColumns) {
    emit("update:columnCount", props.columnCount - 1);
  }
}
</script>

<style scoped lang="scss">
.photos-toolbar {
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

  &__tabs {
    display: flex;
    gap: 4px;
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba(255, 255, 255, 0.55);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
      background: rgba(255, 255, 255, 0.08);
    }

    &--active {
      color: #fff;
      background: rgba(255, 255, 255, 0.12);
    }
  }

  &__tab-label {
    // 保留结构以备后续需要隐藏文字
  }

  &__density {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__density-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;

    &:hover:not(:disabled) {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    &:disabled {
      opacity: 0.25;
      cursor: default;
    }
  }

  &__density-value {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    min-width: 16px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  &__actions {
    display: flex;
    align-items: center;
  }

  &__select-btn {
    padding: 6px 16px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.18);
    }
  }
}
</style>
