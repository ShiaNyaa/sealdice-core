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

// 宽屏用纵向柱状图，窄屏目标名放不下，改成横向条形图。
const height = computed(() =>
  isCompact.value ? `${Math.max(200, props.targets.length * 42 + 24)}px` : '260px'
);

const palette = computed(() => ({
  text: isDark.value ? '#a5afc0' : '#4d596c',
  grid: isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(16,23,36,0.1)',
  track: isDark.value ? 'rgba(255,255,255,0.055)' : 'rgba(16,23,36,0.05)',
  accent: isDark.value ? '#6f96ff' : '#2f5fe0',
  danger: isDark.value ? '#f2757a' : '#cf2f36',
  tooltipBg: isDark.value ? '#121722' : '#ffffff',
  tooltipBorder: isDark.value ? '#1e2531' : '#e2e6ee',
  tooltipText: isDark.value ? '#f2f5fa' : '#101724',
}));

const option = computed<EChartsOption>(() => {
  const color = palette.value;
  const data = props.targets.map(target => ({
    value: target.durationMs,
    ok: target.ok,
    itemStyle: {
      color: target.ok ? color.accent : color.danger,
      borderRadius: isCompact.value ? [0, 4, 4, 0] : [4, 4, 0, 0],
    },
  }));

  const tooltip = {
    trigger: 'axis' as const,
    axisPointer: { type: 'shadow' as const },
    backgroundColor: color.tooltipBg,
    borderColor: color.tooltipBorder,
    borderWidth: 1,
    textStyle: { color: color.tooltipText, fontSize: 12 },
    formatter: (params: unknown) => {
      const list = params as Array<{ name: string; data: { value: number; ok: boolean } }>;
      const item = list[0];
      const detail = item.data.ok ? `${item.data.value} ms` : '不可达';
      return `${item.name}<br/><strong>${detail}</strong>`;
    },
  };

  if (isCompact.value) {
    return {
      animationDuration: 600,
      animationEasing: 'cubicOut',
      grid: { left: 0, right: 46, top: 4, bottom: 0, containLabel: true },
      tooltip,
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: props.targets.map(target => target.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: color.text,
          fontSize: 11,
          width: 84,
          overflow: 'break',
          formatter: (value: string) => value.replace(/\s*机器人\s*API$/, ''),
        },
      },
      series: [
        {
          type: 'bar',
          barWidth: 9,
          showBackground: true,
          backgroundStyle: { color: color.track, borderRadius: 4 },
          data,
          label: {
            show: true,
            position: 'right',
            distance: 6,
            color: color.text,
            fontSize: 10,
            formatter: (params: unknown) => {
              const item = (params as { data: { value: number; ok: boolean } }).data;
              return item.ok ? `${item.value}` : '不可达';
            },
          },
        },
      ],
    };
  }

  return {
    animationDuration: 700,
    animationEasing: 'cubicOut',
    grid: { left: 4, right: 4, top: 30, bottom: 0, containLabel: true },
    tooltip,
    xAxis: {
      type: 'category',
      data: props.targets.map(target => target.label),
      axisLine: { lineStyle: { color: color.grid } },
      axisTick: { show: false },
      axisLabel: {
        color: color.text,
        fontSize: 11,
        interval: 0,
        width: 96,
        overflow: 'break',
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: color.grid, type: 'dashed' } },
      axisLabel: { color: color.text, fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 48,
        data,
        label: {
          show: true,
          position: 'top',
          distance: 6,
          color: color.text,
          fontSize: 11,
          formatter: (params: unknown) => {
            const item = (params as { data: { value: number; ok: boolean } }).data;
            return item.ok ? `${item.value} ms` : '不可达';
          },
        },
      },
    ],
  };
});
</script>
