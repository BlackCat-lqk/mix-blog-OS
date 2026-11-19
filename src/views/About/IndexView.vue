<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { AppWindowProps } from '@/tsInterface/index'
import OsWindow from '@/components/OsWindow/index.vue'
import { profile, site, timeline } from './data'

withDefaults(defineProps<AppWindowProps>(), {
  title: '关于',
  visible: true,
})
const minimized = defineModel<boolean>('minimized', { default: false })
const emit = defineEmits<{ activate: []; close: [] }>()
const now = ref(Date.now())
const refreshTime = window.setInterval(() => { now.value = Date.now() }, 60_000)
onUnmounted(() => window.clearInterval(refreshTime))

const startTime = new Date(site.startDate).getTime()
const anniversaryTime = new Date(site.anniversaryDate).getTime()
const runningDays = computed(() => Math.max(0, Math.floor((now.value - startTime) / 86_400_000)))
const progress = computed(() =>
  Math.min(100, Math.max(0, ((now.value - startTime) / (anniversaryTime - startTime)) * 100)),
)
</script>

<template>
  <OsWindow
    class="about-window"
    v-model:minimized="minimized"
    :title="title"
    :icon="icon"
    :minimize-target="minimizeTarget"
    :visible="visible"
    @activate="emit('activate')"
    @close="emit('close')"
  >
    <div class="about-view">
      <div class="about-scroll">
        <div class="about-layout">
          <aside class="profile" aria-label="个人介绍">
            <section class="profile-card">
              <div class="profile-card__text">
                <h1>{{ profile.name }}</h1>
                <p :title="profile.bio">{{ profile.bio }}</p>
              </div>
              <img class="profile-card__cover" :src="profile.cover" alt="海边的青春合影" decoding="async" />
            </section>

            <ul class="profile-wishes" aria-label="生活心愿">
              <li v-for="wish in profile.wishes" :key="wish">{{ wish }}</li>
            </ul>

            <div class="profile-photos" aria-label="生活照片">
              <img
                v-for="photo in profile.photos"
                :key="photo.src"
                :src="photo.src"
                :alt="photo.alt"
                loading="lazy"
                decoding="async"
              />
            </div>
          </aside>

          <div class="about-main">
            <section class="site-overview" aria-label="站点概览">
              <div class="site-intro">
                <h2>{{ site.headline }} <span>{{ site.highlight }}</span></h2>
                <p class="site-intro__uptime">
                  <span>站点已神奇地运行了</span>
                  <span class="site-intro__days"><strong>{{ runningDays }}</strong> 天</span>
                </p>
              </div>

              <section class="anniversary" aria-labelledby="anniversary-title">
                <h2 id="anniversary-title">时间进度 <strong>{{ progress.toFixed(2) }} %</strong></h2>
                <h3>10年之约</h3>
                <p>{{ site.promise }}</p>
                <div
                  class="anniversary__progress"
                  role="progressbar"
                  aria-label="十年之约时间进度"
                  :aria-valuenow="Number(progress.toFixed(2))"
                  :aria-valuemin="0"
                  :aria-valuemax="100"
                >
                  <span :style="{ width: `${progress}%` }"></span>
                </div>
              </section>
            </section>

            <section class="timeline" aria-labelledby="timeline-title">
              <h2 id="timeline-title" class="timeline__heading">时间线</h2>
              <ol class="timeline__list">
                <li v-for="entry in timeline" :key="entry.id" class="timeline-entry">
                  <h3>
                    {{ entry.title }}
                    <time v-if="entry.date" :datetime="entry.date">（{{ entry.date }}）</time>
                  </h3>
                  <p>{{ entry.description }}</p>
                </li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  </OsWindow>
</template>

<style scoped lang="scss">
.about-window :deep(.os-window__content) {
  background: #f7f8fa;

  &::before,
  &::after {
    display: none;
  }
}

.about-view {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  container: about / inline-size;
  color: #263246;
  background: #f7f8fa;
}

.about-scroll {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c5ccd6 transparent;
}

.about-layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  align-items: start;
  gap: 20px;
  padding: 24px;
}

.profile {
  min-width: 0;
}

.profile-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 292px;
  border: 1.5px solid transparent;
  border-radius: 26px;
  background:
    linear-gradient(145deg, #f9fbff, #eef2ff 55%, #f2faff) padding-box,
    linear-gradient(135deg, #83d1ee, #b5b6f9 65%, #c8aff0) border-box;
  box-shadow: 0 8px 24px #64748b12;
  overflow: hidden;

  &__text {
    padding: 30px 16px;
    color: #23304b;

    h1 {
      font-size: 30px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    p {
      margin-top: 6px;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 600;
    }
  }

  &__cover {
    width: 100%;
    height: 160px;
    border-radius: 24px 24px 0 0;
    object-fit: cover;
  }
}

.profile-wishes {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0;
  margin: 18px 0;
  list-style: none;

  li {
    padding: 3px 7px;
    border: 1px solid #cfe4ee;
    border-radius: 999px;
    color: #256f91;
    background: #f0f9ff;
    font-size: 11px;
    white-space: nowrap;
  }
}

.profile-photos {
  display: grid;
  gap: 12px;
  padding: 0 18px;

  img {
    width: 100%;
    height: auto;
    border: 2px solid #dce3ed;
    border-radius: 10px;
  }
}

.about-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.site-overview,
.timeline {
  padding: 10px;
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  background: #fff;
}

.site-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(200px, 1fr);
  gap: 10px;
}

.site-intro,
.anniversary,
.timeline-entry {
  border: 1px solid #e5e9f0;
  border-radius: 8px;
}

.site-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 36px;
  min-width: 0;
  min-height: 304px;
  padding: 28px 16px;
  text-align: center;

  h2 {
    font-size: clamp(24px, 3.6cqw, 52px);
    font-weight: 400;
    line-height: 1.3;

    span {
      color: #ea580c;
    }
  }

  &__uptime {
    display: flex;
    align-items: baseline;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2px 4px;
    font-size: clamp(14px, 1.9cqw, 28px);
  }

  &__days {
    white-space: nowrap;

    strong {
      color: #ea580c;
      font-size: clamp(30px, 4cqw, 54px);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
  }
}

.anniversary {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 24px 14px 0;
  overflow: hidden;
  background: linear-gradient(#fff4eb, #fff);

  h2 {
    margin-bottom: 22px;
    text-align: center;
    font-size: 16px;
    font-weight: 400;

    strong {
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
  }

  h3 {
    margin-bottom: 6px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
  }

  p {
    flex: 1;
    margin-bottom: 22px;
    color: #526177;
    font-size: 12px;
    line-height: 1.9;
  }

  &__progress {
    height: 8px;
    margin-inline: -14px;
    background: #ffedd5;

    span {
      display: block;
      height: 100%;
      border-radius: 0 4px 4px 0;
      background: #f97316;
    }
  }
}

.timeline {
  &__heading {
    padding: 6px 0 16px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
  }

  &__list {
    display: grid;
    gap: 10px;
    padding: 0;
    list-style: none;
  }
}

.timeline-entry {
  min-width: 0;
  padding: 12px;

  h3 {
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: 600;
  }

  time {
    display: inline-block;
    color: #64748b;
    font-size: 0.85em;
    font-weight: 500;
  }

  p {
    color: #526177;
    font-size: 12px;
    line-height: 1.9;
    overflow-wrap: anywhere;
  }
}

@container about (max-width: 760px) {
  .about-layout {
    grid-template-columns: 160px minmax(0, 1fr);
    gap: 14px;
    padding: 18px;
  }

  .profile-card__text {
    padding-inline: 12px;

    h1 {
      font-size: 26px;
    }
  }

  .profile-photos {
    padding: 0 8px;
  }

  .site-overview {
    grid-template-columns: minmax(0, 1fr);
  }

  .site-intro {
    min-height: 220px;
  }
}

@container about (max-width: 500px) {
  .about-layout {
    grid-template-columns: minmax(0, 1fr);
    padding: 14px;
  }

  .profile-card {
    max-width: 280px;
    margin-inline: auto;
  }

  .profile-photos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    max-width: 280px;
    margin-inline: auto;
  }

  .site-intro h2 {
    font-size: 28px;
  }
}
</style>
