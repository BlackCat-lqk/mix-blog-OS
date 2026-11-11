import { ref, computed, onUnmounted } from 'vue'

let cascadeIndex = 0
const CASCADE_OFFSET = 30
const CASCADE_MAX = 10

const getCascadeOffset = () => (cascadeIndex++ % CASCADE_MAX) * CASCADE_OFFSET

/** 只管理窗口位置、尺寸及拖拽/缩放交互，不依赖应用内容。 */
export function useWindowGeometry() {
  const MIN_WIDTH = 350
  const MIN_HEIGHT = 320
  const MIN_VISIBLE = 150

  // ---- window state ----
  const isMaximized = ref(false)

  // ---- position & size ----
  const width = ref(960)
  const height = ref(540)
  const offset = getCascadeOffset()
  // 首次渲染前确定位置，避免挂载后再移动窗口。
  const left = ref(
    Math.min(
      window.innerWidth - MIN_VISIBLE,
      Math.max(0, (window.innerWidth - width.value) / 2) + offset,
    ),
  )
  const top = ref(Math.max(0, (window.innerHeight - height.value) / 2) + offset)
  const savedRect = ref({ left: left.value, top: top.value, width: width.value, height: height.value })

  // ---- drag state ----
  const dragging = ref(false)
  const pendingRestore = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const winStartLeft = ref(0)
  const winStartTop = ref(0)

  const RESTORE_THRESHOLD = 10 // 向下拖拽超过此距离才退出最大化

  // ---- resize state ----
  const resizing = ref(false)
  const rs = ref({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    n: false,
    s: false,
    e: false,
    w: false,
  })

  // ---- clamp helpers ----
  const clampLeft = (value: number) => {
    const minLeft = -width.value + MIN_VISIBLE
    const maxLeft = window.innerWidth - MIN_VISIBLE
    return Math.max(minLeft, Math.min(maxLeft, value))
  }

  const clampTop = (value: number) => Math.max(0, value)

  const windowStyle = computed(() => {
    if (isMaximized.value) {
      return {
        transform: 'none',
        width: '100vw',
        height: '100vh',
      }
    }
    return {
      transform: `translate(${left.value}px, ${top.value}px)`,
      width: `${width.value}px`,
      height: `${height.value}px`,
    }
  })

  const toggleMaximize = () => {
    if (isMaximized.value) {
      const s = savedRect.value
      left.value = s.left
      top.value = s.top
      width.value = s.width
      height.value = s.height
      isMaximized.value = false
    } else {
      savedRect.value = {
        left: left.value,
        top: top.value,
        width: width.value,
        height: height.value,
      }
      isMaximized.value = true
    }
  }

  // ---- drag ----
  const onTitlebarMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    startTracking()
    if (isMaximized.value) {
      pendingRestore.value = true
      dragStartX.value = e.clientX
      dragStartY.value = e.clientY
      e.preventDefault()
      return
    }

    dragging.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    winStartLeft.value = left.value
    winStartTop.value = top.value
    e.preventDefault()
  }

  // ---- resize (use data-resize attribute instead of inline arrow fns) ----
  const onResizeMouseDown = (e: MouseEvent) => {
    const dir = (e.currentTarget as HTMLElement).dataset.resize
    if (e.button !== 0 || !dir || isMaximized.value) return
    startTracking()
    resizing.value = true
    rs.value = {
      x: e.clientX,
      y: e.clientY,
      left: left.value,
      top: top.value,
      width: width.value,
      height: height.value,
      n: dir.includes('n'),
      s: dir.includes('s'),
      e: dir.includes('e'),
      w: dir.includes('w'),
    }
    e.preventDefault()
    e.stopPropagation()
  }

  // ---- shared mouse handlers (bound to document) ----
  let rafId = 0
  let pendingEvent: MouseEvent | null = null

  let hasMoved = false

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.value && !resizing.value && !pendingRestore.value) return
    pendingEvent = e
    if (dragging.value) {
      lastMouseY = e.clientY
      hasMoved = true
    }
    if (!rafId) {
      rafId = requestAnimationFrame(processMouseMove)
    }
  }

  const processMouseMove = () => {
    rafId = 0
    const e = pendingEvent
    if (!e) return
    pendingEvent = null

    if (pendingRestore.value) {
      const dy = e.clientY - dragStartY.value
      if (dy <= RESTORE_THRESHOLD) return

      const s = savedRect.value
      const ratioX = dragStartX.value / window.innerWidth

      width.value = s.width
      height.value = s.height
      left.value = clampLeft(dragStartX.value - s.width * ratioX)
      top.value = clampTop(dragStartY.value - 8)

      isMaximized.value = false
      pendingRestore.value = false
      dragging.value = true
      winStartLeft.value = left.value
      winStartTop.value = top.value
      return
    }

    if (dragging.value) {
      left.value = clampLeft(winStartLeft.value + (e.clientX - dragStartX.value))
      top.value = clampTop(winStartTop.value + (e.clientY - dragStartY.value))
      return
    }

    if (resizing.value) {
      const dx = e.clientX - rs.value.x
      const dy = e.clientY - rs.value.y
      const { n, s, e: isE, w } = rs.value

      let nl = rs.value.left
      let nt = rs.value.top
      let nw = rs.value.width
      let nh = rs.value.height

      if (isE) nw = rs.value.width + dx
      if (s) nh = rs.value.height + dy
      if (w) {
        nl = rs.value.left + dx
        nw = rs.value.width - dx
      }
      if (n) {
        nt = rs.value.top + dy
        nh = rs.value.height - dy
      }

      // enforce minimum size
      if (w && nw < MIN_WIDTH) {
        nl = rs.value.left + rs.value.width - MIN_WIDTH
        nw = MIN_WIDTH
      }
      if (!w && nw < MIN_WIDTH) nw = MIN_WIDTH
      if (n && nh < MIN_HEIGHT) {
        nt = rs.value.top + rs.value.height - MIN_HEIGHT
        nh = MIN_HEIGHT
      }
      if (!n && nh < MIN_HEIGHT) nh = MIN_HEIGHT

      // enforce boundary: keep titlebar visible
      if (nt < 0) {
        if (n) nh += nt
        nt = 0
      }
      if (nl < 0) {
        if (w) nw += nl
        nl = 0
      }

      if (nh < MIN_HEIGHT) nh = MIN_HEIGHT
      if (nw < MIN_WIDTH) nw = MIN_WIDTH

      left.value = nl
      top.value = nt
      width.value = nw
      height.value = nh
    }
  }

  const TITLEBAR_VISIBLE = 40 // 拖到底部时保留标题栏可见高度

  let lastMouseY = 0

  const onMouseUp = () => {
    stopTracking()
    if (rafId) cancelAnimationFrame(rafId)
    processMouseMove()
    if (pendingRestore.value) {
      pendingRestore.value = false
      return
    }

    if (dragging.value) {
      // 鼠标拖出屏幕顶部 → 自动最大化（仅在窗口确实被拖拽移动过时触发）
      if (hasMoved && lastMouseY <= 0 && !isMaximized.value) {
        savedRect.value = {
          left: winStartLeft.value,
          top: winStartTop.value,
          width: width.value,
          height: height.value,
        }
        isMaximized.value = true
      }
      // 拖到底部 → 弹回，保证标题栏始终可见
      const maxTop = window.innerHeight - TITLEBAR_VISIBLE
      if (top.value > maxTop) {
        top.value = Math.max(0, maxTop)
      }
    }
    dragging.value = false
    resizing.value = false
    hasMoved = false
  }

  // 仅拖拽/缩放期间跟踪鼠标，空闲窗口不处理全局移动事件。
  const startTracking = () => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const stopTracking = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId)
    pendingEvent = null
    stopTracking()
  })

  return {
    windowStyle,
    isMaximized,
    dragging,
    resizing,
    toggleMaximize,
    onTitlebarMouseDown,
    onResizeMouseDown,
  }
}
