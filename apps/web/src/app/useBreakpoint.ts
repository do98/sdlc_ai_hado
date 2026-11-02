import { onBeforeUnmount, onMounted, ref } from 'vue';

/** desktop ≥ 1280 px (3 cột) · tablet 768–1279 px (ngăn tài liệu/nguồn dạng trượt) · mobile < 768 px (một khu vực). */
export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export const BREAKPOINTS = { desktopMin: 1280, tabletMin: 768 } as const;

function current(): Breakpoint {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop';
  if (window.matchMedia(`(min-width: ${BREAKPOINTS.desktopMin}px)`).matches) return 'desktop';
  if (window.matchMedia(`(min-width: ${BREAKPOINTS.tabletMin}px)`).matches) return 'tablet';
  return 'mobile';
}

export function useBreakpoint() {
  const breakpoint = ref<Breakpoint>(current());
  const queries: MediaQueryList[] = [];
  const update = () => {
    breakpoint.value = current();
  };

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    for (const w of [BREAKPOINTS.desktopMin, BREAKPOINTS.tabletMin]) {
      const q = window.matchMedia(`(min-width: ${w}px)`);
      q.addEventListener('change', update);
      queries.push(q);
    }
    update();
  });
  onBeforeUnmount(() => queries.forEach((q) => q.removeEventListener('change', update)));

  return breakpoint;
}
