<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Button from '../shared/ui/Button.vue';
import { messages } from '../shared/lib/messages';
import { useBreakpoint } from './useBreakpoint';

// Khung 3 cột: Tài liệu · Hội thoại · Nguồn (Blueprint §3.8.2).
//  - desktop (≥ 1280): ba cột cố định.
//  - tablet (768–1279): hội thoại rộng toàn chiều; ngăn tài liệu và ngăn nguồn là ngăn trượt mở bằng nút.
//  - mobile (< 768): một khu vực mỗi lần, chuyển bằng thanh tab ở đáy; ngăn nguồn toàn màn hình.
defineProps<{ username?: string }>();
const emit = defineEmits<{ logout: [] }>();

const breakpoint = useBreakpoint();
const docsOpen = ref(false);
const sourceOpen = ref(false);
const tab = ref<'documents' | 'conversation'>('conversation');

// Quay về desktop thì đóng các ngăn trượt (đã hiển thị cố định)
watch(breakpoint, (b) => {
  if (b === 'desktop') {
    docsOpen.value = false;
    sourceOpen.value = false;
  }
});

const showDocs = computed(() =>
  breakpoint.value === 'desktop'
    ? true
    : breakpoint.value === 'tablet'
      ? docsOpen.value
      : tab.value === 'documents',
);
const showChat = computed(() => breakpoint.value !== 'mobile' || tab.value === 'conversation');
const showSource = computed(() => (breakpoint.value === 'desktop' ? true : sourceOpen.value));
const docsIsDrawer = computed(() => breakpoint.value === 'tablet');
const sourceIsDrawer = computed(() => breakpoint.value !== 'desktop');

function closeDrawers(): void {
  docsOpen.value = false;
  sourceOpen.value = false;
}

defineExpose({ openSource: () => (sourceOpen.value = true), breakpoint });
</script>

<template>
  <div
    class="flex h-screen flex-col bg-bg text-text"
    data-testid="app-shell"
    :data-breakpoint="breakpoint"
    @keydown.esc="closeDrawers"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-control focus:bg-bg focus:px-3 focus:py-2"
    >
      {{ messages.layout.skipToContent }}
    </a>

    <header class="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
      <div class="flex items-center gap-3">
        <Button
          v-if="docsIsDrawer"
          variant="secondary"
          :aria-expanded="docsOpen"
          aria-controls="panel-documents"
          @click="docsOpen = !docsOpen"
        >
          {{ messages.layout.openDocuments }}
        </Button>
        <h1 class="m-0 text-lg font-semibold">{{ messages.appName }}</h1>
      </div>
      <div class="flex items-center gap-3" :aria-label="messages.layout.userMenu" role="group">
        <Button
          v-if="sourceIsDrawer"
          variant="secondary"
          :aria-expanded="sourceOpen"
          aria-controls="panel-source"
          @click="sourceOpen = !sourceOpen"
        >
          {{ messages.layout.openSource }}
        </Button>
        <span v-if="username" class="text-base text-muted">{{
          messages.auth.greeting(username)
        }}</span>
        <Button variant="secondary" @click="emit('logout')">{{ messages.auth.logout }}</Button>
      </div>
    </header>

    <div class="relative flex min-h-0 flex-1">
      <aside
        v-show="showDocs"
        id="panel-documents"
        :aria-label="messages.layout.documents"
        class="overflow-y-auto border-r border-border bg-surface-panel p-4"
        :class="
          docsIsDrawer
            ? 'absolute inset-y-0 left-0 z-30 w-documents shadow-floating'
            : breakpoint === 'mobile'
              ? 'w-full'
              : 'w-documents shrink-0'
        "
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="m-0 text-base font-semibold">{{ messages.layout.documents }}</h2>
          <Button
            v-if="docsIsDrawer"
            variant="secondary"
            :aria-label="messages.layout.closePanel"
            @click="docsOpen = false"
          >
            <span aria-hidden="true">✕</span>
          </Button>
        </div>
        <slot name="documents">
          <p class="mt-4 text-base text-muted">{{ messages.layout.documentsEmpty }}</p>
        </slot>
      </aside>

      <main
        v-show="showChat"
        id="main-content"
        class="flex min-w-0 flex-1 flex-col overflow-y-auto p-4"
        tabindex="-1"
      >
        <h2 class="m-0 text-base font-semibold">{{ messages.layout.conversation }}</h2>
        <slot name="conversation">
          <p class="mt-4 text-base text-muted">{{ messages.layout.conversationEmpty }}</p>
        </slot>
      </main>

      <aside
        v-show="showSource"
        id="panel-source"
        :aria-label="messages.layout.source"
        class="overflow-y-auto border-l border-border bg-surface-panel p-4"
        :class="
          sourceIsDrawer
            ? breakpoint === 'mobile'
              ? 'absolute inset-0 z-30'
              : 'absolute inset-y-0 right-0 z-30 w-source shadow-floating'
            : 'w-source shrink-0'
        "
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="m-0 text-base font-semibold">{{ messages.layout.source }}</h2>
          <Button
            v-if="sourceIsDrawer"
            variant="secondary"
            :aria-label="messages.layout.closePanel"
            @click="sourceOpen = false"
          >
            <span aria-hidden="true">✕</span>
          </Button>
        </div>
        <slot name="source">
          <p class="mt-4 text-base text-muted">{{ messages.layout.sourceEmpty }}</p>
        </slot>
      </aside>
    </div>

    <nav
      v-if="breakpoint === 'mobile'"
      :aria-label="messages.layout.tabs"
      class="flex border-t border-border bg-bg"
    >
      <button
        type="button"
        class="min-h-target flex-1 px-4 py-3 text-base"
        :class="
          tab === 'documents'
            ? 'border-t-2 border-primary font-semibold text-primary'
            : 'text-muted'
        "
        :aria-current="tab === 'documents' ? 'page' : undefined"
        @click="tab = 'documents'"
      >
        {{ messages.layout.documents }}
      </button>
      <button
        type="button"
        class="min-h-target flex-1 px-4 py-3 text-base"
        :class="
          tab === 'conversation'
            ? 'border-t-2 border-primary font-semibold text-primary'
            : 'text-muted'
        "
        :aria-current="tab === 'conversation' ? 'page' : undefined"
        @click="tab = 'conversation'"
      >
        {{ messages.layout.conversation }}
      </button>
    </nav>
  </div>
</template>
