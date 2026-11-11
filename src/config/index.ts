/**
 * 桌面应用配置（名称、图标和窗口入口）
 */
import type { AppItem } from "@/tsInterface/index"
import { defineAsyncComponent, markRaw } from 'vue'
import settingIcon from '@/assets/icons/app/setting.svg'
import musicIcon from '@/assets/icons/app/music.svg'

const appConfig: AppItem[] = [
  {
    zhName: '设置',
    enName: 'Setting',
    icon: settingIcon,
    component: markRaw(defineAsyncComponent(() => import('@/views/Setting/IndexView.vue'))),
  },
  {
    zhName: '音乐',
    enName: 'Music',
    icon: musicIcon,
    component: markRaw(defineAsyncComponent(() => import('@/views/Music/IndexView.vue'))),
  },
]

export default appConfig
