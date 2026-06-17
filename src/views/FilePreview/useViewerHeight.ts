import { ref, type Ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

export function useViewerHeight(activeTabId: Ref<number | null>) {
  const viewerWrapperRef = ref<HTMLDivElement | null>(null)
  const viewerHeight = ref(0)

  let resizeObserver: ResizeObserver | null = null

  const update = () => {
    if (viewerWrapperRef.value) {
      viewerHeight.value = viewerWrapperRef.value.clientHeight
    }
  }

  watch(activeTabId, async (id) => {
    await nextTick()
    resizeObserver?.disconnect()
    if (id !== null && viewerWrapperRef.value) {
      update()
      resizeObserver?.observe(viewerWrapperRef.value)
    }
  })

  onMounted(() => {
    resizeObserver = new ResizeObserver(() => update())
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
  })

  return { viewerWrapperRef, viewerHeight }
}
