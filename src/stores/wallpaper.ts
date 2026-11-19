import { ref, watch, onScopeDispose } from "vue";
import { defineStore } from "pinia";
import type { BingWallpaperResponse, WallpaperData } from "@/tsInterface/index";

const DB_NAME = "wallpaper-db";
const STORE_NAME = "wallpaper";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function loadFromDB(db: IDBDatabase): Promise<WallpaperData> {
  return new Promise((resolve) => {
    const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    const req = store.get("data");
    req.onsuccess = () => resolve(req.result ?? { current: "", history: [] });
    req.onerror = () => resolve({ current: "", history: [] });
  });
}

function saveToDB(db: IDBDatabase, data: WallpaperData): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(data, "data");
    tx.oncomplete = () => resolve();
    tx.onabort = () => resolve();
  });
}

export const useWallpaperStore = defineStore("wallpaper", () => {
  const current = ref("");
  const wallpaperUrl = ref("");
  const history = ref<string[]>([]);
  const initialized = ref(false);
  const bingEnabled = ref(false);
  const bingLoading = ref(false);
  const bingError = ref("");
  let previousWallpaper = "";
  let bingRequest: AbortController | null = null;
  let db: IDBDatabase | null = null;

  // 大图的 Base64 会超出 CSS 自定义属性长度限制，桌面使用短对象 URL。
  // current 仍保留原始数据，供预览、历史记录和 IndexedDB 持久化使用。
  watch(current, (value) => {
    const previousUrl = wallpaperUrl.value;
    if (value.startsWith("data:")) {
      const data = value.slice(value.indexOf(",") + 1);
      const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
      const type = value.slice(5, value.indexOf(";"));
      wallpaperUrl.value = URL.createObjectURL(new Blob([bytes], { type }));
    } else {
      wallpaperUrl.value = value;
    }
    if (previousUrl.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
  }, { flush: "sync" });

  onScopeDispose(() => {
    bingRequest?.abort();
    if (wallpaperUrl.value.startsWith("blob:")) URL.revokeObjectURL(wallpaperUrl.value);
  });

  openDB()
    .then((database) => {
      db = database;
      return loadFromDB(db);
    })
    .then((data) => {
      current.value = data.current;
      history.value = data.history;
      previousWallpaper = data.previousWallpaper ?? "";
      bingEnabled.value = data.bingEnabled ?? false;
      initialized.value = true;
      if (bingEnabled.value) void loadBingWallpaper();
    });

  function persist() {
    if (!db) return;
    saveToDB(db, {
      current: current.value,
      history: [...history.value],
      ...(bingEnabled.value ? { bingEnabled: true, previousWallpaper } : {}),
    });
  }

  watch([current, history, bingEnabled], persist, { deep: true });

  async function loadBingWallpaper() {
    if (!bingEnabled.value) return;
    bingRequest?.abort();
    const controller = new AbortController();
    bingRequest = controller;
    bingLoading.value = true;
    bingError.value = "";
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      // 必应接口未提供 CORS 响应头，JSON 通过同源代理读取。
      const response = await fetch(
        "/bing/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN",
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Bing wallpaper request failed");
      const data: BingWallpaperResponse = await response.json();
      const path = data.images?.[0]?.url;
      if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
        throw new Error("Bing wallpaper url is missing or invalid");
      }
      if (controller.signal.aborted || !bingEnabled.value) return;
      current.value = `https://www.bing.com${path}`;
    } catch {
      if (bingRequest === controller && bingEnabled.value) {
        bingError.value = "必应壁纸加载失败，请检查网络后重试";
      }
    } finally {
      clearTimeout(timeout);
      if (bingRequest === controller) {
        bingLoading.value = false;
        bingRequest = null;
      }
    }
  }

  function setBingEnabled(enabled: boolean) {
    if (enabled === bingEnabled.value) return;
    bingRequest?.abort();
    bingRequest = null;
    bingLoading.value = false;
    bingError.value = "";
    if (enabled) {
      previousWallpaper = current.value;
      bingEnabled.value = true;
      void loadBingWallpaper();
    } else {
      bingEnabled.value = false;
      current.value = previousWallpaper;
      previousWallpaper = "";
    }
  }

  function setWallpaper(base64: string) {
    setBingEnabled(false);
    current.value = base64;
    history.value = [base64, ...history.value.filter((h) => h !== base64)].slice(0, 5);
  }

  function setDefaultWallpaper(base64: string) {
    current.value = base64;
  }

  function selectWallpaper(base64: string) {
    setBingEnabled(false);
    current.value = base64;
  }

  return {
    current, wallpaperUrl, history, initialized,
    bingEnabled, bingLoading, bingError, setBingEnabled, loadBingWallpaper,
    setWallpaper, selectWallpaper, setDefaultWallpaper,
  };
});
