import { createApp } from "vue";
import pinia from "@/stores/index.ts";

import App from "./App.vue";
import router from "./router";
import "@/assets/style/index.scss";

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount("#app");
