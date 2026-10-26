<template>
  <section class="feature-disabled-state" role="status">
    <span class="feature-disabled-state__icon" aria-hidden="true">
      <i-tabler-power />
    </span>
    <h2 class="feature-disabled-state__title">{{ title }}</h2>
    <p class="feature-disabled-state__description">{{ description }}</p>
    <div v-if="$slots.default" class="feature-disabled-state__actions">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();

defineSlots<{
  default?(): unknown;
}>();
</script>

<style scoped>
.feature-disabled-state {
  display: flex;
  min-height: 18rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--sd-border);
  border-radius: var(--sd-radius-lg);
  background: var(--sd-bg-elevated);
  gap: 0.4rem;
  padding: 3rem 1.25rem;
  text-align: center;
}

.feature-disabled-state__icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sd-border-soft);
  border-radius: var(--sd-radius-md);
  background: var(--sd-bg-elevated-soft);
  color: var(--sd-text-muted);
  font-size: 22px;
  margin-bottom: 0.45rem;
}

.feature-disabled-state__title {
  margin: 0;
  color: var(--sd-text-primary);
  font-size: 0.9375rem;
  font-weight: 560;
}

.feature-disabled-state__description {
  max-width: 32rem;
  margin: 0;
  color: var(--sd-text-muted);
  font-size: 0.8125rem;
  line-height: 1.6;
}

.feature-disabled-state__actions {
  margin-top: 0.75rem;
}
</style>
