<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import { messages } from '../lib/messages';
import Button from './Button.vue';

// Bắt lỗi trong lúc render/vòng đời của cây con để lỗi không làm trắng cả trang.
const error = ref<unknown>(null);
const emit = defineEmits<{ error: [error: unknown] }>();

onErrorCaptured((e) => {
  error.value = e;
  emit('error', e);
  return false; // đã xử lý, không lan lên trên
});

function retry(): void {
  error.value = null;
}

function reload(): void {
  window.location.reload();
}
</script>

<template>
  <div v-if="error" role="alert" class="mx-auto flex max-w-lg flex-col gap-4 p-6">
    <h1 class="text-xl font-semibold text-error">{{ messages.errorBoundary.title }}</h1>
    <p class="text-base text-text">{{ messages.errorBoundary.description }}</p>
    <div class="flex gap-2">
      <Button @click="retry">{{ messages.errorBoundary.retry }}</Button>
      <Button variant="secondary" @click="reload">{{ messages.errorBoundary.reload }}</Button>
    </div>
  </div>
  <slot v-else />
</template>
