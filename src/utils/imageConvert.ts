/**
 * @description 图片格式转换工具
 * 支持 PNG / JPEG / WebP / AVIF / BMP / GIF / ICO 七种输出格式
 */

import { encodeGIF } from "./gifEncoder";

/** 支持的输出格式 */
export const OUTPUT_FORMATS = [
  { value: "image/png",  label: "PNG",  ext: "png",  lossless: true  },
  { value: "image/jpeg", label: "JPEG", ext: "jpg",  lossless: false },
  { value: "image/webp", label: "WebP", ext: "webp", lossless: false },
  { value: "image/avif", label: "AVIF", ext: "avif", lossless: false },
  { value: "image/bmp",  label: "BMP",  ext: "bmp",  lossless: true  },
  { value: "image/gif",  label: "GIF",  ext: "gif",  lossless: true  },
  { value: "image/x-icon", label: "ICO", ext: "ico", lossless: true },
] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number]["value"];

export interface ConvertOptions {
  format: OutputFormat;
  quality: number; // 0-100, only for lossy formats
}

export interface ConvertResult {
  fileName: string;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  blob: Blob;
  convertedSize: number;
  convertedFormat: string;
  ext: string;
  width: number;
  height: number;
}

/**
 * 将 File 加载为 HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`无法加载图片: ${file.name}`));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error(`无法读取文件: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * 将 ImageData 编码为 BMP 格式的 Blob
 * BMP 是最简单的位图格式，浏览器原生不支持 toBlob('image/bmp')
 */
function encodeBMP(imageData: ImageData): Blob {
  const { data, width, height } = imageData;
  const rowBytes = ((width * 3 + 3) >>> 2) << 2; // 每行补齐到 4 字节边界
  const pixelArraySize = rowBytes * height;
  const fileSize = 54 + pixelArraySize; // 54 字节文件头 + DIB头

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  let offset = 0;

  // BITMAPFILEHEADER (14 bytes)
  view.setUint8(offset, 0x42); offset++; // 'B'
  view.setUint8(offset, 0x4d); offset++; // 'M'
  view.setUint32(offset, fileSize, true); offset += 4; // 文件大小
  view.setUint16(offset, 0, true); offset += 2; // 保留1
  view.setUint16(offset, 0, true); offset += 2; // 保留2
  view.setUint32(offset, 54, true); offset += 4; // 像素数据偏移

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(offset, 40, true); offset += 4; // DIB头大小
  view.setInt32(offset, width, true); offset += 4;
  view.setInt32(offset, -height, true); offset += 4; // 负值 = 从上到下
  view.setUint16(offset, 1, true); offset += 2; // 色彩平面数
  view.setUint16(offset, 24, true); offset += 2; // 每像素位数 (RGB)
  view.setUint32(offset, 0, true); offset += 4; // 压缩方式 (BI_RGB)
  view.setUint32(offset, pixelArraySize, true); offset += 4;
  view.setInt32(offset, 2835, true); offset += 4; // 水平分辨率 (72 DPI)
  view.setInt32(offset, 2835, true); offset += 4; // 垂直分辨率 (72 DPI)
  view.setUint32(offset, 0, true); offset += 4; // 调色板颜色数
  view.setUint32(offset, 0, true); offset += 4; // 重要颜色数

  // 像素数据（BMP 是 BGR 顺序）
  const pixelData = new Uint8Array(buffer, 54);
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4; // data 是 RGBA（从上到下），需要翻转
    const dstRow = (rowBytes * y) | 0;
    for (let x = 0; x < width; x++) {
      const px = srcRow + x * 4;
      pixelData[dstRow + x * 3] = data[px + 2];     // B
      pixelData[dstRow + x * 3 + 1] = data[px + 1]; // G
      pixelData[dstRow + x * 3 + 2] = data[px];     // R
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

/**
 * 将 PNG Blob 封装为 ICO（Windows 图标）格式
 * ICO 容器 = 6字节头 + 16字节目录项 + 嵌入的 PNG 数据
 */
async function encodeICO(pngBlob: Blob, width: number, height: number): Promise<Blob> {
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const fileSize = 6 + 16 + pngBytes.length;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  let off = 0;

  // ICO Header (6 bytes)
  view.setUint16(off, 0, true); off += 2; // Reserved
  view.setUint16(off, 1, true); off += 2; // Type: 1 = ICO
  view.setUint16(off, 1, true); off += 2; // Image count

  // Directory Entry (16 bytes)
  const w = width >= 256 ? 0 : width;   // 0 代表 256
  const h = height >= 256 ? 0 : height;
  view.setUint8(off, w); off += 1;
  view.setUint8(off, h); off += 1;
  view.setUint8(off, 0); off += 1;  // Color palette (0 = no palette)
  view.setUint8(off, 0); off += 1;  // Reserved
  view.setUint16(off, 1, true); off += 2; // Planes (always 1 for ICO)
  view.setUint16(off, 32, true); off += 2; // BPP (32 for RGBA PNG)
  view.setUint32(off, pngBytes.length, true); off += 4; // Image size
  view.setUint32(off, 22, true); off += 4; // Offset (6 header + 16 entry)

  // Image data (PNG)
  const result = new Uint8Array(buffer);
  result.set(pngBytes, 22);

  return new Blob([result], { type: "image/x-icon" });
}

/**
 * 将图片文件缩放到指定尺寸，输出为 PNG Blob
 */
export async function resizeToPNG(
  file: File,
  width: number,
  height: number,
): Promise<Blob> {
  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 Canvas 上下文");

  // 高质量缩放
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG 编码失败"))),
      "image/png",
    );
  });
}

/** 单尺寸 ICO entry 描述 */
export interface IcoEntry {
  pngBlob: Blob;
  width: number;
  height: number;
}

/**
 * 将多个尺寸的 PNG 封装为一个多尺寸 ICO 文件
 * 文件结构: ICO Header + N×Directory Entry + N×PNG Data
 */
export async function encodeMultiSizeICO(entries: IcoEntry[]): Promise<Blob> {
  if (entries.length === 0) throw new Error("至少需要一个尺寸");

  // 先将所有 PNG 读为字节数组
  const pngBytesList: Uint8Array[] = [];
  const widths: number[] = [];
  const heights: number[] = [];

  for (const entry of entries) {
    pngBytesList.push(new Uint8Array(await entry.pngBlob.arrayBuffer()));
    widths.push(entry.width);
    heights.push(entry.height);
  }

  // 计算总大小
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = entrySize * entries.length;
  let dataOffset = headerSize + dirSize;
  const offsets: number[] = [];

  for (let i = 0; i < entries.length; i++) {
    offsets.push(dataOffset);
    dataOffset += pngBytesList[i].length;
  }

  const totalSize = dataOffset; // header + dir + all image data
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let off = 0;

  // ICO Header
  view.setUint16(off, 0, true); off += 2; // Reserved
  view.setUint16(off, 1, true); off += 2; // Type: ICO
  view.setUint16(off, entries.length, true); off += 2; // Count

  // Directory Entries
  for (let i = 0; i < entries.length; i++) {
    const w = widths[i] >= 256 ? 0 : widths[i];
    const h = heights[i] >= 256 ? 0 : heights[i];
    view.setUint8(off, w); off += 1;
    view.setUint8(off, h); off += 1;
    view.setUint8(off, 0); off += 1; // Color palette
    view.setUint8(off, 0); off += 1; // Reserved
    view.setUint16(off, 1, true); off += 2; // Planes
    view.setUint16(off, 32, true); off += 2; // BPP
    view.setUint32(off, pngBytesList[i].length, true); off += 4; // Size
    view.setUint32(off, offsets[i], true); off += 4; // Offset
  }

  // Image data
  const result = new Uint8Array(buffer);
  for (let i = 0; i < entries.length; i++) {
    result.set(pngBytesList[i], offsets[i]);
  }

  return new Blob([result], { type: "image/x-icon" });
}

/** 将 File 加载为 HTMLImageElement（导出供外部使用） */
export { loadImage };

/**
 * 转换单张图片
 */
export async function convertImage(
  file: File,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 Canvas 上下文");

  // 给不支持透明通道的格式填充白色背景
  const opaqueFormats = new Set(["image/jpeg", "image/bmp", "image/gif"]);
  if (opaqueFormats.has(options.format)) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const originalFormat = file.type || "unknown";
  const originalExt = file.name.split(".").pop()?.toLowerCase() || "";
  const formatInfo = OUTPUT_FORMATS.find((f) => f.value === options.format)!;

  let blob: Blob;

  if (options.format === "image/bmp") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    blob = encodeBMP(imageData);
  } else if (options.format === "image/gif") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    blob = encodeGIF(imageData);
  } else if (options.format === "image/x-icon") {
    // ICO: 先转 PNG，再封装为 ICO 容器
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG 编码失败"))), "image/png");
    });
    blob = await encodeICO(pngBlob, img.naturalWidth, img.naturalHeight);
  } else {
    // PNG / JPEG / WebP / AVIF 使用原生 toBlob
    const quality = formatInfo.lossless ? undefined : options.quality / 100;
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`转换失败: ${file.name}`));
        },
        options.format,
        quality,
      );
    });
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const newFileName = `${baseName}.${formatInfo.ext}`;

  return {
    fileName: newFileName,
    originalName: file.name,
    originalSize: file.size,
    originalFormat: originalFormat || originalExt,
    blob,
    convertedSize: blob.size,
    convertedFormat: options.format,
    ext: formatInfo.ext,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

/**
 * 批量转换图片
 */
export async function convertImages(
  files: File[],
  options: ConvertOptions,
  onProgress?: (current: number, total: number) => void,
): Promise<ConvertResult[]> {
  const results: ConvertResult[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    try {
      const result = await convertImage(files[i], options);
      results.push(result);
    } catch (err) {
      results.push({
        fileName: files[i].name,
        originalName: files[i].name,
        originalSize: files[i].size,
        originalFormat: files[i].type || "unknown",
        blob: new Blob([]),
        convertedSize: 0,
        convertedFormat: options.format,
        ext: "error",
        width: 0,
        height: 0,
      });
      console.error(`转换失败 [${files[i].name}]:`, err);
    }
    onProgress?.(i + 1, total);
  }

  return results;
}

/**
 * 格式化文件大小为可读字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[i]}`;
}

/**
 * 触发下载 Blob
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
