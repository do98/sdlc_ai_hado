<script setup lang="ts">
import { messages } from '../shared/lib/messages';
</script>

<template>
  <main class="flex flex-col gap-3 p-6">
    <h1 class="m-0 text-xl font-semibold">{{ messages.notFound.title }}</h1>
    <RouterLink class="text-primary underline" to="/">{{ messages.notFound.back }}</RouterLink>
  </main>
</template>
