import { defineStore } from 'pinia'
// 定义 User 接口
interface User {
  role: string
  username: string
  id: string
  account: string
}

// 定义整个 data 的结构
export interface UserData {
  token: string
  user: User
}
export const useUserInfoStore = defineStore('userInfo', {
  state: () => ({
    data: {
      token: '',
      user: {
        id: '',
        account: '',
        username: '',
        role: ''
      },
    } as UserData,
  }),
  actions: {
    setUserInfo(val: UserData) {
      this.data = val
    },
    removeUserInfo() {
      this.$reset()
      localStorage.removeItem('userInfo')
    },
  },
  persist: true,
})
