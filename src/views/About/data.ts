import type { AboutTimelineEntry } from '@/tsInterface/index'
import profileCover from '@/assets/about/images/profile-cover.jpg'
import mirrorPhoto from '@/assets/about/images/mirror.jpg'
import snowPhoto from '@/assets/about/images/snow.jpg'

// 初始文案、照片和建站日期来自参考图，可在此替换。
export const profile = {
  name: 'K',
  bio: '这个人很懒，什么都没写…',
  cover: profileCover,
  wishes: ['许愿发财', '心想事成', '天天开心', '身体健康', '工作顺利', '大吉大利'],
  photos: [
    { src: mirrorPhoto, alt: '记录生活：镜中的自己' },
    { src: snowPhoto, alt: '记录生活：冬日雪景' },
  ],
}

export const site = {
  headline: 'Creative',
  highlight: 'components',
  startDate: '2025-06-30T00:00:00+08:00',
  anniversaryDate: '2035-06-30T00:00:00+08:00',
  promise: '在这个十年中，我会用心感受生活的美好，用努力书写工作的篇章，用行动诠释人生的意义。这个进度条，不仅是数字的积累，更是我心中的期许和承诺。我相信，经过十年的坚持和努力，我会收获更多，成为一个更好的自己。',
}

export const timeline: AboutTimelineEntry[] = [
  {
    id: 'about',
    title: '关于',
    description: '建站是希望能有自己的一个小天地，里面可以学习、记录生活；有了想法马上行动了，从中也学习到了很多知识，过程中也碰到了很多疑难杂症，好在一一克服解决了。小站还在初期成长，必定有许多不完美之处，之后的时间中会慢慢完善，并将自己的想法加入到内容中去！',
  },
  {
    id: '1.0.0',
    title: '🦄 1.0.0',
    date: '2025-06-30',
    description: '时间来到2025年的4月份，脑中已经开始有想法，当时花了时间选型落地方案，借鉴别人精美的博客。本人的UI审美能力一直不是很好，其中大部分布局及UI都是网上东拼西凑做出来的，其中也加入了一些自己的想法。时间来到6月30，第一个版本正式上线了，虽然其中有很多地方都不太完善，但它确确实实地出生了。',
  },
  {
    id: '1.1.2',
    title: '😽 1.1.2',
    date: '2025-08-03',
    description: '该版本优化和修复了许多问题，特别是性能体验上，使用Google的Lighthouse测试，性能测试从57分提升到97分。新增了一些和完善了一些有趣的功能。更新完该版本，后面可能由于精力和时间问题，更新不会很频繁了。',
  },
]
