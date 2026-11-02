<script setup lang="ts">
import { ref } from 'vue';
import { messages } from '../shared/lib/messages';
import Button from '../shared/ui/Button.vue';
import Dialog from '../shared/ui/Dialog.vue';
import InlineAlert from '../shared/ui/InlineAlert.vue';
import Input from '../shared/ui/Input.vue';
import Skeleton from '../shared/ui/Skeleton.vue';
import { useToast } from '../shared/ui/toast';
import Tooltip from '../shared/ui/Tooltip.vue';

// Trang thử bộ thành phần (chỉ đăng ký route khi chạy dev): đủ 6 component × 3 trạng thái (bình thường, đang tải, lỗi).
const d = messages.demo;
const dialogOpen = ref(false);
const text = ref('');
const longText = ref(d.sampleQuestion.repeat(35));
const toast = useToast();
</script>

<template>
  <main class="mx-auto flex max-w-3xl flex-col gap-8 p-6">
    <header>
      <h1 class="m-0 text-xl font-semibold">{{ d.title }}</h1>
      <p class="m-0 text-base text-muted">{{ d.subtitle }}</p>
    </header>

    <section class="flex flex-col gap-3" aria-labelledby="demo-buttons">
      <h2 id="demo-buttons" class="m-0 text-lg font-semibold">{{ d.buttons }}</h2>
      <div class="flex flex-wrap gap-3">
        <Button>{{ d.primary }}</Button>
        <Button variant="secondary">{{ d.secondary }}</Button>
        <Button variant="danger">{{ d.danger }}</Button>
        <Button disabled>{{ d.disabled }}</Button>
        <Button loading>{{ d.loading }}</Button>
      </div>
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="demo-inputs">
      <h2 id="demo-inputs" class="m-0 text-lg font-semibold">{{ d.inputs }}</h2>
      <Input v-model="text" :label="d.inputNormal" :hint="d.inputNormalHint" />
      <Input v-model="longText" :label="d.inputCounter" counter :maxlength="2000" />
      <Input model-value="" :label="d.inputError" :error="d.inputErrorText" />
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="demo-dialog">
      <h2 id="demo-dialog" class="m-0 text-lg font-semibold">{{ d.dialog }}</h2>
      <div>
        <Button variant="secondary" @click="dialogOpen = true">{{ d.openDialog }}</Button>
      </div>
      <Dialog v-model:open="dialogOpen" :title="d.dialogTitle" :description="d.dialogDescription" />
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="demo-toast">
      <h2 id="demo-toast" class="m-0 text-lg font-semibold">{{ d.toast }}</h2>
      <div class="flex flex-wrap gap-3">
        <Button variant="secondary" @click="toast.success(d.toastSuccessText)">{{
          d.toastSuccess
        }}</Button>
        <Button variant="secondary" @click="toast.error(d.toastErrorText)">{{
          d.toastError
        }}</Button>
      </div>
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="demo-tooltip">
      <h2 id="demo-tooltip" class="m-0 text-lg font-semibold">{{ d.tooltip }}</h2>
      <div>
        <Tooltip :text="d.tooltipText">
          <Button variant="secondary">{{ d.tooltipTrigger }}</Button>
        </Tooltip>
      </div>
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="demo-skeleton">
      <h2 id="demo-skeleton" class="m-0 text-lg font-semibold">{{ d.skeleton }}</h2>
      <Skeleton :label="d.skeletonLabel" class="h-4 w-full" />
      <Skeleton class="h-4 w-3/4" />
      <Skeleton class="h-12 w-full" />
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="demo-alerts">
      <h2 id="demo-alerts" class="m-0 text-lg font-semibold">{{ d.alerts }}</h2>
      <InlineAlert>{{ d.alertInfo }}</InlineAlert>
      <InlineAlert variant="success">{{ d.alertSuccess }}</InlineAlert>
      <InlineAlert variant="warning">{{ d.alertWarning }}</InlineAlert>
      <InlineAlert variant="error">{{ d.alertError }}</InlineAlert>
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="demo-states">
      <h2 id="demo-states" class="m-0 text-lg font-semibold">{{ d.states }}</h2>
      <div class="grid gap-3 md:grid-cols-3">
        <div class="flex flex-col gap-2 rounded-card border border-border p-4">
          <h3 class="m-0 text-base font-semibold">{{ d.stateNormal }}</h3>
          <Button>{{ d.primary }}</Button>
        </div>
        <div class="flex flex-col gap-2 rounded-card border border-border p-4">
          <h3 class="m-0 text-base font-semibold">{{ d.stateLoading }}</h3>
          <Button loading>{{ d.loading }}</Button>
          <Skeleton class="h-4 w-full" />
        </div>
        <div class="flex flex-col gap-2 rounded-card border border-border p-4">
          <h3 class="m-0 text-base font-semibold">{{ d.stateError }}</h3>
          <Input model-value="" :label="d.inputError" :error="d.inputErrorText" />
        </div>
      </div>
    </section>
  </main>
</template>
