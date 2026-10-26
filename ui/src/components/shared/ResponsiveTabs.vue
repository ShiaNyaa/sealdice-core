<template>
  <ResponsiveDataView class="responsive-tabs" :compact-at="props.compactAt">
    <template #table>
      <n-tabs v-model:value="model" type="line" animated class="sd-setting-tabs">
        <n-tab-pane
          v-for="option in props.options"
          :key="option.value"
          :name="option.value"
          :tab="option.label"
        >
          <slot name="panel" :option="option" />
        </n-tab-pane>
      </n-tabs>
    </template>

    <template #compact>
      <div class="responsive-tabs__compact">
        <n-select
          v-model:value="model"
          class="responsive-tabs__select"
          :options="props.options"
          aria-label="选择设置分类"
        />
        <section v-if="selectedOption" class="responsive-tabs__panel">
          <slot name="panel" :option="selectedOption" />
        </section>
      </div>
    </template>
  </ResponsiveDataView>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SelectOption } from 'naive-ui';
import ResponsiveDataView from './ResponsiveDataView.vue';

export type ResponsiveTabOption = SelectOption & { label: string; value: string };

const props = withDefaults(
  defineProps<{
    options: ResponsiveTabOption[];
    compactAt?: number;
  }>(),
  {
    compactAt: 760,
  }
);

const model = defineModel<string>('value', { required: true });

defineSlots<{
  panel(props: { option: ResponsiveTabOption }): unknown;
}>();

const selectedOption = computed(
  () => props.options.find(option => option.value === model.value) ?? props.options[0]
);
</script>

<style scoped>
.responsive-tabs {
  container-type: inline-size;
}

.responsive-tabs__compact {
  display: grid;
  gap: var(--sd-space-lg);
}

.responsive-tabs__select {
  width: min(100%, 22rem);
}

.responsive-tabs__panel {
  min-width: 0;
}

/* 分类切换改成圆角分段控件：比下划线更贴近当前控制台的视觉语言。 */
.sd-setting-tabs :deep(.n-tabs-nav--line-type .n-tabs-nav-scroll-content) {
  border-bottom: none;
}

.sd-setting-tabs :deep(.n-tabs-nav) {
  display: inline-flex;
  max-width: 100%;
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-pill);
  background: var(--sd-bg-elevated-soft);
  padding: 3px;
}

.sd-setting-tabs :deep(.n-tabs-nav-scroll-content) {
  gap: 2px;
}

.sd-setting-tabs :deep(.n-tabs-tab-pad) {
  display: none;
}

.sd-setting-tabs :deep(.n-tabs-tab) {
  height: 30px;
  border-radius: var(--sd-radius-pill);
  color: var(--sd-text-muted);
  font-size: 0.78125rem;
  padding: 0 0.8rem;
  transition:
    background-color var(--sd-transition-fast),
    color var(--sd-transition-fast);
}

.sd-setting-tabs :deep(.n-tabs-tab:hover) {
  background: var(--sd-bg-hover);
  color: var(--sd-text-secondary);
}

.sd-setting-tabs :deep(.n-tabs-tab.n-tabs-tab--active) {
  background: var(--sd-bg-elevated);
  box-shadow: var(--sd-shadow-panel);
  color: var(--sd-text-primary);
  font-weight: 520;
}

.sd-setting-tabs :deep(.n-tabs-bar) {
  display: none;
}

.sd-setting-tabs :deep(.n-tabs-pane-wrapper) {
  margin-top: 1rem;
}
</style>
