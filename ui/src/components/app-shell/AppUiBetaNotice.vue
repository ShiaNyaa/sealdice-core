<template>
  <div v-if="visible" class="sd-beta-notice" role="status">
    <i-tabler-info-circle class="sd-beta-notice__icon" aria-hidden="true" />
    <span class="sd-beta-notice__text">
      新版界面仍在公测。遇到问题欢迎
      <a class="sd-beta-notice__link" :href="feedbackUrl" target="_blank" rel="noopener noreferrer"
        >反馈</a
      >，也可以随时切回旧版界面。
    </span>
    <a class="sd-beta-notice__action" :href="oldUIUrl">切换旧版</a>
    <button type="button" class="sd-beta-notice__close" aria-label="关闭提示" @click="handleClose">
      <i-tabler-x />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { resolveSwitchToOldUIUrl } from '@/api/config';
import {
  UI_BETA_FEEDBACK_URL,
  persistUiBetaNoticeDismissed,
  readUiBetaNoticeDismissed,
} from '@/features/uiBetaNotice/notice';

const feedbackUrl = UI_BETA_FEEDBACK_URL;
const oldUIUrl =
  typeof window !== 'undefined' ? resolveSwitchToOldUIUrl(window.location) : '/?ui=old';
const visible = ref(
  !(typeof localStorage !== 'undefined' && readUiBetaNoticeDismissed(localStorage))
);

function handleClose() {
  visible.value = false;
  if (typeof localStorage !== 'undefined') {
    persistUiBetaNoticeDismissed(localStorage);
  }
}
</script>

<style scoped>
.sd-beta-notice {
  display: flex;
  align-items: center;
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-md);
  background: var(--sd-bg-elevated-soft);
  color: var(--sd-text-secondary);
  font-size: 0.75rem;
  gap: 0.5rem;
  line-height: 1.5;
  padding: 0.5rem 0.6rem 0.5rem 0.75rem;
}

.sd-beta-notice__icon {
  flex: 0 0 auto;
  color: var(--sd-text-muted);
  font-size: 15px;
}

.sd-beta-notice__text {
  min-width: 0;
  flex: 1 1 auto;
}

.sd-beta-notice__link {
  color: var(--sd-primary);
  text-decoration: none;
}

.sd-beta-notice__link:hover {
  text-decoration: underline;
}

.sd-beta-notice__action {
  flex: 0 0 auto;
  border-radius: var(--sd-radius-pill);
  background: var(--sd-bg-control);
  color: var(--sd-text-secondary);
  font-size: 0.6875rem;
  line-height: 1;
  padding: 0.35rem 0.55rem;
  text-decoration: none;
  transition: background-color var(--sd-transition-fast);
}

.sd-beta-notice__action:hover {
  background: var(--sd-bg-control-hover);
}

.sd-beta-notice__close {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--sd-radius-sm);
  background: transparent;
  color: var(--sd-text-muted);
  cursor: pointer;
  font-size: 14px;
}

.sd-beta-notice__close:hover {
  background: var(--sd-bg-hover);
  color: var(--sd-text-secondary);
}

/* 移动端首屏空间有限，公测提示让位给内容；桌面端保留完整说明。 */
@media screen and (max-width: 639.9px) {
  .sd-beta-notice {
    display: none;
  }
}
</style>
