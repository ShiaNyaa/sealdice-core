import Lenis from 'lenis';
import { onBeforeUnmount, watch } from 'vue';
import { usePreferredReducedMotion } from '@vueuse/core';
import { useRoute } from 'vue-router';

/**
 * 平滑滚动只在指针精确、视口足够宽的设备上启用：
 * 触屏设备保留原生惯性滚动，避免与系统手势打架。
 */
export function useSmoothScroll() {
  const reducedMotion = usePreferredReducedMotion();
  const route = useRoute();
  let lenis: Lenis | null = null;
  let frame = 0;

  const supportsSmoothScroll = () =>
    window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 768;

  function stop() {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    lenis?.destroy();
    lenis = null;
  }

  function start() {
    if (lenis || reducedMotion.value === 'reduce' || !supportsSmoothScroll()) return;
    lenis = new Lenis({
      duration: 0.9,
      easing: t => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
    });

    const raf = (time: number) => {
      lenis?.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
  }

  start();

  // 路由切换后回到顶部：Lenis 接管滚动时也要让它知道目标位置。
  watch(
    () => route.fullPath,
    () => {
      lenis?.scrollTo(0, { immediate: true });
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  );

  const mq = window.matchMedia('(pointer: fine)');
  const onPointerChange = () => {
    stop();
    start();
  };
  mq.addEventListener('change', onPointerChange);

  onBeforeUnmount(() => {
    mq.removeEventListener('change', onPointerChange);
    stop();
  });

  return {
    stop,
    start,
    get instance() {
      return lenis;
    },
  };
}
