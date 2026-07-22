<template>
  <Transition name="slide-down">
    <div v-if="visible" class="site-form">
      <h4 class="site-form__title">添加站点</h4>

      <div class="site-form__field">
        <label class="site-form__label">分类名称 <span class="required">*</span></label>
        <input
          v-model="form.secondaryCategory"
          class="site-form__input"
          maxlength="10"
          placeholder="例如：前端工具"
        />
        <span class="site-form__count">{{ form.secondaryCategory.length }}/10</span>
      </div>

      <div class="site-form__field">
        <label class="site-form__label">URL <span class="required">*</span></label>
        <input
          v-model="form.link"
          class="site-form__input"
          placeholder="https://..."
        />
      </div>

      <div class="site-form__field">
        <label class="site-form__label">名称 <span class="required">*</span></label>
        <input
          v-model="form.siteName"
          class="site-form__input"
          maxlength="30"
          placeholder="站点名称"
        />
        <span class="site-form__count">{{ form.siteName.length }}/30</span>
      </div>

      <div class="site-form__field">
        <label class="site-form__label">描述</label>
        <input
          v-model="form.desc"
          class="site-form__input"
          maxlength="500"
          placeholder="简短描述..."
        />
        <span class="site-form__count">{{ form.desc.length }}/500</span>
      </div>

      <div class="site-form__actions">
        <button class="btn btn--primary" :disabled="submitting" @click="handleSubmit">
          <span v-if="submitting" class="btn-spinner"></span>
          {{ submitting ? '创建中...' : '确认' }}
        </button>
        <button class="btn btn--cancel" @click="$emit('cancel')">取消</button>
      </div>

      <p v-if="errorMsg" class="site-form__error">{{ errorMsg }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

export interface SiteFormData {
  secondaryCategory: string
  link: string
  siteName: string
  desc: string
}

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  submit: [data: SiteFormData]
  cancel: []
}>()

const form = reactive<SiteFormData>({
  secondaryCategory: '',
  link: '',
  siteName: '',
  desc: '',
})

const submitting = ref(false)
const errorMsg = ref('')

function validate(): string | null {
  if (!form.secondaryCategory.trim()) return '请输入分类名称'
  if (!form.link.trim()) return '请输入 URL 链接'
  if (!form.siteName.trim()) return '请输入站点名称'
  return null
}

async function handleSubmit() {
  errorMsg.value = ''
  const err = validate()
  if (err) {
    errorMsg.value = err
    return
  }

  submitting.value = true
  // 模拟异步提交
  await new Promise((r) => setTimeout(r, 600))
  emit('submit', { ...form })
  submitting.value = false

  // 重置表单
  form.secondaryCategory = ''
  form.link = ''
  form.siteName = ''
  form.desc = ''
}
</script>

<style lang="scss" scoped>
.site-form {
  background: #f8fafc;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #475569;

    .required {
      color: #ef4444;
    }
  }

  &__input {
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: #1e293b;
    outline: none;
    transition: border-color 0.15s;
    font-family: inherit;

    &:focus {
      border-color: #0078d4;
      box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  &__count {
    position: absolute;
    right: 8px;
    bottom: 8px;
    font-size: 11px;
    color: #9ca3af;
    pointer-events: none;
    background: #fff;
    padding: 0 4px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    padding-top: 4px;
  }

  &__error {
    color: #ef4444;
    font-size: 13px;
    margin: 0;
  }
}

.btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;

  &--primary {
    background: #0078d4;
    color: #fff;

    &:hover:not(:disabled) {
      background: #0066b3;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &--cancel {
    background: #f1f5f9;
    color: #475569;

    &:hover {
      background: #e2e8f0;
    }
  }
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: -2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ---------- transitions ----------
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
