<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue'
import type { ManagedUser, ManagedUserInput } from '@/tsInterface/index'
import { useUserInfoStore } from '@/stores/userInfo'
import { validateEmail, validatePassword, validateUserName } from '@/utils/validation'
import { useUserManagement } from '../useUserManagement'

const props = defineProps<{ active: boolean }>()
const userStore = useUserInfoStore()
const {
  users,
  total,
  loading,
  saving,
  error,
  mutationError,
  message,
  query,
  pageCount,
  loadUsers,
  saveUser,
  removeUser,
} = useUserManagement()
const keyword = ref('')
const status = ref('')
const dialog = ref<HTMLDialogElement>()
const titleId = useId()
const mode = ref<'create' | 'edit' | 'delete'>('create')
const selectedUser = ref<ManagedUser>()
const formError = ref('')
const form = reactive<ManagedUserInput>({
  userName: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active',
  desc: '',
})
const isSelf = computed(() => selectedUser.value?._id === userStore.data.user._id)
const roleName = (value: string) =>
  ({ admin: '管理员', user: '普通用户' })[value] || value || '未设置'
const statusName = (value: string) =>
  ({ active: '正常', disabled: '已禁用' })[value] || value || '未设置'
const formatDate = (value: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('zh-CN')
}

function search() {
  query.keyword = keyword.value.trim()
  query.status = status.value
  query.page = 1
  message.value = ''
  void loadUsers()
}

function changePage(page: number) {
  if (loading.value || page < 1 || page > pageCount.value) return
  query.page = page
  void loadUsers()
}

function openDialog(action: typeof mode.value, user?: ManagedUser) {
  mode.value = action
  selectedUser.value = user
  mutationError.value = ''
  formError.value = ''
  Object.assign(form, {
    userName: user?.userName ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role || 'user',
    status: user?.status || 'active',
    desc: user?.desc ?? '',
  })
  dialog.value?.showModal()
}

function closeDialog() {
  if (!saving.value) dialog.value?.close()
}

async function submit() {
  if (saving.value) return
  if (mode.value === 'delete') {
    if (selectedUser.value && (await removeUser(selectedUser.value))) dialog.value?.close()
    return
  }
  formError.value =
    validateUserName(form.userName) ||
    validateEmail(form.email) ||
    (mode.value === 'create' || form.password ? validatePassword(form.password ?? '') : '')
  if (formError.value) return
  const data: ManagedUserInput = {
    userName: form.userName,
    email: form.email.trim(),
    role: form.role,
    status: form.status,
    desc: form.desc.trim(),
  }
  if (form.password) data.password = form.password
  if (await saveUser(data, selectedUser.value)) dialog.value?.close()
}

watch(
  () => props.active,
  (active) => {
    if (!active) dialog.value?.close()
  },
)
onMounted(loadUsers)
onBeforeUnmount(() => dialog.value?.close())
</script>

<template>
  <section class="users" aria-label="用户管理">
    <header class="users__header">
      <div>
        <p class="users__breadcrumb">控制面板 / 用户管理</p>
        <h1>用户管理</h1>
        <p class="users__description">查看和维护用户账号、角色与状态</p>
      </div>
      <button class="primary-button" type="button" :disabled="saving" @click="openDialog('create')">
        <span aria-hidden="true">＋</span> 新增用户
      </button>
    </header>

    <form class="users__toolbar" role="search" @submit.prevent="search">
      <input
        v-model="keyword"
        type="search"
        placeholder="搜索用户名或邮箱"
        aria-label="搜索用户名或邮箱"
      />
      <select v-model="status" aria-label="按用户状态筛选">
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="disabled">已禁用</option>
      </select>
      <button class="secondary-button" type="submit" :disabled="saving">搜索</button>
      <button
        class="secondary-button"
        type="button"
        :disabled="loading || saving"
        @click="loadUsers"
      >
        刷新
      </button>
    </form>

    <p v-if="message" class="users__notice" role="status">{{ message }}</p>
    <div class="users__table-wrap" :aria-busy="loading">
      <table>
        <caption class="sr-only">
          用户列表
        </caption>
        <thead>
          <tr>
            <th scope="col">用户</th>
            <th scope="col">角色</th>
            <th scope="col">状态</th>
            <th scope="col">注册时间</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id">
            <td>
              <div class="user-identity">
                <span class="user-avatar" aria-hidden="true">{{
                  (user.userName || user.email || '?').slice(0, 1).toUpperCase()
                }}</span>
                <div>
                  <strong>{{ user.userName || '未命名用户' }}</strong>
                  <span v-if="user._id === userStore.data.user._id" class="self-badge">我</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
              </div>
            </td>
            <td>{{ roleName(user.role) }}</td>
            <td>
              <span
                class="status-badge"
                :class="{ 'status-badge--active': user.status === 'active' }"
                >{{ statusName(user.status) }}</span
              >
            </td>
            <td class="user-date">{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="row-actions">
                <button
                  type="button"
                  :disabled="saving"
                  :aria-label="`编辑用户 ${user.userName}`"
                  @click="openDialog('edit', user)"
                >
                  编辑
                </button>
                <button
                  class="danger-text"
                  type="button"
                  :disabled="saving || user._id === userStore.data.user._id"
                  :title="user._id === userStore.data.user._id ? '不能删除当前登录账号' : undefined"
                  :aria-label="`删除用户 ${user.userName}`"
                  @click="openDialog('delete', user)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="users__empty" role="status">
        <span class="loading-ring" />正在加载用户…
      </div>
      <div v-else-if="error" class="users__empty" role="alert">
        <strong>暂时无法加载用户</strong>
        <p>{{ error }}</p>
        <button class="secondary-button" type="button" @click="loadUsers">重新加载</button>
      </div>
      <div v-else-if="!users.length" class="users__empty" role="status">
        <span class="empty-icon" aria-hidden="true">♙</span>
        <strong>{{ query.keyword || query.status ? '未找到符合条件的用户' : '暂无用户' }}</strong>
        <p>
          {{
            query.keyword || query.status
              ? '试试其他关键词或筛选条件'
              : '点击「新增用户」创建第一个账号'
          }}
        </p>
      </div>
    </div>

    <footer class="users__pagination">
      <span>{{ loading ? '正在加载…' : error ? '加载失败' : `共 ${total} 位用户` }}</span>
      <div>
        <button
          class="secondary-button"
          type="button"
          :disabled="loading || saving || !!error || query.page <= 1"
          @click="changePage(query.page - 1)"
        >
          上一页
        </button>
        <span>{{ query.page }} / {{ pageCount }}</span>
        <button
          class="secondary-button"
          type="button"
          :disabled="loading || saving || !!error || query.page >= pageCount"
          @click="changePage(query.page + 1)"
        >
          下一页
        </button>
      </div>
    </footer>

    <dialog
      ref="dialog"
      class="user-dialog"
      :aria-labelledby="titleId"
      @cancel.prevent="closeDialog"
    >
      <form novalidate @submit.prevent="submit">
        <header class="user-dialog__header">
          <h2 :id="titleId">
            {{ mode === 'delete' ? '删除用户' : mode === 'edit' ? '编辑用户' : '新增用户' }}
          </h2>
        </header>
        <div v-if="mode === 'delete'" class="user-dialog__body">
          <p>确定删除用户「{{ selectedUser?.userName || selectedUser?.email }}」吗？</p>
          <p class="delete-hint">删除后将无法恢复，请确认后再操作。</p>
        </div>
        <div v-else class="user-dialog__body user-form">
          <label
            >用户名 <span class="required">*</span
            ><input
              v-model="form.userName"
              name="userName"
              autocomplete="off"
              required
              autofocus
              :disabled="saving"
          /></label>
          <label
            >邮箱 <span class="required">*</span
            ><input
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="off"
              required
              :disabled="saving"
          /></label>
          <label
            >{{ mode === 'edit' ? '重置密码' : '初始密码' }}
            <span v-if="mode === 'create'" class="required">*</span
            ><input
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="new-password"
              :placeholder="mode === 'edit' ? '留空则保留原密码' : '至少 4 个字符'"
              :required="mode === 'create'"
              :disabled="saving"
          /></label>
          <div class="user-form__row">
            <label
              >角色<select v-model="form.role" :disabled="saving || isSelf">
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
                <option v-if="!['user', 'admin'].includes(form.role)" :value="form.role">
                  {{ form.role }}
                </option>
              </select></label
            >
            <label
              >状态<select v-model="form.status" :disabled="saving || isSelf">
                <option value="active">正常</option>
                <option value="disabled">已禁用</option>
                <option v-if="!['active', 'disabled'].includes(form.status)" :value="form.status">
                  {{ form.status }}
                </option>
              </select></label
            >
          </div>
          <p v-if="isSelf" class="user-form__hint">当前登录账号的角色和状态不可在此修改。</p>
          <label
            >简介<textarea
              v-model="form.desc"
              name="desc"
              rows="3"
              maxlength="500"
              :disabled="saving"
            />
          </label>
        </div>
        <p v-if="formError || mutationError" class="user-dialog__error" role="alert">
          {{ formError || mutationError }}
        </p>
        <footer class="user-dialog__footer">
          <button class="secondary-button" type="button" :disabled="saving" @click="closeDialog">
            取消
          </button>
          <button
            :class="mode === 'delete' ? 'danger-button' : 'primary-button'"
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
.users {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 18px;
  padding: 12px 12px 4px;
  color: var(--app-window-color);
  font-size: 13px;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  &__breadcrumb {
    margin-bottom: 12px;
    font-size: 11px;
    opacity: 0.5;
  }
  h1 {
    font-size: 24px;
    font-weight: 650;
    letter-spacing: -0.5px;
  }
  &__description {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.55;
  }
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  &__toolbar > input {
    flex: 1 1 160px;
    width: 100px;
  }
  &__toolbar > select {
    width: 112px;
  }
  &__notice {
    padding: 9px 12px;
    border-radius: 8px;
    background: #21865718;
    color: #218657;
  }
  &__table-wrap {
    flex: 1;
    overflow-x: auto;
    border: 1px solid #8883;
    border-radius: 10px;
  }
  &__empty {
    display: flex;
    min-height: 190px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
    padding: 24px;
    text-align: center;
  }
  &__empty > p {
    max-width: 420px;
    font-size: 12px;
    opacity: 0.6;
    overflow-wrap: anywhere;
  }
  &__pagination {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
  }
  &__pagination > span {
    opacity: 0.55;
  }
  &__pagination > div {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

button {
  cursor: pointer;
  transition: background-color 120ms;
}
button:disabled {
  cursor: default;
  opacity: 0.4;
}
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #0067c0;
  outline-offset: 2px;
}
.primary-button,
.secondary-button,
.danger-button {
  min-height: 34px;
  padding: 6px 13px;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 12px;
  white-space: nowrap;
}
.primary-button {
  background: #0067c0;
  color: white;
}
.primary-button:hover:enabled {
  background: #005aa8;
}
.danger-button {
  background: #c73838;
  color: white;
}
.danger-button:hover:enabled {
  background: #ad2929;
}
.secondary-button {
  border-color: #8884;
  background: var(--app-window-background-color);
  color: inherit;
}
.secondary-button:hover:enabled {
  background: var(--app-window-header-option-bg);
}
input,
select,
textarea {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #8885;
  border-radius: 7px;
  background: var(--app-window-background-color);
  color: inherit;
  font-size: 12px;
}
input:disabled,
select:disabled,
textarea:disabled {
  opacity: 0.6;
}
table {
  width: 100%;
  min-width: 590px;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}
th {
  padding: 11px 14px;
  background: var(--app-window-header-option-bg);
  font-weight: 500;
  white-space: nowrap;
}
td {
  padding: 14px;
  border-top: 1px solid #8882;
}
tbody tr:hover {
  background: #88888808;
}
.user-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 260px;
}
.user-identity > div {
  min-width: 0;
}
.user-identity strong {
  font-size: 12px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.user-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #0067c01a;
  color: #2b83d0;
  font-size: 15px;
  font-weight: 600;
}
.user-email {
  display: block;
  margin-top: 3px;
  opacity: 0.55;
  overflow-wrap: anywhere;
  font-size: 11px;
}
.self-badge {
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #8882;
  font-size: 10px;
}
.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 5px;
  background: #8882;
  white-space: nowrap;
}
.status-badge--active {
  background: #21865718;
  color: #26955e;
}
.user-date {
  white-space: nowrap;
  opacity: 0.65;
}
.row-actions {
  display: flex;
  gap: 12px;
  white-space: nowrap;
}
.row-actions button {
  padding: 2px 0;
  border: none;
  background: transparent;
  color: #2b83d0;
  font-size: 12px;
}
.row-actions .danger-text {
  color: #d34b4b;
}
.empty-icon {
  font-size: 32px;
  opacity: 0.3;
}
.loading-ring {
  width: 22px;
  height: 22px;
  border: 2px solid #8883;
  border-top-color: #0067c0;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .loading-ring {
    animation: none;
  }
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.user-dialog {
  position: fixed;
  inset: 0;
  width: min(440px, calc(100vw - 32px));
  max-height: calc(100dvh - 40px);
  margin: auto;
  padding: 0;
  overflow-y: auto;
  border: 1px solid #8884;
  border-radius: 14px;
  background: var(--app-window-background-color);
  color: var(--app-window-color);
  box-shadow: 0 24px 80px #0004;
  font-size: 13px;

  &::backdrop {
    background: #0005;
  }
  &__header {
    padding: 22px 24px 16px;
  }
  h2 {
    font-size: 19px;
  }
  &__body {
    padding: 0 24px 20px;
  }
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #8883;
  }
  &__error {
    margin: 0 24px 16px;
    color: #d34b4b;
    font-size: 12px;
  }
}
.user-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  label {
    display: block;
    font-size: 12px;
  }
  input,
  select,
  textarea {
    display: block;
    width: 100%;
    margin-top: 6px;
  }
  textarea {
    resize: vertical;
  }
  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  &__hint {
    font-size: 11px;
    opacity: 0.6;
  }
}
.required {
  color: #d34b4b;
}
.delete-hint {
  margin-top: 12px;
  opacity: 0.6;
  font-size: 12px;
}
</style>
