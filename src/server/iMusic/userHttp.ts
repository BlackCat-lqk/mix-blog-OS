import request from "@/utils/request";
interface MusicItem {
  id?: number | string;
  title: string;
  artist?: string;
  audioUrl?: string;
  duration?: number;
  coverUrl?: string;
  lyricsUrl?: string;
}
/**
 * 登录
 * @returns {Promise}
 */
export function loginUserApi(params: object) {
  return request.post("/login", params);
}

/**
 * 添加收藏
 * @returns {Promise}
 */
export function addToFavoritesApi(params: {
  userId: string;
  musicInfo: MusicItem;
  playlistTitle: string;
}) {
  return request.post(`/user/${params.userId}/favorites`, params);
}

/**
 * 取消收藏
 * @returns {Promise}
 */
export function removeFavoritesApi(params: {
  userId: string;
  musicInfo: MusicItem;
  playlistTitle: string;
}) {
  return request.delete(`/user/${params.userId}/favorites/${params.musicInfo.id}`, {
    data: {
      playlistTitle: params.playlistTitle,
    },
  });
}

/**
 * 添加喜欢
 * @returns {Promise}
 */
export function addToLikesApi(params: {
  userId: string;
  musicInfo: MusicItem;
  playlistTitle: string;
}) {
  return request.post(`/user/${params.userId}/likes`, params);
}

/**
 * 取消喜欢
 * @returns {Promise}
 */
export function removeLikesApi(params: {
  userId: string;
  musicInfo: MusicItem;
  playlistTitle: string;
}) {
  return request.delete(`/user/${params.userId}/likes/${params.musicInfo.id}`, {
    data: {
      playlistTitle: params.playlistTitle,
    },
  });
}

/**
 * 查询喜欢和收藏的数据
 * @returns {Promise}
 */
export function queryLikesFavoriteApi(params: { userId: string }) {
  return request.get(`/user/${params.userId}/collections`);
}

/**
 * 查询是否已添加喜欢
 * @returns {Promise}
 */
export function queryLikeApi(params: { userId: string; musicId: string; playlistTitle?: string }) {
  return request.get(`/user/${params.userId}/likes/check/${params.musicId}`);
}
