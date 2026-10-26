<template>
  <div
    ref="divRef"
    class="sd-spotlight"
    :class="className"
    @mousemove="handleMouseMove"
    @focus="handleFocus"
    @blur="handleBlur"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="sd-spotlight__glow"
      :style="{
        opacity,
        background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 72%)`,
      }"
      aria-hidden="true"
    />

    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps {
  className?: string;
  spotlightColor?: string;
}

// 只提供跟随光标的柔光，不携带布局样式：调用方决定卡片外观。
const {
  className = '',
  spotlightColor = 'color-mix(in srgb, var(--sd-primary) 16%, transparent)',
} = defineProps<SpotlightCardProps>();

const divRef = useTemplateRef<HTMLDivElement>('divRef');
const isFocused = ref<boolean>(false);
const position = ref<Position>({ x: 0, y: 0 });
const opacity = ref<number>(0);

const handleMouseMove = (e: MouseEvent) => {
  if (!divRef.value || isFocused.value) return;

  const rect = divRef.value.getBoundingClientRect();
  position.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const handleFocus = () => {
  isFocused.value = true;
  opacity.value = 0.7;
};

const handleBlur = () => {
  isFocused.value = false;
  opacity.value = 0;
};

const handleMouseEnter = () => {
  opacity.value = 0.7;
};

const handleMouseLeave = () => {
  opacity.value = 0;
};
</script>

<style scoped>
.sd-spotlight {
  position: relative;
  overflow: hidden;
}

.sd-spotlight__glow {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 480ms ease;
}
</style>
