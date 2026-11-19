import { createApp } from "vue";
import pinia from "@/stores/index.ts";
import { publicStore } from "@/stores/public"
import App from "./App.vue";
import router from "./router";
import "@/assets/style/index.scss";
import { switchDebugger } from "@/utils/debugger.ts"

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount("#app");

// 初始化应用主题
document.documentElement.setAttribute('data-theme', publicStore().theme)
// 是否允许debugger
switchDebugger(true)
