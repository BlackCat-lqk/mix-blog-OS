<template>
  <div class="header-box">
    <div class="header-box--lt">
      <div class="search-box">
        <img src="@/assets/iMusic/icons/Search.svg" alt="" class="search-icon" />
        <input type="text" class="search-input" placeholder="搜索歌曲、歌手…" v-model="keyword" />
        <img
          v-show="keyword.length > 0"
          class="close-icon"
          src="@/assets/icons/close.svg"
          @click="keyword = ''"
        />
      </div>
    </div>
    <div class="header-box--rt">
      <img :src="messageIcon" />
      <div class="user">
        <div class="avatar">
          <img v-if="userInfoStore.data.token" :src="userInfoStore.data.user.avatar" />
          <img v-else :src="userIcon" @click="requestLogin" />
        </div>
        <span v-if="userInfoStore.data.token">{{ userInfoStore.data.user.userName }}</span>
        <span v-else @click="requestLogin">去登录</span>
      </div>
      <img ref="rootRef" :src="moreIcon" />
    </div>
  </div>
  <!-- 登录弹窗 -->
  <Login :visible="showLoginModal" @login-status="loginStatus" @close="closeLogin"></Login>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useUserInfoStore } from "@/stores/userInfo";
import messageIcon from "@/assets/iMusic/icons/inform.svg";
import moreIcon from "@/assets/iMusic/icons/more_opration.svg";
import userIcon from "@/assets/icons/user.svg";
import Login from "@/views/Login/IndexView.vue";

const userInfoStore = useUserInfoStore();
const keyword = ref("");
const showLoginModal = ref(false);

// 唤起登录弹窗
const requestLogin = () => {
  showLoginModal.value = true;
};

// 登录状态
const loginStatus = (status: boolean) => {
  console.log(status);
};
const closeLogin = () => {
  showLoginModal.value = false;
};
</script>
<style scoped lang="scss">
.header-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  &--lt {
    .search-box {
      display: flex;
      align-items: center;
      gap: 3px;
      border: 1px solid #000;
      padding: 2px 20px 2px 10px;
      border-radius: 4px;
      position: relative;
      height: 36px;
      width: 260px;
      .search-input {
        border: unset;
        background: unset;
        display: flex;
        align-items: center;
        font-size: 12px;
        width: 100%;
        &:focus {
          outline: unset;
        }
      }
      .close-icon {
        width: 12px;
        height: 12px;
        cursor: pointer;
        position: absolute;
        right: 5px;
      }
      .search-icon {
        width: 16px;
        height: 16px;
      }
    }
  }
  &--rt {
    display: flex;
    align-items: center;
    gap: 10px;
    img {
      width: 16px;
    }
    .user {
      display: flex;
      align-items: center;
      gap: 5px;
      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #fff;
        box-shadow: 0 0 3px 1px rgba(0, 0, 0, 0.2);
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          width: 100%;
          height: 100%;
        }
      }
      span {
        font-size: 14px;
      }
    }
  }
}
</style>
