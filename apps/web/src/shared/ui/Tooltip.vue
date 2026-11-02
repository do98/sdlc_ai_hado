<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui';

// Gợi ý hiện khi rê chuột HOẶC focus bàn phím; slot mặc định là phần tử kích hoạt (nhận focus được).
defineProps<{ text: string; side?: 'top' | 'right' | 'bottom' | 'left' }>();
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <TooltipRoot>
      <TooltipTrigger as-child><slot /></TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side ?? 'top'"
          :side-offset="4"
          class="z-50 max-w-xs rounded-control bg-text px-3 py-2 text-sm text-bg shadow-floating"
        >
          {{ text }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
