<script setup lang="ts">
defineProps<{ name: string }>()

const paths: Record<string, string> = {
  play: 'm9 5 11 7-11 7V5Z',
  pause: 'M8 5v14M16 5v14',
  previous: 'M5 5v14M19 5 8 12l11 7V5Z',
  next: 'M19 5v14M5 5l11 7-11 7V5Z',
  loop: 'm17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3',
  single: 'm17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3m8-8 1-1v6',
  shuffle:
    'm17 3 4 4-4 4m0 2 4 4-4 4M3 7h3c5 0 7 10 12 10h3M3 17h3c2 0 3.5-2 5-4m2-2c1.5-2 3-4 5-4h3',
  music:
    'M9 18V5l12-3v13M9 9l12-3M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-3a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z',
  search: 'M21 21l-5-5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  plus: 'M12 5v14M5 12h14',
  volume: 'm11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  cloud: 'M7 18a5 5 0 0 1-1-9.9A6 6 0 0 1 17.5 7 5.5 5.5 0 0 1 18 18H7Z',
}
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>

<style scoped>
svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>
