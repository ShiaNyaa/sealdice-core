<template>
  <Motion
    as="div"
    :class="props.class"
    :initial="getInitial()"
    :while-in-view="getAnimate()"
    :viewport="{ once: true, amount: 0.15 }"
    :transition="{
      duration: props.duration,
      delay: props.delay,
      ease: [0.22, 1, 0.36, 1],
    }"
  >
    <slot />
  </Motion>
</template>

<script setup lang="ts">
import { Motion } from 'motion-v';

interface Props {
  duration?: number;
  delay?: number;
  blur?: string;
  yOffset?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 0.6,
  delay: 0,
  blur: '14px',
  yOffset: 16,
});

function getInitial() {
  return {
    opacity: 0,
    filter: `blur(${props.blur})`,
    y: props.yOffset,
  };
}

function getAnimate() {
  return {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
  };
}
</script>
