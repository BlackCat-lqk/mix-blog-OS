import { nextTick, onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'
import type { AppWindowProps, WindowBounds } from '@/tsInterface/index'

const duration = 200
const easing = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

/** 所有应用共用窗口过渡；动画只改变视觉呈现，不修改几何和业务状态。 */
export function useWindowMotion(
  props: Readonly<AppWindowProps>,
  windowElement: Readonly<Ref<HTMLElement | undefined>>,
  state: {
    minimized: Readonly<Ref<boolean>>
    maximized: Readonly<Ref<boolean>>
    dragging: Readonly<Ref<boolean>>
    resizing: Readonly<Ref<boolean>>
  },
) {
  let animation: Animation | undefined
  let finishVisibility: (() => void) | undefined
  let version = 0
  let restoreFromMinimized = state.minimized.value

  const readFrame = (element: Element) => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    const opacity = parseFloat(style.opacity)
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      opacity: Number.isFinite(opacity) ? opacity : 1,
      borderRadius: style.borderRadius,
    }
  }
  let interrupted: ReturnType<typeof readFrame> | undefined

  const clearAnimation = () => {
    ++version
    if (animation) {
      animation.onfinish = null
      animation.cancel()
      animation = undefined
    }
  }

  const finish = () => {
    const done = finishVisibility
    finishVisibility = undefined
    // 先完成 v-show 的隐藏，再清除动画，避免闪回原位置。
    done?.()
    clearAnimation()
  }

  const cancelWindowMotion = (element?: Element) => {
    interrupted ??= element && animation ? readFrame(element) : undefined
    finishVisibility = undefined
    clearAnimation()
  }

  const canAnimate = (element: Element) =>
    props.visible !== false &&
    !!element.animate &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const isInteractive = () =>
    !state.minimized.value &&
    props.visible !== false &&
    !state.dragging.value &&
    !state.resizing.value

  const dockFrame = (normal: ReturnType<typeof readFrame>) => {
    const target: WindowBounds = props.minimizeTarget?.() ?? {
      left: normal.left,
      top: normal.top + normal.height,
      width: 32,
      height: 32,
    }
    const scale = Math.min(target.width / normal.width, target.height / normal.height, 0.12)
    return {
      left: target.left + (target.width - normal.width * scale) / 2,
      top: target.top + (target.height - normal.height * scale) / 2,
      width: normal.width * scale,
      height: normal.height * scale,
      opacity: 0,
      borderRadius: normal.borderRadius,
    }
  }

  const run = (
    element: Element,
    from: ReturnType<typeof readFrame>,
    to: ReturnType<typeof readFrame>,
    done?: () => void,
  ) => {
    clearAnimation()
    finishVisibility = done
    const layout = element.getBoundingClientRect()
    if (!canAnimate(element) || !layout.width || !layout.height) {
      finish()
      return
    }
    const transform = getComputedStyle(element).transform
    const base = transform === 'none' ? '' : transform
    const keyframe = (frame: ReturnType<typeof readFrame>) => ({
      transform: `${base} translate(${frame.left - layout.left}px, ${frame.top - layout.top}px) scale(${frame.width / layout.width}, ${frame.height / layout.height})`,
      transformOrigin: '0 0',
      opacity: frame.opacity,
      borderRadius: frame.borderRadius,
    })
    animation = element.animate([keyframe(from), keyframe(to)], { duration, easing, fill: 'both' })
    animation.onfinish = finish
  }

  const minimizeWindow = (element: Element, done: () => void) => {
    const from = interrupted ?? readFrame(element)
    interrupted = undefined
    finish()
    if (!state.minimized.value || !canAnimate(element) || !from.width || !from.height) {
      done()
      return
    }
    run(element, from, dockFrame(readFrame(element)), done)
  }

  const restoreWindow = (element: Element, done: () => void) => {
    const from = interrupted
    interrupted = undefined
    finish()
    const normal = readFrame(element)
    const shouldAnimate = restoreFromMinimized
    restoreFromMinimized = false
    if (!shouldAnimate || !canAnimate(element) || !normal.width || !normal.height) {
      done()
      return
    }
    run(element, from ?? dockFrame(normal), normal, done)
  }

  watch(
    state.minimized,
    (minimized) => {
      if (minimized) restoreFromMinimized = true
      // Vue 取消离场时会先设 display:none，在更新前保存中间画面以便平滑反向。
      const element = windowElement.value
      if (element && animation) interrupted = readFrame(element)
    },
    { flush: 'sync' },
  )

  // 在布局更新前记录当前画面，更新后用 FLIP 缩放过渡，避免逐帧改变宽高。
  watch(state.maximized, async () => {
    const element = windowElement.value
    if (!element || !isInteractive()) return
    const from = readFrame(element)
    finish()
    const request = version
    await nextTick()
    if (request !== version || !element.isConnected || !isInteractive()) return
    run(element, from, readFrame(element))
  })

  watch(
    () => props.visible,
    (visible) => {
      if (visible === false) {
        interrupted = undefined
        finish()
      }
    },
    { flush: 'sync' },
  )
  watch(
    [state.dragging, state.resizing],
    ([dragging, resizing]) => {
      if (dragging || resizing) {
        interrupted = undefined
        finish()
      }
    },
    { flush: 'sync' },
  )
  onBeforeUnmount(() => {
    interrupted = undefined
    finishVisibility = undefined
    clearAnimation()
  })

  return { minimizeWindow, restoreWindow, cancelWindowMotion }
}
