<template>
  <SdChart :option="option" :height="height" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import type { EChartsOption } from 'echarts';
import SdChart from './SdChart.vue';
import { useThemeStore } from '@/features/theme/store';
import type { NetworkHealthTarget } from '@/features/base/networkHealth';

const props = defineProps<{
  targets: NetworkHealthTarget[];
}>();

const { isDark } = storeToRefs(useThemeStore());
const breakpoints = useBreakpoints(breakpointsTailwind);
const isCompact = breakpoints.smaller('sm');

const height = computed(() => `${Math.max(210, props.targets.length * 44 + 40)}px`);

const option = computed<EChartsOption>(() => {
  const textColor = isDark.value ? '#a5afc0' : '#4d596c';
  const gridColor = isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(16,23,36,0.1)';
  const trackColor = isDark.value ? 'rgba(255,255,255,0.055)' : 'rgba(16,23,36,0.05)';
  const accent = isDark.value ? '#6f96ff' : '#2f5fe0';
  const danger = isDark.value ? '#f2757a' : '#cf2f36';
  const tooltipBg = isDark.value ? '#121722' : '#ffffff';
  const tooltipBorder = isDark.value ? '#1e2531' : '#e2e6ee';
  const tooltipText = isDark.value ? '#f2f5fa' : '#101724';

  return {
    animationDuration: 700,
    animationEasing: 'cubicOut',
    grid: { left: 0, right: isCompact.value ? 40 : 56, top: 4, bottom: 0, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: { color: tooltipText, fontSize: 12 },
      formatter: params => {
        const item = Array.isArray(params) ? params[0] : params;
        return `${item.name}<br/><strong>${item.value} ms</strong>`;
      },
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: !isCompact.value, lineStyle: { color: gridColor, type: 'dashed' } },
      axisLabel: { show: !isCompact.value, color: textColor, fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: props.targets.map(target => target.label),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 12, margin: 14 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 9,
        showBackground: true,
        backgroundStyle: { color: trackColor, borderRadius: 5 },
        data: props.targets.map(target => ({
          value: target.durationMs,
          ok: target.ok,
          itemStyle: {
            color: target.ok ? accent : danger,
            borderRadius: [0, 5, 5, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          color: textColor,
          fontSize: 11,
          formatter: params => {
            const item = params.data as { value: number; ok: boolean };
            if (!item.ok) return '不可达';
            return isCompact.value ? `${item.value}` : `${item.value} ms`;
          },
        },
      },
    ],
  };
});
</script>
