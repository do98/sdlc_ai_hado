<script setup lang="ts">
// Khung chờ. Truyền class để đặt kích thước (ví dụ "h-4 w-full"). Nếu có `label`, vùng được thông báo là
// đang tải cho trình đọc màn hình (role="status"); nếu không thì chỉ là trang trí (aria-hidden).
defineOptions({ inheritAttrs: false });
defineProps<{ label?: string }>();
</script>

<template>
  <div v-if="label" role="status">
    <span class="sr-only">{{ label }}</span>
    <div
      aria-hidden="true"
      v-bind="$attrs"
      class="animate-pulse rounded-control bg-disabled-bg motion-reduce:animate-none"
    />
  </div>
  <div
    v-else
    aria-hidden="true"
    v-bind="$attrs"
    class="animate-pulse rounded-control bg-disabled-bg motion-reduce:animate-none"
  />
</template>
