<template>
  <VChart class="sd-chart" :option="option" :style="{ height }" autoresize />
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import VChart from 'vue-echarts';
import './echarts';

withDefaults(
  defineProps<{
    option: EChartsOption;
    height?: string;
  }>(),
  {
    height: '260px',
  }
);
</script>

<style scoped>
.sd-chart {
  width: 100%;
}
</style>
