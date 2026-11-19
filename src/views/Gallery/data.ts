import type { GalleryAlbum, GalleryMedia } from '@/tsInterface/index'
import wallpaper1 from '@/assets/setting/images/wallpaper/default-wallpaper1.jpg'
import wallpaper2 from '@/assets/setting/images/wallpaper/default-wallpaper2.png'
import wallpaper3 from '@/assets/setting/images/wallpaper/default-wallpaper3.png'
import wallpaper5 from '@/assets/setting/images/wallpaper/default-wallpaper5.jpg'
import wallpaper6 from '@/assets/setting/images/wallpaper/default-wallpaper6.jpg'
import wallpaper7 from '@/assets/setting/images/wallpaper/default-wallpaper7.jpg'
import thumbnail1 from '@/assets/setting/images/wallpaper/thumbnails/default-wallpaper1.jpg'
import thumbnail2 from '@/assets/setting/images/wallpaper/thumbnails/default-wallpaper2.jpg'
import thumbnail3 from '@/assets/setting/images/wallpaper/thumbnails/default-wallpaper3.jpg'
import thumbnail5 from '@/assets/setting/images/wallpaper/thumbnails/default-wallpaper5.jpg'
import thumbnail6 from '@/assets/setting/images/wallpaper/thumbnails/default-wallpaper6.jpg'
import thumbnail7 from '@/assets/setting/images/wallpaper/thumbnails/default-wallpaper7.jpg'

// 使用现有图片展示相册结构，视频可通过 type: 'video' 和对应 src 配置。
export const albums: GalleryAlbum[] = [
  { id: 'favorites', name: '壁纸精选', thumbnail: thumbnail1 },
  { id: 'desktop', name: '桌面背景', thumbnail: thumbnail3 },
  { id: 'inspiration', name: '灵感收藏', thumbnail: thumbnail6 },
]

export const media: GalleryMedia[] = [
  { id: 'wallpaper-1', albumId: 'favorites', title: '精选壁纸 01', type: 'image', src: wallpaper1, thumbnail: thumbnail1 },
  { id: 'wallpaper-2', albumId: 'favorites', title: '精选壁纸 02', type: 'image', src: wallpaper2, thumbnail: thumbnail2 },
  { id: 'wallpaper-3', albumId: 'desktop', title: '桌面背景 01', type: 'image', src: wallpaper3, thumbnail: thumbnail3 },
  { id: 'wallpaper-5', albumId: 'desktop', title: '桌面背景 02', type: 'image', src: wallpaper5, thumbnail: thumbnail5 },
  { id: 'wallpaper-6', albumId: 'inspiration', title: '灵感收藏 01', type: 'image', src: wallpaper6, thumbnail: thumbnail6 },
  { id: 'wallpaper-7', albumId: 'inspiration', title: '灵感收藏 02', type: 'image', src: wallpaper7, thumbnail: thumbnail7 },
]
