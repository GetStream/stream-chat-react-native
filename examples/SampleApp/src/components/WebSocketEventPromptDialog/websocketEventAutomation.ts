import type { Channel, Event, ReactionResponse, StreamChat, UserResponse } from 'stream-chat';

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
  buildDefaultWebSocketEventPayload,
  buildMessage,
  buildMessageWithReaction,
  buildReaction,
  createWebSocketEventTemplateContext,
  getChannelMessages,
  getEventActor,
  getLatestMessage,
  getNextReactionType,
  toMessageResponse,
} from './websocketEventTemplates';

const getMessageIdList = (channel: Channel) =>
  getChannelMessages(channel)
    .map((message) => message.id)
    .filter(Boolean);

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

const getReactionRecordList = (channel: Channel) => {
  const seen = new Set<string>();

  return getChannelMessages(channel).flatMap((message) => {
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
}): SimulationState => ({
  messageIdsByCid: {
    [channel.cid]: getMessageIdList(channel),
  },
  messageSequence: 0,
  reactionRecordsByCid: {
    [channel.cid]: getReactionRecordList(channel),
  },
  reactionSequence: 0,
  reactionTypeIndex: 0,
  userIndexByCid: {},
});

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
  const loadedMessages = getChannelMessages(context.channel).map((message) =>
    toMessageResponse(message, context),
  );
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
}) => {
  state.messageSequence += 1;

  const message = buildMessage({
    context,
    id: `sampleapp-sim-message-${Date.now()}-${state.messageSequence}`,
    text: `Synthetic chat traffic #${state.messageSequence}`,
    user,
  });

  return {
    ...buildDefaultWebSocketEventPayload({
      context,
      eventType,
      options: {
        actorMode: user.id === context.currentUser.id ? 'current' : 'other',
        reactionUserShape: 'nestedUser',
      },
    }),
    message,
    message_id: message.id,
    user,
    user_id: user.id,
  } as WebSocketEventPayload;
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
}) => {
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

  return {
    ...buildDefaultWebSocketEventPayload({
      context,
      eventType,
      options: {
        actorMode: user.id === context.currentUser.id ? 'current' : 'other',
        reactionUserShape: options.reactionUserShape,
      },
    }),
    message: payloadMessage,
    message_id: targetMessage.id,
    reaction,
    user: reactionUser,
    user_id: reactionUser.id,
  } as WebSocketEventPayload;
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

  return {
    ...buildDefaultWebSocketEventPayload({ context, eventType, options }),
    user,
    user_id: user.id,
  };
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
  if (!payload.message?.id) return;

  const currentIds = state.messageIdsByCid[channel.cid] ?? [];
  if (!currentIds.includes(payload.message.id)) {
    state.messageIdsByCid[channel.cid] = [...currentIds, payload.message.id].slice(-500);
  }

  if (!payload.reaction) return;

  const user = getReactionUser(payload.reaction);
  if (!user) return;

  const currentReactionRecords = state.reactionRecordsByCid[channel.cid] ?? [];
  const reactionRecord: SimulatedReactionRecord = {
    messageId: payload.message.id,
    reactionType: payload.reaction.type,
    user,
  };
  const isSameReaction = (record: SimulatedReactionRecord) =>
    record.messageId === reactionRecord.messageId &&
    record.reactionType === reactionRecord.reactionType &&
    record.user.id === reactionRecord.user.id;
  const isSameUserOnMessage = (record: SimulatedReactionRecord) =>
    record.messageId === reactionRecord.messageId && record.user.id === reactionRecord.user.id;

  if (payload.type === 'reaction.deleted') {
    state.reactionRecordsByCid[channel.cid] = currentReactionRecords.filter(
      (record) => !isSameReaction(record),
    );
    return;
  }

  state.reactionRecordsByCid[channel.cid] = [
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
  const emittedPayload = {
    ...payload,
    type: eventType,
  } as Event;

  client.dispatchEvent(emittedPayload);

  return emittedPayload as WebSocketEventPayload;
};
