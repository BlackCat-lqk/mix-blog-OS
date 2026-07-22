<!-- * @description: 个性化设置 — 壁纸上传与预览 -->
<script lang="ts" setup>
import { reactive } from "vue";
import { Message } from "@/utils/message";
import { useUserInfoStore } from "@/stores/userInfo.ts";
import { logOutUserApi, updateUsersInfoApi } from "@/server/user";
import closeIcon from "@/assets/icons/close.svg";
import FileUpload from "@/components/FileUpload.vue";
import logoAvatar from "@/assets/icons/logo-dark.svg";
const userStore = useUserInfoStore();

// 表单数据
const form = reactive({
  coverUrl: null as File | null,
  userName: "" as string,
  desc: "" as string,
  sex: "" as string,
  birthday: "" as string,
});
// 选择头像
const handleFile = (file: File | null, fielName: string) => {
  if (fielName == "coverUrl") {
    form.coverUrl = file;
  }
};
// 取消选择头像文件
const removeFile = (value: string) => {
  if (value == "coverUrl") {
    form.coverUrl = null;
  }
};
// 提交修改
const submit = async () => {
  try {
    const formData = new FormData();
    formData.append("userName", form.userName);
    formData.append("avatar", form.coverUrl || "");
    formData.append("desc", form.desc);
    formData.append("sex", form.sex || "");
    formData.append("birthday", form.birthday);
    const data = await updateUsersInfoApi(formData);
    const res = data.data;
    if (res.code === 200 && res.data) {
      Message.success("更新成功");
    }
  } catch (e) {
    const error = e as Error;
    Message.error(error.message);
  }
};
// 退出登录
const outLogin = async () => {
  try {
    const data = await logOutUserApi();
    const res = data.data;
    if (res.code === 200) {
      userStore.removeUserInfo();
      Message.success(res.message || "退出成功");
    } else {
      Message.error("退出失败");
    }
  } catch (e) {
    const error = e as Error;
    Message.error(error.message || "退出失败");
  }
};
</script>

<template>
  <div class="account-box">
    <div class="account-box--header">
      <div class="account-box--header--avatar">
        <img :src="userStore.data?.user?.avatar || logoAvatar" />
        <div class="account-box--info">
          <span>{{ userStore.data?.user?.userName }}</span>
          <span>{{ userStore.data?.user?.email }}</span>
        </div>
      </div>
      <div class="account-box--out">
        <button @click.stop="outLogin">退出登录</button>
      </div>
    </div>
    <div class="account-box--edit">
      <div class="form-group form-group--file">
        <label for="cover" class="form-label">头像</label>
        <FileUpload
          v-if="!form.coverUrl"
          ref="coverUrlRef"
          v-model="form.coverUrl"
          accept="image/*"
          max-size="1"
          :required="true"
          label="Select Cover"
          @file-selected="(file: File) => handleFile(file, 'coverUrl')"
        />
        <div v-else class="file-info">
          {{ form.coverUrl.name }}
          <button type="button" class="remove-file" @click="removeFile('coverUrl')">
            <img :src="closeIcon" />
          </button>
        </div>
        <input
          v-model="form.userName"
          type="text"
          class="delete-search-input"
          placeholder="用户名"
        />
        <input v-model="form.desc" type="text" class="delete-search-input" placeholder="签名" />
        <input v-model="form.sex" type="text" class="delete-search-input" placeholder="性别" />
        <input
          v-model="form.birthday"
          type="text"
          class="delete-search-input"
          placeholder="出生年月"
        />
      </div>
      <button class="submit" @click="submit">提交</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.account-box {
  &--header {
    display: flex;
    align-items: center;
    gap: 20%;
    &--avatar {
      padding: 5px;
      display: flex;
      align-items: center;
      gap: 10px;
      img {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        overflow: hidden;
      }
    }
    &--info {
      display: flex;
      flex-direction: column;
    }
    &--out {
      padding: 6px 10px;
      cursor: pointer;
    }
  }
  &--edit {
    display: flex;
    flex-direction: column;
    gap: 5px;
    .submit {
      padding: 2px 10px;
      font-size: 12px;
      border: 1px solid #000;
    }
    .form-group--file {
      display: flex;
      flex-direction: column;
      & > div {
        display: flex;
        flex-direction: column;
      }
    }
  }
}
</style>
