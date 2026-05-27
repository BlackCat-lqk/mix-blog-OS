import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const DB_NAME = 'wallpaper-db'
const STORE_NAME = 'wallpaper'
const DB_VERSION = 1

interface WallpaperData {
  current: string
  history: string[]
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function loadFromDB(db: IDBDatabase): Promise<WallpaperData> {
  return new Promise((resolve) => {
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME)
    const req = store.get('data')
    req.onsuccess = () => resolve(req.result ?? { current: '', history: [] })
    req.onerror = () => resolve({ current: '', history: [] })
  })
}

function saveToDB(db: IDBDatabase, data: WallpaperData): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(data, 'data')
    tx.oncomplete = () => resolve()
    tx.onabort = () => resolve()
  })
}

export const useWallpaperStore = defineStore('wallpaper', () => {
  const current = ref('')
  const history = ref<string[]>([])
  let db: IDBDatabase | null = null

  openDB().then((database) => {
    db = database
    return loadFromDB(db)
  }).then((data) => {
    current.value = data.current
    history.value = data.history
  })

  function persist() {
    if (!db) return
    saveToDB(db, { current: current.value, history: [...history.value] })
  }

  watch(current, persist)
  watch(history, persist, { deep: true })

  function setWallpaper(base64: string) {
    current.value = base64
    history.value = [base64, ...history.value.filter(h => h !== base64)].slice(0, 5)
  }

  function selectWallpaper(base64: string) {
    current.value = base64
  }

  return { current, history, setWallpaper, selectWallpaper }
})
