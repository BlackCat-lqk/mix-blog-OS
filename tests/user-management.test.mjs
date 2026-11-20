import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { parse, compileScript } from '@vue/compiler-sfc'

const root = new URL('../', import.meta.url)
function loadCode(source, imports) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInThisContext(`(function(require, module, exports) {\n${output}\n})`)(
    (id) => {
      if (!(id in imports)) throw new Error(`Unexpected import: ${id}`)
      return imports[id]
    },
    module,
    module.exports,
  )
  return module.exports
}
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8')
const { useUserInfoStore } = loadCode(read('src/stores/userInfo.ts'), { pinia: { defineStore } })
const renderer = Vue.createRenderer({
  createComment: () => ({}),
  insert() {},
  remove() {},
  parentNode: () => null,
  nextSibling: () => null,
})
const sample = (id = 'other') => ({
  _id: id,
  userName: '测试用户',
  email: 'test@example.com',
  role: 'user',
  status: 'active',
  desc: '',
})
const pending = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function fixture(t, overrides = {}) {
  setActivePinia(createPinia())
  const store = useUserInfoStore()
  store.data.token = 'test-token'
  store.data.user.isLogin = true
  store.data.user._id = 'self'
  const calls = []
  const api = {
    getUsersApi: async (query) => {
      calls.push(query)
      return { list: [sample()], total: 1 }
    },
    createUserApi: async () => {},
    editUserApi: async () => {},
    deleteUserApi: async () => {},
    ...overrides,
  }
  const { useUserManagement } = loadCode(read('src/views/ControlPanel/useUserManagement.ts'), {
    vue: Vue,
    '@/stores/userInfo': { useUserInfoStore },
    '@/server/userManagement': api,
  })
  let state
  const app = renderer.createApp({
    setup() {
      state = useUserManagement()
      return () => null
    },
  })
  app.config.warnHandler = (warning) => assert.fail(warning)
  app.mount({})
  t.after(() => app.unmount())
  return { state, store, calls, app }
}

test('登录状态必须同时有 token 和登录标志', () => {
  setActivePinia(createPinia())
  const store = useUserInfoStore()
  assert.equal(store.isAuthenticated, false)
  store.setAuthStatus(true)
  assert.equal(store.isAuthenticated, false)
  store.data.token = 'test-token'
  assert.equal(store.isAuthenticated, true)
  store.setAuthStatus(false)
  assert.equal(store.isAuthenticated, false)
})

test('列表使用搜索与分页参数，失败清除旧数据并允许重试', async (t) => {
  let fail = false
  const { state, calls } = fixture(t, {
    getUsersApi: async (query) => {
      calls.push(query)
      if (fail) throw new Error('服务暂不可用')
      return { list: [sample()], total: 21 }
    },
  })
  Object.assign(state.query, { keyword: '测试', status: 'active', page: 2 })
  await state.loadUsers()
  assert.deepEqual(calls[0], { page: 2, pageSize: 10, keyword: '测试', status: 'active' })
  assert.equal(state.pageCount.value, 3)
  fail = true
  await state.loadUsers()
  assert.equal(state.error.value, '服务暂不可用')
  assert.equal(state.users.value.length, 0)
  assert.equal(state.total.value, 0)
  fail = false
  await state.loadUsers()
  assert.equal(state.error.value, '')
  assert.equal(state.users.value.length, 1)
})

test('快速搜索取消前次请求，较早返回的结果不会覆盖最新结果', async (t) => {
  const first = pending(),
    second = pending()
  const signals = []
  const { state } = fixture(t, {
    getUsersApi: (query, signal) => {
      signals.push(signal)
      return query.keyword === 'first' ? first.promise : second.promise
    },
  })
  state.query.keyword = 'first'
  const a = state.loadUsers()
  state.query.keyword = 'second'
  const b = state.loadUsers()
  assert.equal(signals[0].aborted, true)
  second.resolve({ list: [sample('second')], total: 1 })
  await b
  first.resolve({ list: [sample('first')], total: 1 })
  await a
  assert.equal(state.users.value[0]._id, 'second')
  assert.equal(state.loading.value, false)
})

test('保存失败保留列表并报告错误，重复提交只发送一次请求', async (t) => {
  const request = pending()
  let saves = 0
  const { state } = fixture(t, {
    createUserApi: () => {
      saves++
      return request.promise
    },
  })
  await state.loadUsers()
  const first = state.saveUser(sample())
  assert.equal(await state.saveUser(sample()), false)
  request.reject(new Error('邮箱已存在'))
  assert.equal(await first, false)
  assert.equal(saves, 1)
  assert.equal(state.mutationError.value, '邮箱已存在')
  assert.equal(state.users.value.length, 1)
  assert.equal(state.message.value, '')
})

test('删除后总页数减少时回退到有效页，不能删除自己', async (t) => {
  let deleted = false
  const pages = []
  const { state } = fixture(t, {
    getUsersApi: async (query) => {
      pages.push(query.page)
      return { list: deleted && query.page === 2 ? [] : [sample()], total: deleted ? 10 : 11 }
    },
    deleteUserApi: async () => {
      deleted = true
    },
  })
  state.query.page = 2
  await state.loadUsers()
  assert.equal(await state.removeUser(sample('self')), false)
  assert.equal(deleted, false)
  assert.equal(await state.removeUser(sample()), true)
  assert.deepEqual(pages, [2, 2, 1])
  assert.equal(state.query.page, 1)
  assert.equal(state.total.value, 10)
})

test('更新自己同步资料但不把密码写入用户状态', async (t) => {
  const { state, store } = fixture(t)
  assert.equal(await state.saveUser({ ...sample(), password: 'Test1234' }, sample('self')), true)
  assert.equal(store.data.user.userName, '测试用户')
  assert.equal('password' in store.data.user, false)
})

test('未登录不请求数据，关闭窗口后中止请求并忽略迟到响应', async (t) => {
  const request = pending()
  let signal
  let requests = 0
  const { state, store, app } = fixture(t, {
    getUsersApi: (_query, token) => {
      requests++
      signal = token
      return request.promise
    },
  })
  store.setAuthStatus(false)
  await state.loadUsers()
  assert.equal(requests, 0)
  assert.equal(await state.saveUser(sample()), false)
  store.setAuthStatus(true)
  const loading = state.loadUsers()
  app.unmount()
  assert.equal(signal.aborted, true)
  request.resolve({ list: [sample()], total: 1 })
  await loading
  assert.equal(state.users.value.length, 0)
})

test('桌面与应用总览仅向管理员显示控制面板，降权或退出后关闭窗口并阻止重新打开', (t) => {
  const { store } = fixture(t)
  store.setAuthStatus(false)
  const configs = [{ enName: 'Setting' }, { enName: 'ControlPanel', requiresAuth: true, requiresAdmin: true }]
  const { useDesktopWindows } = loadCode(read('src/components/Desktop/useDesktopWindows.ts'), {
    vue: Vue,
  })
  const { descriptor } = parse(read('src/views/Desktop/IndexView.vue'))
  const script = compileScript(descriptor, { id: 'desktop-test' }).content
  const globals = { window: global.window, localStorage: global.localStorage }
  global.window = {
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener() {},
    removeEventListener() {},
  }
  global.localStorage = { removeItem() {} }
  const component = loadCode(script, {
    vue: Vue,
    '@/config/index': configs,
    '@/stores/wallpaper': { useWallpaperStore: () => Vue.reactive({ initialized: false }) },
    '@/stores/userInfo': { useUserInfoStore },
    '@/assets/setting/images/wallpaper/default-wallpaper1.jpg': { default: '' },
    '@/components/Desktop/DesktopSidebar.vue': { default: {} },
    '@/components/Desktop/useDesktopWindows': { useDesktopWindows },
    '@/components/OsWindow/windowBounds': { windowBoundsKey: Symbol() },
  }).default
  let bindings
  const setup = component.setup
  component.setup = (props, context) => {
    bindings = setup(props, context)
    return () => null
  }
  const app = renderer.createApp(component)
  app.mount({})
  t.after(() => {
    app.unmount()
    Object.assign(global, globals)
  })
  assert.equal(bindings.availableApps.value.length, 1)
  bindings.launchApp('ControlPanel')
  assert.equal(bindings.windows.value.length, 0)
  store.setAuthStatus(true)
  store.data.user.role = 'user'
  assert.equal(bindings.availableApps.value.length, 1)
  bindings.openApp(configs[1])
  bindings.launchApp('ControlPanel')
  bindings.activateApp('ControlPanel')
  assert.equal(bindings.windows.value.length, 0)
  store.data.user.role = 'admin'
  assert.equal(bindings.availableApps.value.length, 2)
  bindings.launchApp('ControlPanel')
  assert.equal(bindings.activeApps.value.length, 1)
  store.data.user.role = 'user'
  assert.equal(bindings.windows.value.length, 0)
  assert.equal(bindings.sidebarApps.value.length, 0)
  assert.equal(bindings.availableApps.value.length, 1)
  store.data.user.role = 'admin'
  bindings.launchApp('ControlPanel')
  assert.equal(bindings.activeApps.value.length, 1)
  store.removeUserInfo()
  assert.equal(bindings.availableApps.value.length, 1)
  assert.equal(bindings.windows.value.length, 0)
  bindings.openApp(configs[1])
  bindings.activateApp('ControlPanel')
  assert.equal(bindings.windows.value.length, 0)
})

test('接口层阻止未登录请求，拒绝无效列表响应并编码用户 ID', async (t) => {
  const { store } = fixture(t)
  const calls = []
  let response = { list: [], total: 0 }
  const request = {
    get: async (url, options) => {
      calls.push([url, options])
      return { data: { data: response } }
    },
    post: async (url, data) => {
      calls.push([url, data])
    },
    put: async (url, data) => {
      calls.push([url, data])
    },
    delete: async (url) => {
      calls.push([url])
    },
  }
  const api = loadCode(read('src/server/userManagement.ts'), {
    '@/utils/request': request,
    '@/stores/userInfo': { useUserInfoStore },
  })
  store.setAuthStatus(false)
  for (const action of [
    () => api.getUsersApi({}),
    () => api.createUserApi({}),
    () => api.editUserApi('id', {}),
    () => api.deleteUserApi('id'),
  ]) {
    await assert.rejects(action, /请先登录/)
  }
  assert.equal(calls.length, 0)
  store.setAuthStatus(true)
  for (const action of [
    () => api.getUsersApi({}), () => api.createUserApi({}), () => api.editUserApi('id', {}), () => api.deleteUserApi('id'),
  ]) await assert.rejects(action, /管理员/)
  assert.equal(calls.length, 0)
  store.data.user.role = 'admin'
  assert.deepEqual(await api.getUsersApi({ page: 1 }), response)
  response = { users: [], total: 0 }
  await assert.rejects(() => api.getUsersApi({ page: 1 }), /数据格式/)
  await api.editUserApi('a/b', sample())
  assert.equal(calls.at(-1)[0], '/user/a%2Fb')
})

test('HTTP 401 和业务 401 清除登录状态，403 保留会话', async (t) => {
  const { store } = fixture(t)
  const originalStorage = global.localStorage
  global.localStorage = { removeItem() {} }
  t.after(() => {
    global.localStorage = originalStorage
  })
  let success, failure
  loadCode(read('src/utils/request.ts'), {
    axios: {
      create: () => ({
        interceptors: {
          request: { use() {} },
          response: {
            use(onSuccess, onFailure) {
              success = onSuccess
              failure = onFailure
            },
          },
        },
      }),
    },
    '@/stores/userInfo': { useUserInfoStore },
  })
  await assert.rejects(
    () => failure({ response: { status: 403, data: { message: '无权限' } } }),
    /无权限/,
  )
  assert.equal(store.isAuthenticated, true)
  await assert.rejects(() => failure({ response: { status: 401 } }))
  assert.equal(store.isAuthenticated, false)
  store.data.token = 'test-token'
  store.setAuthStatus(true)
  await assert.rejects(
    () => success({ data: { data: { code: 401, message: '登录过期' } } }),
    /登录过期/,
  )
  assert.equal(store.isAuthenticated, false)
})
