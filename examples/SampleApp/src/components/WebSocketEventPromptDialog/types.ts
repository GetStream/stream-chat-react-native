import type { ProfilerOnRenderCallback } from 'react';

import type {
  Channel,
  ChannelResponse,
  EventPayload,
  MessageResponse,
  UserResponse,
} from 'stream-chat';

export const supportedWebsocketEventTypes = [
  'message.new',
  'message.updated',
  'message.deleted',
  'reaction.new',
  'reaction.updated',
  'reaction.deleted',
  'typing.start',
  'typing.stop',
  'notification.message_new',
] as const;

export type SupportedWebSocketEventType = (typeof supportedWebsocketEventTypes)[number];

export type PayloadMode = 'fixed' | 'fresh';

export type EventActorMode = 'current' | 'other';

export type ReactionUserShape = 'nestedUser' | 'userIdOnly';

export type SimulatedReactionRecord = {
  messageId: string;
  reactionType: string;
  user: UserResponse;
};

export type WebSocketEventTemplateContext = {
  channel: Channel;
  /**
   * A complete `ChannelResponse`, not a loose bag: v10's event types require the real thing on
   * `reaction.*` and `notification.message_new`, so the simulator has to synthesise the fields the
   * live `channel.data` may not carry rather than widening its way past them.
   */
  channelData: ChannelResponse;
  cid: string;
  currentUser: UserResponse;
  otherUsers: UserResponse[];
  users: UserResponse[];
};

export type WebSocketEventBuildOptions = {
  actorMode: EventActorMode;
  reactionUserShape: ReactionUserShape;
};

export type SimulationState = {
  messageIdsByCid: Record<string, string[]>;
  messagesByCid: Record<string, MessageResponse[]>;
  messageSequence: number;
  reactionRecordsByCid: Record<string, SimulatedReactionRecord[]>;
  reactionSequence: number;
  reactionTypeIndex: number;
  userIndexByCid: Record<string, number>;
};

/**
 * Exactly the events this simulator can emit.
 *
 * v10 made `Event` a discriminated union of ~83 members, each with its own required fields. The old
 * `Event & { message?; reaction? }` distributed that intersection across every member, so a partial
 * synthetic payload matched none of them. Narrowing to the nine supported types instead means the
 * builders are checked against the real contract — `hard_delete` on `message.deleted`,
 * `watcher_count` on `message.new`, a full `channel` on `reaction.*` — and each builder now emits a
 * complete event rather than being cast into shape.
 */
export type WebSocketEventPayload = EventPayload<SupportedWebSocketEventType>;

export type BenchmarkDispatchSample = {
  commitLatencyMs?: number;
  commitTime?: number;
  dispatchStartGapMs?: number;
  dispatchDurationMs: number;
  eventIndex: number;
  eventType: SupportedWebSocketEventType;
  messageCount?: number;
  payloadMessageId?: string;
  scheduleDelayMs?: number;
  scheduledAt?: number;
  startedAt: number;
  // PERF INSTRUMENTATION (remove after diagnosis): Hermes cumulative js_totalAllocatedBytes read just
  // before/after the synchronous event dispatch. Lets analysis split per-event allocation into the
  // LLC-dispatch phase (end − start) vs render/commit vs inter-event gap (pair to the render sample by
  // commitTime; use eventCount===1 samples).
  allocAtDispatchStartBytes?: number;
  allocAtDispatchEndBytes?: number;
};

export type BenchmarkRenderSample = {
  actualDurationMs: number;
  baseDurationMs: number;
  commitTime: number;
  eventCount: number;
  phase: Parameters<ProfilerOnRenderCallback>[1];
  startedAt: number;
  // Hermes GC/heap counters (raw getInstrumentedStats values; units Hermes-version-dependent —
  // read the TREND across checkpoints: heapSize runaway + gcTime/numGCs explosion = GC death spiral).
  jsHeapSize?: number;
  jsNumGCs?: number;
  jsGcTime?: number;
  jsTotalAllocated?: number;
};

export type BenchmarkFrameStats = {
  averageFrameMs: number;
  longFramesOver32Ms: number;
  longFramesOver50Ms: number;
  maxFrameMs: number;
  running: boolean;
  samples: number;
  startedAt?: number;
};

export type BenchmarkTelemetrySummary = {
  averageCommitLatencyMs?: number;
  averageDispatchDurationMs?: number;
  averageDispatchStartGapMs?: number;
  averageRenderDurationMs?: number;
  averageScheduleDelayMs?: number;
  committedEvents: number;
  eventCount: number;
  listChangeCount: number;
  listLengthChangeCount: number;
  listSameLengthChangeCount: number;
  lastDispatchStartGapMs?: number;
  lastListLength?: number;
  lastScheduleDelayMs?: number;
  lastCommitLatencyMs?: number;
  lastRenderDurationMs?: number;
  p95CommitLatencyMs?: number;
  p95DispatchStartGapMs?: number;
  p95RenderDurationMs?: number;
  p95ScheduleDelayMs?: number;
  renderCommitCount: number;
};

export type BenchmarkTelemetrySnapshot = {
  dispatchSamples: BenchmarkDispatchSample[];
  frameStats: BenchmarkFrameStats;
  renderSamples: BenchmarkRenderSample[];
  summary: BenchmarkTelemetrySummary;
};

export type BenchmarkTelemetry = BenchmarkTelemetrySnapshot & {
  clear: () => void;
  flush: () => void;
  getSnapshot: () => BenchmarkTelemetrySnapshot;
  onMessageListRender: ProfilerOnRenderCallback;
  recordMessageListChange: (sample: { nextLength: number; previousLength: number }) => void;
  recordDispatchedEvent: (sample: {
    dispatchDurationMs: number;
    eventType: SupportedWebSocketEventType;
    messageCount?: number;
    payloadMessageId?: string;
    scheduleDelayMs?: number;
    scheduledAt?: number;
    startedAt: number;
    allocAtDispatchStartBytes?: number;
    allocAtDispatchEndBytes?: number;
  }) => void;
  startFrameSampler: () => void;
  stopFrameSampler: () => void;
};
