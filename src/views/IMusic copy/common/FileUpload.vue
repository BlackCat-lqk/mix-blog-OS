<template>
  <div>
    <button type="button" class="input-file" @click="handleClick">选择文件</button>
    <input ref="fileInput" type="file" style="display: none" @change="handleFileChange" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const fileInput = ref<HTMLInputElement | null>(null)

interface Emits {
  (e: 'file-selected', file: File): void
}

const emit = defineEmits<Emits>()

const handleClick = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  if (file != null && file != undefined) {
    emit('file-selected', file)
  }
}
</script>
<style lang="scss" scoped>
.input-file {
  background-color: #1a261e;
  padding: 5px 10px;
  border-radius: 5px;
  border: unset;
  color: #fff;
}
</style>
