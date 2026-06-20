// ============================================================
// Photos 模块共享类型
// ============================================================

export interface PhotoItem {
  id: string;
  url: string; // object URL 或远程 URL
  width: number;
  height: number;
  name?: string;
  favorite?: boolean;
  date?: Date;
}

export type ToolbarTab = "gallery" | "albums" | "search";

export interface ViewerState {
  visible: boolean;
  currentIndex: number;
}
