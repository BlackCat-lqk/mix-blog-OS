# mix-blog-OS

基于 Vue 3、TypeScript 和 Vite 的桌面应用，目前保留：

- 设置：系统壁纸、自定义壁纸、账户资料和头像管理。
- 登录：邮箱登录、注册、登录状态持久化和退出登录。
- 基础界面：桌面和应用窗口。

双击桌面的「设置」图标打开或恢复最小化的窗口，点击左侧账户区域打开登录弹窗。

## 窗口组件

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
