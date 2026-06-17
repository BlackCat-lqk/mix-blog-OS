<!-- * @description: 格式转换面板 — 目标格式、质量、尺寸设置 -->
<script setup lang="ts">
import { computed } from "vue";
import { OUTPUT_FORMATS, type OutputFormat } from "@/utils/imageConvert";

const props = defineProps<{
  format: OutputFormat;
  quality: number;
  batchMode: boolean;
  fileCount: number;
  converting: boolean;
}>();

const emit = defineEmits<{
  "update:format": [value: OutputFormat];
  "update:quality": [value: number];
  "update:batchMode": [value: boolean];
  convert: [];
}>();

const currentFormatInfo = computed(() =>
  OUTPUT_FORMATS.find((f) => f.value === props.format)!,
);

const canConvert = computed(() => props.fileCount > 0 && !props.converting);

const onFormatChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value as OutputFormat;
  emit("update:format", val);
}
</script>

<template>
  <div v-if="fileCount > 0" class="convert-panel">
    <h3 class="convert-panel__title">转换设置</h3>
    <div class="convert-panel__row">
      <!-- 目标格式 -->
      <div class="convert-panel__field">
        <label class="convert-panel__label">目标格式</label>
        <div class="convert-panel__select-wrap">
          <select
            class="convert-panel__select"
            :value="format"
            @change="onFormatChange"
          >
            <option
              v-for="fmt in OUTPUT_FORMATS"
              :key="fmt.value"
              :value="fmt.value"
            >
              {{ fmt.label }} {{ fmt.lossless ? '(无损)' : '' }}
            </option>
          </select>
        </div>
      </div>

      <!-- 质量滑块（仅对有损格式显示） -->
      <div v-if="!currentFormatInfo.lossless" class="convert-panel__field">
        <label class="convert-panel__label">
          质量: <strong>{{ quality }}%</strong>
        </label>
        <div class="convert-panel__range-wrap">
          <input
            type="range"
            class="convert-panel__range"
            min="10"
            max="100"
            step="5"
            :value="quality"
            @input="emit('update:quality', Number(($event.target as HTMLInputElement).value))"
          />
          <div class="convert-panel__range-labels">
            <span>10</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量处理 & 转换按钮 -->
    <div class="convert-panel__actions">
      <label class="convert-panel__batch" title="批量处理：为每张图片分别转换；关闭则合并为一张">
        <input
          type="checkbox"
          :checked="batchMode"
          @change="emit('update:batchMode', ($event.target as HTMLInputElement).checked)"
        />
        <span>批量处理</span>
      </label>

      <button
        class="convert-panel__btn"
        :disabled="!canConvert"
        @click="emit('convert')"
      >
        <span v-if="converting" class="convert-panel__spinner"></span>
        <span>{{ converting ? '转换中...' : `开始转换 (${fileCount} 张)` }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.convert-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px 20px;

  &__title {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 600;
    color: #101828;
  }

  &__row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: #667085;
    text-transform: uppercase;
    letter-spacing: 0.4px;

    strong {
      color: #344054;
    }
  }

  &__select-wrap {
    position: relative;
  }

  &__select {
    appearance: none;
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    font-size: 13px;
    color: #344054;
    background: #f9fafb;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  &__select-wrap::after {
    content: '';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid #667085;
    pointer-events: none;
  }

  &__range-wrap {
    width: 100%;
    max-width: 220px;
  }

  &__range {
    width: 100%;
    height: 6px;
    appearance: none;
    background: #e5e7eb;
    border-radius: 3px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #3b82f6;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }
  }

  &__range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #98a2b3;
    margin-top: 2px;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #f0f1f3;
  }

  &__batch {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #344054;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #3b82f6;
      cursor: pointer;
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    background: #3b82f6;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;

    &:hover:not(:disabled) {
      background: #2563eb;
    }

    &:active:not(:disabled) {
      transform: scale(0.97);
    }

    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
