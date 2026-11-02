<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui';
import { messages } from '../lib/messages';

// Reka UI lo bẫy focus, đóng bằng Esc, trả focus về phần tử đã mở và gắn aria-modal.
defineProps<{ open: boolean; title: string; description?: string }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
</script>

<template>
  <DialogRoot :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-overlay" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card bg-bg p-6 text-text shadow-floating"
      >
        <DialogTitle class="text-lg font-semibold">{{ title }}</DialogTitle>
        <!-- Luôn có mô tả để trình đọc màn hình có ngữ cảnh; khi không truyền thì ẩn thị giác và lặp lại tiêu đề -->
        <DialogDescription :class="description ? 'mt-2 text-base text-muted' : 'sr-only'">
          {{ description ?? title }}
        </DialogDescription>
        <div class="mt-4"><slot /></div>
        <div class="mt-6 flex justify-end gap-2">
          <slot name="footer">
            <DialogClose as-child>
              <button
                type="button"
                class="min-h-target min-w-target rounded-control border border-primary bg-bg px-4 py-2 text-base font-semibold text-primary"
              >
                {{ messages.ui.close }}
              </button>
            </DialogClose>
          </slot>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
