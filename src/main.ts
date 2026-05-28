import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
// import vOsAnimate from "@/directives/osAnimate";
import "@/assets/style/index.scss";
import "overlayscrollbars/overlayscrollbars.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);

// app.directive("os-animate", vOsAnimate);

app.mount("#app");
