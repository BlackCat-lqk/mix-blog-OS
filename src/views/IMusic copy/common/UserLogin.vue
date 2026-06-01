<template>
  <div v-if="props.visible" class="login-container">
    <DialogNotification :visible="props.visible" :title="props.title" @closeDialog="handleClose">
      <template #content>
        <form @submit.prevent="handleSubmit" class="form-container">
          <!-- 账号-->
          <div class="form-group">
            <label for="account" class="form-label">ACCOUNT</label>
            <input
              type="text"
              id="account"
              v-model="formData.account"
              placeholder="account"
              class="form-input"
              required
            />
          </div>
          <!-- 密码 -->
          <div class="form-group">
            <label for="password" class="form-label">PASSWORD</label>
            <input
              type="text"
              id="password"
              v-model="formData.password"
              placeholder="Artist"
              class="form-input"
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-cancel" @click="handleClose">Cancle</button>
            <button type="submit" class="btn btn-submit" :disabled="submitting">
              {{ submitting ? "Submiting..." : "Submit" }}
            </button>
          </div>
        </form>
      </template>
    </DialogNotification>
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
import { reactive, ref } from "vue";
import DialogNotification from "./DialogNotification.vue";
import { loginUserApi } from "@/server/iMusic/userHttp";
import { useUserInfoStore } from "@/stores/iMusic/userInfo";
const notificationVisible = ref(false);
const userInfoStore = useUserInfoStore();
const uploadLoading = ref(false);
const inforMsg = ref("");
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
});
// 提交状态
const submitting = ref(false);
const formData = reactive({
  account: "",
  password: "",
});
interface User {
  role: string;
  username: string;
  id: string;
  account: string;
}
const handleCloseTip = () => {
  notificationVisible.value = false;
};
// 定义整个 data 的结构
export interface UserData {
  token: string;
  user: User;
}
// 登录
const login = async (params: object) => {
  uploadLoading.value = true;
  const res = await loginUserApi(params);
  if (res.data.code === 200) {
    const infoData: UserData = {
      token: res.data.token,
      user: res.data.user,
    };
    userInfoStore.setUserInfo(infoData);
    inforMsg.value = "登录成功";
  } else {
    inforMsg.value = "登录失败";
  }
  uploadLoading.value = false;
};
// 表单提交
const handleSubmit = async () => {
  notificationVisible.value = true;
  try {
    submitting.value = true;
    // 验证必填字段
    if (!formData.account.trim()) {
      alert("input is required");
      return;
    }
    if (!formData.password.trim()) {
      alert("input is required");
      return;
    }
    // 提交表单
    await login(formData);
    // 提交成功后关闭弹窗
    handleClose();
    submitting.value = false;
  } catch (error) {
    console.error(error);
    uploadLoading.value = false;
    inforMsg.value = "登录失败";
  } finally {
    submitting.value = false;
    uploadLoading.value = false;
  }
};
const emit = defineEmits(["update:visible"]);
// 关闭弹窗
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style lang="scss" scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  border: 1px solid #292929;
  border-radius: 8px;
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
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
  border-top: 1px solid #181818;

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
      background-color: #2f784c;
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
</style>
