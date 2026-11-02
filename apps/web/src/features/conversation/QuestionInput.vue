<script setup lang="ts">
import { messages } from '../../shared/lib/messages';

// Ô nhập câu hỏi (ST-04): bị khóa kèm giải thích khi chưa có tài liệu sẵn sàng. Việc gửi câu hỏi làm ở T14–T16,
// nên khi đã có tài liệu sẵn sàng ô vẫn khóa nhưng giải thích rằng tính năng sẽ có ở bước sau.
defineProps<{ hasReadyDocuments: boolean }>();
</script>

<template>
  <div class="mt-4 flex flex-col gap-2" data-testid="question-input">
    <label for="question-box" class="text-base font-semibold">
      {{ messages.conversation.inputLabel }}
    </label>
    <textarea
      id="question-box"
      disabled
      rows="2"
      :placeholder="messages.conversation.inputPlaceholder"
      aria-describedby="question-box-help"
      class="min-h-target rounded-control border border-border-strong bg-bg px-3 py-2 text-base text-text placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-text"
    />
    <p id="question-box-help" class="m-0 text-sm text-muted" data-testid="question-help">
      {{
        hasReadyDocuments ? messages.conversation.lockedSoon : messages.conversation.lockedNoReady
      }}
    </p>
  </div>
</template>
