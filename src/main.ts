import { createApp } from "vue";
import pinia from "@/stores/index.ts";

import App from "./App.vue";
import router from "./router";
import vLoading from "@/directives/loading";
import "@/assets/style/index.scss";
import "overlayscrollbars/overlayscrollbars.css";

const app = createApp(App);

app.use(pinia);
app.use(router);

app.directive("loading", vLoading);

app.mount("#app");
