<script setup lang="ts">
import { computed } from 'vue';
import type { DocumentSummary } from '../../shared/api';
import { viewOfDocument } from '../../shared/lib/documentRow';
import { messages } from '../../shared/lib/messages';
import Button from '../../shared/ui/Button.vue';
import DocumentRow from '../../shared/ui/DocumentRow.vue';
import InlineAlert from '../../shared/ui/InlineAlert.vue';
import Skeleton from '../../shared/ui/Skeleton.vue';
import type { ChannelState } from './documentEvents';

// Danh sách tài liệu workspace (T11): mới nhất trước (thứ tự do máy chủ trả); hàng đang tải lên nằm ở vùng
// tải lên ngay phía trên. Có trạng thái đang tải, lỗi, trống; chỉ báo mất kết nối thời gian thực không chặn thao tác.
const props = defineProps<{
  items: DocumentSummary[];
  loading: boolean;
  failed: boolean;
  connection: ChannelState;
  /** Thông báo cho trình đọc màn hình khi một tài liệu đổi sang Sẵn sàng/Lỗi. */
  announcement: string;
  /** Đang có hàng tải lên cục bộ (thì chưa coi là "trống"). */
  hasLocalRows: boolean;
}>();
const emit = defineEmits<{ upload: []; reload: [] }>();

const views = computed(() => props.items.map(viewOfDocument));
const showEmpty = computed(
  () => !props.loading && !props.failed && props.items.length === 0 && !props.hasLocalRows,
);
</script>

<template>
  <section class="mt-4 flex flex-col gap-3" data-testid="document-list">
    <!-- Vùng thông báo luôn có mặt trong DOM để trình đọc màn hình nhận được thay đổi -->
    <p class="sr-only" role="status" aria-live="polite" data-testid="doc-announcer">
      {{ announcement }}
    </p>

    <InlineAlert v-if="connection === 'reconnecting'" variant="warning" data-testid="conn-lost">
      {{ messages.documents.connectionLost }}
    </InlineAlert>

    <Skeleton v-if="loading" :label="messages.documents.loading" class="h-20 w-full" />

    <div v-else-if="failed" class="flex flex-col gap-2">
      <InlineAlert variant="error">{{ messages.documents.loadError }}</InlineAlert>
      <Button variant="secondary" @click="emit('reload')">{{ messages.documents.reload }}</Button>
    </div>

    <div
      v-else-if="showEmpty"
      class="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong p-6 text-center"
      data-testid="empty-state"
    >
      <span aria-hidden="true" class="text-xl text-subtle">▤</span>
      <p class="m-0 text-base font-semibold">{{ messages.documents.empty.title }}</p>
      <p class="m-0 text-sm text-muted">{{ messages.documents.empty.description }}</p>
      <Button @click="emit('upload')">{{ messages.upload.button }}</Button>
    </div>

    <ul
      v-else-if="views.length > 0"
      class="m-0 flex list-none flex-col gap-2 p-0"
      :aria-label="messages.documents.listLabel"
      data-testid="documents"
    >
      <DocumentRow v-for="v in views" :key="v.key" :view="v" />
    </ul>
  </section>
</template>
