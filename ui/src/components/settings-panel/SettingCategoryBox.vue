<template>
  <section :class="['setting-category-box', { 'setting-category-box-wide': wide }]">
    <header class="setting-category-head">
      <div class="setting-category-heading">
        <h2 :id="headingId" class="setting-category-title">{{ title }}</h2>
        <slot name="title-extra" />
      </div>
      <n-button
        v-if="collapsible"
        text
        size="tiny"
        class="setting-category-toggle"
        :aria-label="expanded ? `收起${title}` : `展开${title}`"
        :aria-expanded="expanded"
        :aria-controls="panelId"
        @click="emit('toggle')"
      >
        <template #icon>
          <i-tabler-chevron-down v-if="expanded" />
          <i-tabler-chevron-right v-else />
        </template>
        {{ expanded ? '收起' : '展开' }}
      </n-button>
    </header>

    <div
      v-if="showPanel && (!collapsible || expanded)"
      :id="panelId"
      class="setting-category-panel"
      role="region"
      :aria-labelledby="headingId"
    >
      <div v-if="$slots.notes" class="setting-category-notes">
        <slot name="notes" />
      </div>
      <div
        :class="[
          'setting-field-layout',
          `setting-field-layout-columns-${columns}`,
          { 'setting-field-layout-padded': padded },
        ]"
      >
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue';

const panelId = `setting-category-panel-${useId()}`;
const headingId = `setting-category-heading-${useId()}`;

withDefaults(
  defineProps<{
    title: string;
    collapsible?: boolean;
    expanded?: boolean;
    wide?: boolean;
    padded?: boolean;
    columns?: 1 | 2;
    showPanel?: boolean;
  }>(),
  {
    showPanel: true,
    columns: 1,
    padded: false,
  }
);

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<style scoped>
.setting-category-box {
  overflow: hidden;
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-lg);
  background: var(--sd-bg-elevated);
}

.setting-category-box-wide {
  grid-column: 1 / -1;
}

.setting-category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sd-border-soft);
  gap: 0.75rem;
  padding: 0.8rem 1.1rem;
}

.setting-category-heading {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.setting-category-title {
  color: var(--sd-text-primary);
  font-size: 0.875rem;
  font-weight: 580;
  letter-spacing: -0.005em;
  line-height: 1.35;
}

.setting-category-toggle {
  flex: 0 0 auto;
  color: var(--sd-text-muted);
}

.setting-category-panel {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.4rem 0.75rem;
}

.setting-category-notes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.35rem 0.7rem 0.5rem;
}

.setting-field-layout {
  display: grid;
  min-width: 0;
}

.setting-field-layout-padded {
  gap: var(--sd-space-sm);
  padding: var(--sd-space-md);
}

.setting-field-layout :deep(.n-form-item) {
  min-width: 0;
}

/*
 * Intermediate rows keep Naive UI's reserved feedback height, so validation
 * does not move later rows. Only an empty feedback wrapper in the visual final
 * row collapses. Real feedback stays in flow and expands the panel downward.
 */
.setting-field-layout
  :deep(.n-form > .n-form-item:last-child > .n-form-item-feedback-wrapper:empty),
.setting-field-layout > :deep(.n-form-item:last-child > .n-form-item-feedback-wrapper:empty) {
  min-height: 0;
}

@media (min-width: 760.1px) {
  .setting-field-layout-columns-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--sd-space-lg);
  }

  .setting-field-layout-columns-2 > :deep(.n-form-item:last-child:nth-child(odd)),
  .setting-field-layout-columns-2 > :deep(.setting-field-span-full) {
    grid-column: 1 / -1;
  }

  .setting-field-layout-columns-2
    > :deep(.n-form-item:nth-last-child(2):nth-child(odd) > .n-form-item-feedback-wrapper:empty) {
    min-height: 0;
  }
}

@media (max-width: 639.9px) {
  .setting-category-head {
    padding: 0.7rem 0.85rem;
  }

  .setting-category-panel {
    padding-inline: 0.2rem;
  }

  .setting-field-layout-padded {
    padding: var(--sd-space-sm);
  }
}
</style>
