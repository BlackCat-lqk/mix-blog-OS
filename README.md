# mix-blog-OS

基于 Vue 3、TypeScript 和 Vite 的桌面应用，目前保留：

- 设置：系统壁纸、自定义壁纸、账户资料和头像管理。
- 登录：邮箱登录、注册、登录状态持久化和退出登录。
- 基础界面：桌面和应用窗口。

双击桌面的「设置」图标打开或恢复最小化的窗口，点击左侧账户区域打开登录弹窗。

左侧桌面状态栏分为三部分：顶部可返回桌面或打开全部应用总览；中间显示已打开的应用，点击可切换、恢复或最小化当前窗口；底部直接进入个性化设置。全部应用总览覆盖整个桌面，提供顶部搜索和应用图标网格；支持中英文名称搜索、回车打开首个结果、Esc 或点击空白处退出，退出后恢复原窗口状态。总览中点击状态栏的应用会直接打开或恢复窗口。返回桌面会最小化所有窗口并保留应用状态。最大化窗口紧贴状态栏右边缘，普通窗口可以拖到状态栏下方，状态栏保持最高层级。

## 窗口组件

项目的接口声明统一放在 `src/tsInterface/index.ts`，各模块通过 `import type` 引用。

- `src/components/OsWindow/index.vue`：公共窗口外壳，提供 `sidebar` 和默认内容插槽，通过 `v-model:minimized` 管理最小化，向外发送 `activate`、`close` 事件。
- `src/components/OsWindow/WindowSidebar.vue`：窗口侧边栏子组件，通过 `items` 和 `v-model` 控制导航，`header` 插槽用于放置账户等应用内容。
- `src/components/OsWindow/useWindowGeometry.ts`：封装拖拽、缩放、最大化和位置状态，不依赖具体应用。
- `src/views/Setting/IndexView.vue`：组合窗口、侧边栏与设置内容，维护设置业务和登录状态。应用入口统一注册在 `src/config/index.ts`。

## 开发

Node.js 版本要求：`^20.19.0 || >=22.12.0`。

```sh
npm ci
npm run dev
```

默认不注入 Vue DevTools 调试面板；需要时运行 `npm run dev:tools`。

开发环境将 `/api` 和 `/uploads` 代理至 `http://localhost:3000`。登录、注册和账户修改需要对应后端服务。

## 检查与构建

```sh
npm run type-check
npm run lint
npm run build
```

## Lighthouse 评测

使用生产构建评测，避免将 Vite 的模块转换、热更新和调试脚本计入页面性能：

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

在 Chrome 无痕窗口中打开命令输出的地址，再运行 Lighthouse。报告中提示的 IndexedDB 存储数据会影响壁纸加载；比较前后结果时应使用相同的设备、限速和壁纸数据。

桌面首屏只加载基础界面，设置窗口和登录表单在打开时加载。页面提供中文语言标记、主内容区域、描述信息及有效的 `robots.txt`。
