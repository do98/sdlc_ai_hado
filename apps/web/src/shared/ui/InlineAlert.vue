<script setup lang="ts">
import { computed } from 'vue';

// Thông báo gắn với một vùng (CMP-18). Trạng thái không chỉ dựa vào màu: luôn có biểu tượng chữ.
// Lỗi cần được đọc ngay (role="alert"); các loại còn lại đọc lịch sự (role="status").
const props = withDefaults(defineProps<{ variant?: 'info' | 'success' | 'warning' | 'error' }>(), {
  variant: 'info',
});

const style = computed(() => {
  switch (props.variant) {
    case 'error':
      return { box: 'border-error bg-error-bg text-error', icon: '✕' };
    case 'warning':
      return { box: 'border-warning bg-warning-bg text-warning', icon: '⚠' };
    case 'success':
      return { box: 'border-success bg-success-bg text-success', icon: '✓' };
    default:
      return { box: 'border-primary bg-surface-user text-text', icon: 'ℹ' };
  }
});
</script>

<template>
  <p
    :role="variant === 'error' ? 'alert' : 'status'"
    class="m-0 flex items-start gap-2 rounded-control border px-3 py-2 text-base"
    :class="style.box"
  >
    <span aria-hidden="true" class="font-semibold">{{ style.icon }}</span>
    <span><slot /></span>
  </p>
</template>
