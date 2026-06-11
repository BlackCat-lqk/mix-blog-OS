<!-- * @description: MIX AI 对话页面 -->
<script lang="ts" setup>
import { ref } from "vue";
import Orb from "@/views/VueBits/BitsOrb.vue";
import InputText from "@/components/InputText.vue";
import ChatList from "./components/ChatList.vue";
import type { ChatMessageData } from "./components/ChatMessage.vue";

// ==================== 写死数据：模拟对话 ====================
const mockReplies: Record<string, string> = {
  你好: "你好！我是 MIX AI，你的智能助手。有什么可以帮你的吗？",
  你能做什么:
    "我可以做很多事情：\n\n• 💬 回答各种问题\n• 📝 帮你写作和润色文案\n• 💻 编写和解释代码\n• 🎨 提供创意灵感\n• 📊 分析数据和信息\n\n试试问我一些有趣的问题吧！",
  今天天气怎么样:
    "我暂时还没有接入实时天气数据 🌤️\n\n不过建议你打开窗看看外面，或者查看任务栏的天气应用。\n\n等后续版本接入联网功能后，我就能帮你查天气啦！",
  写一段vue3代码:
    '当然，这是一个简单的 Vue 3 组合式 API 计数器示例：\n\n```ts\nimport { ref, computed } from "vue";\n\nconst count = ref(0);\nconst double = computed(() => count.value * 2);\n\nconst increment = () => count.value++;\nconst decrement = () => count.value--;\n```\n\n```html\n<div class="counter">\n  <button @click="decrement">-</button>\n  <span>{{ count }} (×2 = {{ double }})</span>\n  <button @click="increment">+</button>\n</div>\n```\n\n这是一个完整的计数器组件，使用了响应式数据和计算属性。',
  谢谢: "不客气！随时找我聊天 😊",
};

// 兜底回复
const fallbackReplies = [
  "这个问题很有意思，让我想想... 🤔",
  "抱歉，我还在学习中，暂时无法回答这个问题。试试问我其他方面的问题？",
  "嗯，这是个好问题！不过我的知识库还在完善中，换个话题试试？",
];

// ==================== 状态 ====================
const msg = ref("");
const loading = ref(false);
const typing = ref(false);

// 初始对话历史（写死）
const messages = ref<ChatMessageData[]>([
  {
    id: 1,
    role: "assistant",
    content:
      "你好！我是 MIX AI，你的桌面智能助手 👋\n\n你可以问我编程问题、让我写文案、或者随便聊聊。输入你的问题然后按 Enter 发送吧！",
    timestamp: Date.now() - 300000,
  },
]);

let nextId = 2;

// ==================== 方法 ====================
const getReply = (input: string): string => {
  // 模糊匹配写死数据
  for (const [keyword, reply] of Object.entries(mockReplies)) {
    if (input.includes(keyword)) {
      return reply;
    }
  }
  // 兜底随机回复
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]!;
};

const handleSend = async (val: string) => {
  if (loading.value) return;

  // 1. 添加用户消息
  messages.value.push({
    id: nextId++,
    role: "user",
    content: val,
    timestamp: Date.now(),
  });

  // 2. 清空输入框
  msg.value = "";

  // 3. 模拟 AI "正在输入..."
  loading.value = true;
  typing.value = true;

  // 模拟网络延迟 800–1800ms
  const delay = 800 + Math.random() * 1000;
  await new Promise((r) => setTimeout(r, delay));

  typing.value = false;

  // 4. 添加 AI 回复（写死数据）
  const reply = getReply(val);
  messages.value.push({
    id: nextId++,
    role: "assistant",
    content: reply,
    timestamp: Date.now(),
  });

  loading.value = false;
};
</script>

<template>
  <div class="mix-ai">
    <!-- 背景 Orb -->
    <Orb
      class="mix-ai__orb"
      :hoverIntensity="0.3"
      :rotateOnHover="false"
      :hue="260"
      :forceHoverState="loading || typing"
    />

    <!-- 对话区域 -->
    <div class="mix-ai__chat">
      <ChatList :messages="messages" :typing="typing" />
    </div>

    <!-- 输入区域 -->
    <div class="mix-ai__input">
      <InputText
        v-model="msg"
        placeholder="输入你的问题，Enter 发送..."
        :maxlength="500"
        :loading="loading"
        send-text="发送"
        :show-count="true"
        :min-rows="1"
        :max-rows="4"
        @send="handleSend"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mix-ai {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  // ---- 背景 Orb ----
  &__orb {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120%;
    height: 120%;
    z-index: 0;
    pointer-events: none;
    opacity: 0.6;
  }

  // ---- 对话区 ----
  &__chat {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    // 底部渐变过渡到输入框
    mask-image: linear-gradient(to top, transparent 0%, #000 24px);
    -webkit-mask-image: linear-gradient(to top, transparent 0%, #000 24px);
  }

  // ---- 输入区 ----
  &__input {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    padding: 0 12px 12px 12px;
  }
}
</style>
