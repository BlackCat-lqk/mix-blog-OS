<template>
  <div class="app-main">
    <HeaderBar />
    <div class="app-main--home">
      <PcAppRail></PcAppRail>
      <HomeIndex></HomeIndex>
    </div>
    <PlayWindow></PlayWindow>
    <PlayDetail></PlayDetail>
  </div>
</template>
<script setup lang="ts">
import HeaderBar from "./common/HeaderBar.vue";
import PcAppRail from "./common/PcAppRail.vue";
import HomeIndex from "./Home/IndexView.vue";
import PlayWindow from "./common/PlayWindow.vue";
import PlayDetail from "./common/PlayDetail.vue";
import { ref, onMounted, onBeforeUnmount } from "vue";

const playMainWindowRef = ref<HTMLElement | null>(null);
const routerViewRef = ref<HTMLElement | null>(null);
const railRef = ref<HTMLElement | null>(null);

const BP_PC = "(min-width: 900px)";
const PLAY_BAR_BOTTOM_MOBILE = 16;

const isPcLayout = () => typeof window !== "undefined" && window.matchMedia(BP_PC).matches;

const updateLayout = () => {
  const playBox = playMainWindowRef.value;
  const routerEl = routerViewRef.value;
  const rail = railRef.value;
  if (!playBox || !routerEl || !rail) return;
  const pc = isPcLayout();
  const bottom = pc ? 0 : PLAY_BAR_BOTTOM_MOBILE;
  playBox.style.bottom = `${bottom}px`;
  const heightPlay = playBox.offsetHeight;
  const gap = pc ? 0 : 8;
  routerEl.style.height = `calc(100vh - ${heightPlay + bottom + gap}px - 110px)`;
  rail.style.height = `calc(100vh - ${heightPlay + bottom + gap}px - 80px)`;
};

let layoutObserver: ResizeObserver | null = null;
let mqPc: MediaQueryList | null = null;

const onMqPcChange = () => updateLayout();

onMounted(() => {
  updateLayout();
  const playBox = playMainWindowRef.value;
  if (typeof ResizeObserver !== "undefined" && playBox) {
    layoutObserver = new ResizeObserver(updateLayout);
    layoutObserver.observe(playBox);
  }
  mqPc = window.matchMedia(BP_PC);
  mqPc.addEventListener("change", onMqPcChange);
  window.addEventListener("resize", updateLayout);
});

onBeforeUnmount(() => {
  layoutObserver?.disconnect();
  layoutObserver = null;
  mqPc?.removeEventListener("change", onMqPcChange);
  mqPc = null;
  window.removeEventListener("resize", updateLayout);
});
</script>
<style scoped lang="scss">
.app-main {
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  height: 100%;
  &--home {
    width: 100%;
    height: 100%;
    display: flex;
    background-color: rgba(255, 255, 255, 0.9);
  }
}
</style>
