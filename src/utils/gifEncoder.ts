/**
 * @description GIF 编码器 —— 包含 Octree 颜色量化 + GIF-LZW 压缩 + 二进制组装
 *
 * GIF89a 单帧（非动画），输出为 Blob("image/gif")
 */

// ============================================================
// 1. Octree 颜色量化（将任意颜色空间减少到 ≤ 256 色）
// ============================================================

interface OctreeNode {
  children: (OctreeNode | null)[];
  rSum: number;
  gSum: number;
  bSum: number;
  count: number;
  isLeaf: boolean;
}

function createNode(): OctreeNode {
  return { children: new Array(8).fill(null), rSum: 0, gSum: 0, bSum: 0, count: 0, isLeaf: false };
}

/** 从 RGBA buffer 构建颜色调色板 */
function buildPalette(pixels: Uint8ClampedArray, maxColors: number): Uint8Array {
  const root = createNode();
  let leafCount = 0;
  const leaves: OctreeNode[] = [];

  // 逐像素插入八叉树
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // 跳过透明像素（alpha < 128 视为透明）
    // 但 GIF 也需要处理透明... 这里简化处理
    let node = root;
    for (let shift = 7; shift >= 0; shift--) {
      const idx =
        ((r >> shift) & 1) << 2 |
        ((g >> shift) & 1) << 1 |
        ((b >> shift) & 1);
      if (!node.children[idx]) {
        const child = createNode();
        node.children[idx] = child;
        if (shift === 0) {
          child.isLeaf = true;
          leafCount++;
          leaves.push(child);
        }
      }
      node = node.children[idx]!;
      if (node.isLeaf) break;
    }
    node.rSum += r;
    node.gSum += g;
    node.bSum += b;
    node.count++;

    // 叶子过多时合并
    while (leafCount > maxColors) {
      reduceTree(root, leaves);
    }
  }

  // 从剩余叶子构建调色板
  const palette: number[] = [];
  collectPalette(root, palette);

  // 填充到 256 色
  while (palette.length < maxColors * 3) {
    palette.push(0, 0, 0);
  }

  return new Uint8Array(palette);
}

/** 合并（reduc）一层叶子 */
function reduceTree(root: OctreeNode, leaves: OctreeNode[]): void {
  // 找到深度最深、像素数最少的可合并节点
  // 简化实现：遍历叶子找最佳合并候选
  let best: OctreeNode | null = null;
  let bestDepth = -1;

  for (const leaf of leaves) {
    if (!leaf.isLeaf) continue;
    const depth = getNodeDepth(root, leaf);
    if (depth > bestDepth && leaf.count > 0) {
      bestDepth = depth;
      best = leaf;
    }
  }

  if (!best) return;

  // 合并：将叶子的父节点的所有孩子合并到父节点
  const parent = findParent(root, best);
  if (!parent) return;

  // 找到 parent 中所有叶子
  const siblings: OctreeNode[] = [];
  for (let i = 0; i < 8; i++) {
    const child = parent.children[i];
    if (child && child.isLeaf) {
      siblings.push(child);
      parent.children[i] = null;
    }
  }

  parent.rSum = siblings.reduce((s, c) => s + c.rSum, 0);
  parent.gSum = siblings.reduce((s, c) => s + c.gSum, 0);
  parent.bSum = siblings.reduce((s, c) => s + c.bSum, 0);
  parent.count = siblings.reduce((s, c) => s + c.count, 0);
  parent.isLeaf = true;

  // 更新叶子列表
  for (const s of siblings) {
    const idx = leaves.indexOf(s);
    if (idx >= 0) leaves.splice(idx, 1);
  }
  leaves.push(parent);
}

function getNodeDepth(root: OctreeNode, target: OctreeNode): number {
  function dfs(node: OctreeNode, depth: number): number {
    if (node === target) return depth;
    for (const child of node.children) {
      if (child) {
        const d = dfs(child, depth + 1);
        if (d >= 0) return d;
      }
    }
    return -1;
  }
  return dfs(root, 0);
}

function findParent(root: OctreeNode, target: OctreeNode): OctreeNode | null {
  function dfs(node: OctreeNode): OctreeNode | null {
    for (const child of node.children) {
      if (child === target) return node;
      if (child) {
        const p = dfs(child);
        if (p) return p;
      }
    }
    return null;
  }
  return dfs(root);
}

function collectPalette(node: OctreeNode, out: number[]): void {
  if (node.isLeaf && node.count > 0) {
    out.push(
      Math.round(node.rSum / node.count),
      Math.round(node.gSum / node.count),
      Math.round(node.bSum / node.count),
    );
    return;
  }
  for (const child of node.children) {
    if (child) collectPalette(child, out);
  }
}

// ============================================================
// 2. GIF-LZW 压缩
// ============================================================

interface LzwOutput {
  /** 打包后的字节数据块 */
  blocks: Uint8Array[];
  /** 输出数据总字节数 */
  totalBytes: number;
}

function lzwEncode(data: Uint8Array, minCodeSize: number): LzwOutput {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  const maxTableSize = 4096;

  // 初始化码表
  const table = new Map<string, number>();
  for (let i = 0; i < clearCode; i++) {
    table.set(String.fromCharCode(i), i);
  }

  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;

  // 输出 bit 缓冲
  let bitBuf = 0;
  let bitCount = 0;
  const outputBytes: number[] = [];

  function writeCode(code: number): void {
    bitBuf |= (code << bitCount) & 0xffffffff;
    bitCount += codeSize;
    while (bitCount >= 8) {
      outputBytes.push(bitBuf & 0xff);
      bitBuf >>>= 8;
      bitCount -= 8;
    }
  }

  // 写入清除码
  writeCode(clearCode);

  let prefix = "";
  for (let i = 0; i < data.length; i++) {
    const char = String.fromCharCode(data[i]);
    const combined = prefix + char;

    if (table.has(combined)) {
      prefix = combined;
    } else {
      writeCode(table.get(prefix)!);
      if (nextCode < maxTableSize) {
        table.set(combined, nextCode++);
        // 当前 code 值达到 2^codeSize 时加大码宽
        if (nextCode >= (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        // 码表满：写清除码 + 重置
        writeCode(clearCode);
        table.clear();
        for (let j = 0; j < clearCode; j++) {
          table.set(String.fromCharCode(j), j);
        }
        nextCode = endCode + 1;
        codeSize = minCodeSize + 1;
      }
      prefix = char;
    }
  }

  // 写剩余前缀
  if (prefix) {
    writeCode(table.get(prefix)!);
  }
  // 写结束码
  writeCode(endCode);

  // 刷新剩余 bit
  if (bitCount > 0) {
    outputBytes.push(bitBuf & 0xff);
  }

  // 分包（GIF 每块 ≤ 255 字节）
  const blocks: Uint8Array[] = [];
  const raw = new Uint8Array(outputBytes);
  let offset = 0;
  while (offset < raw.length) {
    const chunkSize = Math.min(255, raw.length - offset);
    blocks.push(raw.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }

  return { blocks, totalBytes: raw.length };
}

// ============================================================
// 3. GIF 二进制组装
// ============================================================

export function encodeGIF(
  imageData: ImageData,
  options?: { transparentIndex?: number },
): Blob {
  const { data, width, height } = imageData;
  const palette = buildPalette(data, 256);
  const colorCount = palette.length / 3;

  // 确定透明索引
  let transparentIndex = options?.transparentIndex;
  if (transparentIndex === undefined) {
    // 找一个未使用的颜色槽作为透明索引
    transparentIndex = colorCount < 256 ? colorCount : -1;
  }
  const hasTransparency = transparentIndex >= 0 && transparentIndex < 256;

  // 计算最近色映射
  const pixelIndices = mapPixelsToPalette(data, palette, colorCount);

  // 构建字节流
  const parts: Uint8Array[] = [];

  // GIF Header: "GIF89a"
  parts.push(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]));

  // Logical Screen Descriptor (7 bytes)
  const lsd = new Uint8Array(7);
  const view = new DataView(lsd.buffer);
  view.setUint16(0, width, true);
  view.setUint16(2, height, true);
  // Packed: global color table=1, color resolution=7(bpp-1), sort=0, size of GCT
  const gctSize = Math.ceil(Math.log2(Math.max(2, colorCount))) - 1;
  view.setUint8(4, 0b10000000 | 0b01110000 | (gctSize & 0x07));
  view.setUint8(5, 0); // background color index
  view.setUint8(6, 0); // pixel aspect ratio (0 = not specified)
  parts.push(lsd);

  // Global Color Table: 3 * 2^(gctSize+1) entries, zero-padded
  const gctEntryCount = 1 << (gctSize + 1);
  const gctData = new Uint8Array(gctEntryCount * 3);
  gctData.set(palette.slice(0, colorCount * 3));
  parts.push(gctData);

  // Netscape Application Extension (循环播放，对静态 GIF 也写以提高兼容性)
  const appExt = new Uint8Array([
    0x21, 0xff, 0x0b, // Extension Introducer + App Extension Label + Block Size
    0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, // "NETSCAPE"
    0x32, 0x2e, 0x30, // "2.0"
    0x03, 0x01, // Block Size + Sub-block data size
    0x00, 0x00, // Loop count (0 = infinite)
    0x00, // Block terminator
  ]);
  parts.push(appExt);

  // Graphic Control Extension (8 bytes)
  const gce = new Uint8Array(8);
  gce[0] = 0x21; // Extension Introducer
  gce[1] = 0xf9; // Graphic Control Label
  gce[2] = 0x04; // Block Size
  // Packed: disposal method(0), userInput=0, transparent color flag
  gce[3] = hasTransparency ? 0b00000001 : 0b00000000;
  // Delay Time (0)
  gce[4] = 0;
  gce[5] = 0;
  // Transparent Color Index
  gce[6] = hasTransparency ? transparentIndex : 0;
  gce[7] = 0x00; // Block Terminator
  parts.push(gce);

  // Image Descriptor (10 bytes)
  const imgDesc = new Uint8Array(10);
  const v2 = new DataView(imgDesc.buffer);
  imgDesc[0] = 0x2c; // Image Separator
  v2.setUint16(1, 0, true); // Left
  v2.setUint16(3, 0, true); // Top
  v2.setUint16(5, width, true); // Width
  v2.setUint16(7, height, true); // Height
  // Packed: no local color table, no interlace, no sort, size=0
  imgDesc[9] = 0x00;
  parts.push(imgDesc);

  // LZW 编码图像数据
  const minCodeSize = Math.max(2, gctSize + 1);
  const lzw = lzwEncode(pixelIndices, minCodeSize);
  const lzwBytes: number[] = [minCodeSize]; // LZW Minimum Code Size
  for (const block of lzw.blocks) {
    lzwBytes.push(block.length); // Sub-block size
    for (const b of block) lzwBytes.push(b);
  }
  lzwBytes.push(0x00); // Block Terminator
  parts.push(new Uint8Array(lzwBytes));

  // Trailer
  parts.push(new Uint8Array([0x3b]));

  // 组装最终 Blob
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let off = 0;
  for (const p of parts) {
    result.set(p, off);
    off += p.length;
  }

  return new Blob([result], { type: "image/gif" });
}

/** 将每个像素映射到调色板最近色 */
function mapPixelsToPalette(
  pixels: Uint8ClampedArray,
  palette: Uint8Array,
  colorCount: number,
): Uint8Array {
  const len = pixels.length / 4;
  const indices = new Uint8Array(len);

  // 预计算调色板 Lab 近似值用于更快比较
  const palRGB: [number, number, number][] = [];
  for (let i = 0; i < colorCount; i++) {
    palRGB.push([palette[i * 3], palette[i * 3 + 1], palette[i * 3 + 2]]);
  }

  for (let i = 0; i < len; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    const a = pixels[i * 4 + 3];

    // 透明像素 → 透明索引
    if (a < 128 && colorCount < 256) {
      indices[i] = colorCount; // 透明色在调色板末尾
      continue;
    }

    // 最近邻搜索（欧几里得距离 R/G/B 空间）
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let j = 0; j < colorCount; j++) {
      const [pr, pg, pb] = palRGB[j];
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }
    indices[i] = bestIdx;
  }

  return indices;
}
