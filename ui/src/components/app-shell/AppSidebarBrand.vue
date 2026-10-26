<template>
  <div class="sd-sidebar-brand" :class="{ collapsed: props.collapsed }">
    <button
      type="button"
      class="brand-mark"
      aria-label="启用高级配置"
      @click="emit('enableAdvancedConfig')"
    >
      <img :src="sealdiceD20" alt="" class="brand-mark-image" />
    </button>

    <div v-if="!props.collapsed" class="brand-info">
      <div class="brand-title-row">
        <button type="button" class="brand-title" @click="emit('enableAdvancedConfig')">
          {{ appName }}
        </button>
        <n-tooltip v-if="overview?.runtime.containerMode">
          <template #trigger>
            <span class="brand-badge" aria-label="容器模式">容器</span>
          </template>
          当前以容器模式启动，部分功能受到限制。
        </n-tooltip>
      </div>
      <span class="brand-meta">
        {{ overview?.version.simple ?? '海豹核心' }}
        <template v-if="channelText"> · {{ channelText }}</template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import sealdiceD20 from '@/assets/sealdice-d20.svg';
import { useBaseOverview } from '@/features/base/useBaseOverview';

const props = withDefaults(
  defineProps<{
    collapsed?: boolean;
  }>(),
  {
    collapsed: false,
  }
);

const emit = defineEmits<{
  enableAdvancedConfig: [];
}>();

const { overview, appName, channelText } = useBaseOverview();
</script>

<style scoped>
.sd-sidebar-brand {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  border-bottom: 1px solid var(--sd-border-soft);
  gap: 0.65rem;
  margin: 0 0.7rem;
  padding: 1.05rem 0.3rem 0.95rem;
}

.sd-sidebar-brand.collapsed {
  justify-content: center;
  margin: 0 0.35rem;
  padding: 1.05rem 0 0.95rem;
}

.brand-mark {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--sd-radius-sm);
  background: transparent;
  cursor: pointer;
  margin: 0;
  padding: 0;
  transition: transform var(--sd-transition-base);
}

.brand-mark:hover {
  transform: rotate(-6deg) scale(1.05);
}

.brand-mark:active {
  transform: scale(0.94);
}

.brand-mark-image {
  display: block;
  width: 28px;
  height: 28px;
}

.brand-info {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 0.1rem;
}

.brand-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
}

.brand-title {
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--sd-text-primary);
  cursor: pointer;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.25;
  padding: 0;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-badge {
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-pill);
  color: var(--sd-text-muted);
  font-size: 0.625rem;
  line-height: 1;
  padding: 0.15rem 0.35rem;
}

.brand-meta {
  overflow: hidden;
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
