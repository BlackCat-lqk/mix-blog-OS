<template>
  <div class="form-inline-wrapper">
    <form @submit.prevent="handleSubmit" class="form-container">
      <!-- 歌曲名称-->
      <div class="form-group">
        <label for="title" class="form-label">歌曲名</label>
        <input type="text" id="title" v-model="formData.title" class="form-input" required />
      </div>

      <!-- 歌手 -->
      <div class="form-group">
        <label for="artist" class="form-label">歌手</label>
        <input type="text" id="artist" v-model="formData.artist" class="form-input" required />
      </div>

      <!-- 音频 -->
      <div class="form-group form-group--file">
        <div>
          <label for="audio" class="form-label">音频</label>
          <FileUpload
            ref="audioUrlRef"
            v-model="formData.audioUrl"
            accept=".wav, .mp3, .aac, .flac, .m4a, .ogg, .opus, .wma"
            max-size="1"
            :required="true"
            label="Select Audio"
            @file-selected="(file: File) => handleFile(file, 'audioUrl')"
          />
        </div>

        <div class="file-info">
          {{ formData.audioUrl?.name }}
          <button type="button" class="remove-file" @click="removeFile('audioUrl')">×</button>
        </div>
      </div>

      <!-- 封面 -->
      <div class="form-group form-group--file">
        <label for="cover" class="form-label">封面</label>
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
      <div class="form-group form-group--file">
        <label for="lyrics" class="form-label">歌词文件</label>
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
    </form>
    <div v-loading="submitting" class="form-actions">
      <button type="submit" class="btn btn-submit" :disabled="submitting">
        {{ submitting ? "提交中..." : "提交" }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import FileUpload from "../common/FileUpload.vue";
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
// const handleCloseTip = () => {
//   notificationVisible.value = false;
// };

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
  display: grid;
  padding: 20px;
  .form-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      .form-input {
        border: 1px solid #000;
        color: #000;
        height: 32px;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
    .form-group--file {
      display: flex;
      flex-direction: unset;
      align-items: center;
      & > div {
        display: flex;
        flex-direction: column;
      }
    }
  }
  .form-actions {
    width: 100%;
    margin-top: 10px;
    .btn-submit {
      width: 100%;
      background-color: #fff;
      border: 1px solid #000;
      font-size: 14px;
    }
  }
}
</style>
