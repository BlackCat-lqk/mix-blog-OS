import { computed, ref } from 'vue'
import type { DesktopWindow } from '@/tsInterface/index'

/** 统一管理应用窗口，列表顺序保持打开顺序。 */
export function useDesktopWindows() {
  const windows = ref<DesktopWindow[]>([])
  let nextZIndex = 0

  const activeWindowId = computed(
    () =>
      windows.value.reduce<DesktopWindow | undefined>((active, item) => {
        if (item.minimized) return active
        return !active || item.zIndex > active.zIndex ? item : active
      }, undefined)?.id,
  )

  const activateWindow = (id: string) => {
    const item = windows.value.find((window) => window.id === id)
    if (!item) return
    item.minimized = false
    if (activeWindowId.value !== id) item.zIndex = ++nextZIndex
  }

  const openWindow = (id: string) => {
    if (windows.value.some((item) => item.id === id)) {
      activateWindow(id)
      return
    }
    windows.value.push({ id, minimized: false, zIndex: ++nextZIndex })
  }

  const setMinimized = (id: string, minimized: boolean) => {
    const item = windows.value.find((window) => window.id === id)
    if (!item) return
    if (minimized) item.minimized = true
    else activateWindow(id)
  }

  const toggleWindow = (id: string) => {
    if (activeWindowId.value === id) setMinimized(id, true)
    else openWindow(id)
  }

  const closeWindow = (id: string) => {
    windows.value = windows.value.filter((item) => item.id !== id)
  }

  const showDesktop = () => {
    windows.value.forEach((item) => {
      item.minimized = true
    })
  }

  return {
    windows,
    activeWindowId,
    activateWindow,
    openWindow,
    setMinimized,
    toggleWindow,
    closeWindow,
    showDesktop,
  }
}
