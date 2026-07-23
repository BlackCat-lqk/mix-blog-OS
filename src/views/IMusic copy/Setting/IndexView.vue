<template>
  <div v-show="props.show" class="setting-main-box">
    <div class="seeting-inner-box">
      <header class="setting-header">
        <h2 class="setting-title">设置</h2>
        <button type="button" class="close-btn" aria-label="关闭" @click="closeSetting">
          <img src="@/assets/icon/Close.svg" alt="" />
        </button>
      </header>
      <p class="setting-desc">管理账户相关功能与曲库内容</p>
      <div class="setting-layout">
        <div class="setting-menu">
          <button type="button" class="setting-action-box" @click="showEditSong = !showEditSong">
            <span class="muen">
              <img src="@/assets/icon/more.svg" alt="" />
              编辑歌曲
            </span>
            <span class="icon">
              <img src="@/assets/icon/Right.svg" alt="" />
            </span>
          </button>
          <button type="button" class="delete-song-box" @click="showDeleteSong = !showDeleteSong">
            <span class="muen">
              <img src="@/assets/icon/delete.svg" alt="" />
              删除歌曲
            </span>
            <span class="icon">
              <img src="@/assets/icon/Right.svg" alt="" />
            </span>
          </button>
        </div>
        <aside class="setting-panel">
          <h3 class="setting-panel-title">当前页说明</h3>
          <p class="setting-panel-text">
            编辑歌曲：用于修改歌曲名称、歌手、时长以及音频/封面/歌词文件。
          </p>
          <p class="setting-panel-text">
            删除歌曲：支持按歌名或歌手快速搜索并删除，操作不可恢复。
          </p>
          <p class="setting-panel-tip">建议操作前先确认已登录且网络稳定。</p>
        </aside>
      </div>
    </div>
  </div>
  <DeleteSong v-model:show="showDeleteSong" />
  <EditSong v-model:show="showEditSong" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import DeleteSong from './DeleteSong.vue'
import EditSong from './EditSong.vue'

const showDeleteSong = ref(false)
const showEditSong = ref(false)
const emit = defineEmits(['update:show'])
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const closeSetting = () => {
  emit('update:show', false)
}
</script>

<style scoped lang="scss">
.setting-main-box {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  z-index: var(--z-drawer-overlay);
  padding: 0;
  backdrop-filter: blur(10px);
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.72);
  box-shadow: inset 0 0 10px 1px rgba(255, 255, 255, 0.2);
}

.seeting-inner-box {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 16px 0 24px;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(22, 32, 26, 0.98) 0%, rgba(15, 23, 18, 0.99) 100%);
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.setting-title {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  color: #f5f5f5;
  letter-spacing: 0.04em;
}

.close-btn {
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  img {
    width: 24px;
    height: 24px;
  }
}

.setting-desc {
  display: none;
  margin: 0;
  padding: 12px 16px 0;
  font-size: 13px;
  line-height: 1.5;
  color: #9ca3af;
}

.setting-menu {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-panel {
  margin: 0 16px;
  border-radius: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.setting-panel-title {
  margin: 0;
  color: #f3f4f6;
  font-size: 14px;
  font-weight: 600;
}

.setting-panel-text {
  margin: 10px 0 0;
  color: #c2c7d0;
  font-size: 13px;
  line-height: 1.55;
}

.setting-panel-tip {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(31, 186, 45, 0.08);
  border: 1px solid rgba(74, 222, 111, 0.2);
  color: #b8f3c8;
  font-size: 12px;
}

.setting-action-box,
.delete-song-box {
  width: 100%;
  border-radius: 14px;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1a261e;
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  padding: 0 16px;
  box-sizing: border-box;
  font-family: inherit;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:active {
    background: #243628;
  }

  .muen {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-size: 16px;

    img {
      width: 20px;
      height: 20px;
    }
  }

  .icon {
    display: flex;
    align-items: center;
    opacity: 0.6;

    img {
      width: 18px;
      height: 18px;
    }
  }
}

@media (min-width: 900px) {
  .setting-main-box {
    left: var(--imusic-pc-sidebar-width);
    right: 0;
    top: 0;
    bottom: 0;
    width: auto;
    height: auto;
    padding: 0;
    background: rgba(12, 14, 13, 0.94);
    backdrop-filter: none;
    box-shadow: none;
    align-items: stretch;
  }

  .seeting-inner-box {
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: none;
    border-right: none;
    padding: 28px 32px 40px;
    background: linear-gradient(180deg, rgba(24, 36, 29, 0.98) 0%, rgba(13, 20, 16, 0.99) 100%);
    box-shadow: none;
  }

  .setting-header {
    padding: 0 0 20px;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .setting-title {
    font-size: 22px;
  }

  .setting-desc {
    display: block;
    padding: 16px 0 8px;
  }

  .setting-menu {
    padding: 0;
    gap: 12px;
  }

  .setting-layout {
    padding-top: 24px;
    display: grid;
    grid-template-columns: minmax(340px, 520px) minmax(280px, 1fr);
    gap: 18px;
    align-items: start;
  }

  .setting-panel {
    margin: 0;
    min-height: 100%;
    box-sizing: border-box;
    padding: 16px 18px;
  }

  .setting-action-box,
  .delete-song-box {
    min-height: 56px;
    padding: 0 20px;
    border-radius: 12px;
    background: rgba(26, 38, 30, 0.9);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;

    &:hover {
      background: rgba(31, 186, 45, 0.12);
      border-color: rgba(62, 232, 106, 0.25);
    }

    .muen {
      font-size: 15px;
    }

    .icon {
      opacity: 0.85;
    }
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
