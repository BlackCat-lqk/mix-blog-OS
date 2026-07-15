import type { Directive, DirectiveBinding } from "vue";
import "./loading.scss";

interface MaskInstance {
  el: HTMLElement;
  fullscreen: boolean;
}

function resolveBinding(binding: DirectiveBinding): {
  visible: boolean;
  text: string;
} {
  const val = binding.value;
  if (typeof val === "string") {
    return { visible: val.length > 0, text: val };
  }
  return { visible: !!val, text: "" };
}

function createMask(text: string, fullscreen: boolean): HTMLElement {
  const mask = document.createElement("div");
  mask.className = "v-loading-mask";
  if (fullscreen) {
    mask.classList.add("is-fullscreen");
  }

  const spinner = document.createElement("div");
  spinner.className = "v-loading-spinner";
  mask.appendChild(spinner);

  if (text) {
    const textEl = document.createElement("p");
    textEl.className = "v-loading-text";
    textEl.textContent = text;
    mask.appendChild(textEl);
  }

  return mask;
}

function setText(mask: HTMLElement, text: string): void {
  const existing = mask.querySelector(".v-loading-text") as HTMLElement | null;
  if (text && existing) {
    existing.textContent = text;
  } else if (text && !existing) {
    const textEl = document.createElement("p");
    textEl.className = "v-loading-text";
    textEl.textContent = text;
    mask.appendChild(textEl);
  } else if (!text && existing) {
    existing.remove();
  }
}

function insertMask(el: HTMLElement, mask: HTMLElement): void {
  const computed = getComputedStyle(el);
  if (computed.position === "static") {
    el.style.position = "relative";
  }
  el.appendChild(mask);
}

const vLoading: Directive<HTMLElement> = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { visible, text } = resolveBinding(binding);
    if (!visible) return;
    const fullscreen = !!binding.modifiers?.fullscreen;
    const mask = createMask(text, fullscreen);
    insertMask(el, mask);
    (el as any)._vLoadingMask = { el: mask, fullscreen } satisfies MaskInstance;
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { visible, text } = resolveBinding(binding);
    const fullscreen = !!binding.modifiers?.fullscreen;
    const instance: MaskInstance | undefined = (el as any)._vLoadingMask;

    if (visible && !instance) {
      const mask = createMask(text, fullscreen);
      insertMask(el, mask);
      (el as any)._vLoadingMask = { el: mask, fullscreen } satisfies MaskInstance;
    } else if (visible && instance) {
      setText(instance.el, text);
    } else if (!visible && instance) {
      instance.el.remove();
      (el as any)._vLoadingMask = null;
    }
  },

  unmounted(el: HTMLElement) {
    const instance: MaskInstance | undefined = (el as any)._vLoadingMask;
    if (instance) {
      instance.el.remove();
      (el as any)._vLoadingMask = null;
    }
  },
};

export default vLoading;
