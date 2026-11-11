<!-- 公共窗口外壳：标题栏、窗口控制及侧边栏/内容插槽 -->
<template>
  <div v-show="!isMinimized" class="os-window" :class="{
    'os-window--maximized': isMaximized,
    'os-window--dragging': dragging,
    'os-window--resizing': resizing,
  }" :style="windowStyle" role="dialog" :aria-label="title" @mousedown.capture="emit('activate')"
    @focusin="emit('activate')">
    <!-- resize handles -->
    <div class="os-resize os-resize--n" data-resize="n" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--s" data-resize="s" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--e" data-resize="e" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--w" data-resize="w" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--ne" data-resize="ne" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--nw" data-resize="nw" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--se" data-resize="se" @mousedown="onResizeMouseDown"></div>
    <div class="os-resize os-resize--sw" data-resize="sw" @mousedown="onResizeMouseDown"></div>

    <!-- titlebar -->
    <div class="os-window__titlebar" @mousedown="onTitlebarMouseDown" @dblclick.stop="toggleMaximize">
      <div class="os-window__titlebar__lf">
        <div v-if="icon" class="os-window__icon">
          <img :src="icon" alt="" />
        </div>
        <span class="os-window__title">{{ title }}</span>
      </div>

      <div class="os-window__controls" @mousedown.stop @dblclick.stop>
        <button class="os-window__btn os-window__btn--minimize" type="button" @click="isMinimized = true" title="最小化"
          aria-label="最小化">
          <img :src="minimize" alt="" />
        </button>
        <button class="os-window__btn" type="button" @click="toggleMaximize" :title="isMaximized ? '还原' : '最大化'"
          :aria-label="isMaximized ? '还原' : '最大化'">
          <img :src="isMaximized ? restore : maximize" alt="" />
        </button>
        <button class="os-window__btn os-window__btn--close" type="button" @mouseenter="moveClose = true" @mouseleave="moveClose = false" @click="emit('close')" title="关闭"
          aria-label="关闭">
          <img :src="moveClose ? closeLight : close" alt="" />
        </button>
      </div>
    </div>

    <div class="os-window__body">
      <slot name="sidebar" />
      <div class="os-window__content">
        <slot />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import minimize from '@/assets/icons/minimize.svg'
import close from '@/assets/icons/close.svg'
import closeLight from '@/assets/icons/close-light.svg'
import maximize from '@/assets/icons/maximize.svg'
import restore from '@/assets/icons/maximize-defalut.svg'
import { useWindowGeometry } from './useWindowGeometry'

defineOptions({ name: 'OsWindow' })
defineProps<{ title?: string; icon?: string }>()
const emit = defineEmits<{ close: []; activate: [] }>()
const isMinimized = defineModel<boolean>('minimized', { default: false })
const moveClose = ref(false)
const {
  windowStyle,
  isMaximized,
  dragging,
  resizing,
  toggleMaximize,
  onTitlebarMouseDown,
  onResizeMouseDown,
} = useWindowGeometry()
</script>
<style scoped lang="scss">
// ---- variables ----
$titlebar-h: 40px;
$close-hover: #DB382C;
$text-color: #000;

.os-window {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  border-radius: 15px;
  outline-color: rgba(11,11,12,0.06);
  outline-style: solid;
  outline-width: 1px;
  outline-offset: 0px;
  // border: 1px solid rgba(11,11,12,0.06);
  background: #F3F3F3;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  &--dragging,
  &--resizing {
    user-select: none;
  }

  // 最大化：全屏铺满
  &--maximized {
    border-radius: 0;
    border-color: transparent;

    .os-resize {
      display: none;
    }
  }
}

// ---- titlebar ----
.os-window__titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 15px;
  height: $titlebar-h;
  color: $text-color;
  user-select: none;
  flex-shrink: 0;
  cursor: move;
}

.os-window__titlebar__lf {
  display: flex;
  align-items: center;
  gap: 8px;
}

.os-window__icon {
  width: 24px;
  min-width: 24px;

  img {
    width: 100%;
    height: 100%;
  }
}

.os-window__title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.os-window__controls {
  display: flex;
  height: 100%;
  align-items: flex-start;
}

.os-window__btn {
  width: 42px;
  height: 100%;
  border: none;
  background: transparent;
  color: $text-color;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  img {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: #EAEAEA;
    cursor: pointer;
  }

  &--close:hover {
    background: $close-hover;
    color: #fff;
  }
}

// ---- body ----
.os-window__body {
  flex: 1;
  display: flex;
  gap: 10px;
  min-height: 0;
  padding: 0 10px 10px 10px;
  overflow: hidden;
}

.os-window__content {
  position: relative;
  isolation: isolate;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border-radius: 15px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    z-index: 1;
    height: 24px;
    pointer-events: none;
    background: linear-gradient(var(--edge-direction), rgba(255, 255, 255, 0.75), transparent);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    -webkit-mask-image: linear-gradient(var(--edge-direction), #000, transparent);
    mask-image: linear-gradient(var(--edge-direction), #000, transparent);
  }

  &::before {
    --edge-direction: to bottom;
    top: 0;
    border-radius: 15px 15px 0 0;
  }

  &::after {
    --edge-direction: to top;
    bottom: 0;
    border-radius:  0 0 15px 15px;
  }
}

// ---- resize handles ----
.os-resize {
  position: absolute;
  z-index: 110;

  &--n {
    top: -3px;
    left: 8px;
    right: 8px;
    height: 6px;
    cursor: n-resize;
  }

  &--s {
    bottom: -3px;
    left: 8px;
    right: 8px;
    height: 6px;
    cursor: s-resize;
  }

  &--e {
    right: -3px;
    top: 8px;
    bottom: 8px;
    width: 6px;
    cursor: e-resize;
  }

  &--w {
    left: -3px;
    top: 8px;
    bottom: 8px;
    width: 6px;
    cursor: w-resize;
  }

  &--ne {
    top: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: ne-resize;
  }

  &--nw {
    top: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: nw-resize;
  }

  &--se {
    bottom: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    cursor: se-resize;
  }

  &--sw {
    bottom: -3px;
    left: -3px;
    width: 12px;
    height: 12px;
    cursor: sw-resize;
  }
}
</style>
