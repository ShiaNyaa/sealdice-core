<template>
  <div id="root" class="sd-shell">
    <div class="sd-ambient-glow" aria-hidden="true" />

    <aside class="sd-sidebar" :class="{ 'is-collapsed': collapsedMenu }">
      <AppSidebar
        :collapsed="collapsedMenu"
        :advanced-config-counter="advancedConfigCounter"
        @enable-advanced-config="enableAdvancedConfig"
      />
    </aside>

    <div class="sd-main">
      <AppBreadcrumb
        :collapsed="collapsedMenu"
        :viewport-mode="viewportMode"
        @toggle-sidebar="toggleSidebar"
        @open-search="openSearch"
      />

      <div class="sd-notice-layer">
        <AppUiBetaNotice />
      </div>

      <div
        class="sd-floating-panel-layer"
        :class="{ 'sd-floating-panel-layer--active': hasPendingActions }"
        :style="floatingPanelStyle"
      >
        <AppUnsavedChangesPanel />
      </div>

      <main class="sd-content" :class="getAppShellContentClass(props.contentMode)">
        <div
          :class="[
            getAppShellContainerClass(props.containerMode),
            { 'sd-main-container--pending': hasPendingActions },
          ]"
        >
          <slot />
        </div>
      </main>
    </div>

    <AppMobileTabBar v-show="!drawerMenu" @open-menu="drawerMenu = true" />

    <n-drawer
      v-model:show="drawerMenu"
      class="sd-drawer"
      :default-width="getAppShellDrawerWidth()"
      placement="left"
    >
      <n-drawer-content body-content-style="padding: 0;" :native-scrollbar="false">
        <AppSidebar
          :advanced-config-counter="advancedConfigCounter"
          @enable-advanced-config="enableAdvancedConfig"
        />
      </n-drawer-content>
    </n-drawer>

    <AppSearchMenu
      v-if="renderSearchMenu"
      ref="searchMenuRef"
      :advanced-config-counter="advancedConfigCounter"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useEventListener, useWindowSize } from '@vueuse/core';
import { useDialog, useMessage } from 'naive-ui';
import { useRoute } from 'vue-router';
import {
  getAppShellContainerClass,
  getAppShellContentClass,
  getAppShellDrawerWidth,
  getAppShellViewportMode,
  shouldCollapseAppShellSidebar,
  type AppShellContainerMode,
  type AppShellContentMode,
} from './appShellLayout';
import AppBreadcrumb from './AppBreadcrumb.vue';
import AppMobileTabBar from './AppMobileTabBar.vue';
import AppSidebar from './AppSidebar.vue';
import AppUiBetaNotice from './AppUiBetaNotice.vue';
import AppUnsavedChangesPanel from './AppUnsavedChangesPanel.vue';
import { useUnsavedChangesStore } from '@/features/unsavedChanges/store';
import { isControlledReloadArmed } from '@/features/pwa/swUpdate';
import { storeToRefs } from 'pinia';
import { useUploadStore } from '@/features/upload/store';
import { shouldBlockUnload } from '@/features/upload/closeGuard';

interface AppSearchMenuHandle {
  open: () => void;
}

const props = withDefaults(
  defineProps<{
    contentMode?: AppShellContentMode;
    containerMode?: AppShellContainerMode;
  }>(),
  {
    contentMode: 'default',
    containerMode: 'default',
  }
);

const unsaved = useUnsavedChangesStore();
const { hasPendingActions, hasUnsavedChanges } = storeToRefs(unsaved);
const { hasActive: hasActiveUploads } = storeToRefs(useUploadStore());

const loadAppSearchMenu = () => import('./AppSearchMenu.vue');
const AppSearchMenu = defineAsyncComponent(loadAppSearchMenu);

const route = useRoute();
const { width: viewportWidth } = useWindowSize();
const viewportMode = computed(() => getAppShellViewportMode(viewportWidth.value));

const drawerMenu = ref(false);
const collapsedMenu = ref(shouldCollapseAppShellSidebar(viewportMode.value));
const floatingPanelStyle = computed(() => {
  if (viewportMode.value === 'mobile') return undefined;
  const sidebarWidth = collapsedMenu.value ? 66 : 252;
  return {
    left: `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px) / 2)`,
    width: `min(100%, calc(100vw - ${sidebarWidth}px - 2rem))`,
  };
});
const advancedConfigCounter = ref(0);
const renderSearchMenu = ref(false);
const searchMenuRef = ref<AppSearchMenuHandle | null>(null);
const message = useMessage();
const dialog = useDialog();

function enableAdvancedConfig() {
  advancedConfigCounter.value += 1;
  if (advancedConfigCounter.value > 8) {
    message.info('高级设置页已经开启');
  } else if (advancedConfigCounter.value === 8) {
    message.success('已开启高级设置页');
  } else if (advancedConfigCounter.value > 2) {
    message.info(`再按 ${8 - advancedConfigCounter.value} 次开启高级设置页`);
  }
}

function toggleSidebar() {
  if (viewportMode.value === 'mobile') {
    drawerMenu.value = true;
    return;
  }
  collapsedMenu.value = !collapsedMenu.value;
}

async function openSearch() {
  renderSearchMenu.value = true;
  await loadAppSearchMenu();
  await nextTick();
  searchMenuRef.value?.open();
}

watch(viewportMode, mode => {
  collapsedMenu.value = shouldCollapseAppShellSidebar(mode);
  drawerMenu.value = false;
});

watch(
  () => route.fullPath,
  () => {
    drawerMenu.value = false;
  }
);

useEventListener(window, 'keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    void openSearch();
  }
});

useEventListener(window, 'beforeunload', event => {
  // 升级提示的受控刷新、关闭确认都走同一判定：有未保存改动或有进行中上传时提示。
  const block = shouldBlockUnload({
    controlledReloadArmed: isControlledReloadArmed(),
    hasUnsavedChanges: hasUnsavedChanges.value,
    hasActiveUploads: hasActiveUploads.value,
  });
  if (!block) return;
  event.preventDefault();
  event.returnValue = '';
});

const releaseConfirmHandler = unsaved.setConfirmHandler(
  source =>
    new Promise(resolve => {
      dialog.warning({
        title: '确认离开',
        content: source.confirmMessage,
        positiveText: '确定忽略',
        negativeText: '取消',
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
        onMaskClick: () => resolve(false),
        onEsc: () => resolve(false),
      });
    })
);
onBeforeUnmount(releaseConfirmHandler);
</script>

<style scoped>
.sd-shell {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  background: var(--sd-bg-app);
}

.sd-sidebar {
  position: sticky;
  z-index: 20;
  top: 0;
  display: flex;
  width: 252px;
  height: 100vh;
  flex: 0 0 auto;
  flex-direction: column;
  border-right: 1px solid var(--sd-border-sidebar);
  background: var(--sd-bg-sidebar);
  transition: width var(--sd-transition-base);
}

.sd-sidebar.is-collapsed {
  width: 66px;
}

.sd-main {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.sd-notice-layer {
  padding: 0.75rem clamp(1rem, 2.4vw, 2rem) 0;
}

.sd-notice-layer:empty {
  display: none;
}

.sd-content {
  display: flex;
  width: 100%;
  flex: 1 1 auto;
  min-width: 0;
  padding: 1rem clamp(1rem, 2.4vw, 2rem) 3.5rem;
}

.sd-main-container {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--sd-content-max-width);
  min-width: 0;
  margin-inline: auto;
}

.sd-main-container--wide {
  width: 100%;
  max-width: none;
  margin-inline: 0;
}

.sd-page-shell {
  width: 100%;
  min-width: 0;
}

.sd-page-shell--workspace {
  display: flex;
  min-height: calc(100vh - 9rem);
  flex-direction: column;
}

/* 移动端沉底状态条会盖住页面末尾，脏态出现时补足底部空间。 */
@media screen and (max-width: 767.9px) {
  .sd-main-container--pending {
    padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
  }
}

.sd-floating-panel-layer {
  position: fixed;
  top: 4.25rem;
  left: 50%;
  z-index: 40;
  display: flex;
  width: min(100%, calc(100vw - 16rem));
  justify-content: center;
  pointer-events: none;
  transform: translateX(-50%);
}

@media screen and (max-width: 767.9px) {
  .sd-floating-panel-layer {
    top: auto;
    bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px));
    left: 0;
    width: 100%;
    transform: none;
  }
}

:global(.sd-drawer .n-drawer-content) {
  background: var(--sd-bg-sidebar);
}

:global(.sd-drawer .n-drawer-body-content-wrapper) {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

:global(.sd-drawer .sd-sidebar-content) {
  flex: 1 1 auto;
  min-height: 0;
}

@media screen and (max-width: 767.9px) {
  .sd-sidebar {
    display: none;
  }

  .sd-content {
    padding: 0.85rem 0.9rem calc(5rem + env(safe-area-inset-bottom, 0px));
  }

  .sd-notice-layer {
    padding: 0.6rem 0.9rem 0;
  }

  .sd-page-shell--workspace {
    min-height: calc(100vh - 11rem);
  }
}

@media screen and (min-width: 768px) and (max-width: 1023.9px) {
  .sd-content {
    padding: 1.25rem 1.25rem 3rem;
  }
}
</style>
