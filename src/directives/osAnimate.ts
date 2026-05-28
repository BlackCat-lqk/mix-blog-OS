import type { Directive } from "vue";
import gsap from "gsap";

/**
 * v-os-animate
 * macOS 风格的窗口显示/隐藏过渡动画
 *
 * 用法: <OsWindow v-os-animate="boolean" />
 * - true:  窗口以缩放+淡入效果出现 (仿 macOS 打开应用)
 * - false: 窗口以缩放+淡出效果消失 (仿 macOS 关闭应用)
 */
const vOsAnimate: Directive<HTMLElement, boolean> = {
  mounted(el, binding) {
    if (!binding.value) {
      gsap.set(el, { display: "none", scale: 0.92, opacity: 0 });
    }
  },

  updated(el, binding) {
    const visible = binding.value === true;
    const wasVisible = binding.oldValue === true;
    if (visible === wasVisible) return;

    gsap.killTweensOf(el);

    if (visible) {
      gsap.set(el, { display: "", willChange: "transform, opacity" });
      gsap.fromTo(
        el,
        { scale: 0.92, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.22,
          ease: "power3.out",
          onComplete() {
            gsap.set(el, { willChange: "auto" });
          },
        },
      );
    } else {
      gsap.set(el, { willChange: "transform, opacity" });
      gsap.to(el, {
        scale: 0.92,
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
        onComplete() {
          gsap.set(el, { display: "none", willChange: "auto" });
        },
      });
    }
  },

  unmounted(el) {
    gsap.killTweensOf(el);
  },
};

export default vOsAnimate;
