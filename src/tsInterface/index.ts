/**
 * @description: ts接口类封装
 */
import type { Component } from 'vue'
export interface UserInfo {
  isLogin: boolean;
  _id: string;
  userName: string;
  email: string;
  desc: string;
  avatar: string;
  sex: string;
  birthday: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  token: string;
  user: UserInfo;
}

export interface AppItem {
  zhName?: string
  enName: string
  title?: string
  icon?: string
  component: Component
}

export interface DesktopWindow {
  id: string
  minimized: boolean
  zIndex: number
}

export interface SidebarApp {
  id: string
  name: string
  icon?: string
  minimized: boolean
}

export interface WindowSidebarItem {
  id: string
  name: string
  icon: string
}

export interface WindowBounds {
  left: number
  top: number
  width: number
  height: number
}

export interface SettingsNavigation {
  section: string
}

export interface WallpaperData {
  current: string
  history: string[]
}

export interface FileUploadEmits {
  (e: 'file-selected', file: File): void
}
