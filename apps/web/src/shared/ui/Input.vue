<script setup lang="ts">
import { computed, useId } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    id?: string;
    type?: string;
    error?: string | null;
    hint?: string;
    /** Hiện bộ đếm "n/maxlength" (đếm theo điểm mã Unicode, cùng quy tắc với backend). */
    counter?: boolean;
    maxlength?: number;
    autocomplete?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  { type: 'text', error: null, counter: false, disabled: false, required: false },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const autoId = useId();
const inputId = computed(() => props.id ?? `input-${autoId}`);
const messageId = computed(() => `${inputId.value}-message`);
const length = computed(() => Array.from(props.modelValue).length);
const counterState = computed(() => {
  if (!props.counter || !props.maxlength) return 'normal';
  if (length.value > props.maxlength) return 'over';
  return length.value >= props.maxlength * 0.9 ? 'near' : 'normal';
});

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="inputId" class="text-sm font-semibold text-text">{{ label }}</label>
    <input
      :id="inputId"
      :value="modelValue"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? messageId : undefined"
      class="min-h-target rounded-control border bg-bg px-3 py-2 text-base text-text placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-text"
      :class="error ? 'border-error' : 'border-border-strong'"
      @input="onInput"
    />
    <div class="flex items-start justify-between gap-2">
      <!-- Vùng thông báo luôn có trong DOM để trình đọc màn hình đọc được khi nội dung đổi -->
      <p
        :id="messageId"
        aria-live="polite"
        class="text-sm"
        :class="error ? 'text-error' : 'text-muted'"
      >
        {{ error ?? hint }}
      </p>
      <span
        v-if="counter && maxlength"
        class="shrink-0 text-sm"
        :class="{
          'text-muted': counterState === 'normal',
          'font-semibold text-warning': counterState === 'near',
          'font-semibold text-error': counterState === 'over',
        }"
        data-testid="counter"
        >{{ length }}/{{ maxlength }}</span
      >
    </div>
  </div>
</template>
