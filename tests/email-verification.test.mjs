import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as validation from '../src/utils/validation.ts'

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
function load(source, imports) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInThisContext(`(function(require,module,exports){\n${output}\n})`)(
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
const renderer = Vue.createRenderer({
  createComment: () => ({}),
  insert() {},
  remove() {},
  parentNode: () => null,
  nextSibling: () => null,
})
const success = { retryAfter: 60, expiresIn: 600 }

function fixture(t, send = async () => success) {
  const original = { window: global.window, localStorage: global.localStorage }
  const storage = new Map(),
    listeners = new Map()
  const beforeCleanup = []
  global.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
  global.window = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name) => listeners.delete(name),
  }
  t.mock.timers.enable({ apis: ['Date', 'setInterval'], now: 100000 })
  const email = Vue.ref('test@example.com')
  const { useEmailVerification } = load(read('src/composables/useEmailVerification.ts'), {
    vue: Vue,
    '@/server/user': { sendRegistrationCodeApi: send },
    '@/utils/validation': validation,
  })
  let state, app
  const mount = () => {
    app?.unmount()
    app = renderer.createApp({
      setup() {
        state = useEmailVerification(email)
        return () => null
      },
    })
    app.mount({})
    return state
  }
  mount()
  t.after(() => {
    beforeCleanup.forEach((callback) => callback())
    app.unmount()
    t.mock.timers.reset()
    global.window = original.window
    global.localStorage = original.localStorage
  })
  return {
    email,
    state,
    mount,
    storage,
    listeners,
    useEmailVerification,
    beforeCleanup: (callback) => beforeCleanup.push(callback),
    unmount: () => app.unmount(),
  }
}

test('邮箱校验通过后才发送，发送中与60秒冷却期间阻止重复请求', async (t) => {
  const response = pending(),
    calls = []
  const f = fixture(t, (email, signal) => {
    calls.push({ email, signal })
    return response.promise
  })
  f.email.value = 'bad'
  await Vue.nextTick()
  await f.state.send()
  assert.equal(calls.length, 0)
  assert.match(f.state.error.value, /邮箱/)
  f.email.value = ' Test@Example.COM '
  await Vue.nextTick()
  const first = f.state.send()
  await f.state.send()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].email, 'test@example.com')
  assert.equal(f.state.sending.value, true)
  response.resolve(success)
  await first
  assert.equal(f.state.remaining.value, 60)
  assert.match(f.state.message.value, /已发送/)
  await f.state.send()
  assert.equal(calls.length, 1)
  t.mock.timers.tick(59000)
  assert.equal(f.state.remaining.value, 1)
  t.mock.timers.tick(1000)
  assert.equal(f.state.remaining.value, 0)
  await f.state.send()
  assert.equal(calls.length, 2)
})

test('冷却按邮箱保存，切换邮箱、重建页面和其他标签页同步都不会重置倒计时', async (t) => {
  const f = fixture(t)
  await f.state.send()
  t.mock.timers.tick(10000)
  f.email.value = 'other@example.com'
  await Vue.nextTick()
  assert.equal(f.state.remaining.value, 0)
  await f.state.send()
  assert.equal(f.state.remaining.value, 60)
  f.email.value = 'test@example.com'
  await Vue.nextTick()
  assert.equal(f.state.remaining.value, 50)
  const restored = f.mount()
  assert.equal(restored.remaining.value, 50)
  const key = 'registration-code-cooldown:test@example.com'
  f.storage.set(key, String(Date.now() + 25000))
  f.listeners.get('storage')({ key })
  assert.equal(restored.remaining.value, 25)
  f.unmount()
  assert.equal(f.listeners.size, 0)
})

test('服务器429恢复真实冷却，邮件发送失败保留重试能力', async (t) => {
  let limited = true
  const f = fixture(t, async () => {
    if (limited) throw Object.assign(new Error('请在27秒后重发'), { retryAfter: 27 })
    throw new Error('邮件发送失败')
  })
  await f.state.send()
  assert.equal(f.state.remaining.value, 27)
  assert.match(f.state.error.value, /27/)
  t.mock.timers.tick(27000)
  limited = false
  await f.state.send()
  assert.equal(f.state.remaining.value, 0)
  assert.equal(f.state.sending.value, false)
  assert.equal(f.state.error.value, '邮件发送失败')
})

test('发送期间切换邮箱只更新原邮箱冷却，不显示过期结果', async (t) => {
  const response = pending()
  const f = fixture(t, () => response.promise)
  const sending = f.state.send()
  f.email.value = 'other@example.com'
  await Vue.nextTick()
  response.resolve(success)
  await sending
  assert.equal(f.state.remaining.value, 0)
  assert.equal(f.state.message.value, '')
  f.email.value = 'test@example.com'
  await Vue.nextTick()
  assert.equal(f.state.remaining.value, 60)
})

test('关闭页面中止请求，取消后较早响应不会修改新请求状态', async (t) => {
  const first = pending(),
    second = pending()
  const signals = []
  const f = fixture(t, (_email, signal) => {
    signals.push(signal)
    return signals.length === 1 ? first.promise : second.promise
  })
  const old = f.state.send()
  f.state.cancel()
  assert.equal(signals[0].aborted, true)
  const current = f.state.send()
  first.resolve(success)
  await old
  assert.equal(f.state.sending.value, true)
  assert.equal(f.state.remaining.value, 0)
  f.unmount()
  assert.equal(signals[1].aborted, true)
  second.resolve(success)
  await current
  assert.equal(f.state.message.value, '')
})

test('验证码请求使用专用接口并且注册请求携带六位字符串', async () => {
  const calls = []
  const request = {
    post: async (...args) => {
      calls.push(args)
      return { data: { data: success } }
    },
  }
  const api = load(read('src/server/user.ts'), { '@/utils/request': request })
  const controller = new AbortController()
  assert.deepEqual(
    await api.sendRegistrationCodeApi('test@example.com', controller.signal),
    success,
  )
  assert.deepEqual(calls[0], [
    '/user/register-code',
    { email: 'test@example.com' },
    { signal: controller.signal },
  ])
  await api.registerUserApi({
    email: 'test@example.com',
    userName: '用户',
    password: 'pass',
    verificationCode: '000001',
  })
  assert.equal(calls[1][0], '/user/register')
  assert.equal(calls[1][1].verificationCode, '000001')
})

test('注册表单必须填写邮箱验证码，错误时保留输入，成功后返回登录', async (t) => {
  const f = fixture(t)
  const calls = []
  let fail = true
  const { descriptor } = parse(read('src/views/Login/IndexView.vue'))
  const imports = {
    vue: Vue,
    '@/stores/userInfo.ts': { useUserInfoStore: () => ({ removeUserInfo() {} }) },
    '@/server/user.ts': {
      registerUserApi: async (body) => {
        calls.push(body)
        if (fail) throw new Error('邮箱验证码错误')
        return { data: { code: 200 } }
      },
    },
    '@/composables/useEmailVerification': { useEmailVerification: f.useEmailVerification },
    '@/utils/validation': validation,
  }
  for (const name of [
    '@/assets/icons/logo-light.svg',
    '@/assets/icons/user.png',
    '@/assets/icons/password.png',
    '@/assets/icons/email.png',
    './components/LoginInput.vue',
    '@/assets/icons/close-light.svg',
  ])
    imports[name] = {}
  const component = load(
    compileScript(descriptor, { id: 'register-test' }).content,
    imports,
  ).default
  let state
  const setup = component.setup
  component.setup = (props, context) => {
    state = setup(props, context)
    return () => null
  }
  const app = renderer.createApp(component, { visible: true })
  app.mount({})
  f.beforeCleanup(() => app.unmount())
  state.isRegister.value = true
  Object.assign(state.form, {
    email: ' Test@Example.com ',
    userName: '测试用户',
    password: 'Test123!',
  })
  await Vue.nextTick()
  await state.handleSubmit()
  assert.equal(calls.length, 0)
  assert.match(state.errors.verificationCode, /邮箱验证码/)
  state.form.verificationCode = '000001'
  await state.handleSubmit()
  assert.equal(calls[0].verificationCode, '000001')
  assert.equal(state.form.verificationCode, '000001')
  assert.equal(state.submitError.value, '邮箱验证码错误')
  fail = false
  await state.handleSubmit()
  assert.equal(state.isRegister.value, false)
  assert.equal(state.form.verificationCode, '')
  assert.equal(state.successMessage.value, '注册成功，请登录')
})
