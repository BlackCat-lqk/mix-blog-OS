import request from '@/utils/request'
/**
 * 查询
 * @returns {Promise}
 */
export function getMusicApi(params: { page: number; limit: number }) {
  return request.get(`/music?page=${params.page}&limit=${params.limit}`)
}

/**
 * 上传
 * @returns {Promise}
 */
export function createMusicApi(params: object) {
  return request.post('/music', params)
}

/**
 * 删除
 * @returns {Promise}
 */
export function deleteMusicApi(params: { id: string }) {
  return request.delete(`/music/${params.id}`)
}

/** Web/H5：带文件或 multipart 元数据更新（multipart/form-data） */
export function updateMusicApi(params: { id: string; data: FormData }) {
  return request.put(`/music/${params.id}`, params.data)
}

/** 仅更新元数据（application/json，无文件） */
export function updateMusicMetaApi(params: {
  id: string
  data: { title?: string; artist?: string; duration?: number }
}) {
  return request.post(`/music/${params.id}`, params.data)
}

// 模糊搜索（发现音乐页使用）
export function searchMusicApi(params: { keyword: string }) {
  return request.get(`/music/search?keyword=${params.keyword}`)
}

