import request from '@/utils/request'

/**
 * 更新用户头像
 * @returns {Promise}
 */
export function updateUserAvatarApi(params: { email: string; password: string }) {
  return request.post('/api/users/avatar', params)
}

/**
 * 根据邮箱更新用户信息
 * @returns {Promise}
 */
export function updateUsers(
  email: string,
  data: Partial<{
    userName: string
    role: string
    status: string
    avatar: string
    sex: string
    birthday: null
    desc: string
    updatedAt: string
  }>,
) {
  return request.put(`/users/${email}`, data)
}

/**
 * 用户登录
 * @returns {Promise}
 */
export function loginUserApi(params: { email: string; password: string }) {
  return request.post('/login', params)
}

/**
 * 用户退出登录
 * @returns {Promise}
 */
export function logOutUserApi() {
  return request.post('/logout')
}

