import type { MusicLyrics, MusicLyricLine } from '@/tsInterface/index'

/** 支持多时间标签、毫秒偏移和无时间标签的纯文本。 */
export function parseLyrics(source: string): MusicLyrics {
  const offset = Number(source.match(/\[offset:\s*([+-]?\d+)\s*\]/i)?.[1] ?? 0) / 1000
  const lines: MusicLyricLine[] = []
  const plain: string[] = []

  for (const raw of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const timestamps = [...raw.matchAll(/\[(\d+):(\d{1,2}(?:\.\d+)?)\]/g)]
    const text = raw.replace(/\[(?:\d+:\d{1,2}(?:\.\d+)?|[a-z]+:[^\]]*)\]/gi, '').trim()
    if (text) plain.push(text)
    for (const timestamp of timestamps) {
      const seconds = Number(timestamp[2])
      if (seconds >= 60) continue
      lines.push({ time: Math.max(0, Number(timestamp[1]) * 60 + seconds - offset), text })
    }
  }

  lines.sort((a, b) => a.time - b.time)
  return { lines, text: plain.join('\n') }
}

export function findLyricIndex(lines: readonly MusicLyricLine[], time: number): number {
  let left = 0
  let right = lines.length - 1
  let result = -1
  while (left <= right) {
    const middle = (left + right) >> 1
    if (lines[middle]!.time <= time) {
      result = middle
      left = middle + 1
    } else {
      right = middle - 1
    }
  }
  return result
}

export function formatTime(seconds: number): string {
  const value = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}
