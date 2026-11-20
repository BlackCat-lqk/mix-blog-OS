import { computed, onBeforeUnmount, reactive, ref, shallowRef } from 'vue'
import { getContentList } from '@/server/content'
import type { ContentByResource, ContentQuery, ContentResource } from '@/tsInterface/index'

export function useContentList<R extends ContentResource>(resource: R, admin = false) {
  const items = shallowRef<ContentByResource[R][]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  const query = reactive<ContentQuery>({ page: 1, pageSize: 20, keyword: '' })
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.pageSize)))
  let controller: AbortController | undefined
  let version = 0
  let disposed = false

  async function load() {
    if (disposed) return
    controller?.abort()
    controller = new AbortController()
    const current = ++version
    loading.value = true
    error.value = ''
    items.value = []
    total.value = 0
    try {
      const data = await getContentList(resource, { ...query }, controller.signal, admin)
      if (disposed || current !== version) return
      const lastPage = Math.max(1, Math.ceil(data.total / query.pageSize))
      if (query.page > lastPage) {
        query.page = lastPage
        await load()
        return
      }
      items.value = data.list
      total.value = data.total
    } catch (cause) {
      if (!disposed && current === version)
        error.value = cause instanceof Error ? cause.message : '加载失败，请稍后重试'
    } finally {
      if (current === version) loading.value = false
    }
  }

  function changePage(page: number) {
    if (loading.value || page < 1 || page > pageCount.value) return
    query.page = page
    void load()
  }

  onBeforeUnmount(() => {
    disposed = true
    ++version
    controller?.abort()
  })
  return { items, total, loading, error, query, pageCount, load, changePage }
}
