import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { createUserApi, deleteUserApi, editUserApi, getUsersApi } from '@/server/userManagement'
import type { ManagedUser, ManagedUserInput, UserListQuery } from '@/tsInterface/index'

export function useUserManagement() {
  const userStore = useUserInfoStore()
  const users = ref<ManagedUser[]>([])
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const mutationError = ref('')
  const message = ref('')
  const query = reactive<UserListQuery>({ page: 1, pageSize: 10, keyword: '', status: '' })
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.pageSize)))
  let controller: AbortController | undefined
  let requestId = 0
  let disposed = false
  const messageOf = (error: unknown) =>
    error instanceof Error ? error.message : '请求失败，请稍后重试'

  async function loadUsers() {
    controller?.abort()
    const id = ++requestId
    controller = new AbortController()
    error.value = ''
    users.value = []
    total.value = 0
    if (!userStore.isAuthenticated || disposed) return
    loading.value = true
    try {
      const data = await getUsersApi({ ...query }, controller.signal)
      if (disposed || id !== requestId || !userStore.isAuthenticated) return
      // 删除或其他管理者修改数据后，回到仍有数据的最后一页。
      const lastPage = Math.max(1, Math.ceil(data.total / query.pageSize))
      if (query.page > lastPage) {
        query.page = lastPage
        await loadUsers()
        return
      }
      users.value = data.list
      total.value = data.total
    } catch (reason) {
      if (!disposed && id === requestId && userStore.isAuthenticated)
        error.value = messageOf(reason)
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  async function saveUser(data: ManagedUserInput, user?: ManagedUser): Promise<boolean> {
    if (saving.value || !userStore.isAuthenticated || disposed) return false
    saving.value = true
    mutationError.value = ''
    message.value = ''
    try {
      if (user) await editUserApi(user._id, data)
      else await createUserApi(data)
      if (disposed || !userStore.isAuthenticated) return false
      if (user?._id === userStore.data.user._id) {
        const { userName, email, role, status, desc } = data
        Object.assign(userStore.data.user, { userName, email, role, status, desc })
      }
      message.value = user ? '用户资料已更新' : '用户已新增'
      await loadUsers()
      return true
    } catch (reason) {
      mutationError.value = messageOf(reason)
      return false
    } finally {
      saving.value = false
    }
  }

  async function removeUser(user: ManagedUser): Promise<boolean> {
    if (saving.value || !userStore.isAuthenticated || disposed) return false
    if (user._id === userStore.data.user._id) {
      mutationError.value = '不能删除当前登录账号'
      return false
    }
    saving.value = true
    mutationError.value = ''
    message.value = ''
    try {
      await deleteUserApi(user._id)
      if (disposed || !userStore.isAuthenticated) return false
      message.value = '用户已删除'
      await loadUsers()
      return true
    } catch (reason) {
      mutationError.value = messageOf(reason)
      return false
    } finally {
      saving.value = false
    }
  }

  onBeforeUnmount(() => {
    disposed = true
    ++requestId
    controller?.abort()
  })

  return {
    users,
    total,
    loading,
    saving,
    error,
    mutationError,
    message,
    query,
    pageCount,
    loadUsers,
    saveUser,
    removeUser,
  }
}
