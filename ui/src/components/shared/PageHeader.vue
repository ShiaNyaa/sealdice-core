<template>
  <header class="sd-page-header">
    <div class="sd-page-header__copy">
      <p v-if="eyebrow" class="sd-page-header__eyebrow">{{ eyebrow }}</p>
      <div class="sd-page-header__title-row">
        <h1>{{ title }}</h1>
        <slot name="badge" />
      </div>
      <p v-if="description || $slots.description" class="sd-page-header__description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div v-if="$slots.default || $slots.meta" class="sd-page-header__aside">
      <div v-if="$slots.meta" class="sd-page-header__meta">
        <slot name="meta" />
      </div>
      <div v-if="$slots.default" class="sd-page-header__actions">
        <slot />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    eyebrow?: string;
  }>(),
  {
    description: '',
    eyebrow: '',
  }
);
</script>

<style scoped>
.sd-page-header {
  display: flex;
  min-width: 0;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sd-space-md);
  padding: 0.25rem 0 0.35rem;
}

.sd-page-header__copy {
  min-width: 0;
}

.sd-page-header__eyebrow {
  margin: 0 0 0.45rem;
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  font-weight: 520;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
}

.sd-page-header__title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.6rem;
}

.sd-page-header h1 {
  margin: 0;
  color: var(--sd-text-primary);
  font-size: var(--sd-page-title-size);
  font-weight: var(--sd-page-title-weight);
  letter-spacing: -0.025em;
  line-height: var(--sd-page-title-line-height);
}

.sd-page-header__description {
  margin: 0.4rem 0 0;
  max-width: 62ch;
  color: var(--sd-text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
}

.sd-page-header__aside {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.6rem;
}

.sd-page-header__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sd-page-header__actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 720px) {
  .sd-page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .sd-page-header__aside {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .sd-page-header__actions {
    justify-content: flex-start;
  }
}
</style>
