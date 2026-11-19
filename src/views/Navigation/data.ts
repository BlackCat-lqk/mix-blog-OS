import type { NavigationCategory } from '@/tsInterface/index'

// 示例分类和站点，后续可替换为实际导航数据。
export const categories: NavigationCategory[] = [
  {
    id: 'development',
    title: '开发资源',
    children: [
      {
        id: 'frontend',
        title: '前端开发',
        sites: [
          {
            id: 'vue',
            title: 'Vue.js — 渐进式 JavaScript 框架',
            description: '易学易用、性能出色且功能丰富的框架，提供声明式、组件化的编程模型，帮助你高效构建各种规模的 Web 用户界面。',
            url: 'https://cn.vuejs.org/',
            icon: 'https://cn.vuejs.org/logo.svg',
          },
          {
            id: 'react',
            title: 'React',
            description: '用于构建 Web 和原生用户界面的库，通过组件组织界面与交互。',
            url: 'https://zh-hans.react.dev/',
            icon: 'https://zh-hans.react.dev/favicon.ico',
          },
          {
            id: 'typescript',
            title: 'TypeScript — JavaScript 的类型化超集',
            description: '为 JavaScript 提供静态类型检查，包含语言手册、入门教程和在线演练场。',
            url: 'https://www.typescriptlang.org/',
            icon: 'https://www.typescriptlang.org/favicon-32x32.png',
          },
          {
            id: 'mdn',
            title: 'MDN Web Docs — Web 开发技术文档',
            description: '查阅 HTML、CSS、JavaScript 和 Web API 的参考资料、教程及浏览器兼容性信息，学习开放 Web 平台的基础知识和开发实践。',
            url: 'https://developer.mozilla.org/zh-CN/',
            icon: 'https://developer.mozilla.org/favicon.ico',
          },
        ],
      },
      {
        id: 'development-tools',
        title: '开发工具',
        sites: [
          {
            id: 'github',
            title: 'GitHub',
            description: '探索开源项目，托管代码，与开发者一起协作构建软件。',
            url: 'https://github.com/',
            icon: 'https://github.com/favicon.ico',
          },
          {
            id: 'vscode',
            title: 'Visual Studio Code',
            description: '轻量且功能丰富的代码编辑器，提供扩展、调试和版本控制支持。',
            url: 'https://code.visualstudio.com/',
            icon: 'https://code.visualstudio.com/favicon.ico',
          },
        ],
      },
    ],
  },
  {
    id: 'design',
    title: '设计灵感',
    children: [
      {
        id: 'design-tools',
        title: '设计工具',
        sites: [
          {
            id: 'figma',
            title: 'Figma',
            description: '在浏览器中协作设计界面、制作交互原型并与团队分享设计方案。',
            url: 'https://www.figma.com/',
            icon: 'https://www.figma.com/favicon.ico',
          },
        ],
      },
      {
        id: 'inspiration',
        title: '灵感采集',
        sites: [
          {
            id: 'dribbble',
            title: 'Dribbble',
            description: '发现来自全球设计师的界面、插画和创意作品，收集新的设计灵感。',
            url: 'https://dribbble.com/',
            icon: 'https://dribbble.com/favicon.ico',
          },
        ],
      },
    ],
  },
  {
    id: 'productivity',
    title: '效率工具',
    children: [
      {
        id: 'notes',
        title: '笔记文档',
        sites: [
          {
            id: 'notion',
            title: 'Notion',
            description: '将笔记、文档和项目整理到同一工作空间，记录想法并安排工作。',
            url: 'https://www.notion.so/',
            icon: 'https://www.notion.so/images/favicon.ico',
          },
        ],
      },
      {
        id: 'translation',
        title: '翻译工具',
        sites: [
          {
            id: 'deepl',
            title: 'DeepL 翻译',
            description: '支持多种语言的文本和文档翻译，帮助阅读资料与跨语言交流。',
            url: 'https://www.deepl.com/translator',
            icon: 'https://www.deepl.com/img/favicon/favicon_32.png',
          },
        ],
      },
    ],
  },
]
