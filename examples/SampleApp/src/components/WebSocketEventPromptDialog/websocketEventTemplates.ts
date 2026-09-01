import { nowNs } from 'stream-chat';
import type {
  Channel,
  ChannelResponse,
  LocalMessage,
  MessageResponse,
  ReactionGroupResponse,
  ReactionResponse,
  UserResponse,
} from 'stream-chat';

import type {
  EventActorMode,
  ReactionUserShape,
  SupportedWebSocketEventType,
  WebSocketEventBuildOptions,
  WebSocketEventPayload,
  WebSocketEventTemplateContext,
} from './types';
import { supportedWebsocketEventTypes } from './types';

const fallbackChannelId = 'sampleapp-benchmark';
const reactionTypes = ['love', 'like', 'haha', 'wow', 'sad'];

type MessageEntryLike = {
  state?: {
    getLatestValue?: () => {
      message?: LocalMessage;
    };
  };
};

type MessagePaginatorLike = {
  messageEntryState?: {
    getLatestValue?: () => {
      items?: MessageEntryLike[];
    };
  };
  state?: {
    getLatestValue?: () => {
      items?: LocalMessage[];
    };
  };
};

const normalizeUser = (user: Partial<UserResponse> | null | undefined, fallbackId: string) => {
  const id = user?.id || fallbackId;

  return {
    id,
    image: user?.image,
    name: user?.name || id,
    online: user?.online ?? true,
    role: user?.role || 'user',
    updated_at: user?.updated_at || nowNs(),
  } as UserResponse;
};

const uniqueUsers = (users: UserResponse[]) => {
  const seen = new Set<string>();

  return users.filter((user) => {
    if (!user.id || seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
};

export const getChannelMessages = (channel: Channel) => {
  const paginator = (channel as unknown as { messagePaginator?: MessagePaginatorLike })
    .messagePaginator;
  const messageEntries = paginator?.messageEntryState?.getLatestValue?.().items;
  const messagesFromEntries = messageEntries
    ?.map((entry) => entry.state?.getLatestValue?.().message)
    .filter((message): message is LocalMessage => !!message);

  if (messagesFromEntries?.length) {
    return messagesFromEntries;
  }

  const paginatorItems = paginator?.state?.getLatestValue?.().items;
  if (paginatorItems?.length) {
    return paginatorItems;
  }

  const legacyMessages = (channel.state as unknown as { messages?: LocalMessage[] }).messages;
  return legacyMessages ?? [];
};

const createChannelData = (channel: Channel) => {
  const data = (channel.data ?? {}) as Partial<ChannelResponse>;
  const cid = channel.cid || data.cid || `${channel.type}:${channel.id || fallbackChannelId}`;
  const [cidType = channel.type || 'messaging', cidId = channel.id || fallbackChannelId] =
    cid.split(':');

  return {
    ...data,
    cid,
    disabled: data.disabled ?? false,
    frozen: data.frozen ?? false,
    id: channel.id || data.id || cidId,
    member_count:
      data.member_count ?? (Object.keys(channel.state?.members ?? {}).length || undefined),
    type: channel.type || data.type || cidType,
  };
};

export const createWebSocketEventTemplateContext = ({
  channel,
  currentUserId,
}: {
  channel: Channel;
  currentUserId?: string;
}): WebSocketEventTemplateContext => {
  const channelData = createChannelData(channel);
  const currentUser = normalizeUser(
    channel.getClient().user ?? { id: currentUserId },
    currentUserId || 'sampleapp-current-user',
  );
  const memberUsers = Object.values(channel.state?.members ?? {}).flatMap((member) =>
    member.user ? [normalizeUser(member.user, member.user.id)] : [],
  );
  const syntheticUser = normalizeUser(
    { id: `${currentUser.id}-benchmark-peer`, name: 'Benchmark Peer' },
    'sampleapp-benchmark-peer',
  );
  const users = uniqueUsers([currentUser, ...memberUsers, syntheticUser]);
  const otherUsers = users.filter((user) => user.id !== currentUser.id);

  return {
    channel,
    channelData,
    cid: channelData.cid,
    currentUser,
    otherUsers: otherUsers.length ? otherUsers : [syntheticUser],
    users,
  };
};

export const getEventActor = (
  context: WebSocketEventTemplateContext,
  actorMode: EventActorMode,
) => {
  if (actorMode === 'current') {
    return context.currentUser;
  }

  return context.otherUsers[0] ?? context.currentUser;
};

export const toMessageResponse = (
  message: LocalMessage | MessageResponse,
  context: WebSocketEventTemplateContext,
) => {
  const createdAt = message.created_at ?? nowNs();
  const updatedAt = message.updated_at ?? createdAt;
  const user = message.user ? normalizeUser(message.user, message.user.id) : context.currentUser;

  return {
    ...message,
    cid: message.cid || context.cid,
    created_at: createdAt,
    id: message.id,
    latest_reactions: message.latest_reactions ?? [],
    own_reactions: message.own_reactions ?? [],
    reaction_counts: message.reaction_counts ?? {},
    reaction_groups: message.reaction_groups ?? {},
    reaction_scores: message.reaction_scores ?? {},
    text: message.text ?? '',
    type: message.type ?? 'regular',
    updated_at: updatedAt,
    user,
    user_id: message.user_id || user.id,
  } as MessageResponse;
};

export const getLatestMessage = (context: WebSocketEventTemplateContext) => {
  const messages = getChannelMessages(context.channel);

  return messages.length ? toMessageResponse(messages[messages.length - 1], context) : undefined;
};

const buildBasePayload = (
  context: WebSocketEventTemplateContext,
  eventType: SupportedWebSocketEventType,
  user: UserResponse,
) =>
  ({
    channel: context.channelData,
    channel_id: context.channelData.id,
    channel_type: context.channelData.type,
    cid: context.cid,
    created_at: nowNs(),
    type: eventType,
    user,
    user_id: user.id,
  }) as WebSocketEventPayload;

export const buildMessage = ({
  context,
  id,
  text,
  type = 'regular',
  user,
}: {
  context: WebSocketEventTemplateContext;
  id: string;
  text: string;
  type?: MessageResponse['type'];
  user: UserResponse;
}) => {
  const timestamp = nowNs();

  return {
    cid: context.cid,
    created_at: timestamp,
    html: `<p>${text}</p>`,
    id,
    latest_reactions: [],
    own_reactions: [],
    reaction_counts: {},
    reaction_groups: {},
    reaction_scores: {},
    text,
    type,
    updated_at: timestamp,
    user,
    user_id: user.id,
  } as MessageResponse;
};

const getReactionUserFields = (user: UserResponse, reactionUserShape: ReactionUserShape) =>
  reactionUserShape === 'userIdOnly' ? { user_id: user.id } : { user, user_id: user.id };

export const buildReaction = ({
  messageId,
  reactionType,
  reactionUserShape,
  user,
}: {
  messageId: string;
  reactionType: string;
  reactionUserShape: ReactionUserShape;
  user: UserResponse;
}) => {
  const timestamp = nowNs();

  return {
    created_at: timestamp,
    message_id: messageId,
    score: 1,
    type: reactionType,
    updated_at: timestamp,
    ...getReactionUserFields(user, reactionUserShape),
  } as ReactionResponse;
};

const getReactionUserId = (reaction: ReactionResponse) => reaction.user?.id ?? reaction.user_id;

const removeEmptyReactionGroups = (groups: Record<string, ReactionGroupResponse>) =>
  Object.fromEntries(Object.entries(groups).filter(([, group]) => group.count > 0));

export const buildMessageWithReaction = ({
  message,
  reaction,
  removed = false,
  enforceUnique = false,
}: {
  message: MessageResponse;
  reaction: ReactionResponse;
  enforceUnique?: boolean;
  removed?: boolean;
}) => {
  const reactionUserId = getReactionUserId(reaction);
  const timestamp = nowNs();
  const sameReaction = (candidate: ReactionResponse) =>
    candidate.type === reaction.type && getReactionUserId(candidate) === reactionUserId;
  const baseLatestReactions = message.latest_reactions ?? [];
  const baseOwnReactions = message.own_reactions ?? [];
  const sameReactionUser = (candidate: ReactionResponse) =>
    getReactionUserId(candidate) === reactionUserId;
  const latest_reactions = removed
    ? baseLatestReactions.filter((candidate) => !sameReaction(candidate))
    : [
        reaction,
        ...baseLatestReactions.filter((candidate) =>
          enforceUnique ? !sameReactionUser(candidate) : !sameReaction(candidate),
        ),
      ].slice(0, 10);
  const own_reactions = removed
    ? baseOwnReactions.filter((candidate) => !sameReaction(candidate))
    : enforceUnique
      ? [reaction]
      : [reaction, ...baseOwnReactions.filter((candidate) => !sameReaction(candidate))];
  const currentGroups = message.reaction_groups ?? {};
  const currentGroup = currentGroups[reaction.type];
  const currentCount =
    currentGroup?.count ??
    baseLatestReactions.filter((candidate) => candidate.type === reaction.type).length;
  const nextCount = Math.max(0, removed ? currentCount - 1 : currentCount + 1);
  const reaction_groups = removeEmptyReactionGroups({
    ...currentGroups,
    [reaction.type]: {
      count: nextCount,
      first_reaction_at: currentGroup?.first_reaction_at || timestamp,
      last_reaction_at: timestamp,
      sum_scores: nextCount,
    },
  });
  const reaction_counts = {
    ...(message.reaction_counts ?? {}),
    [reaction.type]: nextCount,
  };
  const reaction_scores = {
    ...(message.reaction_scores ?? {}),
    [reaction.type]: nextCount,
  };

  if (nextCount === 0) {
    delete reaction_counts[reaction.type];
    delete reaction_scores[reaction.type];
  }

  return {
    ...message,
    latest_reactions,
    own_reactions,
    reaction_counts,
    reaction_groups,
    reaction_scores,
    updated_at: timestamp,
  } as MessageResponse;
};

const buildReactionPayload = ({
  context,
  eventType,
  message,
  options,
  reactionType,
  user,
}: {
  context: WebSocketEventTemplateContext;
  eventType: 'reaction.new' | 'reaction.updated' | 'reaction.deleted';
  message: MessageResponse;
  options: WebSocketEventBuildOptions;
  reactionType: string;
  user: UserResponse;
}) => {
  const reaction = buildReaction({
    messageId: message.id,
    reactionType,
    reactionUserShape: options.reactionUserShape,
    user,
  });
  const payloadMessage = buildMessageWithReaction({
    enforceUnique: eventType === 'reaction.updated',
    message,
    reaction,
    removed: eventType === 'reaction.deleted',
  });

  return {
    ...buildBasePayload(context, eventType, user),
    message: payloadMessage,
    message_id: message.id,
    reaction,
  };
};

export const buildDefaultWebSocketEventPayload = ({
  context,
  eventType,
  options,
}: {
  context: WebSocketEventTemplateContext;
  eventType: SupportedWebSocketEventType;
  options: WebSocketEventBuildOptions;
}): WebSocketEventPayload => {
  const user = getEventActor(context, options.actorMode);
  const latestMessage =
    getLatestMessage(context) ??
    buildMessage({
      context,
      id: 'sampleapp-benchmark-message',
      text: 'Synthetic chat traffic',
      user,
    });
  const basePayload = buildBasePayload(context, eventType, user);

  switch (eventType) {
    case 'message.new': {
      const message = buildMessage({
        context,
        id: `sampleapp-benchmark-message-${Date.now()}`,
        text: 'Synthetic chat traffic',
        user,
      });

      return {
        ...basePayload,
        message,
        message_id: message.id,
      };
    }
    case 'notification.message_new': {
      const message = buildMessage({
        context,
        id: `sampleapp-benchmark-notification-message-${Date.now()}`,
        text: 'Synthetic notification traffic',
        user,
      });

      return {
        ...basePayload,
        message,
        message_id: message.id,
      };
    }
    case 'message.updated': {
      return {
        ...basePayload,
        message: {
          ...latestMessage,
          text: `${latestMessage.text || 'Synthetic chat traffic'} (updated)`,
          updated_at: nowNs(),
        } as MessageResponse,
        message_id: latestMessage.id,
      };
    }
    case 'message.deleted': {
      return {
        ...basePayload,
        message: {
          ...latestMessage,
          deleted_at: nowNs(),
          text: '',
          type: 'deleted',
          updated_at: nowNs(),
        } as MessageResponse,
        message_id: latestMessage.id,
      };
    }
    case 'reaction.new':
    case 'reaction.updated':
    case 'reaction.deleted':
      return buildReactionPayload({
        context,
        eventType,
        message: latestMessage,
        options,
        reactionType: reactionTypes[0],
        user,
      });
    case 'typing.start':
    case 'typing.stop':
      return basePayload;
    default:
      return basePayload;
  }
};

export const buildWebSocketEventDraft = (
  eventType: SupportedWebSocketEventType,
  context: WebSocketEventTemplateContext,
  options: WebSocketEventBuildOptions,
) => JSON.stringify(buildDefaultWebSocketEventPayload({ context, eventType, options }), null, 2);

export const buildInitialWebSocketEventDrafts = (
  context: WebSocketEventTemplateContext,
  options: WebSocketEventBuildOptions,
) =>
  supportedWebsocketEventTypes.reduce(
    (drafts, eventType) => {
      drafts[eventType] = buildWebSocketEventDraft(eventType, context, options);
      return drafts;
    },
    {} as Record<SupportedWebSocketEventType, string>,
  );

export const getNextReactionType = (state: { reactionTypeIndex: number }) => {
  const reactionType = reactionTypes[state.reactionTypeIndex % reactionTypes.length];
  state.reactionTypeIndex += 1;
  return reactionType;
};
