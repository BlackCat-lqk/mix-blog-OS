<!-- * @description: 自定义颜色编辑器 — HSV/HSL/LAB 色彩空间、渐变停止点、拾色器 -->
<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { _copyToClipboard } from "@/utils/publickFun";
import {
  type RGB,
  type HSV,
  type LAB,
  rgbToHsv,
  hsvToRgb,
  rgbToLab,
  labToRgb,
  hsvToHex,
  hexToHsv,
} from "@/utils/colorConvert";

// ---- Props & Emits ----

const props = defineProps<{
  /** 初始 hex 颜色值，如 "#FFFFFF" */
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// ---- 核心状态：以 HSV 为内部唯一真相来源 ----

const hue = ref(0);
const saturation = ref(100);
const value = ref(100);

// ---- 从 HSV 派生的颜色表示 ----

const currentRgb = computed<RGB>(() =>
  hsvToRgb({ h: hue.value, s: saturation.value, v: value.value }),
);

const currentHsv = computed<HSV>(() => ({
  h: hue.value,
  s: saturation.value,
  v: value.value,
}));

const currentLab = computed<LAB>(() => rgbToLab(currentRgb.value));

const hexValue = computed<string>(() =>
  hsvToHex({ h: hue.value, s: saturation.value, v: value.value }),
);

// ---- 各模式输入缓冲区（字符串，允许部分输入）----

const activeEditMode = ref<"rgb" | "hsv" | "lab" | null>(null);

const rgbBuf = ref({ r: "255", g: "255", b: "255" });
const hsvBuf = ref({ h: "0", s: "0", v: "100" });
const labBuf = ref({ l: "100", a: "0", b: "0" });
const hexBuf = ref("#FFFFFF");

// 同步所有缓冲区（跳过正在编辑的模式）
const syncBuffers = (skip?: "rgb" | "hsv" | "lab") => {
  if (skip !== "rgb") {
    const rgb = currentRgb.value;
    rgbBuf.value = { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) };
  }
  if (skip !== "hsv") {
    hsvBuf.value = { h: String(hue.value), s: String(saturation.value), v: String(value.value) };
  }
  if (skip !== "lab") {
    const lab = currentLab.value;
    labBuf.value = { l: String(lab.l), a: String(lab.a), b: String(lab.b) };
  }
  if (!skip) {
    hexBuf.value = hexValue.value;
  }
}

// ---- 渐变状态 (Gradient State) ----

interface GradientStop {
  id: number;
  position: number; // 0-100 %
  color: string; // hex
}

const nextStopId = ref(1);

const gradientStops = ref<GradientStop[]>([
  { id: nextStopId.value++, position: 0, color: "#ffffff" },
  { id: nextStopId.value++, position: 100, color: "#ffffff" },
]);

const selectedStopId = ref<number | null>(null);
const gradientAngle = ref(0); // 0-359 度
const gradientOpacity = ref(100); // 0-100

const isDraggingStop = ref(false);
const draggingStopId = ref<number | null>(null);

const areaColorRef = ref<HTMLElement | null>(null);

// 排序后的停止点
const sortedStops = computed(() =>
  [...gradientStops.value].sort((a, b) => a.position - b.position),
);

/** hex -> {r,g,b} (direct parse, no HSV intermediate) */
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

// 预览用的渐变 CSS
const gradientCSS = computed(() => {
  const stops = sortedStops.value;
  if (stops.length === 0) return "";
  if (stops.length === 1) return stops[0]?.color;

  const stopStrings = stops.map((s) => {
    const rgb = hexToRgb(s.color);
    const alpha = gradientOpacity.value / 100;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha}) ${s.position}%`;
  });
  return `linear-gradient(${gradientAngle.value}deg, ${stopStrings.join(", ")})`;
});

// 编辑器横条的渐变背景（始终水平）
const gradientBarCSS = computed(() => {
  const stops = sortedStops.value;
  if (stops.length === 0) return "#ccc";
  if (stops.length === 1) return stops[0]?.color;

  const stopStrings = stops.map((s) => `${s.color} ${s.position}%`);
  return `linear-gradient(to right, ${stopStrings.join(", ")})`;
});

// 可复制的 CSS 文本
const gradientCSSText = computed(() => {
  if (gradientStops.value.length === 0) return "";
  if (gradientStops.value.length === 1)
    return `background-color: ${gradientStops.value[0]?.color};`;

  const stops = sortedStops.value;
  const stopStrings = stops.map((s) => {
    const rgb = hexToRgb(s.color);
    const alpha = gradientOpacity.value / 100;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha}) ${s.position}%`;
  });
  return `background-image: linear-gradient(${gradientAngle.value}deg, ${stopStrings.join(", ")});`;
});

// ---- 从内部 HSV 状态更新所有派生值 ----

const updateFromHsv = (h: number, s: number, v: number) => {
  hue.value = ((h % 360) + 360) % 360;
  saturation.value = Math.max(0, Math.min(100, s));
  value.value = Math.max(0, Math.min(100, v));
  syncBuffers(activeEditMode.value ?? undefined);
  emit("update:modelValue", hexValue.value);

  // 同步选中渐变停止点的颜色
  if (selectedStopId.value !== null) {
    const stop = gradientStops.value.find((s) => s.id === selectedStopId.value);
    if (stop) stop.color = hexValue.value;
  }
}

const updateFromRgb = (r: number, g: number, b: number) => {
  const hsv = rgbToHsv({ r, g, b });
  updateFromHsv(hsv.h, hsv.s, hsv.v);
}

const updateFromLab = (l: number, a: number, b: number) => {
  const clamped: LAB = {
    l: Math.max(0, Math.min(100, l)),
    a: Math.max(-128, Math.min(127, a)),
    b: Math.max(-128, Math.min(127, b)),
  };
  const rgb = labToRgb(clamped);
  updateFromRgb(rgb.r, rgb.g, rgb.b);
}
// ---- HEX 输入 ----

const onHexInput = () => {
  let raw = hexBuf.value.trim();
  if (!raw.startsWith("#")) raw = "#" + raw;
  hexBuf.value = raw;

  const hsv = hexToHsv(raw);
  if (hsv) {
    hue.value = hsv.h;
    saturation.value = hsv.s;
    value.value = hsv.v;
    syncBuffers("rgb");
    syncBuffers("hsv");
    syncBuffers("lab");
    emit("update:modelValue", hexValue.value);
    // 同步选中渐变停止点
    if (selectedStopId.value !== null) {
      const stop = gradientStops.value.find((s) => s.id === selectedStopId.value);
      if (stop) stop.color = hexValue.value;
    }
  }
}

const onHexBlur = () => {
  // 无效则还原
  if (!hexToHsv(hexBuf.value)) {
    hexBuf.value = hexValue.value;
  }
}

// ---- RGB 输入 ----

const onRgbInput = () => {
  const r = parseInt(rgbBuf.value.r);
  const g = parseInt(rgbBuf.value.g);
  const b = parseInt(rgbBuf.value.b);
  if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
    updateFromRgb(
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b)),
    );
  }
}

const onRgbBlur = () => {
  // 无效字段还原为当前值
  const real = currentRgb.value;
  if (isNaN(parseInt(rgbBuf.value.r))) rgbBuf.value.r = String(real.r);
  if (isNaN(parseInt(rgbBuf.value.g))) rgbBuf.value.g = String(real.g);
  if (isNaN(parseInt(rgbBuf.value.b))) rgbBuf.value.b = String(real.b);
  rgbBuf.value.r = String(Math.max(0, Math.min(255, parseInt(rgbBuf.value.r) || 0)));
  rgbBuf.value.g = String(Math.max(0, Math.min(255, parseInt(rgbBuf.value.g) || 0)));
  rgbBuf.value.b = String(Math.max(0, Math.min(255, parseInt(rgbBuf.value.b) || 0)));
  onRgbInput();
}

const onRgbFocus = () => {
  activeEditMode.value = "rgb";
}

const onRgbLeave = () => {
  activeEditMode.value = null;
}

// ---- HSV 输入 ----

const onHsvInput = () => {
  const h = parseInt(hsvBuf.value.h);
  const s = parseInt(hsvBuf.value.s);
  const v = parseInt(hsvBuf.value.v);
  if (!isNaN(h) && !isNaN(s) && !isNaN(v)) {
    updateFromHsv(
      ((h % 360) + 360) % 360,
      Math.max(0, Math.min(100, s)),
      Math.max(0, Math.min(100, v)),
    );
  }
}

const onHsvBlur = () => {
  const real = currentHsv.value;
  if (isNaN(parseInt(hsvBuf.value.h))) hsvBuf.value.h = String(real.h);
  if (isNaN(parseInt(hsvBuf.value.s))) hsvBuf.value.s = String(real.s);
  if (isNaN(parseInt(hsvBuf.value.v))) hsvBuf.value.v = String(real.v);
  hsvBuf.value.h = String((((parseInt(hsvBuf.value.h) || 0) % 360) + 360) % 360);
  hsvBuf.value.s = String(Math.max(0, Math.min(100, parseInt(hsvBuf.value.s) || 0)));
  hsvBuf.value.v = String(Math.max(0, Math.min(100, parseInt(hsvBuf.value.v) || 0)));
  onHsvInput();
}

const onHsvFocus = () => {
  activeEditMode.value = "hsv";
}

const onHsvLeave = () => {
  activeEditMode.value = null;
}

// ---- LAB 输入 ----

const onLabInput = () => {
  const l = parseInt(labBuf.value.l);
  const a = parseInt(labBuf.value.a);
  const b = parseInt(labBuf.value.b);
  if (!isNaN(l) && !isNaN(a) && !isNaN(b)) {
    updateFromLab(l, a, b);
  }
}

const onLabBlur = () => {
  const real = currentLab.value;
  if (isNaN(parseInt(labBuf.value.l))) labBuf.value.l = String(real.l);
  if (isNaN(parseInt(labBuf.value.a))) labBuf.value.a = String(real.a);
  if (isNaN(parseInt(labBuf.value.b))) labBuf.value.b = String(real.b);
  labBuf.value.l = String(Math.max(0, Math.min(100, parseInt(labBuf.value.l) || 0)));
  labBuf.value.a = String(Math.max(-128, Math.min(127, parseInt(labBuf.value.a) || 0)));
  labBuf.value.b = String(Math.max(-128, Math.min(127, parseInt(labBuf.value.b) || 0)));
  onLabInput();
}

const onLabFocus = () => {
  activeEditMode.value = "lab";
}

const onLabLeave = () => {
  activeEditMode.value = null;
}

// ---- 颜色区域 (SV Field) 交互 ----

const fieldRef = ref<HTMLElement | null>(null);
const hueRef = ref<HTMLElement | null>(null);
const isDraggingField = ref(false);
const isDraggingHue = ref(false);

const fieldCursorStyle = computed(() => ({
  left: `${saturation.value}%`,
  top: `${100 - value.value}%`,
  backgroundColor: hexValue.value,
}));

const fieldBgColor = computed(() => {
  // 选定色相下纯饱和明亮颜色
  return hsvToHex({ h: hue.value, s: 100, v: 100 });
});

const hueCursorStyle = computed(() => ({
  top: `${(hue.value / 360) * 100}%`,
}));

const fieldPosToSv = (clientX: number, clientY: number) => {
  const el = fieldRef.value;
  if (!el) return { s: saturation.value, v: value.value };
  const rect = el.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
  return {
    s: (x / rect.width) * 100,
    v: 100 - (y / rect.height) * 100,
  };
}

const onFieldMouseDown = (e: MouseEvent) => {
  isDraggingField.value = true;
  const { s, v } = fieldPosToSv(e.clientX, e.clientY);
  updateFromHsv(hue.value, Math.round(s), Math.round(v));
  e.preventDefault();
}

const onHueMouseDown = (e: MouseEvent) => {
  isDraggingHue.value = true;
  const h = huePosFromClient(e.clientY);
  updateFromHsv(Math.round(h), saturation.value, value.value);
  e.preventDefault();
}

const huePosFromClient = (clientY: number): number => {
  const el = hueRef.value;
  if (!el) return hue.value;
  const rect = el.getBoundingClientRect();
  const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
  return (y / rect.height) * 360;
}

// ---- 全局鼠标事件 ----

const onMouseMove = (e: MouseEvent) => {
  if (isDraggingStop.value && draggingStopId.value !== null) {
    const pos = stopPosFromClient(e.clientX);
    const stop = gradientStops.value.find((s) => s.id === draggingStopId.value);
    if (stop) stop.position = Math.max(0, Math.min(100, Math.round(pos * 10) / 10));
    return;
  }
  if (isDraggingField.value) {
    const { s, v } = fieldPosToSv(e.clientX, e.clientY);
    updateFromHsv(hue.value, Math.round(s), Math.round(v));
  }
  if (isDraggingHue.value) {
    updateFromHsv(Math.round(huePosFromClient(e.clientY)), saturation.value, value.value);
  }
}

const onMouseUp = () => {
  if (isDraggingStop.value) {
    // 延迟重置，让 click 事件能检测到刚拖过
    setTimeout(() => {
      isDraggingStop.value = false;
      draggingStopId.value = null;
    }, 10);
  }
  isDraggingField.value = false;
  isDraggingHue.value = false;
}

// ---- Touch 事件 ----

const getFirstTouch = (e: TouchEvent): Touch | undefined => {
  return e.touches[0];
}

const onFieldTouchStart = (e: TouchEvent) => {
  const touch = getFirstTouch(e);
  if (touch) {
    isDraggingField.value = true;
    const { s, v } = fieldPosToSv(touch.clientX, touch.clientY);
    updateFromHsv(hue.value, Math.round(s), Math.round(v));
    e.preventDefault();
  }
}

const onHueTouchStart = (e: TouchEvent) => {
  const touch = getFirstTouch(e);
  if (touch) {
    isDraggingHue.value = true;
    updateFromHsv(Math.round(huePosFromClient(touch.clientY)), saturation.value, value.value);
    e.preventDefault();
  }
}

const onTouchMove = (e: TouchEvent) => {
  const touch = getFirstTouch(e);
  if (!touch) return;

  if (isDraggingStop.value && draggingStopId.value !== null) {
    const pos = stopPosFromClient(touch.clientX);
    const stop = gradientStops.value.find((s) => s.id === draggingStopId.value);
    if (stop) stop.position = Math.max(0, Math.min(100, Math.round(pos * 10) / 10));
    return;
  }

  if (isDraggingField.value) {
    const { s, v } = fieldPosToSv(touch.clientX, touch.clientY);
    updateFromHsv(hue.value, Math.round(s), Math.round(v));
  }
  if (isDraggingHue.value) {
    updateFromHsv(Math.round(huePosFromClient(touch.clientY)), saturation.value, value.value);
  }
}

const onTouchEnd = () => {
  if (isDraggingStop.value) {
    setTimeout(() => {
      isDraggingStop.value = false;
      draggingStopId.value = null;
    }, 10);
  }
  isDraggingField.value = false;
  isDraggingHue.value = false;
}

// ---- 渐变停止点交互 ----

const stopPosFromClient = (clientX: number): number => {
  const el = areaColorRef.value;
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  return (x / rect.width) * 100;
}

const selectStop = (id: number | null) => {
  selectedStopId.value = id;
  if (id !== null) {
    const stop = gradientStops.value.find((s) => s.id === id);
    if (stop) setFromHex(stop.color);
  }
}

const onStopMouseDown = (e: MouseEvent, stopId: number) => {
  isDraggingStop.value = true;
  draggingStopId.value = stopId;
  selectStop(stopId);
  e.preventDefault();
  e.stopPropagation();
}

const onAreaColorTouchStart = (e: TouchEvent) => {
  const target = (e.target as HTMLElement)?.closest?.("[data-stop-id]") as HTMLElement | null;
  if (!target) return;
  const stopId = Number(target.dataset.stopId);
  if (isNaN(stopId)) return;
  const touch = e.touches[0];
  if (touch) {
    isDraggingStop.value = true;
    draggingStopId.value = stopId;
    selectStop(stopId);
    e.preventDefault();
    e.stopPropagation();
  }
}

const onAreaColorClick = (e: MouseEvent) => {
  // 刚拖完不添加新停止点
  if (isDraggingStop.value) return;

  const pos = stopPosFromClient(e.clientX);
  const newStop: GradientStop = {
    id: nextStopId.value++,
    position: Math.round(pos * 10) / 10,
    color: hexValue.value,
  };
  gradientStops.value.push(newStop);
  selectStop(newStop.id);
}

const removeStop = (stopId: number) => {
  if (gradientStops.value.length <= 2) return; // 最少保留2个
  const idx = gradientStops.value.findIndex((s) => s.id === stopId);
  if (idx !== -1) {
    gradientStops.value.splice(idx, 1);
    if (selectedStopId.value === stopId) selectStop(null);
  }
}

// ---- 初始化 & 外部更新 ----

const setFromHex = (hex: string) => {
  const hsv = hexToHsv(hex);
  if (hsv) {
    hue.value = hsv.h;
    saturation.value = hsv.s;
    value.value = hsv.v;
    syncBuffers();
    emit("update:modelValue", hexValue.value);
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) setFromHex(newVal);
  },
);

// 初始化：设置默认颜色
onMounted(() => {
  if (props.modelValue) {
    setFromHex(props.modelValue);
  } else {
    updateFromHsv(180, 0, 100); // 默认白色
  }
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);

  // 显式设置 passive: false 避免浏览器控制台警告
  fieldRef.value?.addEventListener("touchstart", onFieldTouchStart, { passive: false });
  hueRef.value?.addEventListener("touchstart", onHueTouchStart, { passive: false });
  areaColorRef.value?.addEventListener("touchstart", onAreaColorTouchStart, { passive: false });
});

onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);

  fieldRef.value?.removeEventListener("touchstart", onFieldTouchStart);
  hueRef.value?.removeEventListener("touchstart", onHueTouchStart);
  areaColorRef.value?.removeEventListener("touchstart", onAreaColorTouchStart);
});
</script>

<template>
  <div class="color-picker">
    <div style="display: flex; gap: 40px">
      <!-- 预览区域 -->
      <div
        class="preview-box"
        :style="
          gradientStops.length >= 2 ? { backgroundImage: gradientCSS } : { backgroundColor: '#fff' }
        "
      ></div>
      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          justify-content: center;
        "
      >
        <!-- ====== 渐变编辑器 ====== -->
        <div class="area-color" ref="areaColorRef" @click="onAreaColorClick">
          <div class="area-color__bar" :style="{ background: gradientBarCSS }">
            <!-- 停止点指示器 -->
            <div
              v-for="stop in gradientStops"
              :key="stop.id"
              class="area-color__stop"
              :class="{ 'area-color__stop--selected': stop.id === selectedStopId }"
              :style="{ left: stop.position + '%', backgroundColor: stop.color }"
              :data-stop-id="stop.id"
              @mousedown="(e: MouseEvent) => onStopMouseDown(e, stop.id)"
              @dblclick="removeStop(stop.id)"
            >
              <span class="area-color__stop-label">{{ stop.position }}%</span>
            </div>
          </div>
        </div>
        <!-- 渐变参数控件 -->
        <div class="gradient-controls">
          <div class="gradient-control">
            <label class="gradient-control__label">角度</label>
            <input
              class="gradient-control__range"
              type="range"
              min="0"
              max="360"
              v-model.number="gradientAngle"
            />
            <input
              class="gradient-control__num"
              type="number"
              min="0"
              max="360"
              v-model.number="gradientAngle"
            />
            <span class="gradient-control__unit">°</span>
          </div>
          <div class="gradient-control">
            <label class="gradient-control__label">透明度</label>
            <input
              class="gradient-control__range"
              type="range"
              min="0"
              max="100"
              v-model.number="gradientOpacity"
            />
            <input
              class="gradient-control__num"
              type="number"
              min="0"
              max="100"
              v-model.number="gradientOpacity"
            />
            <span class="gradient-control__unit">%</span>
          </div>
          <div class="gradient-control__copy">
            <code class="gradient-control__css">{{ gradientCSSText }}</code>
            <img
              src="@/assets/uiColors/icons/copy.svg"
              @click="_copyToClipboard(gradientCSSText)"
              title="复制 CSS"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 主取色区域 ====== -->
    <div style="display: flex; gap: 20px">
      <div class="color-picker__main">
        <!-- SV 颜色平面 -->
        <div
          class="color-picker__field"
          ref="fieldRef"
          @mousedown="onFieldMouseDown"
        >
          <div class="color-picker__field-bg" :style="{ backgroundColor: fieldBgColor }"></div>
          <div class="color-picker__field-sat"></div>
          <div class="color-picker__field-val"></div>
          <div class="color-picker__field-cursor" :style="fieldCursorStyle"></div>
        </div>

        <!-- Hue 色相滑条 -->
        <div
          class="color-picker__hue"
          ref="hueRef"
          @mousedown="onHueMouseDown"
        >
          <div class="color-picker__hue-cursor" :style="hueCursorStyle"></div>
        </div>
      </div>

      <div class="color-picker__controls">
        <!-- RGB 控件 -->
        <div class="color-picker__inputs">
          <span>RGB:</span>
          <div class="color-picker__input-group">
            <label class="color-picker__label">R</label>
            <input
              class="color-picker__input"
              v-model="rgbBuf.r"
              @input="onRgbInput"
              @blur="onRgbBlur"
              @focus="onRgbFocus"
              @change="onRgbLeave"
              type="number"
              min="0"
              max="255"
            />
          </div>
          <div class="color-picker__input-group">
            <label class="color-picker__label">G</label>
            <input
              class="color-picker__input"
              v-model="rgbBuf.g"
              @input="onRgbInput"
              @blur="onRgbBlur"
              @focus="onRgbFocus"
              @change="onRgbLeave"
              type="number"
              min="0"
              max="255"
            />
          </div>
          <div class="color-picker__input-group">
            <label class="color-picker__label">B</label>
            <input
              class="color-picker__input"
              v-model="rgbBuf.b"
              @input="onRgbInput"
              @blur="onRgbBlur"
              @focus="onRgbFocus"
              @change="onRgbLeave"
              type="number"
              min="0"
              max="255"
            />
          </div>
          <img
            src="@/assets/uiColors/icons/copy.svg"
            @click="_copyToClipboard(`rgb(${rgbBuf.r}, ${rgbBuf.g}, ${rgbBuf.b})`)"
          />
        </div>

        <!-- HSV 控件 -->
        <div class="color-picker__inputs">
          <span>HSV:</span>
          <div class="color-picker__input-group">
            <label class="color-picker__label">H</label>
            <input
              class="color-picker__input"
              v-model="hsvBuf.h"
              @input="onHsvInput"
              @blur="onHsvBlur"
              @focus="onHsvFocus"
              @change="onHsvLeave"
              type="number"
              min="0"
              max="360"
            />
          </div>
          <div class="color-picker__input-group">
            <label class="color-picker__label">S</label>
            <input
              class="color-picker__input"
              v-model="hsvBuf.s"
              @input="onHsvInput"
              @blur="onHsvBlur"
              @focus="onHsvFocus"
              @change="onHsvLeave"
              type="number"
              min="0"
              max="100"
            />
          </div>
          <div class="color-picker__input-group">
            <label class="color-picker__label">V</label>
            <input
              class="color-picker__input"
              v-model="hsvBuf.v"
              @input="onHsvInput"
              @blur="onHsvBlur"
              @focus="onHsvFocus"
              @change="onHsvLeave"
              type="number"
              min="0"
              max="100"
            />
          </div>
          <img
            src="@/assets/uiColors/icons/copy.svg"
            @click="_copyToClipboard(`hsv(${hsvBuf.h}, ${hsvBuf.s}, ${hsvBuf.v})`)"
          />
        </div>

        <!-- LAB 控件 -->
        <div class="color-picker__inputs">
          <span>LAB:</span>
          <div class="color-picker__input-group">
            <label class="color-picker__label">L</label>
            <input
              class="color-picker__input"
              v-model="labBuf.l"
              @input="onLabInput"
              @blur="onLabBlur"
              @focus="onLabFocus"
              @change="onLabLeave"
              type="number"
              min="0"
              max="100"
            />
          </div>
          <div class="color-picker__input-group">
            <label class="color-picker__label">A</label>
            <input
              class="color-picker__input"
              v-model="labBuf.a"
              @input="onLabInput"
              @blur="onLabBlur"
              @focus="onLabFocus"
              @change="onLabLeave"
              type="number"
              min="-128"
              max="127"
            />
          </div>
          <div class="color-picker__input-group">
            <label class="color-picker__label">B</label>
            <input
              class="color-picker__input"
              v-model="labBuf.b"
              @input="onLabInput"
              @blur="onLabBlur"
              @focus="onLabFocus"
              @change="onLabLeave"
              type="number"
              min="-128"
              max="127"
            />
          </div>
          <img
            src="@/assets/uiColors/icons/copy.svg"
            @click="_copyToClipboard(`lab(${labBuf.l}, ${labBuf.a}, ${labBuf.b})`)"
          />
        </div>
        <div class="color-picker__panel">
          <div class="color-picker__panel-swatch"></div>
          <div class="color-picker__panel-hex">
            <input
              class="color-picker__panel-hex-input"
              v-model="hexBuf"
              @input="onHexInput"
              @blur="onHexBlur"
              maxlength="7"
              spellcheck="false"
            />
            <img src="@/assets/uiColors/icons/copy.svg" @click="_copyToClipboard(hexBuf)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ---- 变量 ----
$field-size: 280px;
$slider-width: 18px;
$panel-width: 140px;
$border-color: #d0d0d0;
$text-color: #222;
$bg: #f2f2f2;

.color-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 30px;
  padding: 16px;
  border-radius: 10px;
  user-select: none;
  font-family: "Mulish", "PingFang SC", "Microsoft YaHei", sans-serif;
}

// 预览区域
.preview-box {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background-color: #fff;
  background-size: cover;
  aspect-ratio: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: background-image 0.2s ease;
}

// ====== 渐变编辑器 ======
.area-color {
  width: 300px;
  position: relative;
  cursor: pointer;

  &__bar {
    width: 100%;
    height: 36px;
    border-radius: 8px;
    border: 2px solid $border-color;
    position: relative;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    transition: border-color 0.15s;

    .area-color:hover & {
      border-color: #aaa;
    }
  }

  &__stop {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow:
      0 0 0 2px rgba(0, 0, 0, 0.35),
      0 1px 4px rgba(0, 0, 0, 0.4);
    cursor: grab;
    z-index: 2;
    transition:
      width 0.12s,
      height 0.12s,
      border-width 0.12s,
      box-shadow 0.12s;

    &:active {
      cursor: grabbing;
    }

    &--selected {
      width: 24px;
      height: 24px;
      border-width: 4px;
      box-shadow:
        0 0 0 3px #0078d4,
        0 0 10px rgba(0, 120, 212, 0.5),
        0 1px 6px rgba(0, 0, 0, 0.4);
      z-index: 3;
    }

    &-label {
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: #666;
      white-space: nowrap;
      font-family: "Consolas", "Menlo", monospace;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;

      .area-color__stop--selected &,
      .area-color__stop:hover & {
        opacity: 1;
      }
    }
  }
}

// ====== 渐变参数控件 ======
.gradient-controls {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gradient-control {
  display: flex;
  align-items: center;
  gap: 8px;

  &__label {
    min-width: 42px;
    font-size: 13px;
    font-weight: 600;
    color: #666;
    letter-spacing: 0.5px;
  }

  &__range {
    flex: 1;
    height: 6px;
    appearance: none;
    -webkit-appearance: none;
    background: linear-gradient(to right, #ddd 0%, #aaa 100%);
    border-radius: 3px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #888;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      transition: border-color 0.15s;

      &:hover {
        border-color: #0078d4;
      }
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #888;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    }
  }

  &__num {
    width: 52px;
    height: 28px;
    text-align: center;
    border: 1px solid $border-color;
    border-radius: 5px;
    font-size: 13px;
    color: $text-color;
    background: #fff;
    outline: none;
    font-family: "Consolas", "Menlo", monospace;

    -moz-appearance: textfield;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      border-color: #0078d4;
      box-shadow: 0 0 0 1px rgba(0, 120, 212, 0.2);
    }
  }

  &__unit {
    font-size: 12px;
    color: #999;
    font-weight: 600;
  }

  &__copy {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f5f5f5;
    border: 1px solid $border-color;
    border-radius: 6px;
    padding: 8px 10px;
    margin-top: 4px;

    img {
      width: 18px;
      cursor: pointer;
      flex-shrink: 0;
      opacity: 0.6;
      transition: opacity 0.15s;

      &:hover {
        opacity: 1;
      }
    }
  }

  &__css {
    flex: 1;
    font-size: 11px;
    color: #555;
    word-break: break-all;
    font-family: "Consolas", "Menlo", monospace;
    line-height: 1.4;
    user-select: all;
  }
}

// ====== 主取色区域 ======
.color-picker__main {
  display: flex;
  gap: 10px;
}

// --- SV 颜色平面 ---
.color-picker__field {
  width: $field-size;
  height: $field-size;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  cursor: crosshair;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.color-picker__field-bg {
  position: absolute;
  inset: 0;
}

.color-picker__field-sat {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fff, transparent);
}

.color-picker__field-val {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #000, transparent);
}

.color-picker__field-cursor {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.4);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
  transition:
    left 0.05s ease-out,
    top 0.05s ease-out;
}

// --- Hue 色相滑条 ---
.color-picker__hue {
  width: $slider-width;
  height: $field-size;
  position: relative;
  border-radius: 9px;
  cursor: pointer;
  background: linear-gradient(
    to bottom,
    #ff0000 0%,
    #ffff00 17%,
    #00ff00 33%,
    #00ffff 50%,
    #0000ff 67%,
    #ff00ff 83%,
    #ff0000 100%
  );
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.color-picker__hue-cursor {
  position: absolute;
  left: -4px;
  right: -4px;
  height: 8px;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 2;

  // 左右三角箭头
  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-right: 5px solid #333333;
  }

  &::after {
    right: 0;
    border-left: 5px solid #333;
  }
}

// ====== 右侧预览面板 ======
.color-picker__panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: $panel-width;
}

.color-picker__panel-hex {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 6px;
  padding: 0 8px;
  height: 32px;
  img {
    width: 16px;
    cursor: pointer;
  }
  &-hash {
    color: #888;
    font-size: 14px;
    font-weight: 600;
    margin-right: 2px;
  }

  &-input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 14px;
    color: $text-color;
    background: transparent;
    font-family: "Consolas", "Menlo", monospace;
    letter-spacing: 0.5px;
    min-width: 0;

    &::selection {
      background: rgba(0, 120, 212, 0.25);
    }
  }
}

.color-picker__panel-swatch {
  position: relative;
  width: 100%;
  aspect-ratio: 3/1;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  // 棋盘格背景（显示透明度感）
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px;
  background-position:
    0 0,
    0 5px,
    5px -5px,
    -5px 0;

  // 叠加实际颜色
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background: v-bind("hexValue");
  }
}

.color-picker__panel-values {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: #666;

  &--row {
    display: flex;
    justify-content: space-between;
    padding: 0 4px;

    span:first-child {
      font-weight: 600;
      color: #999;
    }

    span:last-child {
      color: $text-color;
      font-family: "Consolas", "Menlo", monospace;
    }
  }
}

// ====== 底部控件区域 ======
.color-picker__controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// --- 模式标签 ---
.color-picker__modes {
  display: flex;
  gap: 2px;
  background: #e0e0e0;
  border-radius: 6px;
  padding: 3px;
  width: fit-content;
}

.color-picker__mode-btn {
  padding: 4px 16px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.5px;

  &:hover {
    color: #555;
  }

  &.active {
    background: #fff;
    color: $text-color;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
}

// --- 输入控件 ---
.color-picker__inputs {
  display: flex;
  gap: 12px;
  align-items: center;
  letter-spacing: 0.03rem;
  span {
    width: 30px;
  }
  img {
    width: 16px;
    cursor: pointer;
  }
}

.color-picker__input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-picker__label {
  font-size: 12px;
  font-weight: 700;
  color: #999;
  width: 16px;
  text-align: right;
  letter-spacing: 0.5px;
}

.color-picker__input {
  width: 64px;
  height: 30px;
  text-align: center;
  border: 1px solid $border-color;
  border-radius: 5px;
  font-size: 14px;
  color: $text-color;
  background: #fff;
  outline: none;
  font-family: "Consolas", "Menlo", monospace;
  transition: border-color 0.15s;
  -moz-appearance: textfield;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }

  &:focus {
    border-color: #0078d4;
    box-shadow: 0 0 0 1px rgba(0, 120, 212, 0.2);
  }
}
</style>
