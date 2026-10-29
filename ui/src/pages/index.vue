<template>
  <main ref="pageRef" class="home-page sd-page">
    <PageHeader
      eyebrow="Overview"
      title="运行概览"
      description="实例资源、群组服务与网络状态，保持清晰可见。"
    >
      <template #meta>
        <span class="live-pill" :class="{ 'is-live': logStream.connected }">
          <span class="live-pill__dot" />
          {{ logStream.connected ? '实时连接' : '连接中断' }}
        </span>
      </template>

      <n-tooltip v-if="hasNewVersion && isContainerMode">
        <template #trigger>
          <n-button type="primary" disabled>升级新版</n-button>
        </template>
        容器模式下禁止直接更新，请手动拉取最新镜像
      </n-tooltip>
      <n-button v-else-if="hasNewVersion" type="primary" disabled>升级新版</n-button>
    </PageHeader>

    <section class="stat-strip" aria-label="实例关键指标">
      <article class="stat">
        <span class="stat__label">
          <i-tabler-cpu />
          内存占用
        </span>
        <div class="stat__value">
          <template v-if="overview">
            <NumberTicker
              :value="memoryMegabytes"
              :decimal-places="1"
              :duration="1100"
              class="stat__number"
            />
            <span class="stat__unit">MB</span>
          </template>
          <span v-else class="stat__placeholder">—</span>
        </div>
        <span class="stat__foot" :title="runtimeSummary">{{ runtimeSummary }}</span>
      </article>

      <article class="stat">
        <span class="stat__label">
          <i-tabler-users-group />
          群组服务
        </span>
        <div class="stat__value">
          <template v-if="groupSummary">
            <NumberTicker
              :value="groupSummary.joined"
              :decimal-places="0"
              :duration="1100"
              class="stat__number"
            />
            <span class="stat__unit">个已加入</span>
          </template>
          <span v-else class="stat__placeholder">—</span>
        </div>
        <span class="stat__foot">
          <template v-if="groupSummary">
            已启用
            <strong>{{ groupSummary.enabled }}</strong>
            · 未启用
            <strong>{{ inactiveGroups }}</strong>
          </template>
          <template v-else>等待群组数据</template>
        </span>
      </article>

      <article class="stat">
        <span class="stat__label">
          <i-tabler-clock-hour-4 />
          运行时长
        </span>
        <div class="stat__value">
          <span v-if="overview" class="stat__state">{{ uptimeDisplay }}</span>
          <span v-else class="stat__placeholder">—</span>
        </div>
        <span class="stat__foot">启动于 {{ startedAt }}</span>
      </article>
    </section>

    <SpotlightCard class="panel panel--chart">
      <header class="panel__head">
        <div>
          <h2>服务响应</h2>
          <p>
            最近一次探测耗时，单位毫秒。
            <template v-if="networkHealth.timestamp !== 0">
              {{ formatNetworkHealthRelativeTime(networkHealth.timestamp) }}更新
            </template>
          </p>
        </div>
        <div class="panel__actions">
          <span class="panel__badge">
            {{ networkHealth.ok.length }}/{{ networkHealth.total }} 正常
          </span>
          <n-button
            v-if="networkHealth.timestamp !== 0"
            size="small"
            secondary
            :loading="networkHealthRefreshing"
            @click="refreshNetworkHealth"
          >
            <template #icon>
              <n-icon><i-tabler-refresh /></n-icon>
            </template>
            重新检测
          </n-button>
        </div>
      </header>

      <Suspense>
        <AsyncLatencyChart v-if="networkHealth.targets.length" :targets="networkHealth.targets" />
        <div v-else class="chart-placeholder">
          <n-spin :size="20" />
          <span>正在等待首次探测结果</span>
        </div>
      </Suspense>
    </SpotlightCard>

    <section class="log-panel">
      <header class="log-panel__header">
        <div class="log-title">
          <h2>运行日志</h2>
          <span class="log-transport">
            {{
              logStream.transport === 'polling'
                ? '轮询'
                : logStream.transport === 'sse'
                  ? 'SSE'
                  : '未连接'
            }}
          </span>
        </div>
        <div class="log-controls">
          <n-checkbox v-model:checked="displayReverse" size="small">最新在前</n-checkbox>
          <n-checkbox v-model:checked="autoRefresh" size="small">保持刷新</n-checkbox>
          <n-button size="small" quaternary @click="logStream.reconnect">重连</n-button>
          <n-button
            size="tiny"
            type="primary"
            secondary
            :disabled="!logOverflow || logAtLatest"
            :aria-label="logAtLatest ? '已在最新日志' : '跳到最新一条日志'"
            @click="scrollToLatestLog"
          >
            {{ logAtLatest ? '已是最新' : '跳到最新' }}
          </n-button>
        </div>
      </header>

      <TipBox v-if="logStream.errorText" type="error" class="log-alert">
        {{ logStream.errorText }}
      </TipBox>

      <div ref="logsContainer" class="logs">
        <ListEmptyState v-if="!logData.length" description="暂无运行日志" />
        <n-data-table
          v-else
          ref="logTable"
          :data="logData"
          :columns="columns"
          :row-key="getLogRowKey"
          :class="isMobile ? 'w-full' : ''"
          :bordered="false"
          size="small"
          :max-height="isMobile ? 340 : 388"
          :virtual-scroll="!isMobile"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="tsx">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { breakpointsTailwind, useBreakpoints, usePreferredReducedMotion } from '@vueuse/core';
import { useQuery } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import gsap from 'gsap';
import type { DataTableColumns, DataTableInst } from 'naive-ui';
import {
  getSdApiV2BaseNetworkHealthOptions,
  getSdApiV2BaseOverviewOptions,
  postSdApiV2GroupList,
} from '@/api';
import { useBaseLogStreamStore } from '@/features/base/logStreamStore';
import { applyLogDisplayUpdate, type BaseLogEntry } from '@/features/base/logStreamState';
import {
  formatNetworkHealthRelativeTime,
  normalizeNetworkHealthData,
} from '@/features/base/networkHealth';
import { formatRuntimeSummary } from '@/features/base/runtimeSummary';
import NumberTicker from '@/components/inspira/NumberTicker.vue';
import SpotlightCard from '@/components/bits/SpotlightCard.vue';

import PageHeader from '@/components/shared/PageHeader.vue';
import TipBox from '@/components/shared/TipBox.vue';
import ListEmptyState from '@/components/shared/ListEmptyState.vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/features/auth/store';
const { hasAccessToken } = storeToRefs(useAuthStore());
const prefersReducedMotion = usePreferredReducedMotion();

const AsyncLatencyChart = defineAsyncComponent(
  () => import('@/components/charts/LatencyChart.vue')
);

const pageRef = useTemplateRef<HTMLElement>('pageRef');

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('md');

// 首页是运行概览页：低频状态走 overview query，高频日志走 realtime。
// 不把日志混进 overview，是为了避免 5 秒轮询带回大量日志数据。
const overviewQuery = useQuery({
  ...getSdApiV2BaseOverviewOptions(),
  enabled: hasAccessToken,
  refetchInterval: 5000,
});

const networkHealthQuery = useQuery({
  ...getSdApiV2BaseNetworkHealthOptions(),
  enabled: hasAccessToken,
  refetchInterval: 300000,
});

const groupSummaryQuery = useQuery({
  queryKey: ['home', 'group-summary'],
  queryFn: fetchGroupSummary,
  enabled: hasAccessToken,
  staleTime: 30000,
  refetchInterval: 60000,
});

const overview = computed(() => overviewQuery.data.value?.item);
const memoryUsed = computed(() => overview.value?.memory.usedSys ?? 0);
const memoryMegabytes = computed(() => Math.round((memoryUsed.value / 1024 / 1024) * 10) / 10);
const groupSummary = computed(() => groupSummaryQuery.data.value);
const inactiveGroups = computed(() =>
  Math.max(0, (groupSummary.value?.joined ?? 0) - (groupSummary.value?.enabled ?? 0))
);
const runtimeSummary = computed(() =>
  formatRuntimeSummary(overview.value?.runtime, { withMode: true })
);
const uptimeSeconds = computed(() => Number(overview.value?.runtime.uptime ?? 0));
const uptimeDisplay = computed(() => {
  const total = uptimeSeconds.value;
  if (!total) return '—';
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days) return `${days} 天 ${hours} 小时`;
  if (hours) return `${hours} 小时 ${minutes} 分`;
  if (minutes) return `${minutes} 分钟`;
  return '刚刚启动';
});
const startedAt = computed(() =>
  uptimeSeconds.value
    ? dayjs().subtract(uptimeSeconds.value, 'second').format('MM-DD HH:mm')
    : '—'
);
const hasNewVersion = computed(() => {
  const version = overview.value?.version;
  if (!version) return false;
  return version.code < version.latestCode;
});
const isContainerMode = computed(() => overview.value?.runtime.containerMode === true);

const displayReverse = ref(true);
const autoRefresh = ref(true);
const visibleLogs = ref<BaseLogEntry[]>([]);
const logsContainer = useTemplateRef<HTMLElement>('logsContainer');
const logTable = useTemplateRef<DataTableInst>('logTable');
const logOverflow = ref(false);
const logAtLatest = ref(true);
let logScrollElement: HTMLElement | null = null;
const logStream = useBaseLogStreamStore();
logStream.ensureInitialized();
const networkHealth = computed(() =>
  normalizeNetworkHealthData(networkHealthQuery.data.value?.item)
);
const networkHealthRefreshing = computed(() => networkHealthQuery.isFetching.value);

watch(
  [() => logStream.logs, autoRefresh],
  () => {
    visibleLogs.value = applyLogDisplayUpdate(visibleLogs.value, logStream.logs, autoRefresh.value);
  },
  { immediate: true }
);

// 日志源保持 append 顺序，展示顺序只在 computed 中转换，避免切换“倒序显示”
// 时破坏原始缓冲和后续 append 逻辑。
const logData = computed(() => {
  return displayReverse.value ? [...visibleLogs.value].reverse() : visibleLogs.value;
});

function getLogRowKey(row: BaseLogEntry) {
  return row.id;
}

async function fetchGroupSummary() {
  const firstPageSize = 100;
  const firstResponse = await postSdApiV2GroupList({
    body: {
      page: 1,
      pageSize: firstPageSize,
      keyword: '',
      filter: {},
    },
    throwOnError: true,
  });

  let total = Number(firstResponse.data.item.total ?? 0);
  let groups = firstResponse.data.item.list ?? [];

  if (groups.length < total) {
    const fullResponse = await postSdApiV2GroupList({
      body: {
        page: 1,
        pageSize: total,
        keyword: '',
        filter: {},
      },
      throwOnError: true,
    });
    total = Number(fullResponse.data.item.total ?? total);
    groups = fullResponse.data.item.list ?? [];
  }

  return {
    joined: total,
    enabled: groups.filter(group => group.active).length,
  };
}

function refreshNetworkHealth() {
  void networkHealthQuery.refetch();
}

// 「跳到最新」始终跳到最新那一条：倒序显示时它在顶部，正序显示时在尾部。
// 走表格实例的 scrollTo，因为虚拟滚动下真正的滚动元素是内部的 .v-vl，
// .n-data-table-base-table-body 只是外层 scrollbar 包装，对它 scrollTo 不会生效。
function scrollToLatestLog() {
  if (!logData.value.length) return;

  // 到底部用一个足够大的 top 交给浏览器 clamp：scrollTo 的公开类型里没有
  // position 字段，而它内部实现就是 top: MAX_SAFE_INTEGER。
  const top = displayReverse.value ? 0 : Number.MAX_SAFE_INTEGER;
  const table = logTable.value;
  if (table) {
    table.scrollTo({ top, behavior: 'smooth' });
    return;
  }

  getLogScrollElement()?.scrollTo({ top, behavior: 'smooth' });
}

function getLogScrollElement(): HTMLElement | null {
  const root = logsContainer.value;
  if (!root) return null;
  return (
    root.querySelector<HTMLElement>('.n-data-table-base-table-body .v-vl') ??
    root.querySelector<HTMLElement>('.n-data-table-base-table-body')
  );
}

function updateLogScrollState() {
  const element = getLogScrollElement();
  if (element !== logScrollElement) {
    logScrollElement?.removeEventListener('scroll', updateLogScrollState);
    logScrollElement = element;
    logScrollElement?.addEventListener('scroll', updateLogScrollState, { passive: true });
  }

  if (!element) {
    logOverflow.value = false;
    logAtLatest.value = true;
    return;
  }

  const maxScrollTop = element.scrollHeight - element.clientHeight;
  logOverflow.value = maxScrollTop > 1;
  logAtLatest.value =
    maxScrollTop <= 1 ||
    (displayReverse.value ? element.scrollTop <= 1 : element.scrollTop >= maxScrollTop - 1);
}

async function refreshLogScrollState() {
  await nextTick();
  requestAnimationFrame(updateLogScrollState);
}

watch([logData, displayReverse, isMobile], refreshLogScrollState, { flush: 'post' });

type LogLevelTone = 'neutral' | 'info' | 'warning' | 'error';

function getLogLevelMeta(level: string): { label: string; tone: LogLevelTone } {
  switch (level.toLowerCase()) {
    case 'info':
      return { label: 'INFO', tone: 'info' };
    case 'warn':
    case 'warning':
      return { label: 'WARN', tone: 'warning' };
    case 'error':
    case 'fatal':
      return { label: level.toUpperCase(), tone: 'error' };
    default:
      return { label: level.toUpperCase() || 'LOG', tone: 'neutral' };
  }
}

function renderLogLevel(row: BaseLogEntry) {
  const meta = getLogLevelMeta(row.level);
  return <span class={['log-level', `log-level--${meta.tone}`]}>{meta.label}</span>;
}

const columns = computed<DataTableColumns<BaseLogEntry>>(() => {
  const data: DataTableColumns<BaseLogEntry> = [
    {
      title: '时间',
      key: 'ts',
      width: isMobile.value ? 70 : 96,
      render: row => (
        <div class="log-time">
          <span class="log-time-text">
            {dayjs.unix(row.ts).format(isMobile.value ? 'HH:mm' : 'HH:mm:ss')}
          </span>
        </div>
      ),
    },
  ];

  data.push({
    title: '级别',
    key: 'level',
    width: isMobile.value ? 68 : 76,
    render: renderLogLevel,
  });

  if (!isMobile.value) {
    data.push({
      title: '模块',
      key: 'module',
      width: 118,
      render: row => <span class="log-module">{row.module ?? '—'}</span>,
    });
  }

  data.push({
    title: '信息',
    key: 'msg',
    render: row => <div class="log-message">{row.msg}</div>,
  });

  return data;
});

// GSAP 只负责入场编排：一条时间轴同时管理指标、图表、日志区的节奏。
onMounted(() => {
  refreshLogScrollState();

  if (prefersReducedMotion.value === 'reduce') return;

  const root = pageRef.value;
  if (!root) return;
  const context = gsap.context(() => {
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .from('.sd-page-header', { y: 10, opacity: 0, duration: 0.45 })
      .from('.stat', { y: 16, opacity: 0, duration: 0.5, stagger: 0.06 }, '-=0.2')
      .from('.panel', { y: 18, opacity: 0, duration: 0.55 }, '-=0.28')
      .from('.log-panel', { y: 14, opacity: 0, duration: 0.45 }, '-=0.35');
  }, root);

  onBeforeUnmount(() => context.revert());
});

onBeforeUnmount(() => {
  logScrollElement?.removeEventListener('scroll', updateLogScrollState);
});
</script>

<style scoped>
.home-page {
  width: 100%;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-sm);
  background: var(--sd-bg-elevated);
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  gap: 0.42rem;
  line-height: 1;
  padding: 0.32rem 0.6rem;
}

.live-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sd-text-muted);
}

.live-pill.is-live {
  border-color: var(--sd-success-border);
  background: var(--sd-success-soft);
  color: var(--sd-success);
}

.live-pill.is-live .live-pill__dot {
  background: var(--sd-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--sd-success) 18%, transparent);
}

/* 指标条：一块连续表面里用分隔线切开，比三张独立卡片更安静。 */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-lg);
  background: var(--sd-bg-elevated);
}

.stat {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.15rem 1.35rem 1.2rem;
}

.stat + .stat {
  border-left: 1px solid var(--sd-border-soft);
}

.stat__label {
  display: inline-flex;
  align-items: center;
  color: var(--sd-text-muted);
  font-size: 0.75rem;
  gap: 0.4rem;
}

.stat__label svg {
  font-size: 15px;
}

.stat__value {
  display: flex;
  min-height: 2rem;
  align-items: baseline;
  gap: 0.35rem;
}

.stat__number {
  color: var(--sd-text-primary);
  font-size: 1.8rem;
  font-variant-numeric: tabular-nums;
  font-weight: 580;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.stat__state {
  color: var(--sd-text-primary);
  font-size: 1.5rem;
  font-weight: 580;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.stat__unit {
  color: var(--sd-text-muted);
  font-size: 0.78rem;
}

.stat__placeholder {
  color: var(--sd-text-muted);
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.2;
}

.stat__foot {
  overflow: hidden;
  color: var(--sd-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat__foot strong {
  color: var(--sd-text-secondary);
  font-weight: 520;
}

.panel,
.log-panel {
  border: 1px solid var(--sd-border);
  border-radius: var(--sd-radius-lg);
  background: var(--sd-bg-elevated);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.15rem 1.3rem 1.3rem;
}

.panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.panel__head h2 {
  color: var(--sd-text-primary);
  font-size: 0.9375rem;
  font-weight: 580;
}

.panel__head p {
  margin: 0.25rem 0 0;
  color: var(--sd-text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.panel__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
}

.panel__badge {
  flex: 0 0 auto;
  border-radius: var(--sd-radius-xs);
  background: var(--sd-bg-control);
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  line-height: 1;
  padding: 0.3rem 0.5rem;
}

.chart-placeholder {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  color: var(--sd-text-muted);
  font-size: 0.8125rem;
  gap: 0.6rem;
}

.log-panel {
  overflow: hidden;
}

.log-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sd-border-soft);
  gap: 1rem;
  padding: 0.9rem 1.2rem;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.log-title h2 {
  color: var(--sd-text-primary);
  font-size: 0.9375rem;
  font-weight: 580;
}

.log-transport {
  border-radius: var(--sd-radius-xs);
  background: var(--sd-bg-control);
  color: var(--sd-text-muted);
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  line-height: 1;
  padding: 0.25rem 0.42rem;
}

.log-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.log-alert {
  margin: 0.85rem 1.2rem 0;
}

.logs {
  padding: 0 0.4rem 0.4rem;
}

:deep(.logs .n-data-table-th) {
  background: transparent;
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  font-weight: 520;
  letter-spacing: 0.03em;
}

:deep(.logs .n-data-table-td) {
  border-color: var(--sd-border-soft);
  font-size: 0.78rem;
}

:deep(.log-time) {
  display: flex;
  align-items: center;
  color: var(--sd-text-muted);
  font-variant-numeric: tabular-nums;
}

:deep(.log-level) {
  display: inline-flex;
  min-width: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--sd-bg-control);
  color: var(--sd-text-secondary);
  font-family: var(--sd-font-code);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.5;
  padding: 0 0.28rem;
}

:deep(.log-level--info) {
  background: var(--sd-primary-soft);
  color: var(--sd-primary);
}

:deep(.log-level--warning) {
  background: var(--sd-warning-soft);
  color: var(--sd-warning);
}

:deep(.log-level--error) {
  background: var(--sd-error-soft);
  color: var(--sd-error);
}

:deep(.log-module) {
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
}

:deep(.log-message) {
  color: var(--sd-text-secondary);
  font-family: var(--sd-font-code);
  font-size: 0.75rem;
  line-height: 1.6;
}

@media (max-width: 860px) {
  .stat-strip {
    grid-template-columns: 1fr;
  }

  .stat + .stat {
    border-top: 1px solid var(--sd-border-soft);
    border-left: 0;
  }

  .stat {
    padding: 0.95rem 1.1rem;
  }

  .stat__value {
    min-height: 1.8rem;
  }

  .stat__number,
  .stat__placeholder {
    font-size: 1.5rem;
  }

  .stat__state {
    font-size: 1.25rem;
  }

  .panel__head {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.6rem;
  }

  .panel__actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 720px) {
  .log-panel__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.7rem;
  }

  .log-controls {
    justify-content: flex-start;
  }
}
</style>
