<template>
  <div class="test-mode-frame" :class="{ 'test-mode-frame--active': active }">
    <div v-if="active" class="test-mode-frame__banner" role="status">
      <i-tabler-eye-exclamation class="test-mode-frame__banner-icon" aria-hidden="true" />
      <span>{{ bannerText }}</span>
    </div>
    <div v-if="active" class="test-mode-frame__watermark" aria-hidden="true">
      <span v-for="row in watermarkRows" :key="row" class="test-mode-frame__watermark-row">
        {{ row }}
      </span>
    </div>
    <div class="test-mode-frame__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  active: boolean;
  bannerText: string;
  watermarkText: string;
}>();

const watermarkRows = computed(() => {
  const text = props.watermarkText.trim();
  return text
    ? Array.from({ length: 7 }, (_, index) => `${text} · ${text} · ${text} · ${index + 1}`)
    : [];
});
</script>

<style scoped>
.test-mode-frame {
  position: relative;
  min-height: 100%;
}

.test-mode-frame__content {
  position: relative;
  z-index: 1;
  min-height: 100%;
}

.test-mode-frame__banner {
  position: sticky;
  z-index: 60;
  top: 0;
  display: flex;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid color-mix(in srgb, var(--sd-warning) 22%, transparent);
  background: color-mix(in srgb, var(--sd-warning) 13%, var(--sd-bg-app));
  color: var(--sd-warning);
  font-size: 0.75rem;
  gap: 0.4rem;
  letter-spacing: 0.01em;
}

.test-mode-frame__banner-icon {
  font-size: 14px;
}

.test-mode-frame__watermark {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: grid;
  place-content: center;
  gap: 4rem;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.08;
  transform: rotate(-24deg) scale(1.15);
}

.test-mode-frame__watermark-row {
  white-space: nowrap;
  color: var(--sd-text-primary);
  font-size: clamp(1.15rem, 1.8vw, 1.8rem);
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

@media (max-width: 767.9px) {
  .test-mode-frame__banner {
    height: 28px;
    font-size: 0.6875rem;
  }

  .test-mode-frame__watermark {
    gap: 3rem;
    transform: rotate(-24deg) scale(1.3);
  }
}
</style>
