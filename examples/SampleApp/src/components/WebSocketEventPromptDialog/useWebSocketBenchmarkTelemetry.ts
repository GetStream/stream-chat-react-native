import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ProfilerOnRenderCallback } from 'react';

import type {
  BenchmarkDispatchSample,
  BenchmarkFrameStats,
  BenchmarkRenderSample,
  BenchmarkTelemetry,
} from './types';

const maxSamples = 160;

const initialFrameStats: BenchmarkFrameStats = {
  averageFrameMs: 0,
  longFramesOver32Ms: 0,
  longFramesOver50Ms: 0,
  maxFrameMs: 0,
  running: false,
  samples: 0,
};

export const getBenchmarkNow = () => globalThis.performance?.now?.() ?? Date.now();

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

export const useWebSocketBenchmarkTelemetry = (): BenchmarkTelemetry => {
  const [dispatchSamples, setDispatchSamples] = useState<BenchmarkDispatchSample[]>([]);
  const [renderSamples, setRenderSamples] = useState<BenchmarkRenderSample[]>([]);
  const [frameStats, setFrameStats] = useState<BenchmarkFrameStats>(initialFrameStats);
  const pendingDispatchSamplesRef = useRef<BenchmarkDispatchSample[]>([]);
  const eventIndexRef = useRef(0);
  const frameStatsRef = useRef<BenchmarkFrameStats>(initialFrameStats);
  const frameRequestRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef<number | null>(null);

  const recordDispatchedEvent = useCallback<BenchmarkTelemetry['recordDispatchedEvent']>(
    (sample) => {
      const eventIndex = eventIndexRef.current + 1;
      eventIndexRef.current = eventIndex;
      const dispatchSample: BenchmarkDispatchSample = {
        ...sample,
        eventIndex,
      };

      pendingDispatchSamplesRef.current.push(dispatchSample);
      setDispatchSamples((currentSamples) =>
        [dispatchSample, ...currentSamples].slice(0, maxSamples),
      );
    },
    [],
  );

  const onMessageListRender = useCallback<ProfilerOnRenderCallback>(
    (_id, phase, actualDuration, baseDuration, startTime, commitTime) => {
      const pendingSamples = pendingDispatchSamplesRef.current.splice(0);
      if (!pendingSamples.length) {
        return;
      }

      const renderSample: BenchmarkRenderSample = {
        actualDurationMs: actualDuration,
        baseDurationMs: baseDuration,
        commitTime,
        eventCount: pendingSamples.length,
        phase,
        startedAt: startTime,
      };

      const committedSamples = pendingSamples.map((sample) => ({
        ...sample,
        commitLatencyMs: Math.max(0, commitTime - sample.startedAt),
        commitTime,
      }));

      setDispatchSamples((currentSamples) => {
        const committedSampleByIndex = new Map(
          committedSamples.map((sample) => [sample.eventIndex, sample]),
        );

        return currentSamples.map(
          (sample) => committedSampleByIndex.get(sample.eventIndex) ?? sample,
        );
      });

      setRenderSamples((currentSamples) => [renderSample, ...currentSamples].slice(0, maxSamples));
    },
    [],
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
    setFrameStats(frameStatsRef.current);
  }, []);

  const startFrameSampler = useCallback(() => {
    stopFrameSampler();

    frameStatsRef.current = {
      ...initialFrameStats,
      running: true,
      startedAt: getBenchmarkNow(),
    };
    setFrameStats(frameStatsRef.current);

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
          setFrameStats(frameStatsRef.current);
        }
      }

      frameRequestRef.current = requestAnimationFrame(sampleFrame);
    };

    frameRequestRef.current = requestAnimationFrame(sampleFrame);
  }, [stopFrameSampler]);

  const clear = useCallback(() => {
    pendingDispatchSamplesRef.current = [];
    eventIndexRef.current = 0;
    setDispatchSamples([]);
    setRenderSamples([]);
  }, []);

  useEffect(() => stopFrameSampler, [stopFrameSampler]);

  const summary = useMemo(() => {
    const committedDispatchSamples = dispatchSamples.filter(
      (sample) => typeof sample.commitLatencyMs === 'number',
    );
    const commitLatencies = committedDispatchSamples.flatMap((sample) =>
      typeof sample.commitLatencyMs === 'number' ? [sample.commitLatencyMs] : [],
    );
    const dispatchDurations = dispatchSamples.map((sample) => sample.dispatchDurationMs);
    const renderDurations = renderSamples.map((sample) => sample.actualDurationMs);

    return {
      averageCommitLatencyMs: roundMetric(average(commitLatencies)),
      averageDispatchDurationMs: roundMetric(average(dispatchDurations)),
      averageRenderDurationMs: roundMetric(average(renderDurations)),
      committedEvents: committedDispatchSamples.length,
      eventCount: dispatchSamples.length,
      lastCommitLatencyMs: roundMetric(commitLatencies[0]),
      lastRenderDurationMs: roundMetric(renderSamples[0]?.actualDurationMs),
      p95CommitLatencyMs: roundMetric(percentile(commitLatencies, 0.95)),
      p95RenderDurationMs: roundMetric(percentile(renderDurations, 0.95)),
      renderCommitCount: renderSamples.length,
    };
  }, [dispatchSamples, renderSamples]);

  return {
    clear,
    dispatchSamples,
    frameStats,
    onMessageListRender,
    recordDispatchedEvent,
    renderSamples,
    startFrameSampler,
    stopFrameSampler,
    summary,
  };
};
