/**
 * @description 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 防抖时间间隔（毫秒）
 * @returns {Function} - 包装后的防抖函数
 */
export function _debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// 日期格式化
interface resDate {
  date: string;
  time: string;
}
export function _formatTime(dateString: string): resDate {
  const date = dateString ? new Date(dateString) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
  };
}

/**
 * @description 格式化秒onds为mm:ss
 * @returns {string} - 格式化后的时间字符串
 */
// 格式秒
export const formatSeconds = (minute: number) => {
  const second = Math.floor(minute % 60);
  const ms = Math.floor(minute / 60);
  return `${ms}:${second < 10 ? "0" + second : second}`;
};

/**
 * @description 将文本内容复制到剪贴板
 * @param {string} text - 要复制的文本内容
 * @returns {Promise<boolean>} - 复制成功返回 true，失败返回 false
 */
export async function _copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // 降级方案：使用传统的 execCommand
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
