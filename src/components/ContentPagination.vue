<script setup lang="ts">
defineProps<{ page: number; pageCount: number; total: number; disabled?: boolean }>()
const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <footer class="content-pagination" aria-label="列表分页">
    <span>共 {{ total }} 项</span>
    <div>
      <button type="button" :disabled="disabled || page <= 1" @click="emit('change', page - 1)">
        上一页
      </button>
      <span>{{ page }} / {{ pageCount }}</span>
      <button
        type="button"
        :disabled="disabled || page >= pageCount"
        @click="emit('change', page + 1)"
      >
        下一页
      </button>
    </div>
  </footer>
</template>

<style scoped>
.content-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0 4px;
  font-size: 12px;
}
.content-pagination > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
button {
  padding: 6px 10px;
  border: 1px solid #8884;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
button:focus-visible {
  outline: 2px solid #0067c0;
  outline-offset: 2px;
}
</style>
