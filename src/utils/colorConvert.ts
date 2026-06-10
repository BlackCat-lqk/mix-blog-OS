/**
 * @description 颜色空间转换工具：RGB ↔ HSV ↔ LAB ↔ HEX
 */

// ---- 类型定义 ----

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface LAB {
  l: number;  // 0-100
  a: number;  // -128 ~ 127
  b: number;  // -128 ~ 127
}

// ---- RGB ↔ HSV ----

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;

  const max = Math.max(rp, gp, bp);
  const min = Math.min(rp, gp, bp);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rp) {
      h = 60 * (((gp - bp) / delta) % 6);
    } else if (max === gp) {
      h = 60 * ((bp - rp) / delta + 2);
    } else {
      h = 60 * ((rp - gp) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const sp = s / 100;
  const vp = v / 100;
  const hp = h / 60;

  const c = vp * sp;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = vp - c;

  let rp = 0, gp = 0, bp = 0;
  if (hp < 1)       { rp = c; gp = x; bp = 0; }
  else if (hp < 2)  { rp = x; gp = c; bp = 0; }
  else if (hp < 3)  { rp = 0; gp = c; bp = x; }
  else if (hp < 4)  { rp = 0; gp = x; bp = c; }
  else if (hp < 5)  { rp = x; gp = 0; bp = c; }
  else              { rp = c; gp = 0; bp = x; }

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

// ---- RGB ↔ HEX ----

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

// ---- RGB ↔ LAB（经由 XYZ / D65 光源）----

/** sRGB → 线性 RGB */
function linearize(c: number): number {
  const cp = c / 255;
  return cp <= 0.04045 ? cp / 12.92 : Math.pow((cp + 0.055) / 1.055, 2.4);
}

/** 线性 RGB → sRGB */
function delinearize(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

/** XYZ → LAB 辅助函数 */
function xyzToLabF(t: number): number {
  const delta = 6 / 29;
  return t > delta * delta * delta ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

/** LAB → XYZ 辅助函数 */
function labToXyzF(t: number): number {
  const delta = 6 / 29;
  return t > delta ? t * t * t : 3 * delta * delta * (t - 4 / 29);
}

// D65 参考白点
const REF_X = 0.95047;
const REF_Y = 1.0;
const REF_Z = 1.08883;

export function rgbToLab(rgb: RGB): LAB {
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);

  // RGB → XYZ（D65）
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

  // XYZ → LAB
  const fx = xyzToLabF(x / REF_X);
  const fy = xyzToLabF(y / REF_Y);
  const fz = xyzToLabF(z / REF_Z);

  return {
    l: Math.round(116 * fy - 16),
    a: Math.round(500 * (fx - fy)),
    b: Math.round(200 * (fy - fz)),
  };
}

export function labToRgb({ l, a_coord, b_coord }: LAB): RGB {
  // LAB → XYZ
  const fy = (l + 16) / 116;
  const fx = a_coord / 500 + fy;
  const fz = fy - b_coord / 200;

  const x = labToXyzF(fx) * REF_X;
  const y = labToXyzF(fy) * REF_Y;
  const z = labToXyzF(fz) * REF_Z;

  // XYZ → RGB（线性）
  const r =  3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const b =  0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  return {
    r: clampByte(delinearize(r)),
    g: clampByte(delinearize(g)),
    b: clampByte(delinearize(b)),
  };
}

// ---- 便捷组合函数 ----

export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv));
}

export function hexToHsv(hex: string): HSV | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsv(rgb) : null;
}

export function hsvToLab(hsv: HSV): LAB {
  return rgbToLab(hsvToRgb(hsv));
}

export function labToHsv(lab: LAB): HSV {
  return rgbToHsv(labToRgb(lab));
}

// ---- 工具函数 ----

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, n));
}

export function clampHsv(hsv: HSV): HSV {
  return {
    h: ((hsv.h % 360) + 360) % 360,
    s: Math.max(0, Math.min(100, hsv.s)),
    v: Math.max(0, Math.min(100, hsv.v)),
  };
}

export function clampLab(lab: LAB): LAB {
  return {
    l: Math.max(0, Math.min(100, lab.l)),
    a: Math.max(-128, Math.min(127, lab.a)),
    b: Math.max(-128, Math.min(127, lab.b)),
  };
}
