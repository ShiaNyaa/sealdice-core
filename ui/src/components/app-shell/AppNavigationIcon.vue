<template>
  <Icon :icon="iconName" :inline="true" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { resolveNavigationIcon } from '@/lib/icons';

const props = defineProps<{
  name?: string;
}>();

const iconName = computed(() => resolveNavigationIcon(props.name));
</script>
