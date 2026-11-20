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
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

export type ManagedUser = Omit<UserInfo, 'isLogin'>

export interface UserListQuery {
  page: number
  pageSize: number
  keyword: string
  status: string
}

export interface UserListData {
  list: ManagedUser[]
  total: number
}

export interface ManagedUserInput {
  userName: string
  email: string
  password?: string
  role: string
  status: string
  desc: string
}

export interface ApiResult<T> {
  data: { code: number; message?: string; data: T }
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

export interface NavigationSite {
  id: string
  title: string
  description: string
  url: string
  icon: string
}

export interface NavigationSubcategory {
  id: string
  title: string
  sites: NavigationSite[]
}

export interface NavigationCategory {
  id: string
  title: string
  children: NavigationSubcategory[]
}

export interface GalleryAlbum {
  id: string
  name: string
  thumbnail: string
}

export interface GalleryMedia {
  id: string
  albumId: string
  title: string
  type: 'image' | 'video'
  src: string
  thumbnail: string
}

export interface AboutTimelineEntry {
  id: string
  title: string
  date?: string
  description: string
}

export interface WallpaperData {
  current: string
  history: string[]
  bingEnabled?: boolean
  previousWallpaper?: string
}

export interface BingWallpaperResponse {
  images?: { url?: string }[]
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
  lyricsUrl?: string
}

export interface ContentRecord {
  [key: string]: string | number | null
  id: string
  description: string
  status: 'active' | 'disabled'
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface OnlineMusic extends ContentRecord {
  title: string
  artist: string
  album: string
  url: string
  coverUrl: string
  lyricsUrl: string
  duration: number
  fileName: string
  source: 'online'
}

export interface ManagedAlbum extends ContentRecord, GalleryAlbum {}
export interface ManagedMedia extends ContentRecord, GalleryMedia {}
export interface ManagedCategory extends ContentRecord {
  title: string
  parentId: string | null
}
export interface ManagedSite extends ContentRecord, NavigationSite {
  categoryId: string
}

export interface ContentByResource {
  music: OnlineMusic
  'gallery/albums': ManagedAlbum
  'gallery/media': ManagedMedia
  'navigation/categories': ManagedCategory
  'navigation/sites': ManagedSite
}
export type ContentResource = keyof ContentByResource
export interface ContentQuery {
  page: number
  pageSize: number
  keyword: string
  status?: string
  albumId?: string
  type?: string
  parentId?: string
  categoryId?: string
}
export interface ContentPage<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
export interface ContentOption {
  value: string
  label: string
}
export interface ContentField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'url' | 'select' | 'asset'
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
  step?: number
  options?: ContentOption[]
  relation?: 'albums' | 'parents' | 'subcategories'
  fileField?: string
  accept?: string
  fileLimit?: number
}
export interface ContentManagerConfig {
  title: string
  label: string
  fields: ContentField[]
}
