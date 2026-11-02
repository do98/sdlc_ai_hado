<script setup lang="ts">
import { ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastViewport } from 'reka-ui';
import { messages } from '../lib/messages';
import { PERSISTENT_TOAST_MS, SUCCESS_TOAST_MS, useToast } from './toast';

const { items, dismiss } = useToast();
</script>

<template>
  <ToastProvider :label="messages.ui.notifications" swipe-direction="right">
    <!-- Lỗi: type foreground → đọc ngay (assertive) và ở lại; thành công: background → đọc lịch sự, tự ẩn 5 giây -->
    <ToastRoot
      v-for="item in items"
      :key="item.id"
      :type="item.kind === 'error' ? 'foreground' : 'background'"
      :duration="item.kind === 'error' ? PERSISTENT_TOAST_MS : SUCCESS_TOAST_MS"
      class="flex items-start gap-3 rounded-card border p-4 shadow-floating"
      :class="
        item.kind === 'error'
          ? 'border-error bg-error-bg text-error'
          : 'border-success bg-success-bg text-success'
      "
      @update:open="(open: boolean) => !open && dismiss(item.id)"
    >
      <ToastDescription class="flex-1 text-base">
        <span aria-hidden="true">{{ item.kind === 'error' ? '✕' : '✓' }}</span>
        {{ item.text }}
      </ToastDescription>
      <ToastClose
        :aria-label="messages.ui.dismissNotification"
        class="min-h-target min-w-target rounded-control text-base font-semibold"
      >
        <span aria-hidden="true">✕</span>
      </ToastClose>
    </ToastRoot>
    <ToastViewport
      :label="`${messages.ui.notifications} ({hotkey})`"
      class="fixed bottom-0 right-0 z-50 m-4 flex w-full max-w-sm flex-col gap-2 outline-none"
    />
  </ToastProvider>
</template>
