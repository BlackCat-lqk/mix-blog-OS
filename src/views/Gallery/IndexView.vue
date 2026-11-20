<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AppWindowProps, ManagedAlbum } from '@/tsInterface/index'
import OsWindow from '@/components/OsWindow/index.vue'
import ContentPagination from '@/components/ContentPagination.vue'
import { getAllContent } from '@/server/content'
import { useContentList } from '@/composables/useContentList'

withDefaults(defineProps<AppWindowProps>(), {
  title: '图库',
  visible: true,
})
const minimized = defineModel<boolean>('minimized', { default: false })
const emit = defineEmits<{ activate: []; close: [] }>()
const query = ref('')
const keyword = ref('')
const mediaType = ref('')
const albums = ref<ManagedAlbum[]>([])
const albumsLoading = ref(false)
const albumsError = ref('')
const { items: displayedMedia, total, loading, error, query: mediaQuery, pageCount, load, changePage } = useContentList('gallery/media')
const selectedAlbumId = ref<string | null>(null)
const filteredAlbums = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase()
  return albums.value.filter((album) => album.name.toLocaleLowerCase().includes(keyword))
})
const selectedAlbum = computed(() => albums.value.find((album) => album.id === selectedAlbumId.value))
let albumsController: AbortController | undefined
async function loadAlbums() {
  albumsController?.abort()
  const controller = new AbortController()
  albumsController = controller
  albumsLoading.value = true
  albumsError.value = ''
  albums.value = []
  try {
    const result = await getAllContent('gallery/albums', controller.signal)
    if (controller.signal.aborted) return
    albums.value = result
    if (selectedAlbumId.value && !result.some((album) => album.id === selectedAlbumId.value)) selectedAlbumId.value = null
  } catch (cause) {
    if (!controller.signal.aborted) albumsError.value = cause instanceof Error ? cause.message : '图集加载失败'
  } finally {
    if (!controller.signal.aborted) albumsLoading.value = false
  }
}
function searchMedia() {
  mediaQuery.keyword = keyword.value.trim()
  mediaQuery.type = mediaType.value || undefined
  mediaQuery.page = 1
  void load()
}
function refresh() { void loadAlbums(); void load() }
watch(selectedAlbumId, (id) => { mediaQuery.albumId = id ?? undefined; mediaQuery.page = 1; void load() })
onMounted(refresh)
onBeforeUnmount(() => albumsController?.abort())

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
            <img v-if="album.thumbnail" :src="album.thumbnail" alt="" width="40" height="40" decoding="async" />
            <span v-else aria-hidden="true">▧</span>
            <span class="album-button__name" :title="album.name">{{ album.name }}</span>
          </button>
          <p v-if="albumsLoading" class="gallery-sidebar__empty" role="status">正在加载图集…</p>
          <p v-else-if="albumsError" class="gallery-sidebar__empty" role="alert">
            {{ albumsError }} <button type="button" @click="loadAlbums">重试</button>
          </p>
          <p v-else-if="!filteredAlbums.length" class="gallery-sidebar__empty" role="status">
            {{ query ? '未找到图集' : '暂无图集' }}
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
        <span class="gallery-content__count">{{ total }} 项媒体</span>
      </header>
      <form class="gallery-toolbar" role="search" @submit.prevent="searchMedia">
        <input v-model="keyword" type="search" placeholder="搜索媒体名称" aria-label="搜索媒体名称" maxlength="254" />
        <select v-model="mediaType" aria-label="媒体类型"><option value="">全部媒体</option><option value="image">图片</option><option value="video">视频</option></select>
        <button type="submit" :disabled="loading">搜索</button>
        <button type="button" :disabled="loading || albumsLoading" @click="refresh">刷新</button>
      </form>
      <p v-if="loading" class="gallery-content__empty" role="status">正在加载媒体…</p>
      <p v-else-if="error" class="gallery-content__empty" role="alert">{{ error }} <button type="button" @click="load">重试</button></p>
      <div v-else class="media-grid">
        <figure v-for="item in displayedMedia" :key="item.id" class="media-item">
          <a
            v-if="item.type === 'image'"
            class="media-item__image"
            :href="item.src"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`查看原图：${item.title}`"
          >
            <img :src="item.thumbnail || item.src" :alt="item.title" loading="lazy" decoding="async" />
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
      <p v-if="!loading && !error && !displayedMedia.length" class="gallery-content__empty" role="status">
        {{ mediaQuery.keyword || mediaQuery.type ? '未找到符合条件的媒体' : '暂无图片或媒体' }}
      </p>
      <ContentPagination :page="mediaQuery.page" :page-count="pageCount" :total="total" :disabled="loading || !!error" @change="changePage" />
    </section>
  </OsWindow>
</template>

<style scoped lang="scss">
.gallery-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.gallery-toolbar input { flex: 1; min-width: 120px; }
.gallery-toolbar input, .gallery-toolbar select, .gallery-toolbar button { padding: 7px 10px; border: 1px solid #8884; border-radius: 7px; background: transparent; color: inherit; font-size: 12px; }
.gallery-toolbar button { cursor: pointer; }
.gallery-toolbar button:disabled { opacity: .4; }
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
