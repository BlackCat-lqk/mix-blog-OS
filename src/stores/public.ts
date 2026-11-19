import { defineStore } from 'pinia'

export const publicStore = defineStore('public', {
  state: ()=> ({
    theme: 'light'
  }),
  actions: {
    switchTheme(val: string){
      this.theme = val
    }
  },
  persist: true
})
