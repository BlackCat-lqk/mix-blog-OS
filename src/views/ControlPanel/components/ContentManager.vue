<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue'
import type {
  ContentField,
  ContentOption,
  ContentRecord,
  ContentResource,
  ManagedAlbum,
  ManagedCategory,
} from '@/tsInterface/index'
import { useUserInfoStore } from '@/stores/userInfo'
import { deleteContent, getAllContent, saveContent } from '@/server/content'
import { useContentList } from '@/composables/useContentList'
import ContentPagination from '@/components/ContentPagination.vue'
import { contentManagers, contentPayload, fileRules } from '../contentManagement'

const props = defineProps<{ resource: ContentResource; active: boolean }>()
const config = contentManagers[props.resource]
const store = useUserInfoStore()
const { items, total, loading, error, query, pageCount, load, changePage } = useContentList(
  props.resource,
  true,
)
const keyword = ref('')
const status = ref('')
const relationFilter = ref('')
const albums = ref<ManagedAlbum[]>([])
const categories = ref<ManagedCategory[]>([])
const optionsLoading = ref(false)
const optionsError = ref('')
const saving = ref(false)
const message = ref('')
const mutationError = ref('')
const dialog = ref<HTMLDialogElement>()
const titleId = useId()
const mode = ref<'create' | 'edit' | 'delete'>('create')
const editorVersion = ref(0)
const selected = ref<ContentRecord>()
const form = reactive<Record<string, string>>({})
const files = reactive<Record<string, File | undefined>>({})
let disposed = false
let optionsController: AbortController | undefined
let mutationController: AbortController | undefined
const isAdmin = () => store.isAuthenticated && store.data.user.role === 'admin'
const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : '请求失败，请重试'
const roots = computed(() => categories.value.filter((item) => item.parentId === null))
const label = (item: ContentRecord) => String(item.name ?? item.title ?? '')
const preview = (item: ContentRecord) =>
  String(
    item.coverUrl || item.thumbnail || item.icon || (item.type === 'image' ? item.src : '') || '',
  )
const filterField = config.fields.find((field) => field.relation)

function optionsFor(field: ContentField, editing = true): ContentOption[] {
  if (field.relation === 'albums')
    return albums.value.map((item) => ({
      value: item.id,
      label: item.name + (item.status === 'disabled' ? '（已停用）' : ''),
    }))
  if (field.relation === 'parents')
    return roots.value
      .filter((item) => !editing || item.id !== selected.value?.id)
      .map((item) => ({ value: item.id, label: item.title }))
  if (field.relation === 'subcategories')
    return categories.value
      .filter((item) => item.parentId !== null)
      .map((item) => ({
        value: item.id,
        label: `${roots.value.find((root) => root.id === item.parentId)?.title ?? ''} / ${item.title}${item.status === 'disabled' ? '（已停用）' : ''}`,
      }))
  return field.options ?? []
}
const missingRelation = computed(() =>
  config.fields.some((field) => field.relation && field.required && !optionsFor(field).length),
)
function group(item: ContentRecord) {
  if (props.resource === 'music') return `${item.artist}${item.album ? ` / ${item.album}` : ''}`
  if (filterField) {
    const value = item[filterField.key]
    return value === null
      ? '一级分类'
      : (optionsFor(filterField, false).find((option) => option.value === value)?.label ??
          String(value ?? ''))
  }
  return String(item.description || '—')
}

async function loadOptions() {
  if (!filterField || disposed || !isAdmin()) return
  optionsController?.abort()
  const controller = new AbortController()
  optionsController = controller
  optionsLoading.value = true
  optionsError.value = ''
  albums.value = []
  categories.value = []
  try {
    if (filterField.relation === 'albums') {
      const data = await getAllContent('gallery/albums', controller.signal, true)
      if (!controller.signal.aborted) albums.value = data
    } else {
      const data = await getAllContent('navigation/categories', controller.signal, true)
      if (!controller.signal.aborted) categories.value = data
    }
  } catch (cause) {
    if (!controller.signal.aborted) optionsError.value = errorMessage(cause)
  } finally {
    if (!controller.signal.aborted) optionsLoading.value = false
  }
}
function refresh() {
  void load()
  void loadOptions()
}
function search() {
  query.keyword = keyword.value.trim()
  query.status = status.value
  query.page = 1
  if (props.resource === 'gallery/media') query.albumId = relationFilter.value || undefined
  if (props.resource === 'navigation/sites') query.categoryId = relationFilter.value || undefined
  if (props.resource === 'navigation/categories')
    query.parentId = relationFilter.value === '__root__' ? '' : relationFilter.value || undefined
  void load()
}
function open(action: typeof mode.value, item?: ContentRecord) {
  editorVersion.value++
  mode.value = action
  selected.value = item
  mutationError.value = ''
  for (const key of Object.keys(files)) delete files[key]
  for (const field of config.fields)
    form[field.key] = String(
      item?.[field.key] ?? (field.type === 'number' ? 0 : (field.options?.[0]?.value ?? '')),
    )
  dialog.value?.showModal()
}
function close() {
  if (!saving.value) dialog.value?.close()
}
function selectFile(event: Event, field: ContentField) {
  if (field.fileField) files[field.fileField] = (event.target as HTMLInputElement).files?.[0]
}
async function submit() {
  if (saving.value || !isAdmin() || disposed) return
  mutationError.value = ''
  message.value = ''
  let body: ReturnType<typeof contentPayload> | undefined
  try {
    if (mode.value !== 'delete') body = contentPayload(props.resource, form, files, selected.value)
  } catch (cause) {
    mutationError.value = errorMessage(cause)
    return
  }
  saving.value = true
  const controller = new AbortController()
  mutationController = controller
  try {
    if (mode.value === 'delete' && selected.value)
      await deleteContent(props.resource, selected.value.id, controller.signal)
    else if (body) await saveContent(props.resource, body, selected.value?.id, controller.signal)
    if (disposed || !isAdmin()) return
    message.value = mode.value === 'delete' ? `${config.label}已删除` : `${config.label}已保存`
    dialog.value?.close()
    refresh()
  } catch (cause) {
    if (!disposed && !controller.signal.aborted) mutationError.value = errorMessage(cause)
  } finally {
    if (!disposed) saving.value = false
  }
}
watch(
  () => props.active,
  (active) => {
    if (!active) dialog.value?.close()
  },
)
onMounted(refresh)
onBeforeUnmount(() => {
  disposed = true
  optionsController?.abort()
  mutationController?.abort()
  dialog.value?.close()
})
</script>

<template>
  <section class="content-manager" :aria-label="config.title">
    <header class="manager-header">
      <div>
        <p>控制面板 / {{ config.title }}</p>
        <h1>{{ config.title }}</h1>
      </div>
      <button
        class="primary"
        type="button"
        :disabled="saving || optionsLoading || !!optionsError || missingRelation"
        @click="open('create')"
      >
        ＋ 新增{{ config.label }}
      </button>
    </header>
    <form class="manager-toolbar" role="search" @submit.prevent="search">
      <input
        v-model="keyword"
        type="search"
        :placeholder="`搜索${config.label}`"
        :aria-label="`搜索${config.label}`"
        maxlength="254"
      />
      <select v-model="status" aria-label="内容状态">
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="disabled">已停用</option>
      </select>
      <select
        v-if="filterField"
        v-model="relationFilter"
        :aria-label="filterField.label"
        :disabled="optionsLoading || !!optionsError"
      >
        <option value="">全部{{ filterField.relation === 'albums' ? '图集' : '分类' }}</option>
        <option v-if="filterField.relation === 'parents'" value="__root__">一级分类</option>
        <option
          v-for="option in optionsFor(filterField, false)"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <button type="submit" :disabled="saving">搜索</button
      ><button type="button" :disabled="loading || saving || optionsLoading" @click="refresh">
        刷新
      </button>
    </form>
    <p v-if="message" class="manager-notice" role="status">{{ message }}</p>
    <p v-if="optionsError" class="manager-error" role="alert">
      关联分类加载失败：{{ optionsError }} <button type="button" @click="loadOptions">重试</button>
    </p>
    <p v-else-if="missingRelation && !optionsLoading" class="manager-hint">
      {{
        props.resource === 'gallery/media'
          ? '请先到图集管理创建图集。'
          : '请先到导航分类管理创建一级和二级分类。'
      }}
    </p>
    <div class="manager-table">
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>分类 / 说明</th>
            <th>状态</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <div class="manager-name">
                <img
                  v-if="preview(item)"
                  :src="preview(item)"
                  alt=""
                  width="36"
                  height="36"
                  loading="lazy"
                /><span>{{ label(item) }}</span>
              </div>
            </td>
            <td class="manager-detail" :title="group(item)">{{ group(item) }}</td>
            <td>
              <span class="manager-status" :class="{ active: item.status === 'active' }">{{
                item.status === 'active' ? '正常' : '已停用'
              }}</span>
            </td>
            <td>{{ item.sortOrder }}</td>
            <td class="manager-actions">
              <button
                type="button"
                :disabled="saving || optionsLoading || !!optionsError"
                @click="open('edit', item)"
              >
                编辑</button
              ><button
                class="danger-text"
                type="button"
                :disabled="saving"
                @click="open('delete', item)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="manager-empty" role="status">正在加载…</p>
      <div v-else-if="error" class="manager-empty" role="alert">
        <p>{{ error }}</p>
        <button type="button" @click="load">重新加载</button>
      </div>
      <p v-else-if="!items.length" class="manager-empty" role="status">
        {{
          query.keyword || query.status || relationFilter
            ? '未找到符合条件的内容'
            : `暂无${config.label}`
        }}
      </p>
    </div>
    <ContentPagination
      :page="query.page"
      :page-count="pageCount"
      :total="total"
      :disabled="loading || saving || !!error"
      @change="changePage"
    />

    <dialog ref="dialog" class="manager-dialog" :aria-labelledby="titleId" @cancel.prevent="close">
      <form novalidate @submit.prevent="submit">
        <header>
          <h2 :id="titleId">
            {{ mode === 'delete' ? '删除' : mode === 'edit' ? '编辑' : '新增' }}{{ config.label }}
          </h2>
        </header>
        <div class="manager-dialog-body">
          <p v-if="resource === 'music' && mode !== 'delete'" class="manager-hint">上传音频后，缺少的封面、歌词、专辑和时长会尝试从内嵌信息获取；歌曲名和歌手也可留空自动读取。</p>
          <template v-if="mode === 'delete'"
            ><p>确定删除「{{ selected ? label(selected) : '' }}」吗？</p>
            <p class="manager-hint">删除后无法恢复，上传文件也会被清理。</p></template
          >
          <fieldset v-else :disabled="saving">
            <label v-for="field in config.fields" :key="field.key" class="manager-field">
              <span>{{ field.label }} <span v-if="field.required" class="required">*</span></span>
              <textarea
                v-if="field.type === 'textarea'"
                v-model="form[field.key]"
                :name="field.key"
                :maxlength="field.maxLength"
                rows="3"
              />
              <select
                v-else-if="field.type === 'select'"
                v-model="form[field.key]"
                :name="field.key"
                :aria-required="field.required"
              >
                <option v-if="field.relation" value="">
                  {{ field.required ? '请选择' : '无（一级分类）' }}
                </option>
                <option
                  v-for="option in optionsFor(field)"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <template v-else-if="field.type === 'asset'">
                <input
                  v-model="form[field.key]"
                  :name="field.key"
                  type="text"
                  :aria-label="`${field.label}地址`"
                  :placeholder="
                    field.required
                      ? '填写 HTTP/HTTPS 地址或选择文件'
                      : '填写地址或选择文件，留空移除'
                  "
                  maxlength="2048"
                />
                <input
                  :key="`${editorVersion}-${field.key}`"
                  type="file"
                  :name="field.fileField"
                  :accept="fileRules(resource, field, form).accept"
                  :aria-label="`上传${field.label}`"
                  @change="selectFile($event, field)"
                />
                <small
                  >{{ fileRules(resource, field, form).accept }} · 最大
                  {{ fileRules(resource, field, form).limit }} MB{{
                    field.key === 'lyricsUrl' ? ' · UTF-8 编码' : ''
                  }}</small
                >
              </template>
              <input
                v-else
                v-model="form[field.key]"
                :name="field.key"
                :type="field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                :maxlength="field.maxLength ?? (field.type === 'url' ? 2048 : undefined)"
                :aria-required="field.required"
              />
            </label>
          </fieldset>
          <p v-if="mutationError" class="manager-error" role="alert">{{ mutationError }}</p>
        </div>
        <footer>
          <button type="button" :disabled="saving" @click="close">取消</button
          ><button
            :class="mode === 'delete' ? 'danger' : 'primary'"
            type="submit"
            :disabled="saving"
          >
            {{ saving ? '正在提交…' : mode === 'delete' ? '确认删除' : '保存' }}
          </button>
        </footer>
      </form>
    </dialog>
  </section>
</template>

<style scoped lang="scss">
.content-manager {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
  color: var(--app-window-color);
  font-size: 13px;
}
.manager-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  p {
    opacity: 0.55;
    font-size: 11px;
    margin-bottom: 8px;
  }
  h1 {
    font-size: 23px;
  }
}
button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}
button {
  border: 1px solid #8884;
  background: transparent;
  border-radius: 7px;
  padding: 7px 11px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #0067c0;
  outline-offset: 2px;
}
.primary {
  background: #0067c0;
  color: white;
  border-color: transparent;
}
.danger {
  background: #c73838;
  color: white;
  border-color: transparent;
}
.manager-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  input {
    flex: 1;
    min-width: 120px;
  }
  select {
    max-width: 190px;
  }
}
input,
select,
textarea {
  padding: 8px 10px;
  border: 1px solid #8884;
  border-radius: 7px;
  background: var(--app-window-background-color);
}
.manager-notice {
  padding: 10px;
  border-radius: 7px;
  background: #21865718;
  color: #218657;
  margin-bottom: 14px;
}
.manager-error {
  color: #c73838;
  overflow-wrap: anywhere;
  margin: 10px 0;
}
.manager-hint {
  opacity: 0.65;
  font-size: 12px;
  margin: 10px 0;
}
.manager-table {
  border: 1px solid #8883;
  border-radius: 9px;
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  min-width: 480px;
  text-align: left;
}
th {
  background: #8881;
  font-weight: 500;
  white-space: nowrap;
}
th,
td {
  padding: 11px 12px;
}
td {
  border-top: 1px solid #8882;
}
.manager-name {
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: 230px;
  span {
    overflow-wrap: anywhere;
  }
  img {
    flex-shrink: 0;
    border-radius: 6px;
    object-fit: cover;
  }
}
.manager-detail {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.7;
}
.manager-status {
  padding: 3px 6px;
  border-radius: 4px;
  background: #8882;
  white-space: nowrap;
  &.active {
    color: #218657;
    background: #21865718;
  }
}
.manager-actions {
  white-space: nowrap;
  button {
    border: 0;
    padding: 3px 6px;
    color: #0067c0;
  }
  .danger-text {
    color: #c73838;
  }
}
.manager-empty {
  padding: 40px 15px;
  text-align: center;
  p {
    margin-bottom: 12px;
  }
}
.manager-dialog {
  width: min(540px, calc(100vw - 32px));
  max-height: calc(100dvh - 40px);
  margin: auto;
  padding: 0;
  border: 1px solid #8884;
  border-radius: 12px;
  color: var(--app-window-color);
  background: var(--app-window-background-color);
  font-size: 13px;
  &::backdrop {
    background: #0005;
  }
  header {
    padding: 20px 24px 16px;
  }
  h2 {
    font-size: 19px;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #8883;
  }
}
.manager-dialog-body {
  padding: 0 24px 20px;
  overflow-wrap: anywhere;
}
fieldset {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;
}
.manager-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  input,
  select,
  textarea {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  input[type='file'] {
    font-size: 12px;
    padding: 6px;
  }
  small {
    opacity: 0.6;
    font-size: 11px;
  }
  textarea {
    resize: vertical;
  }
}
.required {
  color: #c73838;
}
</style>
