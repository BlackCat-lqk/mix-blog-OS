<!-- * @description: 对话消息列表 — 自动滚底、空状态、输入中指示器 -->
<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from "vue";
import ChatMessage from "./ChatMessage.vue";
import type { ChatMessageData } from "./ChatMessage.vue";

const props = defineProps<{
  messages: ChatMessageData[];
  /** 是否显示 "AI 正在输入" 指示器 */
  typing?: boolean;
}>();

const listRef = ref<HTMLDivElement | null>(null);
const isNearBottom = ref(true); // 用户是否在底部附近

// ---- 滚动到底部 ----
const scrollToBottom = (smooth = true) => {
  const el = listRef.value;
  if (!el) return;
  el.scrollTo({
    top: el.scrollHeight,
    behavior: smooth ? "smooth" : "instant",
  });
};

// ---- 判断是否在底部附近 ----
const onScroll = () => {
  const el = listRef.value;
  if (!el) return;
  const threshold = 80; // 离底部 80px 内算"在底部"
  isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
};

// 新消息到来时自动滚底（仅当用户本来就在底部）
watch(
  () => props.messages.length,
  () => {
    if (isNearBottom.value) {
      nextTick(() => scrollToBottom(true));
    }
  },
);

// typing 状态变化时也滚底
watch(
  () => props.typing,
  (val) => {
    if (val && isNearBottom.value) {
      nextTick(() => scrollToBottom(true));
    }
  },
);

onMounted(() => {
  // 初始加载时立即滚到底部（无动画）
  nextTick(() => scrollToBottom(false));
});
</script>

<template>
  <div ref="listRef" class="chat-list" @scroll="onScroll">
    <!-- 空状态 -->
    <div v-if="messages.length === 0 && !typing" class="chat-list__empty">
      <div class="chat-list__empty-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p class="chat-list__empty-title">开始对话</p>
      <p class="chat-list__empty-desc">输入你的问题，MIX AI 将为你解答</p>
    </div>

    <!-- 消息列表 -->
    <ChatMessage
      v-for="msg in messages"
      :key="msg.id"
      :id="msg.id"
      :role="msg.role"
      :content="msg.content"
      :timestamp="msg.timestamp"
    />

    <!-- AI 输入中指示器 -->
    <div v-if="typing" class="chat-list__typing">
      <div class="chat-list__typing-avatar" aria-hidden="true">
        <span>AI</span>
      </div>
      <div class="chat-list__typing-bubble">
        <span class="chat-list__typing-dot"></span>
        <span class="chat-list__typing-dot"></span>
        <span class="chat-list__typing-dot"></span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$empty-color: #9ca3af;
$typing-bg: rgba(255, 255, 255, 0.55);
$typing-dot-color: #6b7280;

.chat-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 0;

  // 滚动条美化
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
  }

  // ---- 空状态 ----
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 20px;
    text-align: center;
    color: $empty-color;
    user-select: none;
  }

  &__empty-icon {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  &__empty-title {
    margin: 0 0 6px 0;
    font-size: 16px;
    font-weight: 600;
    color: #6b7280;
  }

  &__empty-desc {
    margin: 0;
    font-size: 13px;
    color: $empty-color;
  }

  // ---- 输入中指示器 ----
  &__typing {
    display: flex;
    gap: 10px;
    padding: 6px 16px;
    align-items: flex-end;
  }

  &__typing-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
  }

  &__typing-bubble {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 12px 16px;
    background: $typing-bg;
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border-bottom-left-radius: 4px;
  }

  &__typing-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $typing-dot-color;
    animation: typing-bounce 1.4s ease-in-out infinite both;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-list__typing-dot {
    animation: none;
    opacity: 0.6;
  }
}
</style>
