<script lang="ts">
export interface WindowSidebarItem {
  id: string
  name: string
  icon: string
}
</script>

<script setup lang="ts">
withDefaults(defineProps<{ items: readonly WindowSidebarItem[]; label?: string }>(), {
  label: '应用导航',
})
const selected = defineModel<string>({ required: true })
</script>

<template>
  <aside class="window-sidebar">
    <div v-if="$slots.header" class="window-sidebar__header">
      <slot name="header" />
    </div>
    <nav class="window-sidebar__menu" :aria-label="label">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="window-sidebar__item"
        :class="{ 'window-sidebar__item--active': selected === item.id }"
        :aria-current="selected === item.id ? 'page' : undefined"
        @click="selected = item.id"
      >
        <img :src="item.icon" alt="" />
        <span>{{ item.name }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.window-sidebar {
  display: flex;
  flex: 0 0 160px;
  flex-direction: column;
  min-height: 0;

  &__header {
    flex-shrink: 0;
  }

  &__menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    overflow-y: auto;
  }

  &__item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px 10px 10px 5px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;

    &:hover,
    &--active {
      background: #FFFFFF;
      color: #0066ff;
    }

    &:focus-visible {
      outline: 2px solid #0066ff;
      outline-offset: -2px;
      color: #0066ff;
    }

    &--active::before {
      content: '';
      position: absolute;
      top: 25%;
      left: 0;
      width: 3px;
      height: 50%;
      border-radius: 8px;
      background: #0066ff;
    }

    img {
      width: 18px;
    }

    span {
      font-size: 14px;
      font-weight: 400;
    }
  }
}
</style>
