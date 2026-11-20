import request from '@/utils/request'
import { useUserInfoStore } from '@/stores/userInfo'
import type { ApiResult, ManagedUserInput, UserListData, UserListQuery } from '@/tsInterface/index'

function requireLogin() {
  const store = useUserInfoStore()
  if (!store.isAuthenticated) throw new Error('请先登录后再管理用户')
  if (store.data.user.role !== 'admin') throw new Error('仅管理员可管理用户')
}

export async function getUsersApi(
  params: UserListQuery,
  signal?: AbortSignal,
): Promise<UserListData> {
  requireLogin()
  const result = await request.get<never, ApiResult<UserListData>>('/user/list', { params, signal })
  const data = result.data.data
  if (!data || !Array.isArray(data.list) || !Number.isInteger(data.total) || data.total < 0) {
    throw new Error('用户列表数据格式不正确')
  }
  return data
}

export async function createUserApi(data: ManagedUserInput) {
  requireLogin()
  await request.post('/user/create', data)
}

export async function editUserApi(id: string, data: ManagedUserInput) {
  requireLogin()
  await request.put(`/user/${encodeURIComponent(id)}`, data)
}

export async function deleteUserApi(id: string) {
  requireLogin()
  await request.delete(`/user/${encodeURIComponent(id)}`)
}
