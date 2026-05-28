// stores/eventStore.js
import { defineStore } from 'pinia'
interface MusicItem {
  id?: number | string
  title: string
  artist?: string
  audioUrl?: string
  duration?: number
  coverUrl?: string
  lyricsUrl?: string
}
interface PlayDetail {
  show: boolean
  data: Array<MusicItem> | []
  currentIndex: number
  control: {
    play: boolean
    porevious: number
    next: number
  }
}

type PlayMode = 'list-loop' | 'single-loop' | 'shuffle'

export const useEventStore = defineStore('event', {
  state: () => ({
    setPlayDetail: {
      show: false,
      data: [] as Array<MusicItem>,
      currentIndex: -1,
    } as PlayDetail,
    control: {
      play: false,
      porevious: 0,
      next: 0,
    } as {
      play: boolean
      porevious: number
      next: number
    },
    outControl: {
      play: false,
      porevious: 0,
      next: 0,
    } as {
      play: boolean
      porevious: number
      next: number
    },
    playMode: 'list-loop' as PlayMode,
    volume: 70,
  }),

  actions: {
    setData(data: Array<MusicItem> | []) {
      this.setPlayDetail.data = data
    },
    setShow(val: boolean) {
      this.setPlayDetail.show = val
    },
    initPlay() {
      this.setPlayDetail.show = false
    },
    // 控制播放
    controlPlay(val: boolean) {
      this.control.play = val
    },
    controlPrevious(val: number) {
      this.control.porevious = val
    },
    controlNext(val: number) {
      this.control.next = val
    },
    outControlPlay(val: boolean) {
      this.outControl.play = val
    },
    outControlPrevious(val: number) {
      this.outControl.porevious = val
    },
    outControlNext(val: number) {
      this.outControl.next = val
    },
    setCurrentIndex(val: number) {
      this.setPlayDetail.currentIndex = val
    },
    setPlayMode(mode: PlayMode) {
      this.playMode = mode
    },
    setVolume(value: number) {
      const nextValue = Number.isFinite(value) ? Math.round(value) : 70
      this.volume = Math.min(100, Math.max(0, nextValue))
    },
  },
})
