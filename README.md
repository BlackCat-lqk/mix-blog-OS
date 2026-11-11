# mix-blog-OS

基于 Vue 3、TypeScript 和 Vite 的桌面应用，目前保留：

- 设置：系统壁纸、自定义壁纸、账户资料和头像管理。
- 登录：邮箱登录、注册、登录状态持久化和退出登录。
- 基础界面：桌面、设置窗口、任务栏和消息提示。

双击桌面的「设置」图标打开窗口，点击左侧账户区域打开登录弹窗。

## 开发

Node.js 版本要求：`^20.19.0 || >=22.12.0`。

```sh
npm ci
npm run dev
```

开发环境将 `/api` 和 `/uploads` 代理至 `http://localhost:3000`。登录、注册和账户修改需要对应后端服务。

## 检查与构建

```sh
npm run type-check
npm run lint
npm run build
```
