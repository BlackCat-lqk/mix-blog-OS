<template>
  <div class="app-main">
    <HeaderBar />
    <div style="display: flex; width: 100%; height: calc(100% - 80px)">
      <div ref="railRef">
        <PcAppRail />
      </div>
      <div class="app-layout">
        <div class="app-router">
          <RouterView />
        </div>
        <div class="song-status" ref="routerViewRef">
          <SongStatus />
        </div>
      </div>
    </div>
    <div ref="playMainWindowRef" class="play-main-window-box">
      <PlayWindow />
    </div>
    <PlayDetail />
  </div>
</template>
<script setup lang="ts">
// import PlayWindow from "./common/PlayWindow.vue";
// import PlayDetail from "./common/PlayDetail.vue";
import HeaderBar from "./common/HeaderBar.vue";
// import PcAppRail from "./common/PcAppRail.vue";
// import SongStatus from "./common/SongStatus.vue";
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
  height: 100vh;
}

.app-layout {
  position: relative;
  width: 100%;
  max-width: 100%;
  flex: 1;
  display: flex;
  gap: 20px;
  padding-right: 38px;
  z-index: 1;
  .song-status {
    width: 380px;
    background: linear-gradient(to bottom, rgba(35, 35, 35, 0.5) 0%, rgba(0, 0, 0, 1) 100%);
    border-radius: 40px 40px 0 0;
  }
}

.app-router {
  flex: 1;
}

.play-main-window-box {
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(2px);
  & > * {
    pointer-events: auto;
  }
}

@media (min-width: 900px) {
  .play-main-window-box {
    width: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    position: fixed;
    z-index: 2;
  }
}
</style>
