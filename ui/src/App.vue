<template>
  <ProConfigProvider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="activeTheme"
    :theme-overrides="themeOverrides"
  >
    <n-message-provider>
      <n-modal-provider>
        <n-dialog-provider>
          <n-loading-bar-provider>
            <RouterView v-slot="{ Component, route }">
              <AppTestModeFrame
                :active="testMode.isTestMode.value"
                :banner-text="testMode.bannerText.value"
                :watermark-text="testMode.watermarkText.value"
              >
                <PlainLayout v-if="route.meta.layout === 'plain'">
                  <Transition name="page-swap" mode="out-in">
                    <component :is="Component" :key="route.path" />
                  </Transition>
                </PlainLayout>
                <AppShell
                  v-else
                  :content-mode="getAppShellContentMode(route.meta.layout)"
                  :container-mode="getAppShellContainerMode(route.meta.layout)"
                >
                  <Transition name="page-swap" mode="out-in">
                    <component :is="Component" :key="route.path" />
                  </Transition>
                </AppShell>
              </AppTestModeFrame>
            </RouterView>
            <AppUnlockDialog />
            <AppUpdatePrompt />
          </n-loading-bar-provider>
        </n-dialog-provider>
      </n-modal-provider>
    </n-message-provider>
  </ProConfigProvider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme, dateZhCN } from 'naive-ui';
import { ProConfigProvider, zhCN } from 'pro-naive-ui';
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import AppTestModeFrame from './components/app-shell/AppTestModeFrame.vue';
import AppShell from './components/app-shell/AppShell.vue';
import AppUnlockDialog from './components/app-shell/AppUnlockDialog.vue';
import AppUpdatePrompt from './components/app-shell/AppUpdatePrompt.vue';
import PlainLayout from './layouts/PlainLayout.vue';
import {
  getAppShellContentMode,
  getAppShellContainerMode,
} from './components/app-shell/appShellLayout';
import { useAuthSession } from './features/auth/useAuthSession';
import { useRealtimeClientStore } from './features/realtime/store';
import { useTestMode } from './features/testMode/state';
import { storeToRefs } from 'pinia';
import { useThemeStore } from './features/theme/store';
import { useSmoothScroll } from './lib/smoothScroll';
// App 是全局 provider 和 layout 分发层。页面不要直接挂全局 provider，
// 否则会出现消息、弹窗、QueryClient 或主题状态多实例的问题。
const { resolvedTheme, themeOverrides } = storeToRefs(useThemeStore());

const activeTheme = computed(() => (resolvedTheme.value === 'dark' ? darkTheme : lightTheme));
const testMode = useTestMode();
const authSession = useAuthSession();

// 平滑滚动仅接管桌面精确指针设备；触屏与 prefers-reduced-motion 走原生滚动。
useSmoothScroll();

// 全局 provider 只接收最终主题对象。颜色计算集中在 features/theme，
// 避免根组件和业务页面各自维护一套主色、状态色和暗色覆盖。

// 实时通道是全局单例：App 挂载后根据 token 自动连接，业务模块只订阅事件。
// 这样首页日志、连接管理等页面可以共享同一条 SSE 连接。
void authSession.tryDefaultSignin();
useRealtimeClientStore().ensureInitialized();
</script>

<style>
/* 页面切换：轻微上浮 + 淡入，退出更快，避免连续导航时拖影。 */
.page-swap-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.page-swap-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.page-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-swap-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

@media (prefers-reduced-motion: reduce) {
  .page-swap-enter-active,
  .page-swap-leave-active {
    transition: none;
  }
}
</style>
