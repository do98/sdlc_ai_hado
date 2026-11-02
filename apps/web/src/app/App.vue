<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useAuthStore } from '../features/auth/authStore';
import ErrorBoundary from '../shared/ui/ErrorBoundary.vue';
import Toaster from '../shared/ui/Toaster.vue';

const auth = useAuthStore();

// Khi tab hiện lại, kiểm tra phiên còn hiệu lực không (phát hiện hết hạn khi người dùng quay lại)
function onVisible(): void {
  if (document.visibilityState === 'visible') void auth.refresh();
}
onMounted(() => document.addEventListener('visibilitychange', onVisible));
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible));
</script>

<template>
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <Toaster />
</template>
