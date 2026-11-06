import { useCallback, useEffect, useRef, useState } from 'react';

import type { ProfilerOnRenderCallback } from 'react';

import type {
  BenchmarkDispatchSample,
  BenchmarkFrameStats,
  BenchmarkRenderSample,
  BenchmarkTelemetry,
  BenchmarkTelemetrySnapshot,
  BenchmarkTelemetrySummary,
} from './types';

const maxSamples = 160;
const snapshotUpdateInterval = 25;

const initialFrameStats: BenchmarkFrameStats = {
  averageFrameMs: 0,
  longFramesOver32Ms: 0,
  longFramesOver50Ms: 0,
  maxFrameMs: 0,
  running: false,
  samples: 0,
};

export const getBenchmarkNow = () => globalThis.performance?.now?.() ?? Date.now();

// PERF INSTRUMENTATION (remove after diagnosis): read Hermes GC/heap counters to tell a GC death
// spiral (heap runaway + GC-time explosion) from a bounded run. Values are RAW getInstrumentedStats
// numbers — units are Hermes-version-dependent, so compare TRENDS across checkpoints, not absolute
// units. Returns undefined fields when Hermes or the stats API is unavailable.
const readHermesGcStats = () => {
  const stats = (
    globalThis as typeof globalThis & {
      HermesInternal?: { getInstrumentedStats?: () => Record<string, number | string> };
    }
  ).HermesInternal?.getInstrumentedStats?.();
  const num = (value: number | string | undefined) => {
    const parsed = typeof value === 'string' ? Number(value) : value;
    return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
  };
  return {
    jsGcTime: num(stats?.js_gcCPUTime ?? stats?.js_gcTime ?? stats?.js_totalGCTime),
    jsHeapSize: num(stats?.js_heapSize),
    jsNumGCs: num(stats?.js_numGCs ?? stats?.js_numCollections),
    jsTotalAllocated: num(stats?.js_totalAllocatedBytes ?? stats?.js_allocatedBytes),
  };
};

// PERF INSTRUMENTATION (remove after diagnosis): single-value read of Hermes cumulative allocated
// bytes, used at dispatch boundaries to attribute per-event allocation to phases WITHOUT attaching a
// debugger (the DevTools allocation sampler pollutes results with its own backend allocation). Reads
// the same counter as readHermesGcStats().jsTotalAllocated; kept separate to avoid building the full
// stats object on the hot path.
export const readHermesTotalAllocatedBytes = (): number | undefined => {
  const stats = (
    globalThis as typeof globalThis & {
      HermesInternal?: { getInstrumentedStats?: () => Record<string, number | string> };
    }
  ).HermesInternal?.getInstrumentedStats?.();
  const value = stats?.js_totalAllocatedBytes ?? stats?.js_allocatedBytes;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
};

const average = (values: number[]) => {
  if (!values.length) return undefined;

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const percentile = (values: number[], percentileValue: number) => {
  if (!values.length) return undefined;

  const sortedValues = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * percentileValue) - 1),
  );

  return sortedValues[index];
};

const roundMetric = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined;

type BenchmarkTelemetryMetrics = {
  commitLatencies: number[];
  committedEvents: number;
  dispatchStartGaps: number[];
  dispatchDurations: number[];
  eventCount: number;
  lastCommitLatencyMs?: number;
  lastDispatchStartGapMs?: number;
  lastListLength?: number;
  lastRenderDurationMs?: number;
  lastScheduleDelayMs?: number;
  listChangeCount: number;
  listLengthChangeCount: number;
  listSameLengthChangeCount: number;
  renderCommitCount: number;
  renderDurations: number[];
  scheduleDelays: number[];
};

const initialSummary: BenchmarkTelemetrySummary = {
  committedEvents: 0,
  eventCount: 0,
  listChangeCount: 0,
  listLengthChangeCount: 0,
  listSameLengthChangeCount: 0,
  renderCommitCount: 0,
};

const createInitialMetrics = (): BenchmarkTelemetryMetrics => ({
  commitLatencies: [],
  committedEvents: 0,
  dispatchStartGaps: [],
  dispatchDurations: [],
  eventCount: 0,
  listChangeCount: 0,
  listLengthChangeCount: 0,
  listSameLengthChangeCount: 0,
  renderCommitCount: 0,
  renderDurations: [],
  scheduleDelays: [],
});

const buildSummary = (metrics: BenchmarkTelemetryMetrics): BenchmarkTelemetrySummary => ({
  averageCommitLatencyMs: roundMetric(average(metrics.commitLatencies)),
  averageDispatchDurationMs: roundMetric(average(metrics.dispatchDurations)),
  averageDispatchStartGapMs: roundMetric(average(metrics.dispatchStartGaps)),
  averageRenderDurationMs: roundMetric(average(metrics.renderDurations)),
  averageScheduleDelayMs: roundMetric(average(metrics.scheduleDelays)),
  committedEvents: metrics.committedEvents,
  eventCount: metrics.eventCount,
  lastCommitLatencyMs: roundMetric(metrics.lastCommitLatencyMs),
  lastDispatchStartGapMs: roundMetric(metrics.lastDispatchStartGapMs),
  lastListLength: metrics.lastListLength,
  lastRenderDurationMs: roundMetric(metrics.lastRenderDurationMs),
  lastScheduleDelayMs: roundMetric(metrics.lastScheduleDelayMs),
  listChangeCount: metrics.listChangeCount,
  listLengthChangeCount: metrics.listLengthChangeCount,
  listSameLengthChangeCount: metrics.listSameLengthChangeCount,
  p95CommitLatencyMs: roundMetric(percentile(metrics.commitLatencies, 0.95)),
  p95DispatchStartGapMs: roundMetric(percentile(metrics.dispatchStartGaps, 0.95)),
  p95RenderDurationMs: roundMetric(percentile(metrics.renderDurations, 0.95)),
  p95ScheduleDelayMs: roundMetric(percentile(metrics.scheduleDelays, 0.95)),
  renderCommitCount: metrics.renderCommitCount,
});

const initialSnapshot: BenchmarkTelemetrySnapshot = {
  dispatchSamples: [],
  frameStats: initialFrameStats,
  renderSamples: [],
  summary: initialSummary,
};

export const useWebSocketBenchmarkTelemetry = (): BenchmarkTelemetry => {
  const [snapshot, setSnapshot] = useState<BenchmarkTelemetrySnapshot>(initialSnapshot);
  const dispatchSamplesRef = useRef<BenchmarkDispatchSample[]>([]);
  const pendingDispatchSamplesRef = useRef<BenchmarkDispatchSample[]>([]);
  const renderSamplesRef = useRef<BenchmarkRenderSample[]>([]);
  const eventIndexRef = useRef(0);
  const metricsRef = useRef<BenchmarkTelemetryMetrics>(createInitialMetrics());
  const frameStatsRef = useRef<BenchmarkFrameStats>(initialFrameStats);
  const frameRequestRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef<number | null>(null);
  const lastSnapshotEventCountRef = useRef(0);
  const lastSnapshotListChangeCountRef = useRef(0);
  const lastSnapshotRenderCommitCountRef = useRef(0);
  const lastDispatchedEventStartedAtRef = useRef<number | null>(null);

  const getSnapshot = useCallback<BenchmarkTelemetry['getSnapshot']>(
    () => ({
      dispatchSamples: dispatchSamplesRef.current,
      frameStats: frameStatsRef.current,
      renderSamples: renderSamplesRef.current,
      summary: buildSummary(metricsRef.current),
    }),
    [],
  );

  const flush = useCallback(() => {
    lastSnapshotEventCountRef.current = metricsRef.current.eventCount;
    lastSnapshotListChangeCountRef.current = metricsRef.current.listChangeCount;
    lastSnapshotRenderCommitCountRef.current = metricsRef.current.renderCommitCount;
    setSnapshot(getSnapshot());
  }, [getSnapshot]);

  const publishSnapshotIfNeeded = useCallback(() => {
    const metrics = metricsRef.current;
    const eventCountDelta = metrics.eventCount - lastSnapshotEventCountRef.current;
    const listChangeCountDelta = metrics.listChangeCount - lastSnapshotListChangeCountRef.current;
    const renderCommitCountDelta =
      metrics.renderCommitCount - lastSnapshotRenderCommitCountRef.current;

    if (
      eventCountDelta < snapshotUpdateInterval &&
      listChangeCountDelta < snapshotUpdateInterval &&
      renderCommitCountDelta < snapshotUpdateInterval
    ) {
      return;
    }

    flush();
  }, [flush]);

  const recordDispatchedEvent = useCallback<BenchmarkTelemetry['recordDispatchedEvent']>(
    (sample) => {
      const eventIndex = eventIndexRef.current + 1;
      const lastDispatchedEventStartedAt = lastDispatchedEventStartedAtRef.current;
      const dispatchStartGapMs =
        typeof lastDispatchedEventStartedAt === 'number'
          ? sample.startedAt - lastDispatchedEventStartedAt
          : undefined;

      eventIndexRef.current = eventIndex;
      lastDispatchedEventStartedAtRef.current = sample.startedAt;
      const dispatchSample: BenchmarkDispatchSample = {
        ...sample,
        dispatchStartGapMs,
        eventIndex,
      };

      pendingDispatchSamplesRef.current.push(dispatchSample);
      dispatchSamplesRef.current = [dispatchSample, ...dispatchSamplesRef.current].slice(
        0,
        maxSamples,
      );
      metricsRef.current.eventCount = eventIndex;
      metricsRef.current.dispatchDurations.push(sample.dispatchDurationMs);
      metricsRef.current.lastDispatchStartGapMs = dispatchStartGapMs;
      if (typeof dispatchStartGapMs === 'number') {
        metricsRef.current.dispatchStartGaps.push(dispatchStartGapMs);
      }
      metricsRef.current.lastScheduleDelayMs = sample.scheduleDelayMs;
      if (typeof sample.scheduleDelayMs === 'number') {
        metricsRef.current.scheduleDelays.push(sample.scheduleDelayMs);
      }
      publishSnapshotIfNeeded();
    },
    [publishSnapshotIfNeeded],
  );

  const recordMessageListChange = useCallback<BenchmarkTelemetry['recordMessageListChange']>(
    ({ nextLength, previousLength }) => {
      const metrics = metricsRef.current;

      metrics.listChangeCount += 1;
      metrics.lastListLength = nextLength;
      if (nextLength === previousLength) {
        metrics.listSameLengthChangeCount += 1;
      } else {
        metrics.listLengthChangeCount += 1;
      }

      publishSnapshotIfNeeded();
    },
    [publishSnapshotIfNeeded],
  );

  const onMessageListRender = useCallback<ProfilerOnRenderCallback>(
    (_id, phase, actualDuration, baseDuration, startTime, commitTime) => {
      const pendingSamples = pendingDispatchSamplesRef.current.splice(0);
      if (!pendingSamples.length) {
        return;
      }

      // PERF INSTRUMENTATION (remove after diagnosis): snapshot Hermes GC/heap per commit.
      const hermesGc = readHermesGcStats();

      const renderSample: BenchmarkRenderSample = {
        actualDurationMs: actualDuration,
        baseDurationMs: baseDuration,
        commitTime,
        eventCount: pendingSamples.length,
        jsGcTime: hermesGc.jsGcTime,
        jsHeapSize: hermesGc.jsHeapSize,
        jsNumGCs: hermesGc.jsNumGCs,
        jsTotalAllocated: hermesGc.jsTotalAllocated,
        phase,
        startedAt: startTime,
      };

      const committedSamples = pendingSamples.map((sample) => ({
        ...sample,
        commitLatencyMs: Math.max(0, commitTime - sample.startedAt),
        commitTime,
      }));
      const committedSampleByIndex = new Map(
        committedSamples.map((sample) => [sample.eventIndex, sample]),
      );
      const latestCommittedSample = committedSamples[committedSamples.length - 1];
      const metrics = metricsRef.current;

      metrics.committedEvents += committedSamples.length;
      metrics.renderCommitCount += 1;
      metrics.renderDurations.push(actualDuration);
      metrics.lastCommitLatencyMs = latestCommittedSample?.commitLatencyMs;
      metrics.lastRenderDurationMs = actualDuration;

      committedSamples.forEach((sample) => {
        if (typeof sample.commitLatencyMs === 'number') {
          metrics.commitLatencies.push(sample.commitLatencyMs);
        }
      });

      dispatchSamplesRef.current = dispatchSamplesRef.current.map(
        (sample) => committedSampleByIndex.get(sample.eventIndex) ?? sample,
      );

      renderSamplesRef.current = [renderSample, ...renderSamplesRef.current].slice(0, maxSamples);
      publishSnapshotIfNeeded();
    },
    [publishSnapshotIfNeeded],
  );

  const stopFrameSampler = useCallback(() => {
    frameStatsRef.current = {
      ...frameStatsRef.current,
      running: false,
    };

    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }

    lastFrameTimestampRef.current = null;
    flush();
  }, [flush]);

  const startFrameSampler = useCallback(() => {
    stopFrameSampler();

    frameStatsRef.current = {
      ...initialFrameStats,
      running: true,
      startedAt: getBenchmarkNow(),
    };
    flush();

    const sampleFrame = (timestamp: number) => {
      if (!frameStatsRef.current.running) return;

      const lastFrameTimestamp = lastFrameTimestampRef.current;
      lastFrameTimestampRef.current = timestamp;

      if (typeof lastFrameTimestamp === 'number') {
        const frameDuration = timestamp - lastFrameTimestamp;
        const currentStats = frameStatsRef.current;
        const samples = currentStats.samples + 1;
        const totalFrameDuration =
          currentStats.averageFrameMs * currentStats.samples + frameDuration;

        frameStatsRef.current = {
          ...currentStats,
          averageFrameMs: totalFrameDuration / samples,
          longFramesOver32Ms: currentStats.longFramesOver32Ms + (frameDuration > 32 ? 1 : 0),
          longFramesOver50Ms: currentStats.longFramesOver50Ms + (frameDuration > 50 ? 1 : 0),
          maxFrameMs: Math.max(currentStats.maxFrameMs, frameDuration),
          samples,
        };

        if (samples % 15 === 0) {
          flush();
        }
      }

      frameRequestRef.current = requestAnimationFrame(sampleFrame);
    };

    frameRequestRef.current = requestAnimationFrame(sampleFrame);
  }, [flush, stopFrameSampler]);

  const clear = useCallback(() => {
    dispatchSamplesRef.current = [];
    pendingDispatchSamplesRef.current = [];
    renderSamplesRef.current = [];
    eventIndexRef.current = 0;
    lastDispatchedEventStartedAtRef.current = null;
    metricsRef.current = createInitialMetrics();
    lastSnapshotEventCountRef.current = 0;
    lastSnapshotListChangeCountRef.current = 0;
    lastSnapshotRenderCommitCountRef.current = 0;
    setSnapshot({
      ...initialSnapshot,
      frameStats: frameStatsRef.current,
    });
  }, []);

  useEffect(() => stopFrameSampler, [stopFrameSampler]);

  return {
    clear,
    dispatchSamples: snapshot.dispatchSamples,
    flush,
    frameStats: snapshot.frameStats,
    getSnapshot,
    onMessageListRender,
    recordMessageListChange,
    recordDispatchedEvent,
    renderSamples: snapshot.renderSamples,
    startFrameSampler,
    stopFrameSampler,
    summary: snapshot.summary,
  };
};
