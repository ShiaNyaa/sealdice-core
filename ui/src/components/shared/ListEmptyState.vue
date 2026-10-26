<template>
  <div class="sd-list-empty-state" :class="{ 'is-bordered': bordered }" role="status">
    <span class="sd-list-empty-state__icon" aria-hidden="true">
      <slot name="icon">
        <i-tabler-inbox />
      </slot>
    </span>
    <p class="sd-list-empty-state__title">{{ description }}</p>
    <div v-if="$slots.description" class="sd-list-empty-state__description">
      <slot name="description" />
    </div>
    <div v-if="$slots.default" class="sd-list-empty-state__extra">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    description: string;
    bordered?: boolean;
  }>(),
  {
    bordered: false,
  }
);

defineSlots<{
  default?(): unknown;
  icon?(): unknown;
  description?(): unknown;
}>();
</script>

<style scoped>
.sd-list-empty-state {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 13rem;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

.sd-list-empty-state.is-bordered {
  border: 1px dashed var(--sd-border);
  border-radius: var(--sd-radius-lg);
  background: var(--sd-bg-elevated);
}

.sd-list-empty-state__icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sd-border-soft);
  border-radius: var(--sd-radius-md);
  background: var(--sd-bg-elevated-soft);
  color: var(--sd-text-muted);
  font-size: 20px;
  margin-bottom: 0.35rem;
}

.sd-list-empty-state__title {
  margin: 0;
  color: var(--sd-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
}

.sd-list-empty-state__description {
  max-width: 30rem;
  color: var(--sd-text-muted);
  font-size: 0.75rem;
  line-height: 1.6;
}

.sd-list-empty-state__extra {
  display: flex;
  max-width: 36rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
}
</style>
