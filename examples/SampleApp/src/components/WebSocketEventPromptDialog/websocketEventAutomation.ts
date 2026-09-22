import { nowNs } from 'stream-chat';
import type {
  Channel,
  MessageResponse,
  ReactionResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import type {
  EventActorMode,
  SimulationState,
  SimulatedReactionRecord,
  SupportedWebSocketEventType,
  WebSocketEventBuildOptions,
  WebSocketEventPayload,
  WebSocketEventTemplateContext,
} from './types';
import {
  buildEventBase,
  buildMessage,
  buildMessageWithReaction,
  buildReaction,
  createWebSocketEventTemplateContext,
  getChannelMessages,
  getEventActor,
  getLatestMessage,
  getNextReactionType,
  getWatcherCount,
  toMessageResponse,
} from './websocketEventTemplates';

const getMessageIdList = (messages: MessageResponse[]) =>
  messages.map((message) => message.id).filter(Boolean);

const getReactionUserId = (reaction: ReactionResponse) => reaction.user?.id ?? reaction.user_id;

const getReactionUser = (reaction: ReactionResponse) => {
  const userId = getReactionUserId(reaction);
  if (!userId) return undefined;

  return (
    reaction.user ??
    ({
      id: userId,
      name: userId,
    } as UserResponse)
  );
};

const getReactionRecordList = (messages: MessageResponse[]) => {
  const seen = new Set<string>();

  return messages.flatMap((message) => {
    const reactions = [...(message.own_reactions ?? []), ...(message.latest_reactions ?? [])];

    return reactions.flatMap((reaction) => {
      const user = getReactionUser(reaction);
      if (!user || !reaction.type || !message.id) return [];

      const key = `${message.id}:${user.id}:${reaction.type}`;
      if (seen.has(key)) return [];
      seen.add(key);

      return [
        {
          messageId: message.id,
          reactionType: reaction.type,
          user,
        },
      ];
    });
  });
};

export const createInitialSimulationState = ({
  channel,
}: {
  channel: Channel;
}): SimulationState => {
  const context = createWebSocketEventTemplateContext({ channel });
  const messages = getChannelMessages(channel).map((message) =>
    toMessageResponse(message, context),
  );

  return {
    messageIdsByCid: {
      [context.cid]: getMessageIdList(messages),
    },
    messagesByCid: {
      [context.cid]: messages,
    },
    messageSequence: 0,
    reactionRecordsByCid: {
      [context.cid]: getReactionRecordList(messages),
    },
    reactionSequence: 0,
    reactionTypeIndex: 0,
    userIndexByCid: {},
  };
};

const getNextUser = ({
  actorMode,
  context,
  state,
}: {
  actorMode: EventActorMode;
  context: WebSocketEventTemplateContext;
  state: SimulationState;
}) => {
  if (actorMode === 'current') {
    return context.currentUser;
  }

  const users = context.otherUsers.length ? context.otherUsers : context.users;
  const currentIndex = state.userIndexByCid[context.cid] ?? 0;
  const user = users[currentIndex % users.length] ?? context.currentUser;
  state.userIndexByCid[context.cid] = currentIndex + 1;

  return user;
};

const getKnownMessage = ({
  context,
  state,
  targetMessageId,
}: {
  context: WebSocketEventTemplateContext;
  state: SimulationState;
  targetMessageId?: string;
}) => {
  const loadedMessages =
    state.messagesByCid[context.cid] ??
    getChannelMessages(context.channel).map((message) => toMessageResponse(message, context));
  const knownIds = state.messageIdsByCid[context.cid] ?? [];
  const newestKnownId = knownIds[knownIds.length - 1];

  return (
    loadedMessages.find((message) => message.id === targetMessageId) ??
    loadedMessages.find((message) => message.id === newestKnownId) ??
    loadedMessages[loadedMessages.length - 1] ??
    getLatestMessage(context)
  );
};

const getTrackedReaction = ({
  context,
  state,
  user,
}: {
  context: WebSocketEventTemplateContext;
  state: SimulationState;
  user: UserResponse;
}) => {
  const records = state.reactionRecordsByCid[context.cid] ?? [];

  return records.find((record) => record.user.id === user.id) ?? records[0];
};

const buildFreshMessagePayload = ({
  context,
  eventType,
  state,
  user,
}: {
  context: WebSocketEventTemplateContext;
  eventType: 'message.new' | 'notification.message_new';
  state: SimulationState;
  user: ReturnType<typeof getEventActor>;
}): WebSocketEventPayload => {
  state.messageSequence += 1;

  const message = buildMessage({
    context,
    id: `sampleapp-sim-message-${Date.now()}-${state.messageSequence}`,
    text: `Synthetic chat traffic #${state.messageSequence}`,
    user,
  });

  // Built from the shared base rather than by spreading a finished event and overriding it: the
  // discriminant has to be a literal, so each type gets its own branch.
  const base = {
    ...buildEventBase(context, user),
    message,
    message_id: message.id,
    watcher_count: getWatcherCount(context),
  };

  return eventType === 'message.new'
    ? { ...base, type: 'message.new' }
    : { ...base, type: 'notification.message_new' };
};

const buildFreshMessageUpdatePayload = ({
  context,
  eventType,
  state,
  user,
}: {
  context: WebSocketEventTemplateContext;
  eventType: 'message.deleted' | 'message.updated';
  state: SimulationState;
  user: ReturnType<typeof getEventActor>;
}): WebSocketEventPayload => {
  const fallbackMessage = buildMessage({
    context,
    id: `sampleapp-sim-update-message-${Date.now()}-${state.messageSequence}`,
    text: 'Synthetic update target',
    user: context.currentUser,
  });
  const targetMessage = getKnownMessage({ context, state }) ?? fallbackMessage;
  const timestamp = nowNs();
  // No cast needed now that `buildMessage` / `toMessageResponse` produce complete `MessageResponse`
  // objects: spreading one keeps every required field.
  const message: MessageResponse =
    eventType === 'message.deleted'
      ? {
          ...targetMessage,
          deleted_at: timestamp,
          text: '',
          type: 'deleted',
          updated_at: timestamp,
        }
      : {
          ...targetMessage,
          text: `${targetMessage.text || 'Synthetic chat traffic'} (updated)`,
          updated_at: timestamp,
        };

  const base = {
    ...buildEventBase(context, user),
    message,
    message_id: message.id,
  };

  return eventType === 'message.deleted'
    ? // `hard_delete` is required on this event; the simulator models the soft-delete path.
      { ...base, hard_delete: false, type: 'message.deleted' }
    : { ...base, type: 'message.updated' };
};

const buildFreshReactionPayload = ({
  context,
  eventType,
  options,
  state,
  user,
}: {
  context: WebSocketEventTemplateContext;
  eventType: 'reaction.new' | 'reaction.updated' | 'reaction.deleted';
  options: Pick<WebSocketEventBuildOptions, 'reactionUserShape'>;
  state: SimulationState;
  user: ReturnType<typeof getEventActor>;
}): WebSocketEventPayload => {
  state.reactionSequence += 1;

  const trackedReaction =
    eventType === 'reaction.updated' || eventType === 'reaction.deleted'
      ? getTrackedReaction({ context, state, user })
      : undefined;
  const fallbackMessage = buildMessage({
    context,
    id: `sampleapp-sim-reaction-message-${Date.now()}-${state.reactionSequence}`,
    text: 'Synthetic reaction target',
    user: context.currentUser,
  });
  const targetMessage =
    getKnownMessage({ context, state, targetMessageId: trackedReaction?.messageId }) ??
    fallbackMessage;
  const reactionType =
    eventType === 'reaction.deleted' && trackedReaction
      ? trackedReaction.reactionType
      : getNextReactionType(state);
  const reactionUser = trackedReaction?.user ?? user;
  const reaction = buildReaction({
    messageId: targetMessage.id,
    reactionType,
    reactionUserShape: options.reactionUserShape,
    user: reactionUser,
  });
  const payloadMessage = buildMessageWithReaction({
    enforceUnique: eventType === 'reaction.updated',
    message: targetMessage,
    reaction,
    removed: eventType === 'reaction.deleted',
  });

  const base = {
    ...buildEventBase(context, reactionUser),
    message: payloadMessage,
    message_id: targetMessage.id,
    reaction,
  };

  switch (eventType) {
    case 'reaction.new':
      return { ...base, type: 'reaction.new' };
    case 'reaction.updated':
      return { ...base, type: 'reaction.updated' };
    case 'reaction.deleted':
      return { ...base, type: 'reaction.deleted' };
    default: {
      const unsupported: never = eventType;
      throw new Error(`WebSocket simulator: unsupported reaction event '${unsupported}'.`);
    }
  }
};

export const buildFreshWebSocketEventPayload = ({
  channel,
  currentUserId,
  eventType,
  options,
  state,
}: {
  channel: Channel;
  currentUserId?: string;
  eventType: SupportedWebSocketEventType;
  options: WebSocketEventBuildOptions;
  state: SimulationState;
}): WebSocketEventPayload => {
  const context = createWebSocketEventTemplateContext({ channel, currentUserId });
  const user = getNextUser({ actorMode: options.actorMode, context, state });

  if (eventType === 'message.new' || eventType === 'notification.message_new') {
    return buildFreshMessagePayload({ context, eventType, state, user });
  }

  if (eventType === 'message.updated' || eventType === 'message.deleted') {
    return buildFreshMessageUpdatePayload({ context, eventType, state, user });
  }

  if (
    eventType === 'reaction.new' ||
    eventType === 'reaction.updated' ||
    eventType === 'reaction.deleted'
  ) {
    return buildFreshReactionPayload({
      context,
      eventType,
      options,
      state,
      user,
    });
  }

  // Only `typing.start` / `typing.stop` reach here; the shared base already carries the actor.
  const base = buildEventBase(context, user);

  return eventType === 'typing.start'
    ? { ...base, type: 'typing.start' }
    : { ...base, type: 'typing.stop' };
};

export const trackSimulationStateFromPayload = ({
  channel,
  payload,
  state,
}: {
  channel: Channel;
  payload: WebSocketEventPayload;
  state: SimulationState;
}) => {
  // `message` and `reaction` are not on every member of the union — `typing.*` carries neither — so
  // read them through an `in` narrowing rather than widening the payload type back out.
  const payloadMessage = 'message' in payload ? payload.message : undefined;
  const payloadReaction = 'reaction' in payload ? payload.reaction : undefined;

  if (!payloadMessage?.id) return;

  const context = createWebSocketEventTemplateContext({ channel });
  const currentMessages = state.messagesByCid[context.cid] ?? [];
  const nextMessage = toMessageResponse(payloadMessage, context);
  const existingMessageIndex = currentMessages.findIndex(
    (message) => message.id === nextMessage.id,
  );
  const nextMessages =
    existingMessageIndex === -1
      ? [...currentMessages, nextMessage]
      : currentMessages.map((message, index) =>
          index === existingMessageIndex ? nextMessage : message,
        );

  state.messagesByCid[context.cid] = nextMessages.slice(-1500);
  state.messageIdsByCid[context.cid] = getMessageIdList(state.messagesByCid[context.cid]);

  if (!payloadReaction) return;

  const user = getReactionUser(payloadReaction);
  if (!user) return;

  const currentReactionRecords = state.reactionRecordsByCid[context.cid] ?? [];
  const reactionRecord: SimulatedReactionRecord = {
    messageId: payloadMessage.id,
    reactionType: payloadReaction.type,
    user,
  };
  const isSameReaction = (record: SimulatedReactionRecord) =>
    record.messageId === reactionRecord.messageId &&
    record.reactionType === reactionRecord.reactionType &&
    record.user.id === reactionRecord.user.id;
  const isSameUserOnMessage = (record: SimulatedReactionRecord) =>
    record.messageId === reactionRecord.messageId && record.user.id === reactionRecord.user.id;

  if (payload.type === 'reaction.deleted') {
    state.reactionRecordsByCid[context.cid] = currentReactionRecords.filter(
      (record) => !isSameReaction(record),
    );
    return;
  }

  state.reactionRecordsByCid[context.cid] = [
    reactionRecord,
    ...currentReactionRecords.filter((record) =>
      payload.type === 'reaction.updated' ? !isSameUserOnMessage(record) : !isSameReaction(record),
    ),
  ].slice(0, 500);
};

export const emitWebSocketEventPayload = ({
  client,
  eventType,
  payload,
}: {
  client: StreamChat;
  eventType: SupportedWebSocketEventType;
  payload: WebSocketEventPayload;
}) => {
  // No `type` override any more: each builder stamps its own literal discriminant, and re-stamping
  // it from the `SupportedWebSocketEventType` union is exactly what used to widen the payload back
  // out of the `Event` union. `eventType` is kept as a parameter because callers pass it for
  // telemetry, and asserting the two agree is cheap.
  if (payload.type !== eventType) {
    throw new Error(
      `WebSocket simulator: built a '${payload.type}' payload for a '${eventType}' step.`,
    );
  }

  client.dispatchEvent(payload);

  return payload;
};
