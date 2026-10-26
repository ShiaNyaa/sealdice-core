<template>
  <main class="tool-test-page sd-page-flow">
    <PageHeader
      title="指令测试"
      description="按当前会话上下文发送指令，验证牌堆、扩展与回复行为。"
    >
      <template #meta>
        <span class="test-status" :class="{ 'is-live': toolTest.realtimeActive.value }">
          <span class="test-status__dot" />
          {{
            toolTest.realtimeTransport.value === 'polling'
              ? '轮询'
              : toolTest.realtimeTransport.value === 'sse'
                ? 'SSE'
                : '未连接'
          }}
        </span>
      </template>
      <NPopover placement="bottom-end" trigger="click">
        <template #trigger>
          <NButton secondary size="small">
            <template #icon>
              <NIcon><i-tabler-dots /></NIcon>
            </template>
            操作
          </NButton>
        </template>
        <div class="tool-test-page__quick-actions">
          <NButton
            secondary
            :loading="toolTest.reloadDeckMutation.isPending.value"
            @click="toolTest.reloadDeck"
          >
            重载牌堆
          </NButton>
          <NButton
            secondary
            :loading="toolTest.reloadJsMutation.isPending.value"
            @click="toolTest.reloadJs"
          >
            重载 JS
          </NButton>
          <NButton
            secondary
            :loading="toolTest.reloadHelpdocMutation.isPending.value"
            @click="toolTest.reloadHelpdoc"
          >
            重载帮助文档
          </NButton>
        </div>
      </NPopover>
    </PageHeader>

    <section class="tool-test-toolbar" aria-label="测试会话设置">
      <div class="tool-test-toolbar__group">
        <span class="tool-test-toolbar__label">会话</span>
        <NRadioGroup v-model:value="toolTest.mode.value" size="small">
          <NRadioButton value="private">私聊</NRadioButton>
          <NRadioButton value="group">群聊</NRadioButton>
        </NRadioGroup>
        <NSelect
          v-if="toolTest.mode.value === 'private'"
          v-model:value="toolTest.selectedSenderIds.private"
          size="small"
          class="tool-test-page__private-sender"
          :options="privateSenderOptions"
          @update:value="toolTest.loadContext('private')"
        />
      </div>
      <div class="tool-test-toolbar__group">
        <span class="tool-test-toolbar__label">消息分段</span>
        <NRadioGroup v-model:value="toolTest.splitOptionKey.value" size="small">
          <NRadioButton
            v-for="option in toolTest.splitOptions.value"
            :key="option.key"
            :value="option.key"
          >
            {{ option.label }}
          </NRadioButton>
        </NRadioGroup>
      </div>
    </section>

    <TipBox v-if="toolTest.commandErrorText.value" type="warning" class="tool-test-page__alert">
      {{ toolTest.commandErrorText.value }}
    </TipBox>
    <TipBox v-if="toolTest.pollingErrorText.value" type="error" class="tool-test-page__alert">
      {{ toolTest.pollingErrorText.value }}
    </TipBox>

    <section class="tool-test-page__workspace" :class="workspaceClass">
      <div class="tool-test-page__chat-column">
        <ToolTestChatWindow
          :title="toolTest.modeTitle.value"
          :messages="toolTest.currentMessages.value"
        >
          <template #actions>
            <NButton
              v-if="toolTest.mode.value === 'group'"
              secondary
              size="small"
              class="tool-test-page__mobile-members-button"
              @click="memberRailOpen = true"
            >
              <template #icon
                ><NIcon><i-tabler-users /></NIcon
              ></template>
              群成员
            </NButton>
          </template>
        </ToolTestChatWindow>

        <footer class="tool-test-page__composer">
          <ToolTestCommandComposer
            :model-value="toolTest.input.value"
            :options="toolTest.commandOptions.value"
            :prefixes="toolTest.currentContext.value.commandPrefix"
            :loading="toolTest.sendMutation.isPending.value || toolTest.commandLoading.value"
            @update:model-value="toolTest.input.value = $event"
            @submit="toolTest.send"
          />
        </footer>
      </div>

      <div
        v-if="memberRailOpen && toolTest.mode.value === 'group'"
        class="tool-test-page__mobile-scrim"
        @click="memberRailOpen = false"
      />
      <ToolTestMemberRail
        v-if="toolTest.mode.value === 'group'"
        :mode="toolTest.mode.value"
        :profiles="toolTest.currentContext.value.members"
        :current-user-id="toolTest.currentContext.value.currentSenderId"
        :group-access="toolTest.currentContext.value.groupAccess"
        :mobile-open="memberRailOpen"
        :saving="toolTest.updateProfileMutation.isPending.value"
        @select="handleSelectProfile"
        @save-profile="toolTest.updateProfile"
        @update-group-access="toolTest.updateGroupAccess"
        @close-mobile="memberRailOpen = false"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { NButton, NIcon, NPopover, NRadioButton, NRadioGroup, NSelect } from 'naive-ui';
import ToolTestChatWindow from '@/components/tool-test/ToolTestChatWindow.vue';
import ToolTestCommandComposer from '@/components/tool-test/ToolTestCommandComposer.vue';
import ToolTestMemberRail from '@/components/tool-test/ToolTestMemberRail.vue';
import { useToolTest } from '@/features/toolTest/useToolTest';
import type { ToolTestProfile } from '@/features/toolTest/model';
import PageHeader from '@/components/shared/PageHeader.vue';
import TipBox from '@/components/shared/TipBox.vue';

const toolTest = useToolTest();
const memberRailOpen = shallowRef(false);

const privateSenderOptions = computed(
  () =>
    toolTest.contexts.private?.members
      .filter(profile => profile.enabled)
      .map(profile => ({ label: `${profile.name} · ${profile.userId}`, value: profile.userId })) ??
    []
);

const workspaceClass = computed(() => ({
  'tool-test-page__workspace--private': toolTest.mode.value === 'private',
  'tool-test-page__workspace--group': toolTest.mode.value === 'group',
}));

async function handleSelectProfile(profile: ToolTestProfile) {
  await toolTest.selectSender(profile);
  memberRailOpen.value = false;
}
</script>

<style scoped>
.tool-test-page {
  --devui-primary: var(--sd-primary);
  --devui-primary-hover: var(--sd-accent-strong);
  --devui-primary-active: var(--sd-accent-strong);
  --devui-base-bg: var(--sd-bg-elevated);
  --devui-global-bg: var(--sd-bg-control);
  --devui-form-control-bg: var(--sd-bg-elevated);
  --devui-form-control-line: var(--sd-border-soft);
  --devui-disabled-bg: var(--sd-bg-control);
  --devui-disabled-text: var(--sd-text-muted);
  --devui-text: var(--sd-text-primary);
  --devui-light-text: var(--sd-text-inverse);
  --devui-placeholder: var(--sd-text-muted);
  --devui-dividing-line: var(--sd-border-soft);
  --devui-list-item-hover-bg: var(--sd-bg-hover);
  --devui-list-item-hover-text: var(--sd-text-primary);
  --devui-list-item-active-bg: var(--sd-bg-selected);
  --devui-list-item-active-text: var(--sd-text-primary);
  --devui-gray-form-control-bg: var(--sd-bg-control);
  --devui-connected-overlay-bg: var(--sd-bg-elevated);
  --devui-font-size: 0.875rem;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.test-status {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-pill);
  background: var(--sd-bg-elevated);
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  gap: 0.4rem;
  line-height: 1;
  padding: 0.32rem 0.6rem;
}

.test-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sd-text-muted);
}

.test-status.is-live {
  border-color: var(--sd-success-border);
  background: var(--sd-success-soft);
  color: var(--sd-success);
}

.test-status.is-live .test-status__dot {
  background: var(--sd-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--sd-success) 18%, transparent);
}

.tool-test-toolbar {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-lg);
  background: var(--sd-bg-elevated);
  gap: 2rem;
  padding: 0.6rem 0.85rem;
}

.tool-test-toolbar__group {
  display: flex;
  min-width: 0;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.6rem;
}

.tool-test-toolbar__label {
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
}

.tool-test-page__controls {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tool-test-page__private-sender {
  width: min(15rem, 100%);
}

@media (max-width: 640px) {
  .tool-test-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tool-test-toolbar__group {
    width: 100%;
    flex-wrap: wrap;
  }
}

.tool-test-page__quick-actions {
  display: grid;
  min-width: 12rem;
  gap: 0.4rem;
}

.tool-test-page__workspace {
  display: flex;
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--sd-border-soft);
  border-radius: var(--sd-radius-md);
  background: var(--sd-bg-elevated);
}

.tool-test-page__chat-column {
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.tool-test-page__workspace :deep(.tool-test-chat-window) {
  min-height: 0;
  flex: 1 1 auto;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.tool-test-page__workspace--private .tool-test-page__chat-column {
  width: 100%;
}

.tool-test-page__mobile-members-button {
  display: none;
}

.tool-test-page__mobile-scrim {
  display: none;
  position: fixed;
  z-index: 19;
  inset: 0;
  background: var(--sd-overlay);
}

.tool-test-page__composer {
  flex-shrink: 0;
  padding: 0.65rem 0.75rem max(0.65rem, env(safe-area-inset-bottom));
  border-top: 1px solid var(--sd-border-soft);
  background: var(--sd-bg-elevated);
}

@media (max-width: 1100px) {
  .tool-test-page__header {
    flex-direction: column;
  }

  .tool-test-page__controls {
    justify-content: flex-start;
  }
}

@media (max-width: 860px) {
  .tool-test-page__mobile-members-button {
    display: inline-flex;
  }

  .tool-test-page__mobile-scrim {
    display: block;
  }

  .tool-test-page__workspace--group :deep(.tool-test-member-rail) {
    position: fixed;
    z-index: 20;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(19rem, 88vw);
    transform: translateX(100%);
    transition: transform 180ms ease;
  }

  .tool-test-page__workspace--group :deep(.tool-test-member-rail--open) {
    transform: translateX(0);
  }
}

@media (max-width: 640px) {
  .tool-test-page__controls {
    width: 100%;
    align-items: stretch;
  }

  .tool-test-page__private-sender {
    flex: 1 1 12rem;
  }

  .tool-test-page__workspace {
    margin-inline: -0.25rem;
    border-radius: var(--sd-radius-md);
  }
}
</style>
