import type { ProfilerOnRenderCallback } from 'react';

import type { Channel, Event, MessageResponse, ReactionResponse, UserResponse } from 'stream-chat';

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
  channelData: {
    cid: string;
    disabled: boolean;
    frozen: boolean;
    id: string;
    member_count?: number;
    type: string;
    [key: string]: unknown;
  };
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

export type WebSocketEventPayload = Event & {
  message?: MessageResponse;
  reaction?: ReactionResponse;
};

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
};

export type BenchmarkRenderSample = {
  actualDurationMs: number;
  baseDurationMs: number;
  commitTime: number;
  eventCount: number;
  phase: Parameters<ProfilerOnRenderCallback>[1];
  startedAt: number;
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
  lastDispatchStartGapMs?: number;
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
  recordDispatchedEvent: (sample: {
    dispatchDurationMs: number;
    eventType: SupportedWebSocketEventType;
    messageCount?: number;
    payloadMessageId?: string;
    scheduleDelayMs?: number;
    scheduledAt?: number;
    startedAt: number;
  }) => void;
  startFrameSampler: () => void;
  stopFrameSampler: () => void;
};
