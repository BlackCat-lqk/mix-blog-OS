import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { createPinia, setActivePinia } = require('pinia')
const { nextTick } = require('vue')
const filename = new URL('../src/stores/wallpaper.ts', import.meta.url)
const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

// 仅替换 Node 中不存在的 IndexedDB，保留真实 Pinia、Blob 和对象 URL。
function fixture(t, storage = {}, fetchBing = () => assert.fail('未预期的必应请求')) {
  const created = []
  const revoked = []
  const database = {
    transaction() {
      const transaction = {
        objectStore: () => ({
          get() {
            const request = {}
            queueMicrotask(() => {
              request.result = structuredClone(storage.data)
              request.onsuccess()
            })
            return request
          },
          put(data) {
            storage.data = structuredClone(data)
            queueMicrotask(() => transaction.oncomplete())
          },
        }),
      }
      return transaction
    },
  }
  const indexedDB = {
    open() {
      const request = { result: database }
      queueMicrotask(() => request.onsuccess())
      return request
    },
  }
  const urls = {
    createObjectURL(blob) {
      const url = URL.createObjectURL(blob)
      created.push(url)
      return url
    },
    revokeObjectURL(url) {
      revoked.push(url)
      URL.revokeObjectURL(url)
    },
  }
  const module = { exports: {} }
  vm.runInThisContext(`(function(require,module,exports,indexedDB,URL,fetch){\n${source}\n})`, {
    filename: filename.pathname,
  })(require, module, module.exports, indexedDB, urls, fetchBing)
  setActivePinia(createPinia())
  const store = module.exports.useWallpaperStore()
  t.after(() => {
    store.$dispose()
    assert.deepEqual(revoked, created, '切换及销毁后释放所有生成的对象 URL')
  })
  return { store, storage, created, revoked }
}

async function flush() {
  await new Promise((resolve) => setImmediate(resolve))
  await nextTick()
}

test('大图使用短对象 URL 显示，保留完整图片、预览和历史数据', async (t) => {
  const { store, storage } = fixture(t)
  await flush()
  const bytes = Buffer.alloc(2 * 1024 * 1024, 123)
  const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`
  store.setWallpaper(dataUrl)
  assert.ok(store.wallpaperUrl.startsWith('blob:'))
  assert.ok(store.wallpaperUrl.length < 100)
  const response = await fetch(store.wallpaperUrl)
  assert.equal(response.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes)
  assert.equal(store.current, dataUrl)
  assert.deepEqual(store.history, [dataUrl])
  await flush()
  assert.deepEqual(storage.data, { current: dataUrl, history: [dataUrl] })
})

test('刷新恢复自定义壁纸时重新生成可用的对象 URL', async (t) => {
  const { store, storage } = fixture(t)
  await flush()
  store.setWallpaper('data:image/png;base64,aGVsbG8=')
  await flush()
  const originalUrl = store.wallpaperUrl
  store.$dispose()
  const restored = fixture(t, storage).store
  await flush()
  assert.equal(restored.initialized, true)
  assert.equal(restored.current, storage.data.current)
  assert.notEqual(restored.wallpaperUrl, originalUrl)
  assert.equal(await (await fetch(restored.wallpaperUrl)).text(), 'hello')
  assert.deepEqual(restored.history, storage.data.history)
})

test('切换系统壁纸和历史图片后更新显示地址并释放旧 URL', async (t) => {
  const { store, created, revoked } = fixture(t)
  await flush()
  store.setDefaultWallpaper('/default.jpg')
  assert.equal(store.wallpaperUrl, '/default.jpg')
  const first = 'data:image/jpeg;base64,YQ=='
  store.setWallpaper(first)
  store.setWallpaper('data:image/png;base64,Yg==')
  assert.deepEqual(revoked, [created[0]])
  store.selectWallpaper('/other.jpg')
  assert.equal(store.wallpaperUrl, '/other.jpg')
  assert.deepEqual(revoked, created)
  store.selectWallpaper(first)
  assert.equal(await (await fetch(store.wallpaperUrl)).text(), 'a')
  assert.equal(store.history.length, 2)
})

test('启用必应后拼接图片地址并持久化，关闭后恢复原壁纸', async (t) => {
  const path = '/th?id=OHR.Test_ZH-CN_1920x1080.jpg&pid=hp'
  const { store, storage } = fixture(t, {}, async (url, options) => {
    assert.equal(url, '/bing/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN')
    assert.ok(options.signal instanceof AbortSignal)
    return Response.json({ images: [{ url: path }] })
  })
  await flush()
  store.setWallpaper('data:image/png;base64,YQ==')
  store.setBingEnabled(true)
  assert.equal(store.bingLoading, true)
  await flush()
  assert.equal(store.current, `https://www.bing.com${path}`)
  assert.equal(store.wallpaperUrl, store.current)
  assert.deepEqual(store.history, ['data:image/png;base64,YQ=='])
  assert.equal(store.bingLoading, false)
  assert.equal(store.bingError, '')
  assert.equal(storage.data.bingEnabled, true)
  assert.equal(storage.data.previousWallpaper, 'data:image/png;base64,YQ==')
  store.setBingEnabled(false)
  assert.equal(store.current, 'data:image/png;base64,YQ==')
  assert.equal(await (await fetch(store.wallpaperUrl)).text(), 'a')
  await flush()
  assert.equal(storage.data.bingEnabled, undefined)
})

test('刷新后保留必应开关并更新今日图片，兼容旧壁纸记录', async (t) => {
  const storage = { data: {
    current: 'https://www.bing.com/th?id=yesterday',
    history: ['/custom.jpg'],
    bingEnabled: true,
    previousWallpaper: '/custom.jpg',
  } }
  const { store } = fixture(t, storage, async () =>
    Response.json({ images: [{ url: '/th?id=today' }] }),
  )
  await flush()
  assert.equal(store.bingEnabled, true)
  assert.equal(store.current, 'https://www.bing.com/th?id=today')
  store.setBingEnabled(false)
  assert.equal(store.current, '/custom.jpg')
  const legacy = fixture(t, { data: { current: '/legacy.jpg', history: [] } }).store
  await flush()
  assert.equal(legacy.bingEnabled, false)
  assert.equal(legacy.current, '/legacy.jpg')
})

test('手动切换或关闭开关后，迟到的必应响应不会覆盖壁纸', async (t) => {
  let resolveRequest
  let signal
  const { store } = fixture(t, {}, (_url, options) => {
    signal = options.signal
    return new Promise((resolve) => { resolveRequest = resolve })
  })
  await flush()
  store.selectWallpaper('/original.jpg')
  store.setBingEnabled(true)
  store.setBingEnabled(false)
  assert.equal(signal.aborted, true)
  resolveRequest(Response.json({ images: [{ url: '/th?id=late' }] }))
  await flush()
  assert.equal(store.current, '/original.jpg')
  for (const select of [store.selectWallpaper, store.setWallpaper]) {
    store.setBingEnabled(true)
    select('/manual.jpg')
    assert.equal(store.bingEnabled, false)
    assert.equal(signal.aborted, true)
    resolveRequest(Response.json({ images: [{ url: '/th?id=late' }] }))
    await flush()
    assert.equal(store.current, '/manual.jpg')
    assert.equal(store.bingError, '')
  }
})

test('网络异常、非成功响应及缺失图片路径时保留原背景并支持重试', async (t) => {
  for (const request of [
    async () => { throw new Error('offline') },
    async () => new Response('', { status: 502 }),
    async () => Response.json({ images: [] }),
    async () => Response.json({ images: [{ url: '//other.example/image.jpg' }] }),
  ]) {
    let fail = true
    const { store } = fixture(t, {}, () => fail
      ? request()
      : Promise.resolve(Response.json({ images: [{ url: '/th?id=retry' }] })),
    )
    await flush()
    store.selectWallpaper('/original.jpg')
    store.setBingEnabled(true)
    await flush()
    assert.equal(store.current, '/original.jpg')
    assert.ok(store.bingError)
    assert.equal(store.bingLoading, false)
    fail = false
    await store.loadBingWallpaper()
    assert.equal(store.current, 'https://www.bing.com/th?id=retry')
    assert.equal(store.bingError, '')
  }
})
