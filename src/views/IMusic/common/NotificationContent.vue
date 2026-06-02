<template>
  <div class="message-box">
    <div>
      <img src="@/assets/iMusic/icons/qz.svg" />
    </div>
    <span>最懂你的iMusic</span>
    <span class="version">version：0.1.2</span>
  </div>
</template>

<style scoped lang="scss">
.message-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  width: 200px;
  padding: 30px 0;
  img {
    width: 30px;
    height: 30px;
  }
  span {
    color: #000;
    font-size: 14px;
  }
  .version {
    font-size: 12px;
    color: #000;
  }
}
</style>
