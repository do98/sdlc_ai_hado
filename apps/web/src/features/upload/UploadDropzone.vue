<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { uploadDocument } from '../../shared/api';
import { LIMITS } from '../../shared/lib/limits';
import { messages } from '../../shared/lib/messages';
import type { RowView } from '../../shared/lib/documentRow';
import Button from '../../shared/ui/Button.vue';
import DocumentRow from '../../shared/ui/DocumentRow.vue';
import { createUploadQueue } from './uploadQueue';
import type { UploadFn, UploadItem } from './uploadQueue';

// Vùng tải lên (SCR-03): nút "Tải PDF lên" mở hộp chọn tệp (dùng được bằng bàn phím), kéo-thả tệp vào cửa sổ
// hiện lớp phủ toàn màn hình, và hàng đợi hiển thị tiến trình/lỗi từng tệp.
const props = defineProps<{
  /** Số tài liệu đã có trong workspace (để biết còn chỗ không). */
  existingCount: number;
  /** Cho phép thay hàm tải lên (dùng khi kiểm thử). */
  uploadFn?: UploadFn;
  /** id các tài liệu đã có trong danh sách máy chủ: hàng cục bộ ACCEPTED có id trùng sẽ được gỡ (đã có bản ghi thật). */
  serverIds?: string[];
  /** Ẩn nút "Tải PDF lên" (khi trạng thái trống đã có nút riêng); dùng pick() để mở hộp chọn tệp. */
  hideButton?: boolean;
}>();
const emit = defineEmits<{ accepted: [] }>();

const queue = createUploadQueue({
  upload: props.uploadFn ?? uploadDocument,
  existingCount: () => props.existingCount,
  onAccepted: () => emit('accepted'),
});

const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
let depth = 0;

const openCount = computed(
  () => queue.items.filter((i) => ['QUEUED', 'UPLOADING', 'RETRYING'].includes(i.state)).length,
);
// ACCEPTED chưa có trong danh sách máy chủ vẫn chiếm một chỗ (tránh bộ đếm tụt tạm thời trước khi danh sách làm mới)
const notListedYet = computed(
  () =>
    queue.items.filter(
      (i) => i.state === 'ACCEPTED' && !(props.serverIds ?? []).includes(i.serverId ?? ''),
    ).length,
);
const used = computed(() => props.existingCount + openCount.value + notListedYet.value);
const full = computed(() => used.value >= LIMITS.maxDocuments);

function pick(): void {
  input.value?.click();
}

function onPicked(event: Event): void {
  const el = event.target as HTMLInputElement;
  const files = Array.from(el.files ?? []);
  el.value = ''; // cho phép chọn lại đúng tệp vừa chọn
  if (files.length > 0) void queue.add(files);
}

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

function onDragEnter(e: DragEvent): void {
  if (!hasFiles(e)) return;
  e.preventDefault();
  depth += 1;
  dragging.value = true;
}
function onDragOver(e: DragEvent): void {
  if (!hasFiles(e)) return;
  e.preventDefault(); // bắt buộc để được phép thả
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}
function onDragLeave(e: DragEvent): void {
  if (!hasFiles(e)) return;
  depth = Math.max(0, depth - 1);
  if (depth === 0) dragging.value = false;
}
function onDrop(e: DragEvent): void {
  if (!hasFiles(e)) return;
  e.preventDefault(); // không để trình duyệt mở tệp PDF thay vì tải lên
  depth = 0;
  dragging.value = false;
  const files = Array.from(e.dataTransfer?.files ?? []);
  if (files.length > 0) void queue.add(files);
}

onMounted(() => {
  window.addEventListener('dragenter', onDragEnter);
  window.addEventListener('dragover', onDragOver);
  window.addEventListener('dragleave', onDragLeave);
  window.addEventListener('drop', onDrop);
});
onBeforeUnmount(() => {
  window.removeEventListener('dragenter', onDragEnter);
  window.removeEventListener('dragover', onDragOver);
  window.removeEventListener('dragleave', onDragLeave);
  window.removeEventListener('drop', onDrop);
  queue.dispose();
});

const isOpen = (item: UploadItem) => ['QUEUED', 'UPLOADING', 'RETRYING'].includes(item.state);

// Hàng cục bộ → mô hình hiển thị chung với danh sách tài liệu (T11.b): Chờ tải · Đang tải lên x% · Đang xử lý · Lỗi
function viewOf(item: UploadItem): RowView {
  const common = {
    key: String(item.id),
    name: item.name,
    sizeBytes: item.size,
    dataState: item.state,
  };
  switch (item.state) {
    case 'QUEUED':
      return { ...common, status: 'queued', progress: null, detail: null };
    case 'UPLOADING':
      return { ...common, status: 'uploading', progress: item.progress, detail: null };
    case 'RETRYING':
      return {
        ...common,
        status: 'uploading',
        progress: item.progress,
        detail: messages.upload.state.retrying(item.retryInSeconds),
      };
    case 'ACCEPTED':
      return {
        ...common,
        status: 'processing',
        progress: null,
        detail: messages.upload.state.accepted,
      };
    default:
      return {
        ...common,
        status: 'error',
        progress: null,
        detail: item.error ?? messages.upload.state.failed,
      };
  }
}

// Có bản ghi thật trong danh sách (khớp id trả về từ IF-03) thì gỡ hàng cục bộ tương ứng
watch(
  () => props.serverIds,
  (ids) => {
    for (const item of [...queue.items]) {
      if (item.state === 'ACCEPTED' && item.serverId && ids?.includes(item.serverId)) {
        queue.dismiss(item.id);
      }
    }
  },
);

defineExpose({ queue, pick });
</script>

<template>
  <section class="mt-4 flex flex-col gap-3" data-testid="upload">
    <input
      ref="input"
      type="file"
      accept="application/pdf,.pdf"
      multiple
      hidden
      data-testid="file-input"
      :aria-label="messages.upload.fileInputLabel"
      @change="onPicked"
    />
    <Button v-if="!hideButton" :disabled="full" @click="pick">
      {{ full ? messages.upload.buttonFull : messages.upload.button }}
    </Button>
    <p class="m-0 text-sm text-muted">{{ messages.upload.hint }}</p>
    <p
      class="m-0 text-sm"
      :class="full ? 'font-semibold text-error' : 'text-muted'"
      data-testid="slots"
    >
      {{ messages.upload.counter(used, LIMITS.maxDocuments) }}
    </p>

    <!-- Mỗi thay đổi trạng thái được thông báo cho trình đọc màn hình -->
    <p class="sr-only" role="status" aria-live="polite" data-testid="announcer">
      {{ queue.status.announcement }}
    </p>

    <ul
      v-if="queue.items.length > 0"
      class="m-0 flex list-none flex-col gap-2 p-0"
      :aria-label="messages.upload.queueLabel"
    >
      <DocumentRow v-for="item in queue.items" :key="item.id" :view="viewOf(item)">
        <template #actions>
          <Button
            v-if="isOpen(item)"
            variant="secondary"
            :aria-label="messages.upload.action.cancelAria(item.name)"
            @click="queue.cancel(item.id)"
          >
            {{ messages.upload.action.cancel }}
          </Button>
          <Button
            v-if="item.state === 'FAILED'"
            :aria-label="messages.upload.action.retryAria(item.name)"
            @click="queue.retry(item.id)"
          >
            {{ messages.upload.action.retry }}
          </Button>
          <Button
            v-if="item.state === 'FAILED' || item.state === 'REJECTED'"
            variant="secondary"
            :aria-label="messages.upload.action.dismissAria(item.name)"
            @click="queue.dismiss(item.id)"
          >
            {{ messages.upload.action.dismiss }}
          </Button>
        </template>
      </DocumentRow>
    </ul>

    <!-- Lớp phủ toàn màn hình khi kéo tệp vào cửa sổ -->
    <div
      v-if="dragging"
      class="fixed inset-0 z-40 flex items-center justify-center bg-overlay p-6"
      data-testid="drop-overlay"
    >
      <div class="max-w-md rounded-card bg-bg p-8 text-center shadow-floating">
        <p class="m-0 text-lg font-semibold">{{ messages.upload.dropTitle }}</p>
        <p class="m-0 mt-2 text-base text-muted">{{ messages.upload.dropHint }}</p>
      </div>
    </div>
  </section>
</template>
