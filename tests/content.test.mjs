import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import { parse, compileScript } from '@vue/compiler-sfc'

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
function load(source, imports = {}) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInThisContext(`(function(require, module, exports) {\n${output}\n})`)(
    (name) => {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`)
      return imports[name]
    },
    module,
    module.exports,
  )
  return module.exports
}
const pending = () => {
  let resolve, reject
  const promise = new Promise((a, b) => {
    resolve = a
    reject = b
  })
  return { promise, resolve, reject }
}
const tick = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
    await Vue.nextTick()
  }
}
const renderer = Vue.createRenderer({
  createComment: () => ({}),
  insert() {},
  remove() {},
  parentNode: () => null,
  nextSibling: () => null,
})
const item = (id = 'one') => ({
  id,
  title: '歌曲',
  artist: '歌手',
  album: '',
  url: 'https://example.com/song.mp3',
  coverUrl: '',
  lyricsUrl: '',
  duration: 0,
  description: '',
  status: 'active',
  sortOrder: 0,
  createdAt: '',
  updatedAt: '',
})
const form = () => ({
  title: '歌曲',
  artist: '歌手',
  album: '',
  url: 'https://example.com/song.mp3',
  coverUrl: '',
  lyricsUrl: '',
  duration: '0',
  description: '',
  status: 'active',
  sortOrder: '0',
})
const management = load(read('src/views/ControlPanel/contentManagement.ts'))

function listFixture(t, getContentList) {
  const { useContentList } = load(read('src/composables/useContentList.ts'), {
    vue: Vue,
    '@/server/content': { getContentList },
  })
  let state
  const app = renderer.createApp({
    setup() {
      state = useContentList('music')
      return () => null
    },
  })
  app.mount({})
  t.after(() => app.unmount())
  return { state, app }
}

test('内容 API 区分公开查询和管理员请求，自动取完分类分页并编码 ID', async () => {
  const calls = []
  const store = { isAuthenticated: false, data: { user: { role: '' } } }
  const request = Object.fromEntries(
    ['get', 'post', 'put', 'delete'].map((method) => [
      method,
      async (...args) => {
        calls.push([method, ...args])
        const page = args[1]?.params?.page ?? 1
        return {
          data: {
            data: {
              list:
                page === 1
                  ? Array.from({ length: 100 }, (_, id) => item(String(id)))
                  : [item('last')],
              total: 101,
            },
          },
        }
      },
    ]),
  )
  const api = load(read('src/server/content.ts'), {
    '@/utils/request': request,
    '@/stores/userInfo': { useUserInfoStore: () => store },
  })
  assert.equal((await api.getAllContent('gallery/albums')).length, 101)
  assert.deepEqual(
    calls.map((call) => call[2].params.page),
    [1, 2],
  )
  const before = calls.length
  for (const action of [
    () => api.getContentList('music', {}, undefined, true),
    () => api.saveContent('music', {}),
    () => api.deleteContent('music', 'id'),
  ]) {
    await assert.rejects(action, /管理员/)
  }
  assert.equal(calls.length, before)
  store.isAuthenticated = true
  store.data.user.role = 'admin'
  const body = new FormData()
  body.set('title', '上传')
  await api.saveContent('music', body, 'a/b')
  assert.equal(calls.at(-1)[1], '/admin/music/a%2Fb')
  assert.equal(calls.at(-1)[2], body)
  await api.deleteContent('navigation/sites', 'a/b')
  assert.equal(calls.at(-1)[1], '/admin/navigation/sites/a%2Fb')
})

test('接口层拒绝错误列表和树结构，取消分页读取后不继续请求', async () => {
  let response = { list: [], total: -1 }
  const api = load(read('src/server/content.ts'), {
    '@/utils/request': { get: async () => ({ data: { data: response } }) },
    '@/stores/userInfo': { useUserInfoStore: () => ({}) },
  })
  await assert.rejects(() => api.getContentList('music', {}), /格式/)
  response = { list: [{ children: [{}] }] }
  await assert.rejects(() => api.getNavigationTree(), /格式/)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(() => api.getAllContent('gallery/albums', controller.signal), {
    name: 'AbortError',
  })
})

test('内容列表快速查询只采用最后结果，失败清除旧数据且可以重试', async (t) => {
  const first = pending(),
    second = pending()
  const calls = []
  let failure = false
  const { state } = listFixture(t, (resource, query, signal) => {
    calls.push({ resource, query, signal })
    if (failure) throw new Error('服务不可用')
    return query.keyword === 'first' ? first.promise : second.promise
  })
  state.query.keyword = 'first'
  const a = state.load()
  state.query.keyword = 'second'
  const b = state.load()
  assert.equal(calls[0].signal.aborted, true)
  second.resolve({ list: [item('second')], total: 21 })
  await b
  first.resolve({ list: [item('first')], total: 1 })
  await a
  assert.equal(state.items.value[0].id, 'second')
  assert.equal(state.pageCount.value, 2)
  failure = true
  await state.load()
  assert.equal(state.error.value, '服务不可用')
  assert.deepEqual(state.items.value, [])
  failure = false
  await state.load()
  assert.equal(state.error.value, '')
  assert.equal(state.total.value, 21)
})

test('删除后列表回退到有效页，关闭页面后中止请求并忽略迟到结果', async (t) => {
  const pages = []
  const late = pending()
  let waiting = false,
    signal
  const { state, app } = listFixture(t, (_resource, query, currentSignal) => {
    pages.push(query.page)
    signal = currentSignal
    return waiting
      ? late.promise
      : Promise.resolve({ list: query.page > 1 ? [] : [item()], total: 1 })
  })
  state.query.page = 2
  await state.load()
  assert.deepEqual(pages, [2, 1])
  assert.equal(state.query.page, 1)
  waiting = true
  const request = state.load()
  app.unmount()
  assert.equal(signal.aborted, true)
  late.resolve({ list: [item('late')], total: 1 })
  await request
  assert.deepEqual(state.items.value, [])
})

test('管理表单生成 JSON 和 multipart，保留原本地路径并支持清空可选文件', () => {
  const { contentPayload } = management
  const data = contentPayload(
    'music',
    { ...form(), duration: '12.5', coverUrl: '' },
    {},
    { ...item(), coverUrl: '/uploads/music/current.png' },
  )
  assert.equal(data.duration, 12.5)
  assert.equal(data.coverUrl, '')
  assert.equal(
    contentPayload(
      'music',
      { ...form(), coverUrl: '/uploads/music/current.png' },
      {},
      { ...item(), coverUrl: '/uploads/music/current.png' },
    ).coverUrl,
    '/uploads/music/current.png',
  )
  const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' })
  const body = contentPayload('music', { ...form(), url: '' }, { audio: file })
  assert.ok(body instanceof FormData)
  assert.equal(body.get('audio').name, 'song.mp3')
  assert.equal(body.has('url'), false)
  assert.equal(body.get('duration'), '0')
  const category = contentPayload(
    'navigation/categories',
    { title: '一级分类', parentId: '', status: 'active', sortOrder: '0', description: '' },
    {},
  )
  assert.equal(category.parentId, null)
})

test('管理表单校验数值、必填字段、链接协议及图片视频上传类型和大小', () => {
  const { contentPayload } = management
  for (const changes of [
    { title: '' },
    { url: 'javascript:alert(1)' },
    { url: 'file:///x' },
    { url: 'https://user:pass@example.com/a' },
    { coverUrl: '/uploads/music/other.png' },
    { duration: '-1' },
    { sortOrder: '0.5' },
    { description: 'x'.repeat(2001) },
    { status: 'draft' },
  ]) {
    assert.throws(() => contentPayload('music', { ...form(), ...changes }, {}))
  }
  assert.throws(() => contentPayload('music', form(), { lyrics: new File(['x'], 'x.exe') }), /格式/)
  assert.throws(
    () =>
      contentPayload('music', form(), {
        cover: new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png'),
      }),
    /不超过 5 MB/,
  )
  const media = {
    title: '视频',
    albumId: 'album',
    type: 'video',
    src: '',
    thumbnail: '',
    status: 'active',
    sortOrder: '0',
    description: '',
  }
  assert.throws(
    () => contentPayload('gallery/media', media, { file: new File(['x'], 'x.png') }),
    /格式/,
  )
  assert.ok(
    contentPayload('gallery/media', media, { file: new File(['video'], 'x.mp4') }) instanceof
      FormData,
  )
})

test('上传音频允许留空曲目信息自动读取，音乐与图集限制分别为100MB和50MB', () => {
  const { contentPayload, contentManagers, fileRules } = management
  const body = contentPayload('music', { ...form(), title: '', artist: '', url: '' }, { audio: new File(['audio'], 'song.mp3') })
  assert.ok(body instanceof FormData); assert.equal(body.has('title'), false); assert.equal(body.has('artist'), false)
  assert.throws(() => contentPayload('music', { ...form(), title: '' }, {}), /歌曲名/)
  for (const [resource, key, limit] of [['music', 'url', 100], ['gallery/albums', 'thumbnail', 50], ['gallery/media', 'src', 50], ['gallery/media', 'thumbnail', 50], ['music', 'coverUrl', 5], ['navigation/sites', 'icon', 5]]) {
    assert.equal(fileRules(resource, contentManagers[resource].fields.find((field) => field.key === key), { type: 'image' }).limit, limit)
  }
  assert.throws(() => contentPayload('music', form(), { audio: { size: 100 * 1024 * 1024 + 1, name: 'large.mp3' } }), /100 MB/)
  assert.throws(() => contentPayload('gallery/albums', { name: '图集', status: 'active', sortOrder: '0', description: '', thumbnail: '' }, { thumbnail: { size: 50 * 1024 * 1024 + 1, name: 'large.png' } }), /50 MB/)
})

function managerFixture(t, overrides = {}, resource = 'music') {
  const api = {
    getContentList: async () => ({ list: [item()], total: 1 }),
    getAllContent: async () => [],
    saveContent: async () => {},
    deleteContent: async () => {},
    ...overrides,
  }
  const store = { isAuthenticated: true, data: { user: { role: 'admin' } } }
  const { useContentList } = load(read('src/composables/useContentList.ts'), {
    vue: Vue,
    '@/server/content': api,
  })
  const { descriptor } = parse(read('src/views/ControlPanel/components/ContentManager.vue'))
  const component = load(compileScript(descriptor, { id: 'content-manager-test' }).content, {
    vue: Vue,
    '@/server/content': api,
    '@/stores/userInfo': { useUserInfoStore: () => store },
    '@/composables/useContentList': { useContentList },
    '@/components/ContentPagination.vue': { default: {} },
    '../contentManagement': management,
  }).default
  let bindings
  const setup = component.setup
  component.setup = (props, context) => {
    bindings = setup(props, context)
    return () => null
  }
  const app = renderer.createApp(component, { resource, active: true })
  app.config.warnHandler = (warning) => assert.fail(warning)
  app.mount({})
  t.after(() => app.unmount())
  let closes = 0
  bindings.dialog.value = {
    showModal() {},
    close() {
      closes++
    },
  }
  return { state: bindings, app, store, closes: () => closes }
}

test('管理保存失败保留输入和文件，重复提交只发一次请求', async (t) => {
  const request = pending()
  let saves = 0
  const { state, closes } = managerFixture(t, {
    saveContent: () => {
      saves++
      return request.promise
    },
  })
  await tick()
  state.open('edit', item())
  state.form.title = '修改后歌曲'
  state.files.cover = new File(['image'], 'cover.png')
  const first = state.submit()
  await state.submit()
  assert.equal(saves, 1)
  request.reject(new Error('保存失败'))
  await first
  assert.equal(state.form.title, '修改后歌曲')
  assert.equal(state.files.cover.name, 'cover.png')
  assert.equal(state.mutationError.value, '保存失败')
  assert.equal(closes(), 0)
  assert.equal(state.message.value, '')
})

test('非空分类删除失败留在确认框，成功后刷新列表', async (t) => {
  let fail = true,
    loads = 0
  const { state, closes } = managerFixture(t, {
    deleteContent: async () => {
      if (fail) throw new Error('分类非空')
    },
    getContentList: async () => {
      loads++
      return { list: [], total: 0 }
    },
  })
  await tick()
  state.open('delete', item())
  await state.submit()
  assert.equal(state.mutationError.value, '分类非空')
  assert.equal(closes(), 0)
  fail = false
  await state.submit()
  await tick()
  assert.equal(closes(), 1)
  assert.equal(state.message.value, '歌曲已删除')
  assert.equal(loads, 2)
})

test('管理页面卸载中止保存，关联分类失败可重试且不会提供不完整选项', async (t) => {
  let fail = true
  const request = pending()
  let signal
  const { state, app } = managerFixture(
    t,
    {
      getAllContent: async () => {
        if (fail) throw new Error('分类加载失败')
        return [{ id: 'album', name: '图集', status: 'active' }]
      },
      saveContent: (_resource, _body, _id, currentSignal) => {
        signal = currentSignal
        return request.promise
      },
    },
    'gallery/media',
  )
  await tick()
  assert.equal(state.optionsError.value, '分类加载失败')
  assert.equal(state.missingRelation.value, true)
  fail = false
  await state.loadOptions()
  assert.equal(state.optionsError.value, '')
  assert.equal(state.missingRelation.value, false)
  state.open('create')
  Object.assign(state.form, { title: '图片', albumId: 'album', src: 'https://example.com/a.png' })
  const saving = state.submit()
  app.unmount()
  assert.equal(signal.aborted, true)
  request.resolve()
  await saving
  assert.equal(state.message.value, '')
})
