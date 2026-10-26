<template>
  <section class="help-collapse">
    <n-collapse :accordion="accordion">
      <n-collapse-item :name="name">
        <template #header>
          <span class="help-collapse__title">
            <i-tabler-help-circle />
            {{ title }}
          </span>
        </template>
        <slot />
      </n-collapse-item>
    </n-collapse>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    name?: string;
    accordion?: boolean;
  }>(),
  {
    title: '查看帮助',
    name: 'help',
    accordion: false,
  }
);
</script>

<style scoped>
.help-collapse {
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-md);
  background: var(--sd-bg-elevated-soft);
  padding: 0 0.9rem;
}

.help-collapse__title {
  display: inline-flex;
  align-items: center;
  color: var(--sd-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  gap: 0.4rem;
}

.help-collapse__title svg {
  font-size: 14px;
  color: var(--sd-text-muted);
}

/* 折叠内容自带上边距，去掉 naive 默认分割线以免通栏切断圆角。 */
.help-collapse :deep(.n-collapse-item) {
  margin-top: 0;
}

.help-collapse :deep(.n-collapse-item__header) {
  padding: 0.55rem 0;
  font-size: 0.75rem;
}

.help-collapse :deep(.n-collapse-item:not(:first-child)) {
  border-top: none;
}

.help-collapse :deep(.n-collapse-item__content-inner) {
  padding-top: 0.15rem;
  padding-bottom: 0.6rem;
  color: var(--sd-text-muted);
  font-size: 0.75rem;
  line-height: 1.65;
}
</style>
