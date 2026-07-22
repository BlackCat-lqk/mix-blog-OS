import { ref, computed } from 'vue'

export interface FileTab {
  id: number
  file: File
  name: string
}

let nextId = 0

export function useFileTabs() {
  const tabs = ref<FileTab[]>([])
  const activeTabId = ref<number | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isDragOver = ref(false)

  const activeTab = computed(() =>
    tabs.value.find(t => t.id === activeTabId.value) ?? null
  )

  const showUpload = computed(() => tabs.value.length === 0)

  const openFile = (file: File) => {
    tabs.value.push({ id: nextId++, file, name: file.name })
    activeTabId.value = nextId - 1
  }

  const closeTab = (tabId: number) => {
    const idx = tabs.value.findIndex(t => t.id === tabId)
    if (idx === -1) return

    tabs.value.splice(idx, 1)

    if (tabs.value.length === 0) {
      activeTabId.value = null
    } else if (activeTabId.value === tabId) {
      const next = tabs.value[Math.min(idx, tabs.value.length - 1)]!
      activeTabId.value = next.id
    }
  }

  const switchTab = (tabId: number) => {
    activeTabId.value = tabId
  }

  const closeAll = () => {
    tabs.value = []
    activeTabId.value = null
  }

  const closeLeft = (tabId: number) => {
    const idx = tabs.value.findIndex(t => t.id === tabId)
    if (idx <= 0) return
    tabs.value.splice(0, idx)
    if (!tabs.value.find(t => t.id === activeTabId.value)) {
      activeTabId.value = tabId
    }
  }

  const closeRight = (tabId: number) => {
    const idx = tabs.value.findIndex(t => t.id === tabId)
    if (idx === -1 || idx >= tabs.value.length - 1) return
    tabs.value.splice(idx + 1)
    if (!tabs.value.find(t => t.id === activeTabId.value)) {
      activeTabId.value = tabId
    }
  }

  const processFileList = (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) openFile(file)
    }
  }

  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement
    processFileList(input.files)
    input.value = ''
  }

  const triggerFileInput = () => {
    fileInputRef.value?.click()
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false
    processFileList(event.dataTransfer?.files ?? null)
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
  }

  const handleDragLeave = () => {
    isDragOver.value = false
  }

  return {
    // state
    tabs,
    activeTabId,
    fileInputRef,
    isDragOver,
    // computed
    activeTab,
    showUpload,
    // methods
    openFile,
    closeTab,
    closeAll,
    closeLeft,
    closeRight,
    switchTab,
    handleFileSelect,
    triggerFileInput,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  }
}
