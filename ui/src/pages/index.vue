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
      <n-button
        v-if="networkHealth.timestamp !== 0"
        quaternary
        :loading="networkHealthRefreshing"
        @click="refreshNetworkHealth"
      >
        <template #icon>
          <n-icon><i-tabler-refresh /></n-icon>
        </template>
        重新检测
      </n-button>
    </PageHeader>

    <section class="stat-strip" aria-label="实例关键指标">
      <article class="stat">
        <span class="stat__label">
          <i-tabler-cpu />
          内存占用
        </span>
        <div class="stat__value">
          <NumberTicker
            :value="memoryMegabytes"
            :decimal-places="1"
            :duration="1100"
            class="stat__number"
          />
          <span class="stat__unit">MB</span>
        </div>
        <span class="stat__foot" :title="runtimeSummary">{{ runtimeSummary }}</span>
      </article>

      <article class="stat">
        <span class="stat__label">
          <i-tabler-users-group />
          群组服务
        </span>
        <div class="stat__value">
          <NumberTicker
            :value="groupSummary?.joined ?? 0"
            :decimal-places="0"
            :duration="1100"
            class="stat__number"
          />
          <span class="stat__unit">个已加入</span>
        </div>
        <span class="stat__foot">
          已启用
          <strong>{{ groupSummary?.enabled ?? 0 }}</strong>
          · 未启用
          <strong>{{ inactiveGroups }}</strong>
        </span>
      </article>

      <article class="stat">
        <span class="stat__label">
          <i-tabler-world />
          网络质量
        </span>
        <div class="stat__value">
          <span class="stat__state" :class="networkTone">{{ networkLabel }}</span>
          <span class="stat__unit">{{ networkHealth.ok.length }}/{{ networkHealth.total }} 可达</span>
        </div>
        <span class="stat__foot">
          {{
            networkHealth.timestamp === 0
              ? '正在进行连通性检测'
              : `${formatNetworkHealthRelativeTime(networkHealth.timestamp)}检测`
          }}
        </span>
      </article>
    </section>

    <section class="insight-grid">
      <SpotlightCard class="panel panel--chart">
        <header class="panel__head">
          <div>
            <h2>服务响应</h2>
            <p>对外部服务端点的最近一次探测耗时，单位毫秒。</p>
          </div>
          <span class="panel__badge">
            {{ networkHealth.ok.length }}/{{ networkHealth.total }} 正常
          </span>
        </header>

        <Suspense>
          <AsyncLatencyChart v-if="networkHealth.targets.length" :targets="networkHealth.targets" />
          <div v-else class="chart-placeholder">
            <n-spin :size="20" />
            <span>正在等待首次探测结果</span>
          </div>
        </Suspense>
      </SpotlightCard>

      <div class="side-stack">
        <SpotlightCard class="panel panel--groups">
          <header class="panel__head">
            <div>
              <h2>群组启用率</h2>
              <p>已启用群组占全部已加入群组的比例。</p>
            </div>
          </header>

          <div class="group-ring">
            <Suspense>
              <AsyncGroupChart :joined="groupSummary?.joined ?? 0" :enabled="groupSummary?.enabled ?? 0" />
            </Suspense>
            <div class="group-ring__legend">
              <span><i class="dot dot--primary" />已启用 {{ groupSummary?.enabled ?? 0 }}</span>
              <span><i class="dot dot--muted" />未启用 {{ inactiveGroups }}</span>
            </div>
          </div>
        </SpotlightCard>

        <section class="panel panel--services">
          <header class="panel__head">
            <div>
              <h2>连通性</h2>
              <p>各机器人平台 API 的实时可达状态。</p>
            </div>
          </header>

          <ul class="service-list">
            <li
              v-for="target in networkHealth.targets"
              :key="target.target"
              class="service-list__item"
            >
              <span class="service-list__dot" :class="{ 'is-down': !target.ok }" />
              <span class="service-list__label">{{ target.label }}</span>
              <span class="service-list__latency">
                {{ target.ok ? `${target.durationMs} ms` : '不可达' }}
              </span>
            </li>
            <li v-if="!networkHealth.targets.length" class="service-list__empty">检测中…</li>
          </ul>
        </section>
      </div>
    </section>

    <section class="bottom-grid">
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
            <n-button size="tiny" quaternary @click="logStream.reconnect">重连</n-button>
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

      <aside class="timeline-panel">
        <header class="panel__head">
          <div>
            <h2>最近事件</h2>
            <p>最新写入的运行记录。</p>
          </div>
          <span class="panel__badge">{{ recentEvents.length }} 条</span>
        </header>

        <ol class="timeline">
          <li
            v-for="event in recentEvents"
            :key="event.id"
            class="timeline__item"
            :class="`is-${getLogLevelMeta(event.level).tone}`"
          >
            <span class="timeline__dot" />
            <div class="timeline__body">
              <div class="timeline__meta">
                <time>{{ dayjs.unix(event.ts).format('HH:mm:ss') }}</time>
                <span class="timeline__level">{{ getLogLevelMeta(event.level).label }}</span>
                <span v-if="event.module" class="timeline__module">{{ event.module }}</span>
              </div>
              <p class="timeline__message">{{ event.msg }}</p>
            </div>
          </li>
          <li v-if="!recentEvents.length" class="timeline__empty">暂无事件</li>
        </ol>
      </aside>
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
const AsyncGroupChart = defineAsyncComponent(() => import('@/components/charts/GroupRingChart.vue'));

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

const networkLabel = computed(() => {
  if (networkHealth.value.timestamp === 0) return '检测中';
  if (networkHealth.value.total === 0) return '未知';
  if (networkHealth.value.ok.length === 0) return '中断';
  if (networkHealth.value.ok.length === networkHealth.value.total) return '良好';
  return '较差';
});

const networkTone = computed(() => {
  switch (networkLabel.value) {
    case '良好':
      return 'is-success';
    case '较差':
      return 'is-warning';
    case '中断':
      return 'is-error';
    default:
      return 'is-primary';
  }
});

// 最近事件直接取实时日志尾部，避免再维护一份独立的时间轴数据源。
const recentEvents = computed(() => visibleLogs.value.slice(-6).reverse());

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
      .from('.panel', { y: 18, opacity: 0, duration: 0.55, stagger: 0.07 }, '-=0.28')
      .from('.timeline__item', { x: 8, opacity: 0, duration: 0.4, stagger: 0.05 }, '-=0.3')
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
  border-radius: var(--sd-radius-pill);
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
  font-size: 1.55rem;
  font-weight: 580;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.stat__unit {
  color: var(--sd-text-muted);
  font-size: 0.78rem;
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

.is-success {
  color: var(--sd-success);
}

.is-warning {
  color: var(--sd-warning);
}

.is-error {
  color: var(--sd-error);
}

.is-primary {
  color: var(--sd-primary);
}

/* 主区：图表占主列，右侧是两块窄面板。 */
.insight-grid {
  display: grid;
  align-items: stretch;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 1rem;
}

.panel,
.log-panel,
.timeline-panel {
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

.panel__badge {
  flex: 0 0 auto;
  border-radius: var(--sd-radius-pill);
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

.side-stack {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  gap: 1rem;
}

.panel--services {
  flex: 1 1 auto;
}

.group-ring {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.group-ring__legend {
  display: flex;
  min-width: 0;
  flex-direction: column;
  color: var(--sd-text-secondary);
  font-size: 0.75rem;
  gap: 0.45rem;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 0.4rem;
  vertical-align: middle;
}

.dot--primary {
  background: var(--sd-primary);
}

.dot--muted {
  background: var(--sd-border);
}

.service-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  gap: 0.35rem 1.1rem;
  list-style: none;
}

.service-list__item {
  display: flex;
  min-width: 0;
  flex: 1 1 42%;
  align-items: center;
  color: var(--sd-text-secondary);
  font-size: 0.75rem;
  gap: 0.4rem;
  padding: 0.2rem 0;
}

.service-list__dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--sd-success);
}

.service-list__dot.is-down {
  background: var(--sd-error);
}

.service-list__label {
  overflow: hidden;
  flex: 1 1 auto;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-list__latency {
  color: var(--sd-text-muted);
  font-variant-numeric: tabular-nums;
  font-size: 0.6875rem;
}

.service-list__empty {
  color: var(--sd-text-muted);
  font-size: 0.75rem;
}

/* 底部：日志为主，时间轴为辅。 */
.bottom-grid {
  display: grid;
  align-items: stretch;
  grid-template-columns: minmax(0, 1.85fr) minmax(0, 1fr);
  gap: 1rem;
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
  border-radius: var(--sd-radius-pill);
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

.timeline-panel {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.15rem 1.3rem 1.3rem;
}

.timeline {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  margin: 0;
  padding: 0 0 0 1rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.2rem;
  list-style: none;
}

.timeline::before {
  position: absolute;
  top: 0.6rem;
  bottom: 0.6rem;
  left: 3px;
  width: 1px;
  background: var(--sd-border-soft);
  content: '';
}

.timeline__item {
  position: relative;
  display: flex;
  gap: 0.7rem;
  padding: 0.35rem 0;
}

.timeline__item + .timeline__item {
  border-top: 1px solid var(--sd-border-soft);
}

.timeline__dot {
  position: absolute;
  z-index: 1;
  top: 0.72rem;
  left: -1rem;
  width: 7px;
  height: 7px;
  border: 1px solid var(--sd-bg-elevated);
  border-radius: 50%;
  background: var(--sd-text-muted);
}

.timeline__item.is-info .timeline__dot {
  background: var(--sd-primary);
}

.timeline__item.is-warning .timeline__dot {
  background: var(--sd-warning);
}

.timeline__item.is-error .timeline__dot {
  background: var(--sd-error);
}

.timeline__body {
  min-width: 0;
  flex: 1 1 auto;
}

.timeline__meta {
  display: flex;
  align-items: center;
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
  gap: 0.45rem;
  line-height: 1.3;
}

.timeline__level {
  font-family: var(--sd-font-code);
  letter-spacing: 0.02em;
}

.timeline__module {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline__message {
  display: -webkit-box;
  margin: 0.15rem 0 0;
  overflow: hidden;
  color: var(--sd-text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.timeline__empty {
  color: var(--sd-text-muted);
  font-size: 0.75rem;
  padding: 0.5rem 0;
}

@media (max-width: 1100px) {
  .insight-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
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

  .stat__number {
    font-size: 1.55rem;
  }

  .stat__state {
    font-size: 1.3rem;
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

  .group-ring {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }
}
</style>
