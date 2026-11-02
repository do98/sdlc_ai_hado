<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '../../shared/api';
import { messages } from '../../shared/lib/messages';
import { safeRedirect } from '../../shared/lib/safeRedirect';
import Button from '../../shared/ui/Button.vue';
import InlineAlert from '../../shared/ui/InlineAlert.vue';
import Input from '../../shared/ui/Input.vue';
import { useAuthStore } from './authStore';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const username = ref('');
const password = ref('');
const submitting = ref(false);
const error = ref<string | null>(null);

const expiredNotice = computed(() => route.query.reason === 'expired');
const canSubmit = computed(
  () => username.value.trim() !== '' && password.value !== '' && !submitting.value,
);

function messageFor(e: unknown): string {
  // ApiError.message đã là thông điệp tiếng Việt chung theo mã lỗi (401 và 423 trùng nhau, không nêu lý do)
  return e instanceof ApiError ? e.message : messages.auth.unexpected;
}

async function onSubmit(): Promise<void> {
  if (!canSubmit.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await auth.login(username.value.trim(), password.value);
    password.value = '';
    await router.replace(safeRedirect(route.query.redirect));
  } catch (e) {
    error.value = messageFor(e);
    password.value = '';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-surface-panel p-4">
    <form
      class="flex w-full max-w-sm flex-col gap-3 rounded-card border border-border bg-bg p-6"
      novalidate
      @submit.prevent="onSubmit"
    >
      <h1 class="m-0 text-lg font-semibold">{{ messages.appName }}</h1>
      <h2 class="m-0 text-base font-semibold text-muted">{{ messages.auth.title }}</h2>

      <InlineAlert v-if="expiredNotice && !error">{{ messages.auth.expired }}</InlineAlert>
      <InlineAlert v-if="error" variant="error">{{ error }}</InlineAlert>

      <Input
        id="username"
        v-model="username"
        :label="messages.auth.username"
        autocomplete="username"
        :maxlength="100"
        required
      />
      <Input
        id="password"
        v-model="password"
        :label="messages.auth.password"
        type="password"
        autocomplete="current-password"
        :maxlength="1024"
        required
      />

      <Button type="submit" :disabled="!canSubmit" :loading="submitting">
        {{ submitting ? messages.auth.submitting : messages.auth.submit }}
      </Button>
    </form>
  </main>
</template>
