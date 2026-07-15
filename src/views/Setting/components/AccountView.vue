<!-- * @description: 个性化设置 — 壁纸上传与预览 -->
<script lang="ts" setup>
import { Message } from "@/utils/message";
import { useUserInfoStore } from "@/stores/userInfo.ts";
import { logOutUserApi } from "@/server/user";
const userStore = useUserInfoStore();
// 退出登录
const outLogin = async () => {
  try {
    const data = await logOutUserApi();
    const res = data.data;
    if (res.code === 200 && res.success) {
      userStore.removeUserInfo();
      Message.success("退出成功");
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
  <div class="account">
    <div class="account--avatar">
      <img :src="userStore.data?.user?.avatar" />
      <div class="account--info">
        <span>{{ userStore.data?.user?.userName }}</span>
        <span>{{ userStore.data?.user?.email }}</span>
      </div>
    </div>
    <div class="account--out">
      <button @click.stop="outLogin">退出登录</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.account {
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
</style>
