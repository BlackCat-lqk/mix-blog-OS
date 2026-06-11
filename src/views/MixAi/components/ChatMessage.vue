<!-- * @description: AI 对话消息气泡 — 区分 user / assistant 角色 -->
<script setup lang="ts">
import { computed } from "vue";

export interface ChatMessageData {
  id: string | number;
  /** 角色：user = 用户消息，assistant = AI 回复 */
  role: "user" | "assistant";
  content: string;
  /** 可选时间戳（毫秒） */
  timestamp?: number;
}

const props = withDefaults(defineProps<ChatMessageData>(), {
  timestamp: undefined,
});

const isUser = computed(() => props.role === "user");

const timeStr = computed(() => {
  if (!props.timestamp) return "";
  const d = new Date(props.timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
});
</script>

<template>
  <div
    class="chat-msg"
    :class="{
      'chat-msg--user': isUser,
      'chat-msg--assistant': !isUser,
    }"
  >
    <!-- AI 头像 -->
    <div v-if="!isUser" class="chat-msg__avatar" aria-hidden="true">
      <span class="chat-msg__avatar-text">AI</span>
    </div>

    <div class="chat-msg__body">
      <!-- 气泡 -->
      <div class="chat-msg__bubble">
        <p class="chat-msg__text" v-text="content"></p>
      </div>

      <!-- 时间 -->
      <time v-if="timeStr" class="chat-msg__time">{{ timeStr }}</time>
    </div>

    <!-- 用户头像 -->
    <div v-if="isUser" class="chat-msg__avatar chat-msg__avatar--user" aria-hidden="true">
      <span class="chat-msg__avatar-text">U</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ---- tokens ----
$bubble-user-bg: #0067c0;
$bubble-user-text: #fff;
$bubble-ai-bg: rgba(255, 255, 255, 0.55);
$bubble-ai-text: #1f2937;
$bubble-radius: 16px;
$avatar-size: 32px;
$avatar-bg-ai: linear-gradient(135deg, #667eea, #764ba2);
$avatar-bg-user: linear-gradient(135deg, #0067c0, #38bdf8);
$time-color: #9ca3af;
$gap: 10px;

.chat-msg {
  display: flex;
  gap: $gap;
  padding: 6px 16px;
  animation: msg-in 300ms ease-out both;

  // 用户消息：右对齐
  &--user {
    flex-direction: row-reverse;

    .chat-msg__body {
      align-items: flex-end;
    }
  }

  &--assistant {
    .chat-msg__body {
      align-items: flex-start;
    }
  }

  // ---- avatar ----
  &__avatar {
    flex-shrink: 0;
    width: $avatar-size;
    height: $avatar-size;
    border-radius: 50%;
    background: $avatar-bg-ai;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;

    &--user {
      background: $avatar-bg-user;
    }
  }

  &__avatar-text {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    user-select: none;
  }

  // ---- body ----
  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 75%;
    min-width: 0;
  }

  // ---- bubble ----
  &__bubble {
    padding: 10px 14px;
    border-radius: $bubble-radius;

    .chat-msg--user & {
      background: $bubble-user-bg;
      color: $bubble-user-text;
      border-bottom-right-radius: 4px;
    }

    .chat-msg--assistant & {
      background: $bubble-ai-bg;
      backdrop-filter: blur(12px);
      color: $bubble-ai-text;
      border-bottom-left-radius: 4px;
    }
  }

  &__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }

  // ---- time ----
  &__time {
    font-size: 11px;
    color: $time-color;
    padding: 0 4px;
    user-select: none;
  }
}

// ---- 入场动画 ----
@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ---- reduced-motion ----
@media (prefers-reduced-motion: reduce) {
  .chat-msg {
    animation: none;
  }
}
</style>
