<script setup lang="ts">
import { computed } from 'vue';
import { messages } from '../lib/messages';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger';
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { variant: 'primary', type: 'button', loading: false, disabled: false },
);

// Đang tải cũng vô hiệu hóa để không gửi trùng
const isDisabled = computed(() => props.disabled || props.loading);

const variantClasses = computed(() => {
  if (isDisabled.value)
    return 'bg-disabled-bg text-disabled-text border-transparent cursor-not-allowed';
  switch (props.variant) {
    case 'secondary':
      return 'bg-bg text-primary border-primary hover:bg-surface-user';
    case 'danger':
      return 'bg-error text-on-primary border-transparent hover:opacity-90';
    default:
      return 'bg-primary text-on-primary border-transparent hover:bg-primary-hover';
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    class="inline-flex min-h-target min-w-target items-center justify-center gap-2 rounded-control border px-4 py-2 text-base font-semibold transition-colors duration-fast"
    :class="variantClasses"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <slot />
    <span v-if="loading" class="sr-only">{{ messages.ui.loading }}</span>
  </button>
</template>
