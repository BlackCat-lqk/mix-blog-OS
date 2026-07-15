/**
 * Message — 函数式调用消息通知
 *
 * 用法：
 *   import { Message } from "@/utils/message";
 *
 *   Message.success("操作成功");
 *   Message.error("发生错误");
 *   Message.warning("请检查输入");
 *
 *   // 带配置
 *   Message.success("已保存", { duration: 5000, position: "top-right", maxToasts: 5 }); // maxToasts = 5 最大通知5条
 *   Message.error("失败",     { duration: 0,    position: "bottom" });   // duration=0 不自动关闭
 *
 * 位置（8 个）：
 *   top | bottom | left | right | top-left | top-right | bottom-left | bottom-right
 */

import { createVNode, render } from "vue";
import ToastMessage from "@/components/ToastMessage.vue";
import type { ToastType, ToastPosition } from "@/components/ToastMessage.vue";

// ============================================================================
// Types
// ============================================================================

export interface MessageOptions {
  /** 自动关闭时间 (ms)，0 表示不自动关闭，默认 3000 */
  duration?: number;
  /** 弹出位置，默认 "top" */
  position?: ToastPosition;
  /** 但容器最大通知数 */
  maxToasts?: number;
}

// ============================================================================
// Container management
// ============================================================================

const containerMap = new Map<ToastPosition, HTMLElement>();

function getContainer(position: ToastPosition): HTMLElement {
  let container = containerMap.get(position);
  if (!container) {
    container = document.createElement("div");
    container.className = `toast-container toast-container--${position}`;
    container.setAttribute("data-toast-container", position);
    document.body.appendChild(container);
    containerMap.set(position, container);
  }
  return container;
}

function countToasts(container: HTMLElement): number {
  return container.querySelectorAll(".toast-item-wrapper").length;
}

function removeOldestToast(container: HTMLElement) {
  const wrappers = container.querySelectorAll(".toast-item-wrapper");
  if (wrappers.length > 0) {
    const oldest = wrappers[0]; // 最旧的在最前面（top）或最后面（bottom）
    // 通过触发关闭按钮来触发正常销毁流程
    const closeBtn = oldest?.querySelector(".toast__close") as HTMLElement | null;
    if (closeBtn) {
      closeBtn.click();
    } else {
      // 兜底：直接移除 DOM
      oldest?.remove();
    }
  }
}

// ============================================================================
// Core
// ============================================================================

function createMessage(type: ToastType, message: string, options: MessageOptions = {}) {
  const { duration = 3000, position = "top", maxToasts = 10 } = options;
  const container = getContainer(position);

  // 超限时移除最早的一条
  if (countToasts(container) >= maxToasts) {
    removeOldestToast(container);
  }

  // 挂载点 — 每个 toast 独立，互不影响
  const mountEl = document.createElement("div");
  mountEl.className = "toast-item-wrapper";

  // ★ 插入位置决定堆叠方向
  //    top / left / right 系列：最新在上方 → prepend
  //    bottom 系列：最新在下方 → append
  if (position.startsWith("top") || position === "left" || position === "right") {
    container.insertBefore(mountEl, container.firstChild);
  } else {
    container.appendChild(mountEl);
  }

  // ---- 创建 vnode ----
  const vnode = createVNode(ToastMessage, {
    type,
    message,
    position,
    duration,
    onDestroy() {
      // 动画结束后卸载
      render(null, mountEl);
      if (mountEl.parentNode) {
        mountEl.parentNode.removeChild(mountEl);
      }

      // 容器内无剩余 toast 时，清理容器
      if (container.children.length === 0) {
        document.body.removeChild(container);
        containerMap.delete(position);
      }
    },
  });

  render(vnode, mountEl);
}

// ============================================================================
// Public API
// ============================================================================

export const Message = {
  /** 成功通知 */
  success(msg: string, options?: MessageOptions) {
    createMessage("success", msg, options);
  },

  /** 错误通知 */
  error(msg: string, options?: MessageOptions) {
    createMessage("error", msg, options);
  },

  /** 警告通知 */
  warning(msg: string, options?: MessageOptions) {
    createMessage("warning", msg, options);
  },
};
