<template>
  <div v-if="props.show" class="edit-main-box">
    <div class="edit-inner-box">
      <header class="edit-header">
        <button type="button" class="back-btn" aria-label="返回" @click="close">
          <img src="@/assets/icon/back.svg" alt="" />
        </button>
        <h2 class="edit-title">编辑歌曲</h2>
        <span class="edit-header-spacer" aria-hidden="true" />
      </header>
      <p class="edit-desc">修改歌曲基础信息，可按需替换音频、封面和歌词文件。</p>
      <div class="edit-toolbar">
        <label class="edit-search" :class="{ focused: searchFocused }">
          <img class="edit-search-icon" src="@/assets/icon/Search.svg" alt="" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            class="edit-search-input"
            placeholder="搜索歌名或歌手"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
          />
        </label>
        <p v-if="searchMode && searchQuery.trim() && searchResults.length > 0" class="edit-filter-hint">
          找到 {{ searchResults.length }} 首
        </p>
      </div>
      <div v-if="listLoading" class="edit-list-loading">加载中…</div>
      <template v-else>
      <div class="edit-song-list-box">
        <div
          class="edit-song-item"
          v-for="item in displayedList"
          :key="String(item.id)"
          :class="{ 'is-expanded': currentEditId === item.id }"
        >
          <div class="song-row">
            <div class="song-info">
              <div class="song-cover">
                <img :src="item.coverUrl || defaultCover" alt="" />
              </div>
              <div class="song-info-box">
                <div class="song-name">{{ item.title }}</div>
                <div class="song-meta">
                  <span class="song-singer">{{ item.artist || '未知歌手' }}</span>
                  <span v-if="formatDuration(item.duration)" class="song-duration">{{
                    formatDuration(item.duration)
                  }}</span>
                </div>
              </div>
            </div>
            <button type="button" class="edit-song-btn" @click="handleSelect(item)">
              {{ currentEditId === item.id ? '收起' : '编辑' }}
            </button>
          </div>
          <form
            v-if="currentEditId === item.id"
            class="edit-form"
            @submit.prevent="handleSubmit(item.id)"
          >
            <div class="form-group">
              <label>歌名</label>
              <input v-model="formData.title" type="text" required placeholder="歌曲标题" />
            </div>
            <div class="form-group">
              <label>歌手</label>
              <input v-model="formData.artist" type="text" required placeholder="艺术家" />
            </div>
            <div class="form-group">
              <label>时长（秒）</label>
              <input v-model.number="formData.duration" type="number" min="0" step="1" />
            </div>
            <div class="form-group">
              <label>音频</label>
              <FileUpload
                v-if="!formData.audioUrl"
                v-model="formData.audioUrl"
                accept=".wav, .mp3, .aac, .flac, .m4a, .ogg, .opus, .wma"
                max-size="1"
                :required="false"
                label="Replace Audio"
                @file-selected="(file: File) => handleFile(file, 'audioUrl')"
              />
              <div v-else class="file-info">
                {{ formData.audioUrl.name }}
                <button type="button" class="remove-file" @click="removeFile('audioUrl')">×</button>
              </div>
            </div>
            <div class="form-group">
              <label>封面</label>
              <FileUpload
                v-if="!formData.coverUrl"
                v-model="formData.coverUrl"
                accept="image/*"
                max-size="1"
                :required="false"
                label="Replace Cover"
                @file-selected="(file: File) => handleFile(file, 'coverUrl')"
              />
              <div v-else class="file-info">
                {{ formData.coverUrl.name }}
                <button type="button" class="remove-file" @click="removeFile('coverUrl')">×</button>
              </div>
            </div>
            <div class="form-group">
              <label>歌词</label>
              <FileUpload
                v-if="!formData.lyricsUrl"
                v-model="formData.lyricsUrl"
                accept=".lrc, .srt, .ass, .ssa, .txt"
                max-size="1"
                :required="false"
                label="Replace Lyrics"
                @file-selected="(file: File) => handleFile(file, 'lyricsUrl')"
              />
              <div v-else class="file-info">
                {{ formData.lyricsUrl.name }}
                <button type="button" class="remove-file" @click="removeFile('lyricsUrl')">×</button>
              </div>
            </div>
            <div class="edit-form-actions">
              <button type="button" class="cancel-btn" @click="handleCancelEdit">取消</button>
              <button type="submit" class="submit-btn" :disabled="submitting">
                {{ submitting ? '提交中...' : '保存修改' }}
              </button>
            </div>
          </form>
        </div>
        <p v-if="!searchMode && total === 0" class="edit-empty">暂无可管理的曲目</p>
        <p v-else-if="searchMode && searchResults.length === 0" class="edit-empty">
          没有匹配的歌曲，试试其他关键词
        </p>
      </div>
      <div v-if="displayTotal > 0" class="edit-pagination" role="navigation" aria-label="分页">
        <span class="edit-pagination-total">共 {{ displayTotal }} 首</span>
        <div class="edit-pagination-actions">
          <button type="button" class="edit-page-btn" :disabled="!canPrevPage" @click="goPrevPage">
            上一页
          </button>
          <span class="edit-page-indicator">{{ displayPage }} / {{ displayTotalPages }}</span>
          <button type="button" class="edit-page-btn" :disabled="!canNextPage" @click="goNextPage">
            下一页
          </button>
        </div>
      </div>
      </template>
    </div>
  </div>
  <DialogNotification
    v-if="notificationVisible"
    :visible="notificationVisible"
    title="Info"
    @closeDialog="handleCloseTip"
  >
    <template #content>
      <div style="display: flex; justify-content: center; align-items: center; padding: 20px">
        <span style="color: #fff">{{ inforMsg }}</span>
      </div>
    </template>
  </DialogNotification>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import DialogNotification from '@/views/common/DialogNotification.vue'
import FileUpload from '@/views/common/FileUpload.vue'
import defaultCover from '@/assets/images/cover.jpg'
import { getMusicApi, searchMusicApi, updateMusicApi, updateMusicMetaApi } from '@/server/musicHttp'
import { _debounce } from '@/utils/publickFun'

const PAGE_SIZE = 10

const emit = defineEmits(['update:show'])
const notificationVisible = ref(false)

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

interface MusicItem {
  id: string
  title: string
  artist?: string
  audioUrl?: string
  duration?: number
  coverUrl?: string
  lyricsUrl?: string
}

interface ListData {
  data: Array<MusicItem>
  total: number
  currentPage: number
  pageSize: number
  totalPages: number
}

const musicList = ref<Array<MusicItem>>([])
const currentPage = ref(1)
const total = ref(0)
const totalPages = ref(1)
const searchMode = ref(false)
const searchResults = ref<Array<MusicItem>>([])
const searchPage = ref(1)
const searchQuery = ref('')
const searchFocused = ref(false)
const listLoading = ref(false)
const currentEditId = ref<string>('')
const submitting = ref(false)
const inforMsg = ref('')

interface EditBaseline {
  title: string
  artist: string
  duration: number
}

const baseline = ref<EditBaseline | null>(null)

const formData = reactive({
  title: '',
  artist: '',
  duration: 180,
  audioUrl: null as File | null,
  coverUrl: null as File | null,
  lyricsUrl: null as File | null,
})

const close = () => {
  emit('update:show', false)
}

const handleCloseTip = () => {
  notificationVisible.value = false
}

function normalizeDuration(d: number | undefined | null): number {
  const n = Number(d)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function formatDuration(sec?: number) {
  if (sec == null || !Number.isFinite(sec)) return ''
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function normalizeMusicItem(row: MusicItem & { id?: string | number }): MusicItem {
  return {
    ...row,
    id: String(row.id ?? ''),
  }
}

const displayedList = computed(() => {
  if (searchMode.value) {
    const start = (searchPage.value - 1) * PAGE_SIZE
    return searchResults.value.slice(start, start + PAGE_SIZE)
  }
  return musicList.value
})

const searchTotalPages = computed(() =>
  Math.max(1, Math.ceil(searchResults.value.length / PAGE_SIZE)),
)

const displayTotal = computed(() =>
  searchMode.value ? searchResults.value.length : total.value,
)
const displayTotalPages = computed(() =>
  searchMode.value ? searchTotalPages.value : totalPages.value,
)
const displayPage = computed(() =>
  searchMode.value ? searchPage.value : currentPage.value,
)
const canPrevPage = computed(
  () => displayPage.value > 1 && displayTotalPages.value >= 1,
)
const canNextPage = computed(
  () => displayPage.value < displayTotalPages.value && displayTotalPages.value > 0,
)

const resetForm = () => {
  formData.title = ''
  formData.artist = ''
  formData.duration = 180
  formData.audioUrl = null
  formData.coverUrl = null
  formData.lyricsUrl = null
  baseline.value = null
}

const handleFile = (file: File | null, fieldName: string) => {
  if (fieldName === 'audioUrl') {
    formData.audioUrl = file
  } else if (fieldName === 'coverUrl') {
    formData.coverUrl = file
  } else if (fieldName === 'lyricsUrl') {
    formData.lyricsUrl = file
  }
}

const removeFile = (fieldName: string) => {
  if (fieldName === 'audioUrl') {
    formData.audioUrl = null
  } else if (fieldName === 'coverUrl') {
    formData.coverUrl = null
  } else if (fieldName === 'lyricsUrl') {
    formData.lyricsUrl = null
  }
}

const getMusicList = async () => {
  listLoading.value = true
  try {
    const res: { data: ListData } = await getMusicApi({
      page: currentPage.value,
      limit: PAGE_SIZE,
    })
    musicList.value = (res.data.data || []).map((row) => normalizeMusicItem(row))
    total.value = res.data.total ?? 0
    const tp = res.data.totalPages
    totalPages.value =
      tp && tp > 0
        ? tp
        : Math.max(1, Math.ceil((res.data.total || 0) / PAGE_SIZE))
    searchMode.value = false
    searchResults.value = []
    searchPage.value = 1
  } catch (e) {
    console.error(e)
    inforMsg.value = '加载列表失败，请检查网络或登录状态'
    notificationVisible.value = true
  } finally {
    listLoading.value = false
  }
}

const runSearchQuery = async () => {
  if (!props.show) return
  const q = searchQuery.value.trim()
  if (!q) {
    searchMode.value = false
    searchResults.value = []
    searchPage.value = 1
    currentPage.value = 1
    await getMusicList()
    return
  }
  listLoading.value = true
  try {
    const res = await searchMusicApi({ keyword: q })
    const raw = res.data
    const arr = Array.isArray(raw) ? raw : []
    searchResults.value = arr.map((row: MusicItem & { id?: string | number }) =>
      normalizeMusicItem(row),
    )
    searchMode.value = true
    searchPage.value = 1
  } catch (e) {
    console.error(e)
    searchResults.value = []
    inforMsg.value = '搜索失败，请检查网络或登录状态'
    notificationVisible.value = true
  } finally {
    listLoading.value = false
  }
}

const debouncedSearch = _debounce(runSearchQuery, 420)

function goPrevPage() {
  handleCancelEdit()
  if (searchMode.value) {
    if (searchPage.value > 1) searchPage.value -= 1
  } else if (currentPage.value > 1) {
    currentPage.value -= 1
    void getMusicList()
  }
}

function goNextPage() {
  handleCancelEdit()
  if (searchMode.value) {
    if (searchPage.value < searchTotalPages.value) searchPage.value += 1
  } else if (currentPage.value < totalPages.value) {
    currentPage.value += 1
    void getMusicList()
  }
}

function applyServerSong(updated: MusicItem) {
  const id = String(updated.id)
  const patch = (list: MusicItem[]) => {
    const i = list.findIndex((m) => String(m.id) === id)
    if (i >= 0) list[i] = { ...list[i], ...updated }
  }
  patch(musicList.value)
  patch(searchResults.value)
}

const handleSelect = (item: MusicItem) => {
  if (currentEditId.value === item.id) {
    currentEditId.value = ''
    resetForm()
    return
  }
  currentEditId.value = item.id
  const dur = item.duration != null ? normalizeDuration(item.duration) : 180
  formData.title = item.title || ''
  formData.artist = item.artist || ''
  formData.duration = dur || 180
  formData.audioUrl = null
  formData.coverUrl = null
  formData.lyricsUrl = null
  baseline.value = {
    title: formData.title,
    artist: formData.artist,
    duration: normalizeDuration(formData.duration),
  }
}

const handleCancelEdit = () => {
  currentEditId.value = ''
  resetForm()
}

const handleSubmit = async (id: string) => {
  if (!formData.title.trim()) {
    inforMsg.value = '歌曲名称不能为空'
    notificationVisible.value = true
    return
  }
  if (!formData.artist.trim()) {
    inforMsg.value = '歌手名称不能为空'
    notificationVisible.value = true
    return
  }

  const b = baseline.value
  if (!b) {
    inforMsg.value = '表单状态异常，请重新选择歌曲'
    notificationVisible.value = true
    return
  }

  const titleTrim = formData.title.trim()
  const artistTrim = formData.artist.trim()
  const durNow = normalizeDuration(formData.duration)

  const metaChanged =
    titleTrim !== b.title || artistTrim !== b.artist || durNow !== b.duration
  const hasFiles = !!(formData.audioUrl || formData.coverUrl || formData.lyricsUrl)

  if (!metaChanged && !hasFiles) {
    inforMsg.value = '没有需要保存的修改'
    notificationVisible.value = true
    return
  }

  submitting.value = true
  try {
    let res: { data?: MusicItem }

    if (hasFiles) {
      const payload = new FormData()
      if (titleTrim !== b.title) payload.append('title', titleTrim)
      if (artistTrim !== b.artist) payload.append('artist', artistTrim)
      if (durNow !== b.duration) payload.append('duration', String(durNow))
      if (formData.audioUrl) payload.append('audioFile', formData.audioUrl)
      if (formData.coverUrl) payload.append('coverFile', formData.coverUrl)
      if (formData.lyricsUrl) payload.append('lyricsFile', formData.lyricsUrl)
      res = await updateMusicApi({ id, data: payload })
    } else {
      const body: { title?: string; artist?: string; duration?: number } = {}
      if (titleTrim !== b.title) body.title = titleTrim
      if (artistTrim !== b.artist) body.artist = artistTrim
      if (durNow !== b.duration) body.duration = durNow
      res = await updateMusicMetaApi({ id, data: body })
    }

    if (res.data) {
      inforMsg.value = '保存成功'
      applyServerSong(res.data)
      handleCancelEdit()
    } else {
      inforMsg.value = '保存失败，请稍后重试'
    }
  } catch (error: unknown) {
    console.error(error)
    inforMsg.value = error instanceof Error ? error.message : '保存失败，请检查登录或网络'
  } finally {
    submitting.value = false
    notificationVisible.value = true
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      searchQuery.value = ''
      currentPage.value = 1
      searchPage.value = 1
      void getMusicList()
    } else {
      searchQuery.value = ''
      searchMode.value = false
      searchResults.value = []
      handleCancelEdit()
    }
  },
  { immediate: true },
)

watch(searchQuery, () => {
  if (!props.show) return
  debouncedSearch()
})
</script>

<style scoped lang="scss">
.edit-main-box {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  z-index: var(--z-drawer-stack);
  padding: 0;
  backdrop-filter: blur(10px);
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.72);
  box-shadow: inset 0 0 10px 1px rgba(255, 255, 255, 0.2);
}

.edit-inner-box {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 16px 0 24px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(22, 32, 26, 0.98) 0%, rgba(15, 23, 18, 0.99) 100%);
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.back-btn {
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 24px;
    height: 24px;
  }
}

.edit-title {
  margin: 0;
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 650;
  color: #f5f5f5;
}

.edit-header-spacer {
  width: 40px;
  flex-shrink: 0;
}

.edit-desc {
  margin: 0;
  padding: 8px 12px 0;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.55;
}

.edit-toolbar {
  padding: 12px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-search {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 2px 4px 2px 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.edit-search.focused {
  border-color: rgba(74, 222, 111, 0.45);
  box-shadow: 0 0 0 1px rgba(74, 222, 111, 0.2);
}

.edit-search-icon {
  width: 18px;
  height: 18px;
  opacity: 0.55;
  flex-shrink: 0;
}

.edit-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 10px 12px 10px 0;
  font-size: 15px;
  color: #f3f4f6;
  outline: none;
}

.edit-search-input::placeholder {
  color: #6b7280;
}

.edit-filter-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  padding-left: 4px;
}

.edit-list-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 48px 16px;
}

.edit-song-list-box {
  margin-top: 12px;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px 12px;
  box-sizing: border-box;
}

.edit-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 32px 16px;
}

.edit-pagination {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding: 12px 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.edit-pagination-total {
  font-size: 12px;
  color: #6b7280;
}

.edit-pagination-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-page-btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: #e5e7eb;
  font-size: 13px;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    background 0.15s ease;
}

.edit-page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.edit-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edit-page-indicator {
  font-size: 13px;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
  min-width: 4.5em;
  text-align: center;
}

.edit-song-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(32, 44, 36, 0.92) 0%, rgba(18, 28, 22, 0.94) 100%);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  overflow: visible;
  transition: border-color 0.2s ease;
}

.edit-song-item.is-expanded {
  border-color: rgba(74, 222, 111, 0.28);
}

.song-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.song-cover {
  flex-shrink: 0;
}

.song-cover img {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.song-info-box {
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.song-name {
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
}

.song-singer {
  color: #b0b0b0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.song-duration {
  flex-shrink: 0;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.28);
}

.edit-song-btn {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(43, 168, 74, 0.45), rgba(24, 99, 42, 0.55));
  color: #ecfdf3;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    filter 0.15s ease;
}

.edit-song-btn:active {
  transform: scale(0.98);
}

.edit-form {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 14px 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  overflow: visible;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    color: #d1d5db;
    font-size: 13px;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    padding: 10px 12px;
    color: #fff;
    background: rgba(0, 0, 0, 0.32);
    outline: none;
    transition: border-color 0.15s ease;
  }

  input:focus {
    border-color: rgba(74, 222, 111, 0.45);
  }

  input::placeholder {
    color: #6b7280;
  }
}

.file-info {
  color: #fff;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.28);
  font-size: 13px;
}

.remove-file {
  margin-left: 8px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
}

.edit-form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.cancel-btn,
.submit-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
}

.submit-btn {
  background: linear-gradient(180deg, #15803d, #0f3f22);
  color: #fff;
  box-shadow: 0 2px 12px rgba(21, 128, 61, 0.35);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 900px) {
  .edit-main-box {
    left: var(--imusic-pc-sidebar-width);
    right: 0;
    top: 0;
    bottom: 0;
    width: auto;
    height: auto;
    padding: 0;
    background: rgba(12, 14, 13, 0.94);
    backdrop-filter: none;
    box-shadow: none;
    align-items: stretch;
  }

  .edit-inner-box {
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: none;
    border-right: none;
    padding: 28px 32px 40px;
    background: linear-gradient(180deg, rgba(24, 36, 29, 0.98) 0%, rgba(13, 20, 16, 0.99) 100%);
    box-shadow: none;
  }

  .edit-header {
    padding: 0 0 20px;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .edit-title {
    text-align: left;
    font-size: 22px;
    padding-left: 8px;
  }

  .edit-header-spacer {
    width: 0;
  }

  .edit-toolbar {
    padding: 16px 0 0;
  }

  .edit-desc {
    padding: 16px 0 8px;
  }

  .edit-song-list-box {
    padding: 0;
    margin-top: 8px;
  }

  .edit-pagination {
    padding: 16px 0 0;
    margin-top: 4px;
  }

  .song-row {
    padding: 14px 18px;
  }

  .edit-song-btn:hover {
    filter: brightness(1.08);
  }

  .edit-form {
    padding: 16px 18px 20px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 20px;
  }

  .edit-form-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
