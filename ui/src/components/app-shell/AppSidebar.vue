<template>
  <div class="sd-sidebar-content" :class="{ 'is-collapsed': props.collapsed }">
    <AppSidebarBrand
      :collapsed="props.collapsed"
      @enable-advanced-config="emit('enableAdvancedConfig')"
    />

    <nav class="sd-nav no-scrollbar" aria-label="主导航">
      <template v-for="item in navigationTree" :key="item.path ?? item.label">
        <div v-if="item.children?.length" class="sd-nav-group">
          <button
            v-if="!props.collapsed"
            type="button"
            class="sd-nav-group__toggle"
            :aria-expanded="isGroupOpen(item)"
            @click="toggleGroup(item.label)"
          >
            <span>{{ item.label }}</span>
            <i-tabler-chevron-down
              class="sd-nav-group__chevron"
              :class="{ 'is-open': isGroupOpen(item) }"
            />
          </button>
          <div v-else class="sd-nav-group__rule" aria-hidden="true" />

          <div v-show="props.collapsed || isGroupOpen(item)" class="sd-nav-group__items">
            <template v-for="child in item.children" :key="child.path ?? child.label">
              <n-tooltip
                v-if="child.path"
                :disabled="!props.collapsed"
                placement="right"
                :delay="200"
              >
                <template #trigger>
                  <RouterLink
                    :to="child.path"
                    class="sd-nav-item"
                    :class="{ 'is-active': isActive(child.path) }"
                    :aria-current="isActive(child.path) ? 'page' : undefined"
                  >
                    <span class="sd-nav-item__icon">
                      <AppNavigationIcon :name="child.icon" />
                    </span>
                    <span v-if="!props.collapsed" class="sd-nav-item__label">{{
                      child.label
                    }}</span>
                  </RouterLink>
                </template>
                {{ child.label }}
              </n-tooltip>
              <span v-else class="sd-nav-item sd-nav-item--static">
                <span class="sd-nav-item__icon">
                  <AppNavigationIcon :name="child.icon" />
                </span>
                <span v-if="!props.collapsed" class="sd-nav-item__label">{{ child.label }}</span>
              </span>
            </template>
          </div>
        </div>

        <n-tooltip v-else :disabled="!props.collapsed" placement="right" :delay="200">
          <template #trigger>
            <RouterLink
              :to="item.path ?? '/'"
              class="sd-nav-item sd-nav-item--top"
              :class="{ 'is-active': item.path ? isActive(item.path) : false }"
              :aria-current="item.path && isActive(item.path) ? 'page' : undefined"
            >
              <span class="sd-nav-item__icon">
                <AppNavigationIcon :name="item.icon" />
              </span>
              <span v-if="!props.collapsed" class="sd-nav-item__label">{{ item.label }}</span>
            </RouterLink>
          </template>
          {{ item.label }}
        </n-tooltip>
      </template>
    </nav>

    <footer class="sd-sidebar-footer">
      <n-tooltip :disabled="!props.collapsed" placement="right">
        <template #trigger>
          <a class="sd-sidebar-action" aria-label="旧版 UI" :href="oldUIUrl">
            <i-tabler-history class="sd-sidebar-action__icon" />
            <span v-if="!props.collapsed">旧版 UI</span>
          </a>
        </template>
        切换回旧版界面
      </n-tooltip>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { resolveSwitchToOldUIUrl } from '@/api/config';
import AppNavigationIcon from './AppNavigationIcon.vue';
import AppSidebarBrand from './AppSidebarBrand.vue';
import type { NavigationItem } from '@/router/types';
import { useAppNavigation } from '@/router/useAppNavigation';

const props = withDefaults(
  defineProps<{
    collapsed?: boolean;
    advancedConfigCounter?: number;
  }>(),
  {
    collapsed: false,
    advancedConfigCounter: 0,
  }
);

const emit = defineEmits<{
  enableAdvancedConfig: [];
}>();

const route = useRoute();
const oldUIUrl =
  typeof window !== 'undefined' ? resolveSwitchToOldUIUrl(window.location) : '/?ui=old';
const { navigationTree } = useAppNavigation(() => props.advancedConfigCounter);

function normalizePath(path: string) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

const currentPath = computed(() => normalizePath(route.path));

function isActive(path: string) {
  if (path === '/') return currentPath.value === '/';
  return currentPath.value === path || currentPath.value.startsWith(`${path}/`);
}

function containsActive(item: NavigationItem): boolean {
  return Boolean(
    item.children?.some(child => (child.path ? isActive(child.path) : containsActive(child)))
  );
}

// 分组默认全部收起，只有当前路由所在的组自动展开；手动展开的偏好只作用于当前页面。
const overrides = ref<Record<string, boolean>>({});

function isGroupOpen(item: NavigationItem) {
  const override = overrides.value[item.label];
  if (override !== undefined) return override;
  return containsActive(item);
}

function toggleGroup(label: string) {
  const item = navigationTree.value.find(entry => entry.label === label);
  if (!item) return;
  overrides.value = { ...overrides.value, [label]: !isGroupOpen(item) };
}

// 路由变化时让目标分组重新参与默认展开判断。
watch(currentPath, () => {
  overrides.value = {};
});
</script>

<style scoped>
.sd-sidebar-content {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  text-align: left;
}

.sd-nav {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 1.15rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.75rem 0.7rem 1rem;
  scrollbar-width: none;
}

.sd-nav::-webkit-scrollbar {
  display: none;
}

.sd-nav-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sd-nav-group__toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: transparent;
  color: var(--sd-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 0.6875rem;
  font-weight: 560;
  letter-spacing: 0.08em;
  line-height: 1;
  padding: 0 0.65rem 0.45rem;
  text-align: left;
  transition: color var(--sd-transition-fast);
}

.sd-nav-group__toggle:hover {
  color: var(--sd-text-secondary);
}

.sd-nav-group__chevron {
  font-size: 13px;
  opacity: 0.7;
  transform: rotate(-90deg);
  transition: transform var(--sd-transition-fast);
}

.sd-nav-group__chevron.is-open {
  transform: rotate(0deg);
}

.sd-nav-group__items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sd-nav-group__rule {
  height: 1px;
  margin: 0.2rem 0.5rem 0.55rem;
  background: var(--sd-border-soft);
}

.sd-nav-item {
  position: relative;
  display: flex;
  height: 34px;
  align-items: center;
  border-radius: var(--sd-radius-md);
  color: var(--sd-text-secondary);
  gap: 0.6rem;
  padding: 0 0.65rem;
  text-decoration: none;
  transition:
    background-color var(--sd-transition-fast),
    color var(--sd-transition-fast);
}

.sd-nav-item--top {
  margin-bottom: 0.15rem;
}

.sd-nav-item__icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: var(--sd-text-muted);
  font-size: 17px;
  transition: color var(--sd-transition-fast);
}

.sd-nav-item__label {
  overflow: hidden;
  flex: 1 1 auto;
  font-size: 0.8125rem;
  font-weight: 450;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sd-nav-item:hover {
  background: var(--sd-bg-sidebar-hover);
  color: var(--sd-text-primary);
}

.sd-nav-item:hover .sd-nav-item__icon {
  color: var(--sd-text-secondary);
}

.sd-nav-item.is-active {
  background: var(--sd-bg-sidebar-selected);
  color: var(--sd-text-primary);
  font-weight: 520;
}

.sd-nav-item.is-active .sd-nav-item__icon {
  color: var(--sd-primary);
}

.sd-nav-item.is-active::before {
  position: absolute;
  top: 50%;
  left: -0.7rem;
  width: 2px;
  height: 15px;
  border-radius: 2px;
  background: var(--sd-primary);
  content: '';
  transform: translateY(-50%);
}

.sd-nav-item--static {
  cursor: default;
}

.sd-sidebar-footer {
  display: flex;
  flex: 0 0 auto;
  padding: 0.55rem 0.7rem 0.75rem;
}

.sd-sidebar-action {
  display: flex;
  width: 100%;
  height: 34px;
  align-items: center;
  border-radius: var(--sd-radius-md);
  color: var(--sd-text-muted);
  gap: 0.6rem;
  padding: 0 0.65rem;
  text-decoration: none;
  transition:
    background-color var(--sd-transition-fast),
    color var(--sd-transition-fast);
}

.sd-sidebar-action:hover {
  background: var(--sd-bg-sidebar-hover);
  color: var(--sd-text-secondary);
}

.sd-sidebar-action__icon {
  flex: 0 0 auto;
  font-size: 17px;
}

.sd-sidebar-action span {
  font-size: 0.78rem;
}

.is-collapsed .sd-nav {
  align-items: center;
  padding-inline: 0.4rem;
}

.is-collapsed .sd-nav-group {
  align-items: center;
  width: 100%;
}

.is-collapsed .sd-nav-item {
  justify-content: center;
  padding: 0;
}

.is-collapsed .sd-nav-item.is-active::before {
  left: -0.4rem;
}

.is-collapsed .sd-sidebar-footer {
  justify-content: center;
  padding-inline: 0.35rem;
}

.is-collapsed .sd-sidebar-action {
  justify-content: center;
  padding: 0;
}
</style>
