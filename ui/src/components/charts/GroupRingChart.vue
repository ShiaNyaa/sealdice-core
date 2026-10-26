<template>
  <div class="group-chart" :style="{ width: size, height: size }">
    <SdChart :option="option" :height="size" />
    <div class="group-chart__center" aria-hidden="true">
      <strong>{{ percent }}%</strong>
      <span>启用率</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { EChartsOption } from 'echarts';
import SdChart from './SdChart.vue';
import { useThemeStore } from '@/features/theme/store';

const props = withDefaults(
  defineProps<{
    joined: number;
    enabled: number;
    size?: string;
  }>(),
  {
    size: '152px',
  }
);

const { isDark } = storeToRefs(useThemeStore());

const percent = computed(() => {
  if (!props.joined) return 0;
  return Math.round((props.enabled / props.joined) * 100);
});

const option = computed<EChartsOption>(() => {
  const accent = isDark.value ? '#6f96ff' : '#2f5fe0';
  const track = isDark.value ? 'rgba(255,255,255,0.07)' : 'rgba(16,23,36,0.06)';
  return {
    animationDuration: 800,
    animationEasing: 'cubicOut',
    series: [
      {
        type: 'pie',
        radius: ['68%', '86%'],
        center: ['50%', '50%'],
        startAngle: 90,
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderWidth: 0 },
        data:
          props.joined > 0
            ? [
                {
                  value: props.enabled,
                  itemStyle: { color: accent, borderRadius: 6 },
                },
                {
                  value: Math.max(0, props.joined - props.enabled),
                  itemStyle: { color: track, borderRadius: 6 },
                },
              ]
            : [{ value: 1, itemStyle: { color: track } }],
      },
    ],
  };
});
</script>

<style scoped>
.group-chart {
  position: relative;
  flex: 0 0 auto;
}

.group-chart__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  gap: 0.1rem;
  pointer-events: none;
}

.group-chart__center strong {
  color: var(--sd-text-primary);
  font-size: 1.3rem;
  font-weight: 580;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
</style>
