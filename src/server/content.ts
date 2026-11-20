import request from '@/utils/request'
import { useUserInfoStore } from '@/stores/userInfo'
import type {
  ApiResult,
  ContentByResource,
  ContentPage,
  ContentQuery,
  ContentResource,
  NavigationCategory,
} from '@/tsInterface/index'

function requireAdministrator() {
  const store = useUserInfoStore()
  if (!store.isAuthenticated || store.data.user.role !== 'admin')
    throw new Error('请使用管理员账号登录后再管理内容')
}

export async function getContentList<R extends ContentResource>(
  resource: R,
  query: ContentQuery,
  signal?: AbortSignal,
  admin = false,
): Promise<ContentPage<ContentByResource[R]>> {
  if (admin) requireAdministrator()
  const result = await request.get<never, ApiResult<ContentPage<ContentByResource[R]>>>(
    `${admin ? '/admin' : ''}/${resource}`,
    { params: query, signal },
  )
  const data = result.data.data
  if (!data || !Array.isArray(data.list) || !Number.isSafeInteger(data.total) || data.total < 0)
    throw new Error('内容列表数据格式不正确')
  return data
}

export async function getAllContent<R extends ContentResource>(
  resource: R,
  signal?: AbortSignal,
  admin = false,
): Promise<ContentByResource[R][]> {
  const items: ContentByResource[R][] = []
  for (let page = 1; ; page++) {
    signal?.throwIfAborted()
    const data = await getContentList(resource, { page, pageSize: 100, keyword: '' }, signal, admin)
    items.push(...data.list)
    if (!data.list.length || page * 100 >= data.total) return items
  }
}

export async function getNavigationTree(signal?: AbortSignal): Promise<NavigationCategory[]> {
  const result = await request.get<never, ApiResult<{ list: NavigationCategory[] }>>(
    '/navigation/tree',
    { signal },
  )
  const list = result.data.data?.list
  if (
    !Array.isArray(list) ||
    !list.every(
      (item) =>
        Array.isArray(item.children) && item.children.every((child) => Array.isArray(child.sites)),
    )
  ) {
    throw new Error('导航分类数据格式不正确')
  }
  return list
}

export async function saveContent(
  resource: ContentResource,
  body: FormData | Record<string, string | number | null>,
  id?: string,
  signal?: AbortSignal,
) {
  requireAdministrator()
  const path = `/admin/${resource}${id ? `/${encodeURIComponent(id)}` : ''}`
  if (id) await request.put(path, body, { signal })
  else await request.post(path, body, { signal })
}

export async function deleteContent(resource: ContentResource, id: string, signal?: AbortSignal) {
  requireAdministrator()
  await request.delete(`/admin/${resource}/${encodeURIComponent(id)}`, { signal })
}
