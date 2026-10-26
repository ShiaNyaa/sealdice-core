<template>
  <nav class="sd-tabbar" aria-label="移动端快捷导航">
    <RouterLink
      v-for="item in primaryItems"
      :key="item.path"
      :to="item.path"
      class="sd-tabbar__item"
      :class="{ 'is-active': isActive(item.path) }"
      :aria-current="isActive(item.path) ? 'page' : undefined"
    >
      <component :is="item.icon" class="sd-tabbar__icon" />
      <span class="sd-tabbar__label">{{ item.label }}</span>
    </RouterLink>

    <button type="button" class="sd-tabbar__item" @click="emit('openMenu')">
      <i-tabler-layout-grid class="sd-tabbar__icon" />
      <span class="sd-tabbar__label">全部</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import IconHome from '~icons/tabler/home';
import IconPlug from '~icons/tabler/plug-connected';
import IconPuzzle from '~icons/tabler/puzzle';
import IconAdjustments from '~icons/tabler/adjustments-horizontal';

const emit = defineEmits<{
  openMenu: [];
}>();

const route = useRoute();
const currentPath = computed(() => route.path);

const primaryItems = [
  { label: '概览', path: '/', icon: IconHome },
  { label: '账号', path: '/connect', icon: IconPlug },
  { label: '扩展', path: '/mod/reply', icon: IconPuzzle },
  { label: '设置', path: '/misc/base-setting', icon: IconAdjustments },
];

function isActive(path: string) {
  if (path === '/') return currentPath.value === '/';
  return currentPath.value === path || currentPath.value.startsWith(`${path}/`);
}
</script>

<style scoped>
.sd-tabbar {
  position: fixed;
  z-index: 50;
  right: 0;
  bottom: 0;
  left: 0;
  display: none;
  align-items: stretch;
  border-top: 1px solid var(--sd-border);
  background: color-mix(in srgb, var(--sd-bg-shell) 92%, transparent);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  backdrop-filter: saturate(160%) blur(18px);
}

.sd-tabbar__item {
  display: flex;
  min-width: 0;
  height: 56px;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--sd-text-muted);
  gap: 0.2rem;
  text-decoration: none;
  transition: color var(--sd-transition-fast);
}

.sd-tabbar__item:active {
  background: var(--sd-bg-hover);
}

.sd-tabbar__item.is-active {
  color: var(--sd-primary);
}

.sd-tabbar__icon {
  font-size: 20px;
}

.sd-tabbar__label {
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1;
}

@media screen and (max-width: 767.9px) {
  .sd-tabbar {
    display: flex;
  }
}
</style>
