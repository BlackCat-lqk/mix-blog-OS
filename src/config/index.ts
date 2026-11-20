/**
 * 桌面应用配置（名称、图标和窗口入口）
 */
import type { AppItem } from "@/tsInterface/index"
import { defineAsyncComponent, markRaw } from 'vue'
import settingIcon from '@/assets/icons/app/setting.png'
import musicIcon from '@/assets/icons/app/music.png'
import aboutIcon from '@/assets/icons/app/about.png'
import navigationIcon from '@/assets/icons/app/website.png'
import galleryIcon from '@/assets/icons/app/photo.png'
import controlPanelIcon from '@/assets/icons/app/adminUser.png'

const appConfig: AppItem[] = [
  {
    zhName: '控制面板',
    enName: 'ControlPanel',
    icon: controlPanelIcon,
    requiresAuth: true,
    requiresAdmin: true,
    component: markRaw(defineAsyncComponent(() => import('@/views/ControlPanel/IndexView.vue'))),
  },
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
  {
    zhName: '关于',
    enName: 'About',
    icon: aboutIcon,
    component: markRaw(defineAsyncComponent(() => import('@/views/About/IndexView.vue'))),
  },
  {
    zhName: '导航',
    enName: 'Navigation',
    icon: navigationIcon,
    component: markRaw(defineAsyncComponent(() => import('@/views/Navigation/IndexView.vue'))),
  },
  {
    zhName: '图库',
    enName: 'Gallery',
    icon: galleryIcon,
    component: markRaw(defineAsyncComponent(() => import('@/views/Gallery/IndexView.vue'))),
  },
]

export default appConfig
