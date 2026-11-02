<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../features/auth/authStore';
import QuestionInput from '../features/conversation/QuestionInput.vue';
import DocumentList from '../features/documents/DocumentList.vue';
import { useDocumentEvents, useDocuments } from '../features/documents/useDocuments';
import UploadDropzone from '../features/upload/UploadDropzone.vue';
import { queryKeys } from '../shared/api';
import AppShell from './AppShell.vue';

const auth = useAuthStore();
const router = useRouter();
const queryClient = useQueryClient();

// Danh sách (IF-02) + cập nhật thời gian thực qua kênh sự kiện (IF-06, ALG-03); không thăm dò
const documents = useDocuments();
const { connection, announcement } = useDocumentEvents();

const items = computed(() => documents.data.value?.items ?? []);
const existingCount = computed(() => documents.data.value?.count ?? 0);
const serverIds = computed(() => items.value.map((d) => d.id));
const hasReady = computed(() => items.value.some((d) => d.status === 'READY'));

const dropzone = ref<InstanceType<typeof UploadDropzone> | null>(null);
const hasLocalRows = computed(() => (dropzone.value?.queue.items.length ?? 0) > 0);
// Trạng thái trống có nút "Tải PDF lên" riêng thì ẩn nút của vùng tải lên để không có hai nút trùng tên
const showEmptyState = computed(
  () =>
    !documents.isPending.value &&
    !documents.isError.value &&
    items.value.length === 0 &&
    !hasLocalRows.value,
);

function onAccepted(): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.documentsAll });
}

async function onLogout(): Promise<void> {
  await auth.logout();
  await router.replace({ name: 'login' });
}
</script>

<template>
  <AppShell :username="auth.user?.username" @logout="onLogout">
    <template #documents>
      <UploadDropzone
        ref="dropzone"
        :existing-count="existingCount"
        :server-ids="serverIds"
        :hide-button="showEmptyState"
        @accepted="onAccepted"
      />
      <DocumentList
        :items="items"
        :loading="documents.isPending.value"
        :failed="documents.isError.value"
        :connection="connection"
        :announcement="announcement"
        :has-local-rows="hasLocalRows"
        @upload="dropzone?.pick()"
        @reload="documents.refetch()"
      />
    </template>
    <template #conversation>
      <QuestionInput :has-ready-documents="hasReady" />
    </template>
  </AppShell>
</template>
