/**
 * @description: ts接口类封装
 */
import type { Component } from 'vue'

export type ErrorStatusCode = 403 | 404 | 500

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

export interface AppWindowProps {
  title?: string
  icon?: string
  minimizeTarget?: () => WindowBounds | undefined
  visible?: boolean
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

export type MusicSource = 'local' | 'online'
export type MusicPlayMode = 'loop' | 'single' | 'shuffle'

export interface MusicLyricLine {
  time: number
  text: string
}

export interface MusicLyrics {
  lines: MusicLyricLine[]
  text: string
}

export interface MusicTrack {
  id: string
  source: MusicSource
  fileKey?: string
  fileName: string
  title: string
  artist: string
  url: string
  coverUrl?: string
  lyrics: MusicLyrics
  duration: number
}
