<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppWindowProps } from '@/tsInterface/index'
import OsWindow from '@/components/OsWindow/index.vue'
import { albums, media } from './data'

withDefaults(defineProps<AppWindowProps>(), {
  title: '图库',
  visible: true,
})
const minimized = defineModel<boolean>('minimized', { default: false })
const emit = defineEmits<{ activate: []; close: [] }>()
const query = ref('')
const selectedAlbumId = ref<string | null>(null)
const filteredAlbums = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase()
  return albums.filter((album) => album.name.toLocaleLowerCase().includes(keyword))
})
const selectedAlbum = computed(() => albums.find((album) => album.id === selectedAlbumId.value))
const displayedMedia = computed(() => selectedAlbumId.value === null
  ? media
  : media.filter((item) => item.albumId === selectedAlbumId.value),
)
const albumCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const item of media) counts.set(item.albumId, (counts.get(item.albumId) ?? 0) + 1)
  return counts
})

const selectSearchResult = (event: KeyboardEvent) => {
  if (event.isComposing) return
  const firstAlbum = filteredAlbums.value[0]
  if (firstAlbum) selectedAlbumId.value = firstAlbum.id
}
</script>

<template>
  <OsWindow
    v-model:minimized="minimized"
    :title="title"
    :icon="icon"
    :minimize-target="minimizeTarget"
    :visible="visible"
    @activate="emit('activate')"
    @close="emit('close')"
  >
    <template #sidebar>
      <aside class="gallery-sidebar" aria-label="图库导航">
        <label class="gallery-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            v-model="query"
            type="search"
            placeholder="搜索相册"
            aria-label="搜索相册"
            autocomplete="off"
            @keydown.enter="selectSearchResult"
          />
        </label>

        <button
          class="library-button"
          :class="{ 'library-button--active': selectedAlbumId === null }"
          type="button"
          :aria-current="selectedAlbumId === null ? 'page' : undefined"
          @click="selectedAlbumId = null"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Library</span>
          <span class="gallery-count">{{ media.length }}</span>
        </button>

        <h2 class="gallery-sidebar__heading">Albums</h2>
        <nav class="album-list" aria-label="Albums 分类">
          <button
            v-for="album in filteredAlbums"
            :key="album.id"
            type="button"
            class="album-button"
            :class="{ 'album-button--active': selectedAlbumId === album.id }"
            :aria-current="selectedAlbumId === album.id ? 'page' : undefined"
            @click="selectedAlbumId = album.id"
          >
            <img :src="album.thumbnail" alt="" width="40" height="40" decoding="async" />
            <span class="album-button__name" :title="album.name">{{ album.name }}</span>
            <span class="gallery-count">{{ albumCounts.get(album.id) ?? 0 }}</span>
          </button>
          <p v-if="!filteredAlbums.length" class="gallery-sidebar__empty" role="status">
            未找到相册
          </p>
        </nav>
      </aside>
    </template>

    <section :key="selectedAlbumId ?? 'library'" class="gallery-content" aria-label="媒体展示">
      <header class="gallery-content__header">
        <div>
          <h1>{{ selectedAlbum?.name ?? 'Library' }}</h1>
          <p>{{ selectedAlbum ? '浏览相册中的图片与媒体' : '全部图片与媒体' }}</p>
        </div>
        <span class="gallery-content__count">{{ displayedMedia.length }} 项媒体</span>
      </header>

      <div class="media-grid">
        <figure v-for="item in displayedMedia" :key="item.id" class="media-item">
          <a
            v-if="item.type === 'image'"
            class="media-item__image"
            :href="item.src"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`查看原图：${item.title}`"
          >
            <img :src="item.thumbnail" :alt="item.title" loading="lazy" decoding="async" />
          </a>
          <video
            v-else
            class="media-item__video"
            :src="item.src"
            :poster="item.thumbnail"
            :aria-label="item.title"
            controls
            playsinline
            preload="none"
          />
          <figcaption :title="item.title">{{ item.title }}</figcaption>
        </figure>
      </div>
      <p v-if="!displayedMedia.length" class="gallery-content__empty" role="status">
        这个相册还没有图片或媒体
      </p>
    </section>
  </OsWindow>
</template>

<style scoped lang="scss">
.gallery-sidebar {
  display: flex;
  flex: 0 0 clamp(128px, 24%, 216px);
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  gap: 16px;
  padding: 14px 4px 8px;
  color: var(--app-window-color);

  &__heading {
    padding: 4px 10px 0;
    font-size: 12px;
    font-weight: 600;
    opacity: 0.6;
  }

  &__empty {
    padding: 12px 10px;
    font-size: 12px;
    opacity: 0.65;
  }
}

.gallery-search {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid #b8bec780;
  border-radius: 8px;
  background: var(--app-window-header-option-bg);

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.55;
  }

  input {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font-size: 12px;
  }

  &:focus-within {
    outline: 2px solid #0067c0;
    outline-offset: -1px;
  }
}

.library-button,
.album-button {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 0;
  border-radius: 9px;
  color: inherit;
  background: transparent;
  text-align: left;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: var(--app-window-header-option-bg);
  }

  &--active,
  &--active:hover {
    color: #005cc8;
    background: #e5efff;
  }

  &:focus-visible {
    outline: 2px solid #0067c0;
    outline-offset: -2px;
  }
}

.library-button {
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
}

.gallery-count {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.6;
}

.album-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.album-button {
  gap: 8px;
  padding: 8px;

  img {
    width: clamp(24px, 4vw, 40px);
    height: clamp(24px, 4vw, 40px);
    flex-shrink: 0;
    border-radius: 6px;
    object-fit: cover;
  }

  &__name {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.gallery-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
  scrollbar-width: thin;
  color: #1e293b;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;

    h1 {
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin-top: 4px;
      color: #64748b;
      font-size: 12px;
    }
  }

  &__count,
  &__empty {
    color: #64748b;
    font-size: 12px;
  }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  gap: 20px 16px;
}

.media-item {
  min-width: 0;

  &__image,
  &__video {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 10px;
    overflow: hidden;
    background: #f1f5f9;
  }

  &__image {
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover {
      outline: 2px solid #93b8ed;
      outline-offset: 2px;
    }

    &:focus-visible {
      outline: 2px solid #0067c0;
      outline-offset: 2px;
    }
  }

  &__video {
    object-fit: contain;
  }

  figcaption {
    margin-top: 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 12px;
  }
}
</style>
