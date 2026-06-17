<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useFileTabs } from "./useFileTabs";
import { useViewerHeight } from "./useViewerHeight";
import FilePreview from "@/components/FilePreview.vue";
import filesIcon from "@/assets/filePreview/images/files.svg";

const {
  tabs,
  activeTabId,
  isDragOver,
  activeTab,
  showUpload,
  closeTab,
  closeAll,
  closeLeft,
  closeRight,
  switchTab,
  handleFileSelect,
  triggerFileInput,
  handleDrop,
  handleDragOver,
  handleDragLeave,
} = useFileTabs();

const { viewerHeight } = useViewerHeight(activeTabId);

// ==================== 右键菜单 ====================
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  tabId: -1,
});

const showContextMenu = (event: MouseEvent, tabId: number) => {
  event.preventDefault();
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    tabId,
  };
};

const hideContextMenu = () => {
  contextMenu.value.visible = false;
};

const handleContextAction = (action: "closeCurrent" | "closeAll" | "closeLeft" | "closeRight") => {
  const { tabId } = contextMenu.value;
  switch (action) {
    case "closeCurrent":
      closeTab(tabId);
      break;
    case "closeAll":
      closeAll();
      break;
    case "closeLeft":
      closeLeft(tabId);
      break;
    case "closeRight":
      closeRight(tabId);
      break;
  }
  hideContextMenu();
};

const onGlobalClick = () => hideContextMenu();

onMounted(() => document.addEventListener("click", onGlobalClick));
onUnmounted(() => document.removeEventListener("click", onGlobalClick));
</script>

<template>
  <div class="file-preview">
    <input
      ref="fileInputRef"
      type="file"
      multiple
      class="file-preview__input"
      @change="handleFileSelect"
    />

    <!-- Tab 栏 -->
    <div v-if="!showUpload" class="file-preview__tab-bar">
      <div class="file-preview__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="file-preview__tab"
          :class="{ 'file-preview__tab--active': tab.id === activeTabId }"
          @click="switchTab(tab.id)"
          @contextmenu="showContextMenu($event, tab.id)"
          :title="tab.name"
        >
          <span class="file-preview__tab-name">{{ tab.name }}</span>
          <span class="file-preview__tab-close" @click.stop="closeTab(tab.id)" title="关闭">×</span>
        </button>
        <button class="file-preview__add-btn" @click="triggerFileInput" title="打开文件">+</button>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="file-preview__context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <button @click="handleContextAction('closeCurrent')">关闭当前</button>
      <button @click="handleContextAction('closeLeft')">关闭左侧</button>
      <button @click="handleContextAction('closeRight')">关闭右侧</button>
      <button @click="handleContextAction('closeAll')">关闭所有</button>
    </div>

    <!-- 预览区域 -->
    <div
      v-if="!showUpload && activeTab"
      class="file-preview__viewer"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div ref="viewerWrapperRef" class="file-preview__viewer-body">
        <FilePreview
          v-if="viewerHeight > 0"
          :file="activeTab.file"
          :file-name="activeTab.name"
          :height="viewerHeight"
        />
      </div>
    </div>

    <!-- 上传区域 -->
    <div
      v-if="showUpload"
      class="file-preview__upload"
      :class="{ 'file-preview__upload--dragover': isDragOver }"
      @click="triggerFileInput"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="file-preview__upload-content">
        <div class="file-preview__icon">
          <img :src="filesIcon" alt="files" />
        </div>
        <p class="file-preview__text">点击选择文件，或拖拽文件到此处</p>
        <p class="file-preview__hint">支持图片、PDF、Office 文档、文本文件</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.file-preview {
  height: 100%;
  display: flex;
  flex-direction: column;

  // ========== Tab 栏 ==========
  &__tab-bar {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.02);
  }

  &__tabs {
    display: flex;
    align-items: stretch;
    overflow-x: auto;
    overflow-y: hidden;

    &::-webkit-scrollbar {
      height: 2px;
    }
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 6px 12px;
    border: none;
    background: transparent;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
    cursor: pointer;
    font-size: 13px;
    color: #888;
    white-space: nowrap;
    transition:
      background 0.15s,
      color 0.15s;
    max-width: 180px;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
      color: #444;
    }

    &--active {
      background: #fff;
      color: #222;
      border-bottom: 2px solid #4a9eff;
      margin-bottom: -1px;

      .file-preview__tab-close {
        opacity: 1;
      }
    }
  }

  &__tab-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  &__tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1;
    opacity: 0;
    transition:
      opacity 0.15s,
      background 0.15s;
    flex-shrink: 0;

    .file-preview__tab:hover & {
      opacity: 0.5;
    }

    &:hover {
      opacity: 1 !important;
      background: rgba(0, 0, 0, 0.1);
      color: #e00;
    }
  }

  &__add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    flex-shrink: 0;
    position: sticky;
    right: 0;
    border: none;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.7) 70%);
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: #222;
    }
  }

  // ========== 右键菜单 ==========
  &__context-menu {
    position: fixed;
    z-index: 9999;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    padding: 4px 0;
    min-width: 120px;

    button {
      display: block;
      width: 100%;
      padding: 6px 16px;
      border: none;
      background: transparent;
      font-size: 13px;
      color: #444;
      text-align: left;
      cursor: pointer;
      white-space: nowrap;

      &:hover {
        background: #f0f0f0;
        color: #111;
      }
    }
  }

  // ========== 预览区 ==========
  &__viewer {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  &__viewer-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  // ========== 上传区 ==========
  &__upload {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    margin: 16px;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background 0.2s;

    &:hover {
      border-color: rgba(0, 0, 0, 0.3);
      background: rgba(0, 0, 0, 0.02);
    }

    &--dragover {
      border-color: #4a9eff;
      background: rgba(74, 158, 255, 0.08);
    }
  }

  &__input {
    display: none;
  }

  &__upload-content {
    text-align: center;
    user-select: none;
    pointer-events: none;
  }

  &__icon {
    color: rgba(0, 0, 0, 0.2);
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
  }

  &__text {
    color: #666;
    font-size: 15px;
    margin: 0 0 8px;
  }

  &__hint {
    color: #999;
    font-size: 12px;
    margin: 0;
  }
}
</style>
