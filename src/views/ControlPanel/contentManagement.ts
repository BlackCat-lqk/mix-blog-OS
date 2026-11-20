import type {
  ContentField,
  ContentManagerConfig,
  ContentRecord,
  ContentResource,
} from '@/tsInterface/index'

const imageAccept = '.png,.jpg,.jpeg,.gif,.webp'
const name: ContentField = {
  key: 'title',
  label: '名称',
  type: 'text',
  required: true,
  maxLength: 200,
}
const common: ContentField[] = [
  { key: 'description', label: '描述', type: 'textarea', maxLength: 2000 },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { value: 'active', label: '正常' },
      { value: 'disabled', label: '已停用' },
    ],
  },
  {
    key: 'sortOrder',
    label: '排序（数值越小越靠前）',
    type: 'number',
    min: -1000000,
    max: 1000000,
    step: 1,
  },
]

export const contentManagers: Record<ContentResource, ContentManagerConfig> = {
  music: {
    title: '音乐管理',
    label: '歌曲',
    fields: [
      { ...name, label: '歌曲名' },
      { key: 'artist', label: '歌手', type: 'text', required: true, maxLength: 200 },
      { key: 'album', label: '专辑', type: 'text', maxLength: 200 },
      {
        key: 'url',
        label: '音频',
        type: 'asset',
        required: true,
        fileField: 'audio',
        accept: '.mp3,.wav,.ogg,.flac,.m4a',
        fileLimit: 100,
      },
      {
        key: 'coverUrl',
        label: '封面',
        type: 'asset',
        fileField: 'cover',
        accept: imageAccept,
        fileLimit: 5,
      },
      {
        key: 'lyricsUrl',
        label: '歌词',
        type: 'asset',
        fileField: 'lyrics',
        accept: '.lrc,.txt',
        fileLimit: 1,
      },
      {
        key: 'duration',
        label: '时长（秒，未知填 0）',
        type: 'number',
        min: 0,
        max: 86400,
        step: 0.01,
      },
      ...common,
    ],
  },
  'gallery/albums': {
    title: '图集管理',
    label: '图集',
    fields: [
      { key: 'name', label: '图集名称', type: 'text', required: true, maxLength: 200 },
      {
        key: 'thumbnail',
        label: '图集封面',
        type: 'asset',
        fileField: 'thumbnail',
        accept: imageAccept,
        fileLimit: 50,
      },
      ...common,
    ],
  },
  'gallery/media': {
    title: '媒体管理',
    label: '媒体',
    fields: [
      { ...name, label: '媒体名称' },
      { key: 'albumId', label: '所属图集', type: 'select', relation: 'albums', required: true },
      {
        key: 'type',
        label: '媒体类型',
        type: 'select',
        options: [
          { value: 'image', label: '图片' },
          { value: 'video', label: '视频' },
        ],
      },
      {
        key: 'src',
        label: '媒体文件',
        type: 'asset',
        required: true,
        fileField: 'file',
        accept: imageAccept,
        fileLimit: 50,
      },
      {
        key: 'thumbnail',
        label: '缩略图',
        type: 'asset',
        fileField: 'thumbnail',
        accept: imageAccept,
        fileLimit: 50,
      },
      ...common,
    ],
  },
  'navigation/categories': {
    title: '导航分类管理',
    label: '分类',
    fields: [
      { ...name, label: '分类名称' },
      { key: 'parentId', label: '上级分类（留空为一级分类）', type: 'select', relation: 'parents' },
      ...common,
    ],
  },
  'navigation/sites': {
    title: '网站管理',
    label: '网站',
    fields: [
      { ...name, label: '网站名称' },
      {
        key: 'categoryId',
        label: '所属二级分类',
        type: 'select',
        relation: 'subcategories',
        required: true,
      },
      { key: 'url', label: '网站地址', type: 'url', required: true },
      {
        key: 'icon',
        label: '网站图标',
        type: 'asset',
        fileField: 'icon',
        accept: `${imageAccept},.ico`,
        fileLimit: 5,
      },
      ...common,
    ],
  },
}

export function fileRules(
  resource: ContentResource,
  field: ContentField,
  values: Record<string, string>,
) {
  return resource === 'gallery/media' && field.key === 'src' && values.type === 'video'
    ? { accept: '.mp4,.webm', limit: 100 }
    : { accept: field.accept ?? '', limit: field.fileLimit ?? 5 }
}

export function contentPayload(
  resource: ContentResource,
  values: Record<string, string>,
  files: Record<string, File | undefined>,
  previous?: ContentRecord,
) {
  const data: Record<string, string | number | null> = {}
  const selected: Record<string, File> = {}
  for (const field of contentManagers[resource].fields) {
    const file = field.fileField ? files[field.fileField] : undefined
    const value = (values[field.key] ?? '').trim()
    if (resource === 'music' && files.audio && ['title', 'artist'].includes(field.key) && !value) continue
    if (field.required && !value && !file)
      throw new Error(`请填写${field.label}${field.type === 'asset' ? '或选择文件' : ''}`)
    if (file && field.fileField) {
      const rules = fileRules(resource, field, values)
      if (!file.size || file.size > rules.limit * 1024 * 1024)
        throw new Error(`${field.label}文件须大于 0 且不超过 ${rules.limit} MB`)
      if (!rules.accept.split(',').some((extension) => file.name.toLowerCase().endsWith(extension)))
        throw new Error(`${field.label}文件格式不支持`)
      selected[field.fileField] = file
      continue
    }
    const maxLength =
      field.maxLength ?? (field.type === 'url' || field.type === 'asset' ? 2048 : undefined)
    if (maxLength && value.length > maxLength)
      throw new Error(`${field.label}最多 ${maxLength} 个字符`)
    if (field.type === 'number') {
      const number = Number(value)
      if (
        !value ||
        !Number.isFinite(number) ||
        number < field.min! ||
        number > field.max! ||
        (field.step === 1 && !Number.isInteger(number))
      ) {
        throw new Error(
          `${field.label}须为 ${field.min} 至 ${field.max} 范围内的${field.step === 1 ? '整数' : '数值'}`,
        )
      }
      data[field.key] = number
    } else if (field.key === 'parentId') data[field.key] = value || null
    else {
      if (field.options && !field.options.some((option) => option.value === value))
        throw new Error(`请选择有效的${field.label}`)
      if ((field.type === 'url' || field.type === 'asset') && value) {
        if (
          !(
            field.type === 'asset' &&
            value.startsWith('/uploads/') &&
            value === previous?.[field.key]
          )
        ) {
          let parsed: URL
          try {
            parsed = new URL(value)
          } catch {
            throw new Error(`${field.label}须为有效的 HTTP/HTTPS 地址`)
          }
          if (
            !['http:', 'https:'].includes(parsed.protocol) ||
            parsed.username ||
            parsed.password ||
            /[\s\\]/.test(value)
          )
            throw new Error(`${field.label}须为有效的 HTTP/HTTPS 地址`)
        }
      }
      data[field.key] = value
    }
  }
  if (!Object.keys(selected).length) return data
  const body = new FormData()
  for (const [key, value] of Object.entries(data))
    body.set(key, value === null ? '' : String(value))
  for (const [key, file] of Object.entries(selected)) body.set(key, file)
  return body
}
