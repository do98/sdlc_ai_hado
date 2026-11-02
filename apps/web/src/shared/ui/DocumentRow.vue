<script setup lang="ts">
import { computed } from 'vue';
import { formatBytes } from '../lib/formatBytes';
import { statusIcon, statusLabel } from '../lib/documentRow';
import type { RowView } from '../lib/documentRow';
import { messages } from '../lib/messages';

// Một hàng tài liệu (CMP DocumentRow, T11.b): tên (văn bản thuần, cắt dài kèm gợi ý đầy đủ), dung lượng,
// trạng thái = biểu tượng + chữ, tiến trình khi đang tải, dòng phụ (trang/lỗi/cảnh báo), nút thao tác (slot).
const props = defineProps<{ view: RowView }>();

const label = computed(() => statusLabel(props.view));
const tone = computed(() => {
  switch (props.view.status) {
    case 'error':
      return 'text-error';
    case 'readyWarning':
      return 'text-warning';
    case 'ready':
      return 'text-success';
    default:
      return 'text-muted';
  }
});
const boxTone = computed(() =>
  props.view.status === 'error'
    ? 'border-error'
    : props.view.status === 'readyWarning'
      ? 'border-warning'
      : 'border-border',
);
</script>

<template>
  <li
    class="flex flex-col gap-1 rounded-card border bg-bg p-3"
    :class="boxTone"
    :data-state="view.dataState"
    :data-status="view.status"
  >
    <div class="flex items-start justify-between gap-2">
      <!-- Tên là văn bản thuần (không HTML); cắt ở 2 dòng, đủ tên nằm ở title -->
      <span
        class="line-clamp-2 min-w-0 break-words text-base font-semibold"
        :title="view.name"
        data-testid="doc-name"
        >{{ view.name }}</span
      >
      <span class="shrink-0 text-sm text-muted">{{ formatBytes(view.sizeBytes) }}</span>
    </div>

    <p class="m-0 flex items-center gap-2 text-sm font-semibold" :class="tone">
      <span aria-hidden="true">{{ statusIcon(view.status) }}</span>
      <span data-testid="doc-status">{{ label }}</span>
    </p>

    <div
      v-if="view.status === 'uploading'"
      role="progressbar"
      :aria-label="messages.upload.progressLabel(view.name)"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="view.progress ?? 0"
      class="h-2 w-full overflow-hidden rounded-pill bg-disabled-bg"
    >
      <div class="h-2 bg-primary" :style="{ width: (view.progress ?? 0) + '%' }" />
    </div>

    <p v-if="view.detail" class="m-0 text-sm" :class="tone" data-testid="doc-detail">
      {{ view.detail }}
    </p>

    <div class="flex gap-2 empty:hidden"><slot name="actions" /></div>
  </li>
</template>
