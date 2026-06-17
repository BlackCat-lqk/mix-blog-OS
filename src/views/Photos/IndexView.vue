<!-- * @description: 图库应用 — 图片导入、网格浏览、多选删除、全屏查看器 -->
<script setup lang="ts">
import { ref, computed, onUnmounted, type Ref } from "vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import EmptyState from "./components/EmptyState.vue";
import PhotoGrid from "./components/PhotoGrid.vue";
import PhotoViewer from "./components/PhotoViewer.vue";
import BottomToolbar from "./components/BottomToolbar.vue";
import ActionBar from "./components/ActionBar.vue";
import type { PhotoItem, ToolbarTab, ViewerState } from "./components/types";

// ============================================================
// 状态
// ============================================================

// NOTE: photos uses deep ref() rather than shallowRef() because
// toggleFavoriteViewer mutates individual items (photo.favorite = !photo.favorite).
// shallowRef would not track these mutations and would break viewer reactivity.
const photos: Ref<PhotoItem[]> = ref([]);
const loading = ref(false);
const activeTab = ref<ToolbarTab>("gallery");
const columnCount = ref(4);
const selectionMode = ref(false);
const selectedIds: Ref<Set<string>> = ref(new Set());
const viewer = ref<ViewerState>({ visible: false, currentIndex: 0 });

// 隐藏的 file input ref
const fileInput = ref<HTMLInputElement | null>(null);

// ============================================================
// 计算属性
// ============================================================

const selectedCount = computed(() => selectedIds.value.size);

// ============================================================
// Demo 数据（picsum 占位图）
// ============================================================

const generateDemoPhotos = (): PhotoItem[] => {
  const demoPhotos: PhotoItem[] = [];
  // 多种宽高比的种子尺寸（宽 × 高）
  const dimensions = [
    [800, 600], [600, 800], [800, 800], [800, 533], [400, 600],
    [600, 400], [800, 1200], [1200, 800], [600, 600], [500, 800],
    [800, 500], [400, 400], [900, 600], [600, 900], [800, 450],
    [450, 800], [700, 700], [1000, 667], [667, 1000], [800, 640],
    [640, 800], [800, 700], [700, 800], [500, 500], [800, 350],
    [600, 600], [900, 900], [800, 1000], [1000, 800], [300, 400],
  ];

  for (let i = 0; i < 30; i++) {
    const dim = dimensions[i] ?? [800, 600];
    const [w, h] = dim;
    const seed = `photos-${i + 1}`;
    demoPhotos.push({
      id: `demo-${i + 1}`,
      url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
      width: w,
      height: h,
      name: `照片 ${i + 1}`,
      favorite: i % 5 === 0, // 每第 5 张标记收藏
      date: new Date(2026, 5, 15 - Math.floor(i / 3)),
    });
  }

  return demoPhotos;
}

// 初始化：加载 demo 数据
photos.value = generateDemoPhotos();

// ============================================================
// 文件导入
// ============================================================

const triggerImport = () => {
  fileInput.value?.click();
}

const handleFileChange = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  loading.value = true;
  const newPhotos: PhotoItem[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const url = URL.createObjectURL(file);

    // 读取图片尺寸
    const dimensions = await getImageDimensions(url);
    newPhotos.push({
      id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      width: dimensions.width,
      height: dimensions.height,
      name: file.name,
      date: new Date(),
    });
  }

  photos.value = [...photos.value, ...newPhotos];
  loading.value = false;

  // 重置 input 以允许重复选择同一文件
  (e.target as HTMLInputElement).value = "";
}

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 }); // 降级默认
    };
    img.src = url;
  });
}

// ============================================================
// 选择逻辑
// ============================================================

const enterSelectionMode = () => {
  selectionMode.value = true;
}

const exitSelectionMode = () => {
  selectionMode.value = false;
  selectedIds.value = new Set();
}

const toggleSelect = (id: string) => {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
    // 若清空则退出选择模式
    if (next.size === 0) {
      selectionMode.value = false;
    }
  } else {
    next.add(id);
  }
  selectedIds.value = next;
}

const deleteSelected = () => {
  const ids = selectedIds.value;
  // 清理 Object URL
  for (const photo of photos.value) {
    if (ids.has(photo.id) && photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
  }
  photos.value = photos.value.filter((p) => !ids.has(p.id));
  exitSelectionMode();
}

// ============================================================
// 查看器逻辑
// ============================================================

const openViewer = (index: number) => {
  viewer.value = { visible: true, currentIndex: index };
}

const closeViewer = () => {
  viewer.value = { visible: false, currentIndex: 0 };
}

const navigateViewer = (index: number) => {
  viewer.value = { ...viewer.value, currentIndex: index };
}

const deleteFromViewer = (index: number) => {
  const photo = photos.value[index];
  if (photo && photo.url.startsWith("blob:")) {
    URL.revokeObjectURL(photo.url);
  }
  photos.value = photos.value.filter((_, i) => i !== index);
  if (photos.value.length === 0) {
    closeViewer();
  } else {
    // 调整索引
    const newIdx = Math.min(index, photos.value.length - 1);
    viewer.value = { ...viewer.value, currentIndex: newIdx };
  }
}

const toggleFavoriteViewer = (index: number) => {
  const photo = photos.value[index];
  if (photo) {
    photo.favorite = !photo.favorite;
  }
}

// ============================================================
// 生命周期清理
// ============================================================

onUnmounted(() => {
  // 清理所有 blob URL
  for (const photo of photos.value) {
    if (photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
  }
});
</script>

<template>
  <div class="photos-app">
    <!-- 隐藏的文件导入 input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="photos-app__hidden-input"
      @change="handleFileChange"
    />

    <!-- 空状态 -->
    <EmptyState
      v-if="photos.length === 0 && !loading"
      @import="triggerImport"
      class="photos-app__empty"
    />

    <!-- 主内容 -->
    <template v-else>
      <!-- 照片网格（滚动区域） -->
      <OverlayScrollbarsComponent
        class="photos-app__scroll"
        :options="{
          scrollbars: {
            autoHide: 'move',
            autoHideDelay: 300,
          },
        }"
        defer
      >
        <PhotoGrid
          :photos="photos"
          :column-count="columnCount"
          :selected-ids="selectedIds"
          :selection-mode="selectionMode"
          @open-viewer="openViewer"
          @toggle-select="toggleSelect"
        />
      </OverlayScrollbarsComponent>

      <!-- 底部栏：选择模式 ? ActionBar : BottomToolbar -->
      <ActionBar
        v-if="selectionMode"
        :selected-count="selectedCount"
        @cancel-selection="exitSelectionMode"
        @delete-selected="deleteSelected"
      />
      <BottomToolbar
        v-else
        :active-tab="activeTab"
        :column-count="columnCount"
        @update:active-tab="activeTab = $event"
        @update:column-count="columnCount = $event"
        @enter-selection="enterSelectionMode"
      />
    </template>

    <!-- 照片查看器（全屏浮层） -->
    <PhotoViewer
      v-if="photos.length > 0"
      :photos="photos"
      :current-index="viewer.currentIndex"
      :visible="viewer.visible"
      @close="closeViewer"
      @navigate="navigateViewer"
      @delete-photo="deleteFromViewer"
      @toggle-favorite="toggleFavoriteViewer"
    />
  </div>
</template>

<style scoped lang="scss">
.photos-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
  overflow: hidden;

  &__hidden-input {
    display: none;
  }

  &__empty {
    flex: 1;
  }

  &__scroll {
    flex: 1;
    min-height: 0;
  }
}
</style>
