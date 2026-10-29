<template>
  <header class="sd-topbar" :class="{ 'sd-topbar--compact': isCompactMode }">
    <div class="sd-topbar__lead">
      <button
        type="button"
        class="icon-action"
        :class="{ 'is-on': props.collapsed && !isMobileMode }"
        :aria-label="isMobileMode ? '打开菜单' : props.collapsed ? '展开侧栏' : '收起侧栏'"
        @click="emit('toggleSidebar')"
      >
        <i-tabler-menu-2 v-if="isMobileMode" />
        <i-tabler-layout-sidebar-left-expand v-else-if="props.collapsed" />
        <i-tabler-layout-sidebar-left-collapse v-else />
      </button>

      <nav class="sd-crumbs" aria-label="面包屑">
        <template v-for="(item, index) in visibleBreadcrumbItems" :key="`${index}-${item.label}`">
          <span v-if="index > 0" class="sd-crumbs__sep" aria-hidden="true">/</span>
          <RouterLink
            v-if="item.to && index < visibleBreadcrumbItems.length - 1"
            :to="item.to"
            class="sd-crumbs__link"
          >
            {{ item.label }}
          </RouterLink>
          <span
            v-else
            class="sd-crumbs__current"
            :aria-current="index === visibleBreadcrumbItems.length - 1 ? 'page' : undefined"
          >
            {{ item.label }}
          </span>
        </template>
      </nav>
    </div>

    <div class="sd-topbar__actions">
      <AppUploadIndicator />

      <button
        type="button"
        class="search-entry"
        :aria-label="isCompactMode ? '搜索' : undefined"
        @click="emit('openSearch')"
      >
        <i-tabler-search class="search-entry__icon" />
        <span v-if="!isCompactMode" class="search-entry__label">搜索</span>
        <kbd v-if="!isCompactMode" class="search-entry__key">Ctrl K</kbd>
      </button>

      <AppThemeSwitch />
      <AppInstallButton v-if="!isCompactMode" />

      <div v-if="!isCompactMode" class="version-summary">
        <span class="version-channel" :class="{ 'is-stable': isStable }">{{ channelText }}</span>
        <span class="version-text">{{ overview?.version.simple ?? '—' }}</span>
        <span v-if="hasNewVersion" class="new-version">
          可升级至 {{ overview?.version.latest }}
        </span>
      </div>

      <AppHeaderOverflowMenu v-if="isCompactMode" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useBaseOverview } from '@/features/base/useBaseOverview';
import { appNavigation } from '@/router/navigation';
import { buildBreadcrumbItems } from '@/router/navigationModel';
import AppInstallButton from './AppInstallButton.vue';
import AppHeaderOverflowMenu from './AppHeaderOverflowMenu.vue';
import AppThemeSwitch from './AppThemeSwitch.vue';
import AppUploadIndicator from './AppUploadIndicator.vue';
import type { AppShellViewportMode } from './appShellLayout';

const props = defineProps<{
  collapsed: boolean;
  viewportMode: AppShellViewportMode;
}>();

const emit = defineEmits<{
  toggleSidebar: [];
  openSearch: [];
}>();

const route = useRoute();
const { overview, isStable, channelText, hasNewVersion } = useBaseOverview();

const breadcrumbItems = computed(() =>
  buildBreadcrumbItems(appNavigation, route.path, String(route.meta.title ?? '当前页面'))
);
const isCompactMode = computed(() => props.viewportMode !== 'desktop');
const isMobileMode = computed(() => props.viewportMode === 'mobile');
const visibleBreadcrumbItems = computed(() =>
  isCompactMode.value ? breadcrumbItems.value.slice(-2) : breadcrumbItems.value
);
</script>

<style scoped>
.sd-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  height: 56px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sd-border-soft);
  background: color-mix(in srgb, var(--sd-bg-shell) 82%, transparent);
  gap: 1rem;
  padding: 0 1.25rem 0 0.85rem;
  backdrop-filter: saturate(160%) blur(14px);
}

.sd-topbar__lead {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
}

.icon-action {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--sd-radius-sm);
  background: transparent;
  color: var(--sd-text-muted);
  cursor: pointer;
  font-size: 18px;
  transition:
    background-color var(--sd-transition-fast),
    color var(--sd-transition-fast);
}

.icon-action:hover {
  background: var(--sd-bg-hover);
  color: var(--sd-text-primary);
}

.icon-action.is-on {
  color: var(--sd-primary);
}

.sd-crumbs {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.4rem;
  overflow: hidden;
  white-space: nowrap;
}

.sd-crumbs__link,
.sd-crumbs__current {
  overflow: hidden;
  font-size: 0.8125rem;
  line-height: 1.2;
  text-overflow: ellipsis;
}

.sd-crumbs__link {
  color: var(--sd-text-muted);
  text-decoration: none;
  transition: color var(--sd-transition-fast);
}

.sd-crumbs__link:hover {
  color: var(--sd-text-primary);
}

.sd-crumbs__current {
  color: var(--sd-text-primary);
  font-weight: 520;
}

.sd-crumbs__sep {
  color: var(--sd-border);
  font-size: 0.75rem;
}

.sd-topbar__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.35rem;
}

.search-entry {
  display: inline-flex;
  height: 32px;
  align-items: center;
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-sm);
  background: var(--sd-bg-elevated);
  color: var(--sd-text-muted);
  cursor: pointer;
  gap: 0.4rem;
  padding: 0 0.4rem 0 0.7rem;
  transition:
    border-color var(--sd-transition-fast),
    color var(--sd-transition-fast),
    background-color var(--sd-transition-fast);
}

.search-entry:hover {
  border-color: var(--sd-primary-border);
  background: var(--sd-bg-elevated);
  color: var(--sd-text-secondary);
}

.search-entry__icon {
  font-size: 15px;
}

.search-entry__label {
  font-size: 0.75rem;
  line-height: 1;
}

.search-entry__key {
  border: 1px solid var(--sd-border-soft);
  border-radius: 5px;
  background: var(--sd-bg-control);
  color: var(--sd-text-muted);
  font-family: var(--sd-font-sans);
  font-size: 0.625rem;
  line-height: 1;
  padding: 0.2rem 0.3rem;
}

.version-summary {
  display: flex;
  align-items: center;
  border-left: 1px solid var(--sd-border-soft);
  gap: 0.4rem;
  margin-left: 0.35rem;
  padding-left: 0.7rem;
}

.version-channel {
  border-radius: var(--sd-radius-xs);
  background: var(--sd-bg-control);
  color: var(--sd-text-muted);
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  line-height: 1;
  padding: 0.22rem 0.42rem;
}

.version-channel.is-stable {
  background: var(--sd-success-soft);
  color: var(--sd-success);
}

.version-text {
  color: var(--sd-text-secondary);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.new-version {
  color: var(--sd-warning);
  font-size: 0.6875rem;
  line-height: 1;
  white-space: nowrap;
}

.sd-topbar--compact {
  padding-inline: 0.55rem 0.7rem;
}

.sd-topbar--compact .search-entry {
  width: 32px;
  justify-content: center;
  padding: 0;
}

.sd-topbar--compact .sd-crumbs__current {
  max-width: 40vw;
}

@media screen and (max-width: 1280px) {
  .version-summary {
    display: none;
  }
}

@media screen and (max-width: 767.9px) {
  .sd-topbar {
    height: 52px;
  }
}
</style>
