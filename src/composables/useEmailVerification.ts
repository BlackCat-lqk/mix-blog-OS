import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { sendRegistrationCodeApi } from '@/server/user'
import { validateEmail } from '@/utils/validation'

export function useEmailVerification(email: Readonly<Ref<string>>) {
  const normalizedEmail = computed(() => email.value.trim().toLowerCase())
  const now = ref(Date.now())
  const expiresAt = ref(0)
  const sending = ref(false)
  const error = ref('')
  const message = ref('')
  const remaining = computed(() => Math.max(0, Math.ceil((expiresAt.value - now.value) / 1000)))
  const key = (address: string) => `registration-code-cooldown:${address}`
  let controller: AbortController | undefined
  let disposed = false
  const readCooldown = () => {
    now.value = Date.now()
    try {
      const value = Number(localStorage.getItem(key(normalizedEmail.value)))
      expiresAt.value = Number.isFinite(value) ? value : 0
    } catch {
      expiresAt.value = 0
    }
  }
  const cooldown = (address: string, seconds: number) => {
    const deadline = Date.now() + seconds * 1000
    try {
      localStorage.setItem(key(address), String(deadline))
    } catch {
      /* Storage may be unavailable. */
    }
    if (normalizedEmail.value === address) {
      now.value = Date.now()
      expiresAt.value = deadline
    }
  }
  watch(
    normalizedEmail,
    () => {
      readCooldown()
      error.value = ''
      message.value = ''
    },
    { immediate: true },
  )
  const timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  const onStorage = (event: StorageEvent) => {
    if (event.key === key(normalizedEmail.value) || event.key === null) readCooldown()
  }
  window.addEventListener('storage', onStorage)

  async function send() {
    if (sending.value || disposed) return
    now.value = Date.now()
    if (remaining.value > 0) return
    error.value = validateEmail(email.value)
    message.value = ''
    if (error.value) return
    const address = normalizedEmail.value
    controller = new AbortController()
    const current = controller
    sending.value = true
    try {
      const result = await sendRegistrationCodeApi(address, current.signal)
      if (disposed || current.signal.aborted) return
      cooldown(address, Math.max(60, result.retryAfter))
      if (address === normalizedEmail.value)
        message.value = '验证码已发送，请检查邮箱，有效期为 10 分钟。'
    } catch (cause) {
      if (disposed || current.signal.aborted) return
      const retryAfter = (cause as { retryAfter?: number })?.retryAfter
      if (typeof retryAfter === 'number' && retryAfter > 0) cooldown(address, retryAfter)
      if (address === normalizedEmail.value)
        error.value = cause instanceof Error ? cause.message : '验证码发送失败，请重试'
    } finally {
      if (controller === current) sending.value = false
    }
  }
  function cancel() {
    controller?.abort()
    sending.value = false
    error.value = ''
    message.value = ''
  }
  onBeforeUnmount(() => {
    disposed = true
    cancel()
    clearInterval(timer)
    window.removeEventListener('storage', onStorage)
  })
  return { sending, remaining, error, message, send, cancel }
}
