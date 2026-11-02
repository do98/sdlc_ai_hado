import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { listDocuments, queryKeys } from '../../shared/api';
import type { DocumentList, DocumentUpdatedEvent, StreamEvents } from '../../shared/api';
import { messageForDocumentError } from '../../shared/lib/documentRow';
import { messages } from '../../shared/lib/messages';
import { createDocumentEventsChannel } from './documentEvents';

/** T11.a: danh sách tài liệu (IF-02) với khóa truy vấn ['documents', {}]. Cập nhật đến từ SSE, không thăm dò. */
export function useDocuments() {
  return useQuery({ queryKey: queryKeys.documents(), queryFn: listDocuments, retry: false });
}

/**
 * Áp một sự kiện `document.updated` vào cache bằng setQueryData (không tải lại cả danh sách). Trả về thông báo
 * cho trình đọc màn hình khi một tài liệu vừa chuyển từ "đang xử lý" sang "sẵn sàng"/"lỗi". Tài liệu chưa có
 * trong cache (ví dụ do người khác tải lên) → làm mới danh sách.
 */
export function applyDocumentUpdate(
  queryClient: QueryClient,
  event: DocumentUpdatedEvent,
): string | null {
  const key = queryKeys.documents();
  const list = queryClient.getQueryData<DocumentList>(key);
  const index = list?.items.findIndex((d) => d.id === event.id) ?? -1;
  if (!list || index < 0) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.documentsAll });
    return null;
  }
  const prev = list.items[index];
  const next = {
    ...prev,
    status: event.status,
    errorCode: event.errorCode,
    warning: event.warning,
    pageCount: event.pageCount,
  };
  const items = list.items.slice();
  items[index] = next;
  queryClient.setQueryData<DocumentList>(key, { ...list, items });

  if (prev.status !== 'PROCESSING' || next.status === 'PROCESSING') return null;
  if (next.status === 'ERROR') {
    return messages.documents.announce.error(next.name, messageForDocumentError(next.errorCode));
  }
  return next.warning
    ? messages.documents.announce.readyWarning(next.name)
    : messages.documents.announce.ready(next.name);
}

/**
 * Mở kênh sự kiện workspace khi component gắn vào (đã đăng nhập) và đóng khi gỡ. Trả về trạng thái kết nối
 * và thông báo cho vùng aria-live.
 */
export function useDocumentEvents(connect?: StreamEvents) {
  const queryClient = useQueryClient();
  const announcement = ref('');
  const channel = createDocumentEventsChannel({
    connect,
    onUpdate: (event) => {
      const text = applyDocumentUpdate(queryClient, event);
      if (text) announcement.value = text;
    },
    onResync: () => void queryClient.invalidateQueries({ queryKey: queryKeys.documentsAll }),
  });
  onMounted(() => channel.start());
  onBeforeUnmount(() => channel.stop());
  return { connection: channel.state, announcement };
}
