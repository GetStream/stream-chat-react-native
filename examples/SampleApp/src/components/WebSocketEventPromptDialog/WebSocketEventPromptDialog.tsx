import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import type { Channel, StreamChat } from 'stream-chat';

import type {
  BenchmarkTelemetry,
  EventActorMode,
  PayloadMode,
  ReactionUserShape,
  SimulationState,
  SupportedWebSocketEventType,
  WebSocketEventBuildOptions,
  WebSocketEventPayload,
} from './types';
import { supportedWebsocketEventTypes } from './types';
import { getBenchmarkNow } from './useWebSocketBenchmarkTelemetry';
import {
  buildFreshWebSocketEventPayload,
  createInitialSimulationState,
  emitWebSocketEventPayload,
  trackSimulationStateFromPayload,
} from './websocketEventAutomation';
import {
  buildWebSocketEventDraft,
  createWebSocketEventTemplateContext,
  getChannelMessages,
} from './websocketEventTemplates';

type WebSocketEventPromptDialogProps = {
  channel: Channel;
  client: StreamChat;
  messageListImplementation?: string;
  messageListMode?: string;
  messageListPruning?: number;
  telemetry: BenchmarkTelemetry;
};

type ActiveIntervalMode = 'finiteScenario' | 'liveScenario' | 'single';

type PreparedScenarioEvent = {
  eventType: SupportedWebSocketEventType;
  messageCount?: number;
  payload: WebSocketEventPayload;
};

type PreparedScenarioMetadata = {
  durationMs: number;
  eventCount: number;
};

const actionButtonHitSlop = { bottom: 8, left: 8, right: 8, top: 8 };
const defaultScenarioSeed = '1729';
const progressUpdateInterval = 25;

const getSimulationMessageCount = (channel: Channel, state: SimulationState) =>
  state.messageIdsByCid[channel.cid]?.length;

const parseIntervalMs = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return 500;

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? Math.max(1, parsedValue) : 500;
};

const formatMs = (value?: number) => {
  if (typeof value !== 'number') return '-';
  if (!Number.isFinite(value)) return '-';
  if (value >= 100) return `${value.toFixed(0)}ms`;
  return `${value.toFixed(2)}ms`;
};

const formatNumber = (value?: number) => {
  if (typeof value !== 'number') return '-';
  if (!Number.isFinite(value)) return '-';
  if (value >= 100) return value.toFixed(0);
  return value.toFixed(2);
};

const Section = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SegmentedOption = <T extends string>({
  label,
  onSelect,
  selected,
  value,
}: {
  label: string;
  onSelect: (value: T) => void;
  selected: boolean;
  value: T;
}) => (
  <Pressable
    hitSlop={actionButtonHitSlop}
    onPress={() => onSelect(value)}
    style={[styles.segmentedOption, selected && styles.segmentedOptionSelected]}
  >
    <Text style={[styles.segmentedOptionText, selected && styles.segmentedOptionTextSelected]}>
      {label}
    </Text>
  </Pressable>
);

const ActionButton = ({
  disabled,
  label,
  onPress,
  tone = 'default',
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary';
}) => (
  <Pressable
    disabled={disabled}
    hitSlop={actionButtonHitSlop}
    onPress={onPress}
    style={[
      styles.actionButton,
      tone === 'primary' && styles.actionButtonPrimary,
      disabled && styles.actionButtonDisabled,
    ]}
  >
    <Text
      style={[
        styles.actionButtonText,
        tone === 'primary' && styles.actionButtonPrimaryText,
        disabled && styles.actionButtonTextDisabled,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const scenarioTemplateSteps: {
  actorMode: EventActorMode;
  eventType: SupportedWebSocketEventType;
}[] = [
  { actorMode: 'other', eventType: 'typing.start' },
  { actorMode: 'other', eventType: 'message.new' },
  { actorMode: 'current', eventType: 'reaction.new' },
  { actorMode: 'other', eventType: 'reaction.new' },
  { actorMode: 'other', eventType: 'message.updated' },
  { actorMode: 'other', eventType: 'message.new' },
  { actorMode: 'current', eventType: 'reaction.updated' },
  { actorMode: 'other', eventType: 'typing.stop' },
  { actorMode: 'current', eventType: 'message.new' },
  { actorMode: 'current', eventType: 'reaction.deleted' },
  { actorMode: 'other', eventType: 'message.new' },
  { actorMode: 'current', eventType: 'reaction.new' },
  { actorMode: 'current', eventType: 'message.updated' },
  { actorMode: 'other', eventType: 'reaction.new' },
  { actorMode: 'other', eventType: 'message.new' },
  { actorMode: 'other', eventType: 'reaction.updated' },
  { actorMode: 'other', eventType: 'message.deleted' },
  { actorMode: 'other', eventType: 'message.new' },
  { actorMode: 'other', eventType: 'reaction.deleted' },
  { actorMode: 'current', eventType: 'message.new' },
];

const defaultScenarioEventTypes = Array.from(
  new Set(scenarioTemplateSteps.map((step) => step.eventType)),
);

const scenarioEventWeights: Record<SupportedWebSocketEventType, number> = {
  'message.deleted': 4,
  'message.new': 34,
  'message.updated': 10,
  'notification.message_new': 2,
  'reaction.deleted': 8,
  'reaction.new': 24,
  'reaction.updated': 8,
  'typing.start': 5,
  'typing.stop': 5,
};

const hashSeed = (value: string) => {
  const parsedSeed = Number(value);
  if (Number.isFinite(parsedSeed)) {
    return Math.abs(Math.floor(parsedSeed));
  }

  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return hash;
};

const randomFromSeed = (seed: number, index: number, salt: number) => {
  const randomValue = Math.sin(seed * 12.9898 + index * 78.233 + salt * 37.719) * 43758.5453;

  return randomValue - Math.floor(randomValue);
};

const getWeightedScenarioEventType = (
  index: number,
  eventTypes: SupportedWebSocketEventType[],
  seed: number,
) => {
  const enabledTypes = eventTypes.length ? eventTypes : defaultScenarioEventTypes;
  const totalWeight = enabledTypes.reduce((total, type) => total + scenarioEventWeights[type], 0);
  let remainingWeight = randomFromSeed(seed, index, 0) * totalWeight;

  for (const type of enabledTypes) {
    remainingWeight -= scenarioEventWeights[type];
    if (remainingWeight <= 0) {
      return type;
    }
  }

  return enabledTypes[enabledTypes.length - 1] ?? 'message.new';
};

const getScenarioActorMode = (
  index: number,
  eventType: SupportedWebSocketEventType,
  seed: number,
): EventActorMode => {
  const randomValue = randomFromSeed(seed, index, 1);

  if (eventType === 'typing.start' || eventType === 'typing.stop') {
    return randomValue < 0.85 ? 'other' : 'current';
  }

  if (eventType.startsWith('reaction.')) {
    return randomValue < 0.65 ? 'current' : 'other';
  }

  return randomValue < 0.78 ? 'other' : 'current';
};

const getScenarioStep = (
  index: number,
  eventTypes: SupportedWebSocketEventType[],
  seed: number,
) => {
  const eventType = getWeightedScenarioEventType(index, eventTypes, seed);

  return {
    actorMode: getScenarioActorMode(index, eventType, seed),
    eventType,
  };
};

export const WebSocketEventPromptDialog = ({
  channel,
  client,
  messageListImplementation,
  messageListMode,
  messageListPruning,
  telemetry,
}: WebSocketEventPromptDialogProps) => {
  const [visible, setVisible] = useState(false);
  const [eventType, setEventType] = useState<SupportedWebSocketEventType>('reaction.new');
  const [payloadMode, setPayloadMode] = useState<PayloadMode>('fresh');
  const [actorMode, setActorMode] = useState<EventActorMode>('current');
  const [reactionUserShape, setReactionUserShape] = useState<ReactionUserShape>('userIdOnly');
  const [payloadDraft, setPayloadDraft] = useState('');
  const [intervalMs, setIntervalMs] = useState('500');
  const [activeIntervalMode, setActiveIntervalMode] = useState<ActiveIntervalMode | null>(null);
  const [lastRunLabel, setLastRunLabel] = useState('none');
  const [lastStatus, setLastStatus] = useState('Idle');
  const [scenarioEventTypes, setScenarioEventTypes] =
    useState<SupportedWebSocketEventType[]>(defaultScenarioEventTypes);
  const [scenarioSeed, setScenarioSeed] = useState(defaultScenarioSeed);
  const [scenarioProgress, setScenarioProgress] = useState<{
    emitted: number;
    total?: number;
  } | null>(null);
  const [preparedScenarioMetadata, setPreparedScenarioMetadata] =
    useState<PreparedScenarioMetadata | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scenarioIntervalIndexRef = useRef(0);
  const simulationStateRef = useRef<SimulationState | null>(null);

  const buildOptions = useMemo<WebSocketEventBuildOptions>(
    () => ({
      actorMode,
      reactionUserShape,
    }),
    [actorMode, reactionUserShape],
  );

  const refreshDraft = useCallback(() => {
    const context = createWebSocketEventTemplateContext({
      channel,
      currentUserId: client.userID,
    });

    setPayloadDraft(buildWebSocketEventDraft(eventType, context, buildOptions));
  }, [buildOptions, channel, client.userID, eventType]);

  const resetSimulationState = useCallback(() => {
    simulationStateRef.current = createInitialSimulationState({ channel });
    telemetry.clear();
    refreshDraft();
    setPreparedScenarioMetadata(null);
    setLastStatus('Reset');
  }, [channel, refreshDraft, telemetry]);

  const stopInterval = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setActiveIntervalMode(null);
  }, []);

  const getSimulationState = useCallback(() => {
    if (!simulationStateRef.current) {
      simulationStateRef.current = createInitialSimulationState({ channel });
    }

    return simulationStateRef.current;
  }, [channel]);

  const toggleScenarioEventType = useCallback((type: SupportedWebSocketEventType) => {
    setScenarioEventTypes((currentTypes) => {
      if (currentTypes.includes(type)) {
        return currentTypes.length === 1
          ? currentTypes
          : currentTypes.filter((currentType) => currentType !== type);
      }

      return [...currentTypes, type];
    });
  }, []);

  const randomizeScenarioSeed = useCallback(() => {
    setScenarioSeed(String(Math.floor(Date.now() % 1000000000)));
  }, []);

  const buildPayload = useCallback(
    ({
      eventTypeToBuild = eventType,
      forceFresh = false,
      optionsToBuild = buildOptions,
      stateToBuild,
    }: {
      eventTypeToBuild?: SupportedWebSocketEventType;
      forceFresh?: boolean;
      optionsToBuild?: WebSocketEventBuildOptions;
      stateToBuild?: SimulationState;
    } = {}): WebSocketEventPayload => {
      if (forceFresh || payloadMode === 'fresh') {
        return buildFreshWebSocketEventPayload({
          channel,
          currentUserId: client.userID,
          eventType: eventTypeToBuild,
          options: optionsToBuild,
          state: stateToBuild ?? getSimulationState(),
        });
      }

      return JSON.parse(payloadDraft) as WebSocketEventPayload;
    },
    [
      buildOptions,
      channel,
      client.userID,
      eventType,
      getSimulationState,
      payloadDraft,
      payloadMode,
    ],
  );

  const emitPayload = useCallback(
    ({
      eventTypeToEmit,
      messageCount,
      payload,
      scheduledAt,
      trackState = true,
      updateDraft = true,
      updateStatus = true,
    }: {
      eventTypeToEmit: SupportedWebSocketEventType;
      messageCount?: number;
      payload: WebSocketEventPayload;
      scheduledAt?: number;
      trackState?: boolean;
      updateDraft?: boolean;
      updateStatus?: boolean;
    }) => {
      try {
        const startedAt = getBenchmarkNow();
        const emittedPayload = emitWebSocketEventPayload({
          client,
          eventType: eventTypeToEmit,
          payload,
        });
        const dispatchDurationMs = getBenchmarkNow() - startedAt;
        const simulationState =
          trackState || typeof messageCount !== 'number' ? getSimulationState() : undefined;

        if (trackState && simulationState) {
          trackSimulationStateFromPayload({
            channel,
            payload: emittedPayload,
            state: simulationState,
          });
        }
        telemetry.recordDispatchedEvent({
          dispatchDurationMs,
          eventType: eventTypeToEmit,
          messageCount:
            messageCount ??
            (simulationState ? getSimulationMessageCount(channel, simulationState) : undefined),
          payloadMessageId: emittedPayload.message?.id,
          scheduleDelayMs:
            typeof scheduledAt === 'number' ? Math.max(0, startedAt - scheduledAt) : undefined,
          scheduledAt,
          startedAt,
        });

        if (updateDraft) {
          setPayloadDraft(JSON.stringify(emittedPayload, null, 2));
        }
        if (updateStatus) {
          setPreparedScenarioMetadata(null);
          setLastRunLabel(`single:${eventTypeToEmit}`);
          setLastStatus(`Emitted ${eventTypeToEmit}`);
        }

        return emittedPayload;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to emit event';
        setLastStatus(message);
        return undefined;
      }
    },
    [channel, client, getSimulationState, telemetry],
  );

  const emitOne = useCallback(
    ({
      eventTypeToEmit = eventType,
      forceFresh = false,
      optionsToEmit = buildOptions,
      updateDraft = true,
      updateStatus = true,
    }: {
      eventTypeToEmit?: SupportedWebSocketEventType;
      forceFresh?: boolean;
      optionsToEmit?: WebSocketEventBuildOptions;
      updateDraft?: boolean;
      updateStatus?: boolean;
    } = {}) => {
      try {
        const payload = buildPayload({
          eventTypeToBuild: eventTypeToEmit,
          forceFresh,
          optionsToBuild: optionsToEmit,
        });

        return emitPayload({
          eventTypeToEmit,
          payload,
          updateDraft,
          updateStatus,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to emit event';
        setLastStatus(message);
        return undefined;
      }
    },
    [buildOptions, buildPayload, emitPayload, eventType],
  );

  const emitBurst = useCallback(
    (count: number) => {
      const startedAt = getBenchmarkNow();
      let emittedCount = 0;
      let lastPayload: WebSocketEventPayload | undefined;

      for (let index = 0; index < count; index += 1) {
        const emittedPayload = emitOne({ updateDraft: false, updateStatus: false });
        if (!emittedPayload) break;
        lastPayload = emittedPayload;
        emittedCount += 1;
      }

      if (lastPayload) {
        setPayloadDraft(JSON.stringify(lastPayload, null, 2));
      }

      setPreparedScenarioMetadata(null);
      setLastRunLabel(`burst:${eventType}:${count}`);
      setLastStatus(
        `Emitted ${emittedCount} ${eventType} events in ${formatMs(getBenchmarkNow() - startedAt)}`,
      );
    },
    [emitOne, eventType],
  );

  const buildScenarioEvent = useCallback(
    ({
      index,
      numericScenarioSeed,
      stateToBuild,
      trackState = false,
    }: {
      index: number;
      numericScenarioSeed: number;
      stateToBuild: SimulationState;
      trackState?: boolean;
    }): PreparedScenarioEvent => {
      const scenarioStep = getScenarioStep(index, scenarioEventTypes, numericScenarioSeed);
      const payload = buildPayload({
        eventTypeToBuild: scenarioStep.eventType,
        forceFresh: true,
        optionsToBuild: {
          actorMode: scenarioStep.actorMode,
          reactionUserShape,
        },
        stateToBuild,
      });

      if (trackState) {
        trackSimulationStateFromPayload({
          channel,
          payload: {
            ...payload,
            type: scenarioStep.eventType,
          },
          state: stateToBuild,
        });
      }

      return {
        eventType: scenarioStep.eventType,
        messageCount: getSimulationMessageCount(channel, stateToBuild),
        payload,
      };
    },
    [buildPayload, channel, reactionUserShape, scenarioEventTypes],
  );

  const prepareScenarioEvents = useCallback(
    (count: number, numericScenarioSeed: number) => {
      const startedAt = getBenchmarkNow();
      const stateToBuild = createInitialSimulationState({ channel });
      const events = Array.from({ length: count }, (_, index) =>
        buildScenarioEvent({
          index,
          numericScenarioSeed,
          stateToBuild,
          trackState: true,
        }),
      );
      const durationMs = getBenchmarkNow() - startedAt;

      setPreparedScenarioMetadata({
        durationMs,
        eventCount: events.length,
      });

      return {
        durationMs,
        events,
      };
    },
    [buildScenarioEvent, channel],
  );

  const emitScenarioStep = useCallback(
    (index: number, numericScenarioSeed: number) => {
      const stateToBuild = getSimulationState();
      const scenarioEvent = buildScenarioEvent({
        index,
        numericScenarioSeed,
        stateToBuild,
      });

      return emitPayload({
        eventTypeToEmit: scenarioEvent.eventType,
        payload: scenarioEvent.payload,
        updateDraft: false,
        updateStatus: false,
      });
    },
    [buildScenarioEvent, emitPayload, getSimulationState],
  );

  const emitScenario = useCallback(
    (count: number) => {
      stopInterval();

      const parsedIntervalMs = parseIntervalMs(intervalMs);
      const numericScenarioSeed = hashSeed(scenarioSeed);
      const preparedScenario = prepareScenarioEvents(count, numericScenarioSeed);
      const startedAt = getBenchmarkNow();
      let emittedCount = 0;
      let lastPayload: WebSocketEventPayload | undefined;

      const finishScenario = () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        if (lastPayload) {
          setPayloadDraft(JSON.stringify(lastPayload, null, 2));
        }

        const durationMs = getBenchmarkNow() - startedAt;
        simulationStateRef.current = createInitialSimulationState({ channel });
        telemetry.flush();
        setActiveIntervalMode(null);
        setScenarioProgress({ emitted: emittedCount, total: count });
        setLastStatus(
          `Scenario emitted ${emittedCount}/${count} prebuilt events over ${formatMs(
            durationMs,
          )} (${parsedIntervalMs}ms interval, prepared in ${formatMs(
            preparedScenario.durationMs,
          )})`,
        );
      };

      const emitNextScenarioEvent = () => {
        const preparedEvent = preparedScenario.events[emittedCount];

        if (!preparedEvent) {
          finishScenario();
          return;
        }

        const emittedPayload = emitPayload({
          eventTypeToEmit: preparedEvent.eventType,
          messageCount: preparedEvent.messageCount,
          payload: preparedEvent.payload,
          scheduledAt: startedAt + emittedCount * parsedIntervalMs,
          trackState: false,
          updateDraft: false,
          updateStatus: false,
        });

        if (!emittedPayload) {
          finishScenario();
          return;
        }

        lastPayload = emittedPayload;
        emittedCount += 1;
        if (emittedCount % progressUpdateInterval === 0 || emittedCount >= count) {
          setScenarioProgress({ emitted: emittedCount, total: count });
        }

        if (emittedCount >= count) {
          finishScenario();
        }
      };

      setActiveIntervalMode('finiteScenario');
      setScenarioProgress({ emitted: 0, total: count });
      setLastRunLabel(`scenario:${count}:${parsedIntervalMs}:seed:${scenarioSeed}:prebuilt`);
      setLastStatus(
        `Scenario ${count} prepared in ${formatMs(
          preparedScenario.durationMs,
        )}; running every ${parsedIntervalMs}ms`,
      );
      setVisible(false);

      emitNextScenarioEvent();
      if (emittedCount < count) {
        intervalIdRef.current = setInterval(emitNextScenarioEvent, parsedIntervalMs);
      }
    },
    [
      channel,
      emitPayload,
      intervalMs,
      prepareScenarioEvents,
      scenarioSeed,
      stopInterval,
      telemetry,
    ],
  );

  const startInterval = useCallback(() => {
    stopInterval();

    const parsedIntervalMs = parseIntervalMs(intervalMs);
    intervalIdRef.current = setInterval(() => {
      emitOne({ updateDraft: false, updateStatus: false });
    }, parsedIntervalMs);
    setPreparedScenarioMetadata(null);
    setActiveIntervalMode('single');
    setLastRunLabel(`interval:${eventType}:${parsedIntervalMs}`);
    setLastStatus(`Interval ${eventType} every ${parsedIntervalMs}ms`);
    setVisible(false);
  }, [emitOne, eventType, intervalMs, stopInterval]);

  const startScenarioInterval = useCallback(() => {
    stopInterval();

    const parsedIntervalMs = parseIntervalMs(intervalMs);
    const numericScenarioSeed = hashSeed(scenarioSeed);
    scenarioIntervalIndexRef.current = 0;
    intervalIdRef.current = setInterval(() => {
      emitScenarioStep(scenarioIntervalIndexRef.current, numericScenarioSeed);
      scenarioIntervalIndexRef.current += 1;
      if (scenarioIntervalIndexRef.current % progressUpdateInterval === 0) {
        setScenarioProgress({ emitted: scenarioIntervalIndexRef.current });
      }
    }, parsedIntervalMs);
    setPreparedScenarioMetadata(null);
    setActiveIntervalMode('liveScenario');
    setScenarioProgress({ emitted: 0 });
    setLastRunLabel(`live-scenario:${parsedIntervalMs}:seed:${scenarioSeed}`);
    setLastStatus(`Live scenario every ${parsedIntervalMs}ms`);
    setVisible(false);
  }, [emitScenarioStep, intervalMs, scenarioSeed, stopInterval]);

  const closeDialog = useCallback(() => {
    setVisible(false);
  }, []);

  const stopRunningScript = useCallback(() => {
    stopInterval();
    telemetry.flush();
    setLastStatus(
      scenarioProgress?.total
        ? `Stopped at ${scenarioProgress.emitted}/${scenarioProgress.total}`
        : 'Stopped',
    );
  }, [scenarioProgress, stopInterval, telemetry]);

  useEffect(() => {
    simulationStateRef.current = createInitialSimulationState({ channel });

    return stopInterval;
  }, [channel, stopInterval]);

  useEffect(() => {
    refreshDraft();
  }, [refreshDraft]);

  useEffect(() => {
    stopInterval();
  }, [
    actorMode,
    eventType,
    intervalMs,
    payloadMode,
    reactionUserShape,
    scenarioEventTypes,
    scenarioSeed,
    stopInterval,
  ]);

  const frameStats = telemetry.frameStats;
  const summary = telemetry.summary;
  const latestDispatchSample = telemetry.dispatchSamples[0];
  const latestRenderSample = telemetry.renderSamples[0];
  const activeRunLabel =
    activeIntervalMode === 'finiteScenario'
      ? 'Scenario'
      : activeIntervalMode === 'liveScenario'
        ? 'Live'
        : activeIntervalMode === 'single'
          ? 'Live single'
          : undefined;
  const activeRunSubtitle =
    activeIntervalMode === 'finiteScenario' && scenarioProgress?.total
      ? `${scenarioProgress.emitted}/${scenarioProgress.total}`
      : activeRunLabel
        ? `${summary.eventCount} events`
        : 'Bench';
  const latestAppliedMessage =
    visible && latestDispatchSample?.payloadMessageId
      ? getChannelMessages(channel).find(
          (message) => message.id === latestDispatchSample.payloadMessageId,
        )
      : undefined;
  const latestOwnReactionShape =
    latestAppliedMessage?.own_reactions
      ?.map(
        (reaction) =>
          `${reaction.type}: user_id=${reaction.user_id ?? '-'} user.id=${reaction.user?.id ?? '-'}`,
      )
      .join(' | ') || 'none';

  const getBenchmarkReport = useCallback(() => {
    const telemetrySnapshot = telemetry.getSnapshot();

    return {
      channelCid: channel.cid,
      createdAt: new Date().toISOString(),
      latestOwnReactionShape,
      platform: Platform.OS,
      runConfig: {
        activeIntervalMode,
        actorMode,
        eventType,
        intervalMs: Number(intervalMs) || undefined,
        lastRunLabel,
        messageCount: getChannelMessages(channel).length,
        messageListImplementation,
        messageListMode,
        messageListPruning,
        payloadMode,
        reactionUserShape,
        scenarioPreparation: preparedScenarioMetadata,
        scenarioEventTypes,
        scenarioProgress,
        scenarioSeed,
      },
      telemetry: {
        dispatchSamples: telemetrySnapshot.dispatchSamples.slice(0, 25),
        frameStats: telemetrySnapshot.frameStats,
        renderSamples: telemetrySnapshot.renderSamples.slice(0, 25),
        summary: telemetrySnapshot.summary,
      },
      tool: 'SampleApp WebSocketEventPromptDialog',
    };
  }, [
    activeIntervalMode,
    actorMode,
    channel,
    eventType,
    intervalMs,
    lastRunLabel,
    latestOwnReactionShape,
    messageListImplementation,
    messageListMode,
    messageListPruning,
    payloadMode,
    reactionUserShape,
    preparedScenarioMetadata,
    scenarioEventTypes,
    scenarioProgress,
    scenarioSeed,
    telemetry,
  ]);

  const copyBenchmarkReport = useCallback(() => {
    Clipboard.setString(JSON.stringify(getBenchmarkReport(), null, 2));
    setLastStatus('Copied benchmark report');
  }, [getBenchmarkReport]);

  const logBenchmarkReport = useCallback(() => {
    console.log('[SampleApp WS Benchmark]', JSON.stringify(getBenchmarkReport(), null, 2));
    setLastStatus('Logged benchmark report');
  }, [getBenchmarkReport]);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.floatingButton}>
        <Text style={styles.floatingButtonTitle}>{activeRunLabel ?? 'WS'}</Text>
        <Text style={styles.floatingButtonSubtitle}>{activeRunSubtitle}</Text>
      </Pressable>
      {activeIntervalMode ? (
        <Pressable onPress={stopRunningScript} style={styles.floatingStopButton}>
          <Text style={styles.floatingStopButtonText}>Stop</Text>
        </Pressable>
      ) : null}

      <Modal animationType='slide' onRequestClose={closeDialog} transparent visible={visible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <View style={styles.backdrop} />
          <View style={styles.dialog}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Websocket Events</Text>
                <Text numberOfLines={1} style={styles.subtitle}>
                  {channel.cid}
                </Text>
              </View>
              <ActionButton label='Hide' onPress={closeDialog} />
            </View>

            <ScrollView
              contentContainerStyle={styles.dialogContent}
              keyboardShouldPersistTaps='handled'
            >
              <Section title='Single Event'>
                <ScrollView
                  contentContainerStyle={styles.eventTypeList}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {supportedWebsocketEventTypes.map((type) => (
                    <Pressable
                      hitSlop={actionButtonHitSlop}
                      key={type}
                      onPress={() => setEventType(type)}
                      style={[
                        styles.eventTypeButton,
                        type === eventType && styles.eventTypeButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventTypeButtonText,
                          type === eventType && styles.eventTypeButtonTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Section>

              <Section title='Payload'>
                <View style={styles.segmentedControl}>
                  <SegmentedOption<PayloadMode>
                    label='Fresh'
                    onSelect={setPayloadMode}
                    selected={payloadMode === 'fresh'}
                    value='fresh'
                  />
                  <SegmentedOption<PayloadMode>
                    label='Fixed JSON'
                    onSelect={setPayloadMode}
                    selected={payloadMode === 'fixed'}
                    value='fixed'
                  />
                </View>

                <View style={styles.segmentedControl}>
                  <SegmentedOption<EventActorMode>
                    label='Current user'
                    onSelect={setActorMode}
                    selected={actorMode === 'current'}
                    value='current'
                  />
                  <SegmentedOption<EventActorMode>
                    label='Other user'
                    onSelect={setActorMode}
                    selected={actorMode === 'other'}
                    value='other'
                  />
                </View>

                <View style={styles.segmentedControl}>
                  <SegmentedOption<ReactionUserShape>
                    label='user_id only'
                    onSelect={setReactionUserShape}
                    selected={reactionUserShape === 'userIdOnly'}
                    value='userIdOnly'
                  />
                  <SegmentedOption<ReactionUserShape>
                    label='Nested user'
                    onSelect={setReactionUserShape}
                    selected={reactionUserShape === 'nestedUser'}
                    value='nestedUser'
                  />
                </View>

                <TextInput
                  autoCapitalize='none'
                  autoCorrect={false}
                  editable={payloadMode === 'fixed'}
                  multiline
                  onChangeText={setPayloadDraft}
                  scrollEnabled
                  style={[styles.payloadInput, payloadMode === 'fresh' && styles.payloadPreview]}
                  textAlignVertical='top'
                  value={payloadDraft}
                />

                <View style={styles.actionRow}>
                  <ActionButton label='Refresh' onPress={refreshDraft} />
                  <ActionButton label='Emit 1' onPress={() => emitOne()} />
                  <ActionButton label='Emit 25' onPress={() => emitBurst(25)} />
                  <ActionButton label='Emit 100' onPress={() => emitBurst(100)} />
                </View>
              </Section>

              <Section title='Scenario'>
                <ScrollView
                  contentContainerStyle={styles.eventTypeList}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {supportedWebsocketEventTypes.map((type) => {
                    const selected = scenarioEventTypes.includes(type);

                    return (
                      <Pressable
                        hitSlop={actionButtonHitSlop}
                        key={type}
                        onPress={() => toggleScenarioEventType(type)}
                        style={[styles.eventTypeButton, selected && styles.eventTypeButtonSelected]}
                      >
                        <Text
                          style={[
                            styles.eventTypeButtonText,
                            selected && styles.eventTypeButtonTextSelected,
                          ]}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.seedRow}>
                  <Text style={styles.intervalLabel}>Seed</Text>
                  <TextInput
                    autoCapitalize='none'
                    autoCorrect={false}
                    keyboardType='number-pad'
                    onChangeText={setScenarioSeed}
                    style={styles.seedInput}
                    value={scenarioSeed}
                  />
                  <ActionButton label='New seed' onPress={randomizeScenarioSeed} />
                </View>
                <View style={styles.actionRow}>
                  <ActionButton label='Scenario 100' onPress={() => emitScenario(100)} />
                  <ActionButton label='Scenario 250' onPress={() => emitScenario(250)} />
                  <ActionButton label='Scenario 1000' onPress={() => emitScenario(1000)} />
                  {activeIntervalMode === 'finiteScenario' ||
                  activeIntervalMode === 'liveScenario' ? (
                    <ActionButton label='Stop' onPress={stopRunningScript} tone='primary' />
                  ) : (
                    <ActionButton label='Start live' onPress={startScenarioInterval} />
                  )}
                </View>
              </Section>

              <Section title='Interval'>
                <View style={styles.intervalRow}>
                  <TextInput
                    keyboardType='number-pad'
                    onChangeText={setIntervalMs}
                    style={styles.intervalInput}
                    value={intervalMs}
                  />
                  <Text style={styles.intervalLabel}>ms</Text>
                  {activeIntervalMode === 'single' ? (
                    <ActionButton label='Stop' onPress={stopRunningScript} tone='primary' />
                  ) : (
                    <ActionButton label='Start' onPress={startInterval} tone='primary' />
                  )}
                </View>
              </Section>

              <Section title='Telemetry'>
                <View style={styles.metricsGrid}>
                  <Metric label='Events' value={summary.eventCount} />
                  <Metric label='Committed' value={summary.committedEvents} />
                  <Metric
                    label='Avg dispatch'
                    value={formatMs(summary.averageDispatchDurationMs)}
                  />
                  <Metric label='Avg commit' value={formatMs(summary.averageCommitLatencyMs)} />
                  <Metric label='P95 commit' value={formatMs(summary.p95CommitLatencyMs)} />
                  <Metric label='P95 schedule' value={formatMs(summary.p95ScheduleDelayMs)} />
                  <Metric label='P95 start gap' value={formatMs(summary.p95DispatchStartGapMs)} />
                  <Metric label='Avg render' value={formatMs(summary.averageRenderDurationMs)} />
                  <Metric label='P95 render' value={formatMs(summary.p95RenderDurationMs)} />
                  <Metric label='List commits' value={summary.renderCommitCount} />
                  <Metric label='Frames' value={frameStats.samples} />
                  <Metric label='Long >32' value={frameStats.longFramesOver32Ms} />
                  <Metric label='Long >50' value={frameStats.longFramesOver50Ms} />
                  <Metric label='Max frame' value={formatMs(frameStats.maxFrameMs)} />
                </View>

                <View style={styles.actionRow}>
                  {frameStats.running ? (
                    <ActionButton
                      label='Stop frames'
                      onPress={telemetry.stopFrameSampler}
                      tone='primary'
                    />
                  ) : (
                    <ActionButton
                      label='Start frames'
                      onPress={telemetry.startFrameSampler}
                      tone='primary'
                    />
                  )}
                  <ActionButton label='Clear' onPress={telemetry.clear} />
                  <ActionButton label='Reset state' onPress={resetSimulationState} />
                  <ActionButton label='Copy report' onPress={copyBenchmarkReport} />
                  <ActionButton label='Log report' onPress={logBenchmarkReport} />
                </View>

                <View style={styles.statusBlock}>
                  <Text style={styles.statusText}>{lastStatus}</Text>
                  <Text style={styles.statusText}>
                    Last dispatch {formatMs(latestDispatchSample?.dispatchDurationMs)}, commit{' '}
                    {formatMs(latestDispatchSample?.commitLatencyMs)}, messages{' '}
                    {latestDispatchSample?.messageCount ?? getChannelMessages(channel).length}
                  </Text>
                  <Text style={styles.statusText}>
                    Timer delay {formatMs(latestDispatchSample?.scheduleDelayMs)}, start gap{' '}
                    {formatMs(latestDispatchSample?.dispatchStartGapMs)}
                  </Text>
                  <Text style={styles.statusText}>
                    Last render {formatMs(latestRenderSample?.actualDurationMs)}, base{' '}
                    {formatMs(latestRenderSample?.baseDurationMs)}, frame avg{' '}
                    {formatMs(frameStats.averageFrameMs)}
                  </Text>
                  <Text style={styles.statusText}>
                    Render/event ratio{' '}
                    {formatNumber(
                      summary.eventCount
                        ? summary.renderCommitCount / summary.eventCount
                        : undefined,
                    )}
                  </Text>
                  <Text style={styles.statusText}>own_reactions {latestOwnReactionShape}</Text>
                </View>
              </Section>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 7,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonPrimary: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
  },
  actionButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonTextDisabled: {
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dialog: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: '88%',
    maxWidth: 720,
    minHeight: 520,
    overflow: 'hidden',
    width: '94%',
  },
  dialogContent: {
    padding: 16,
    paddingBottom: 24,
  },
  eventTypeButton: {
    borderColor: '#CBD5E1',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventTypeButtonSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  eventTypeButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  eventTypeButtonTextSelected: {
    color: '#FFFFFF',
  },
  eventTypeList: {
    gap: 8,
    paddingRight: 16,
  },
  floatingButton: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    bottom: 96,
    elevation: 4,
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    right: 16,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    zIndex: 20,
  },
  floatingButtonSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  floatingButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  floatingStopButton: {
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    bottom: 152,
    elevation: 4,
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 14,
    position: 'absolute',
    right: 16,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    zIndex: 20,
  },
  floatingStopButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  intervalInput: {
    borderColor: '#CBD5E1',
    borderRadius: 7,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    minHeight: 38,
    paddingHorizontal: 12,
    width: 92,
  },
  intervalLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  intervalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 7,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 58,
    minWidth: 104,
    padding: 8,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
  },
  payloadInput: {
    backgroundColor: '#0F172A',
    borderRadius: 7,
    color: '#E2E8F0',
    fontFamily: Platform.select({ android: 'monospace', ios: 'Menlo' }),
    fontSize: 11,
    lineHeight: 15,
    marginTop: 12,
    maxHeight: 220,
    minHeight: 180,
    padding: 10,
  },
  payloadPreview: {
    opacity: 0.84,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  seedInput: {
    borderColor: '#CBD5E1',
    borderRadius: 7,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    minHeight: 38,
    paddingHorizontal: 12,
    width: 124,
  },
  seedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  segmentedOption: {
    borderColor: '#CBD5E1',
    borderRadius: 7,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentedOptionSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#0F766E',
  },
  segmentedOptionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedOptionTextSelected: {
    color: '#0F766E',
  },
  statusBlock: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  statusText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 480,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
});
