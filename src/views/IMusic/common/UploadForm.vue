<template>
  <div
    v-show="props.inline || props.visible"
    :class="props.inline ? 'form-inline-wrapper' : 'form-dialog-overlay'"
    @click.self="onOverlayClick"
  >
    <div :class="props.inline ? 'form-dialog form-dialog--inline' : 'form-dialog'" @click.stop>
      <div class="dialog-header">
        <h3>UPLOAD DATA</h3>
        <button v-if="!props.inline" type="button" class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-body">
        <form
          @submit.prevent="handleSubmit"
          :class="['form-container', { 'form-container--inline-pc': props.inline }]"
        >
          <!-- 歌曲名称-->
          <div class="form-group">
            <label for="title" class="form-label">Song name</label>
            <input
              type="text"
              id="title"
              v-model="formData.title"
              placeholder="Song Name"
              class="form-input"
              required
            />
          </div>

          <!-- 歌手 -->
          <div class="form-group">
            <label for="artist" class="form-label">Artist</label>
            <input
              type="text"
              id="artist"
              v-model="formData.artist"
              placeholder="Artist"
              class="form-input"
              required
            />
          </div>

          <!-- 音频 -->
          <div class="form-group form-group--full">
            <label for="audio" class="form-label">Audio</label>
            <FileUpload
              v-if="!formData.audioUrl"
              ref="audioUrlRef"
              v-model="formData.audioUrl"
              accept=".wav, .mp3, .aac, .flac, .m4a, .ogg, .opus, .wma"
              max-size="1"
              :required="true"
              label="Select Audio"
              @file-selected="(file: File) => handleFile(file, 'audioUrl')"
            />
            <div v-else class="file-info">
              {{ formData.audioUrl.name }}
              <button type="button" class="remove-file" @click="removeFile('audioUrl')">×</button>
            </div>
          </div>

          <!-- 封面 -->
          <div class="form-group">
            <label for="cover" class="form-label">Cover</label>
            <FileUpload
              v-if="!formData.coverUrl"
              ref="coverUrlRef"
              v-model="formData.coverUrl"
              accept="image/*"
              max-size="1"
              :required="true"
              label="Select Cover"
              @file-selected="(file: File) => handleFile(file, 'coverUrl')"
            />
            <div v-else class="file-info">
              {{ formData.coverUrl.name }}
              <button type="button" class="remove-file" @click="removeFile('coverUrl')">×</button>
            </div>
          </div>

          <!-- 歌词文件 -->
          <div class="form-group">
            <label for="lyrics" class="form-label">Lyrics</label>
            <FileUpload
              v-if="!formData.lyricsUrl"
              ref="lyricsUrlRef"
              v-model="formData.lyricsUrl"
              accept=".lrc, .srt, .ass, .ssa, .txt"
              max-size="1"
              :required="true"
              label="Select Lyrics"
              @file-selected="(file: File) => handleFile(file, 'lyricsUrl')"
            />
            <div v-else class="file-info">
              {{ formData.lyricsUrl.name }}
              <button type="button" class="remove-file" @click="removeFile('lyricsUrl')">×</button>
            </div>
          </div>

          <div class="form-actions form-group--full">
            <button type="button" class="btn btn-cancel" @click="handleClose">Cancle</button>
            <button type="submit" class="btn btn-submit" :disabled="submitting">
              {{ submitting ? "Submiting..." : "Submit" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <DialogNotification
    v-if="notificationVisible"
    :visible="notificationVisible"
    title="Info"
    @closeDialog="handleCloseTip"
  >
    <template #content>
      <div style="display: flex; justify-content: center; align-items: center; padding: 20px">
        <span v-if="!uploadLoading" style="color: #fff">{{ inforMsg }}</span>
        <span v-else style="color: #fff">UPLOADING...</span>
      </div>
    </template>
  </DialogNotification>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import FileUpload from "./FileUpload.vue";
// import { createMusicApi } from "@/server/musicHttp";
import DialogNotification from "./DialogNotification.vue";
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  /** 内嵌在页面中展示，不使用全屏遮罩弹窗 */
  inline: {
    type: Boolean,
    default: false,
  },
});
const notificationVisible = ref(false);
const emit = defineEmits(["update:visible"]);

// 表单数据
const formData = reactive({
  title: "",
  artist: "",
  duration: 180,
  audioUrl: null as File | null,
  coverUrl: null as File | null,
  lyricsUrl: null as File | null,
});

const handleFile = (file: File | null, fielName: string) => {
  if (fielName == "audioUrl") {
    formData.audioUrl = file;
  } else if (fielName == "coverUrl") {
    formData.coverUrl = file;
  } else if (fielName == "lyricsUrl") {
    formData.lyricsUrl = file;
  }
  console.log("file", formData);
};
// 提交状态
const submitting = ref(false);
const handleCloseTip = () => {
  notificationVisible.value = false;
};
// 关闭弹窗（内嵌模式仅重置表单）
const handleClose = () => {
  resetForm();
  if (!props.inline) {
    emit("update:visible", false);
  }
};

const onOverlayClick = () => {
  if (!props.inline) handleClose();
};
const removeFile = (value: string) => {
  if (value == "audioUrl") {
    formData.audioUrl = null;
  } else if (value == "coverUrl") {
    formData.coverUrl = null;
  } else if (value == "lyricsUrl") {
    formData.lyricsUrl = null;
  }
};
// 重置表单
const resetForm = () => {
  formData.title = "";
  formData.artist = "";
  formData.duration = 180;
  formData.audioUrl = null;
  formData.coverUrl = null;
  formData.lyricsUrl = null;
};
// 上传
const inforMsg = ref("");
const uploadLoading = ref(false);
const upload = async (params: object) => {
  console.log(params);
  // const res = await createMusicApi(params);
  // if (res.data) {
  //   inforMsg.value = "上传成功";
  // } else {
  //   inforMsg.value = "上传失败, token已过期或请先登录";
  // }
  // notificationVisible.value = true;
  // uploadLoading.value = false;
};

// 表单提交
const handleSubmit = async () => {
  try {
    uploadLoading.value = true;
    submitting.value = true;

    // 验证必填字段
    if (!formData.title.trim()) {
      alert("请填写名称");
      return;
    }

    if (!formData.artist.trim()) {
      alert("请填写名称");
      return;
    }
    const formDataFont = new FormData();
    // 添加音乐信息（对应 createMusicDto）
    formDataFont.append("title", formData.title);
    formDataFont.append("artist", formData.artist);
    formDataFont.append("duration", "240");
    if (formData.audioUrl) {
      formDataFont.append("audioFile", formData.audioUrl);
    }

    if (formData.coverUrl) {
      formDataFont.append("coverFile", formData.coverUrl);
    }

    if (formData.lyricsUrl) {
      formDataFont.append("lyricsFile", formData.lyricsUrl);
    }
    await upload(formDataFont);
    submitting.value = false;
    if (props.inline) {
      resetForm();
    } else {
      handleClose();
    }
  } catch (error) {
    console.error(error);
    notificationVisible.value = true;
    uploadLoading.value = false;
    inforMsg.value = "上传失败, token已过期或请先登录";
  } finally {
    submitting.value = false;
    uploadLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.form-inline-wrapper {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  box-sizing: border-box;

  @media (min-width: 900px) {
    max-width: none;
    margin: 0;
  }
}

.form-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-drawer-overlay);
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.form-dialog {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp 0.3s ease;
}

.form-dialog--inline {
  max-width: none;
  max-height: none;
  animation: none;

  @media (min-width: 900px) {
    background: linear-gradient(165deg, rgba(26, 38, 30, 0.98) 0%, rgba(15, 23, 18, 0.99) 100%);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 14px;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.04) inset,
      0 24px 48px rgba(0, 0, 0, 0.35);
    overflow: visible;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;

  @media (min-width: 900px) {
    .form-dialog--inline & {
      padding: 22px 28px 20px;
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;

    @media (min-width: 900px) {
      .form-dialog--inline & {
        font-size: 20px;
        letter-spacing: 0.04em;
      }
    }
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #dcdcdc;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;

    &:hover {
      background-color: #ffffff;
      color: #666;
    }
  }
}

.dialog-body {
  padding: 24px;

  @media (min-width: 900px) {
    .form-dialog--inline & {
      padding: 28px 32px 32px;
    }
  }
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 900px) {
  .form-container--inline-pc {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px 32px;
    align-items: start;
  }

  .form-container--inline-pc .form-group--full {
    grid-column: 1 / -1;
  }

  .form-container--inline-pc .form-actions {
    margin-top: 8px;
    padding-top: 24px;
    border-top-color: rgba(255, 255, 255, 0.08);
    justify-content: flex-end;
    flex-wrap: wrap;

    .btn {
      flex: 0 0 auto;
      min-width: 120px;
    }

    .btn-submit {
      min-width: 168px;
      background: linear-gradient(135deg, #1c5c28, #148028);
      border: 1px solid rgba(62, 232, 106, 0.35);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #23963a, #1aa844);
      }
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.08);
      color: #e8e8e8;
      border: 1px solid rgba(255, 255, 255, 0.12);

      &:hover {
        background: rgba(255, 255, 255, 0.12);
      }
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .file-info {
    color: #fff;
  }
  .remove-file {
    margin-left: 5px;
    cursor: pointer;
    background-color: #0f3f22;
    color: #fff;
  }
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;

  &::after {
    content: " *";
    color: #ff4d4f;
    opacity: 0.8;
  }

  &:has(~ :not([required]))::after {
    content: "";
  }
}

.form-input {
  padding: 12px;
  border: 1px solid #ffffff;
  border-radius: 8px;
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;

  @media (min-width: 900px) {
    .form-dialog--inline & {
      padding: 12px 14px;
      font-size: 15px;
      background: rgba(0, 0, 0, 0.22);
      border-color: rgba(255, 255, 255, 0.14);
      color: #f0f0f0;
    }
  }

  &:focus {
    outline: none;
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }

  .form-dialog--inline &:focus {
    @media (min-width: 900px) {
      border-color: #1fba2d;
      box-shadow: 0 0 0 2px rgba(31, 186, 45, 0.2);
    }
  }

  &::placeholder {
    color: #999;
  }

  &[type="number"] {
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

textarea.form-input {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;

  .btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    &-cancel {
      background-color: #f5f5f5;
      color: #000;

      &:hover {
        background-color: #e8e8e8;
      }
    }

    &-submit {
      background-color: #0f3f22;
      color: #fff;

      &:hover:not(:disabled) {
        background-color: #48ee8a;
      }

      &:disabled {
        background-color: #77f2a8;
        cursor: not-allowed;
        opacity: 0.7;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (min-width: 900px) {
  .form-dialog--inline {
    :deep(.input-file) {
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(0, 0, 0, 0.25);
      color: #e8e8e8;
      font-size: 14px;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;

      &:hover {
        background: rgba(31, 186, 45, 0.15);
        border-color: rgba(31, 186, 45, 0.4);
      }
    }

    .form-label {
      font-size: 13px;
      letter-spacing: 0.02em;
      color: #d1d5db;
    }

    .file-info {
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.2);
      border: 1px dashed rgba(255, 255, 255, 0.12);
    }
  }
}
</style>
