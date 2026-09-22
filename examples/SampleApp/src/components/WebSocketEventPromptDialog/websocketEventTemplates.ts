import { nowNs } from 'stream-chat';
import type {
  Channel,
  ChannelResponse,
  CustomEventData,
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
    updated_at: user?.updated_at ?? nowNs(),
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

const createChannelData = (channel: Channel): ChannelResponse => {
  const data = (channel.data ?? {}) as Partial<ChannelResponse>;
  const cid = channel.cid || data.cid || `${channel.type}:${channel.id || fallbackChannelId}`;
  const [cidType = channel.type || 'messaging', cidId = channel.id || fallbackChannelId] =
    cid.split(':');
  const timestamp = nowNs();

  return {
    ...data,
    cid,
    // `created_at` / `updated_at` / `custom` are required on `ChannelResponse` but are not
    // guaranteed on a live `channel.data`, so fall back rather than asserting they are there.
    created_at: data.created_at ?? timestamp,
    custom: data.custom ?? {},
    disabled: data.disabled ?? false,
    frozen: data.frozen ?? false,
    id: channel.id || data.id || cidId,
    member_count:
      data.member_count ?? (Object.keys(channel.state?.members ?? {}).length || undefined),
    type: channel.type || data.type || cidType,
    updated_at: data.updated_at ?? timestamp,
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
): MessageResponse => {
  const createdAt = message.created_at ?? nowNs();
  const updatedAt = message.updated_at ?? createdAt;
  const user = message.user ? normalizeUser(message.user, message.user.id) : context.currentUser;

  return {
    ...message,
    attachments: message.attachments ?? [],
    cid: message.cid || context.cid,
    created_at: createdAt,
    custom: message.custom ?? {},
    deleted_reply_count: message.deleted_reply_count ?? 0,
    html: message.html ?? '',
    id: message.id,
    latest_reactions: message.latest_reactions ?? [],
    mentioned_channel: message.mentioned_channel ?? false,
    mentioned_here: message.mentioned_here ?? false,
    mentioned_users: message.mentioned_users ?? [],
    own_reactions: message.own_reactions ?? [],
    pinned: message.pinned ?? false,
    reaction_counts: message.reaction_counts ?? {},
    reaction_groups: message.reaction_groups ?? {},
    reaction_scores: message.reaction_scores ?? {},
    reply_count: message.reply_count ?? 0,
    restricted_visibility: message.restricted_visibility ?? [],
    shadowed: message.shadowed ?? false,
    silent: message.silent ?? false,
    text: message.text ?? '',
    type: message.type ?? 'regular',
    updated_at: updatedAt,
    user,
  };
};

export const getLatestMessage = (context: WebSocketEventTemplateContext) => {
  const messages = getChannelMessages(context.channel);

  return messages.length ? toMessageResponse(messages[messages.length - 1], context) : undefined;
};

/**
 * The fields every supported event shares.
 *
 * `type` is deliberately absent: it is the union's discriminant, so each builder supplies it as a
 * literal. Spreading a base that carries `type: SupportedWebSocketEventType` would widen the
 * discriminant and match no single member.
 */
export type WebSocketEventBase = {
  channel: ChannelResponse;
  channel_id: string;
  channel_type: string;
  cid: string;
  created_at: number;
  custom: CustomEventData;
  user: UserResponse;
  user_id: string;
};

export const buildEventBase = (
  context: WebSocketEventTemplateContext,
  user: UserResponse,
): WebSocketEventBase => ({
  channel: context.channelData,
  channel_id: context.channelData.id,
  channel_type: context.channelData.type,
  cid: context.cid,
  created_at: nowNs(),
  custom: {},
  user,
  user_id: user.id,
});

/** `message.new` / `notification.message_new` both require it, and the live value is the honest one. */
export const getWatcherCount = (context: WebSocketEventTemplateContext) =>
  context.channel.state?.watcher_count ?? 0;

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
}): MessageResponse => {
  const timestamp = nowNs();

  return {
    attachments: [],
    cid: context.cid,
    created_at: timestamp,
    custom: {},
    deleted_reply_count: 0,
    html: `<p>${text}</p>`,
    id,
    latest_reactions: [],
    mentioned_channel: false,
    mentioned_here: false,
    mentioned_users: [],
    own_reactions: [],
    pinned: false,
    reaction_counts: {},
    reaction_groups: {},
    reaction_scores: {},
    reply_count: 0,
    restricted_visibility: [],
    shadowed: false,
    silent: false,
    text,
    type,
    updated_at: timestamp,
    user,
  };
};

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
}): ReactionResponse => {
  const timestamp = nowNs();

  return {
    created_at: timestamp,
    custom: {},
    message_id: messageId,
    score: 1,
    type: reactionType,
    updated_at: timestamp,
    user_id: user.id,
    // `userIdOnly` reproduces the wire shape where the server sends `user_id` and no nested `user`,
    // so the key has to be genuinely absent rather than present-and-undefined — telling those two
    // apart is the entire point of the option. `ReactionResponse` types `user` as required, so the
    // omission is asserted here. This is the one place the simulator knowingly emits a shape the
    // v10 types do not model; every other builder now satisfies them outright.
    ...(reactionUserShape === 'userIdOnly' ? {} : { user }),
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
}): MessageResponse => {
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
      first_reaction_at: currentGroup?.first_reaction_at ?? timestamp,
      last_reaction_at: timestamp,
      latest_reactions_by: currentGroup?.latest_reactions_by ?? [],
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
  };
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
}): WebSocketEventPayload => {
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

  const base = {
    ...buildEventBase(context, user),
    message: payloadMessage,
    message_id: message.id,
    reaction,
  };

  // One branch per type: `eventType` is a three-way union here, and a union-valued discriminant is
  // not assignable to any single member of `Event`.
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
  const basePayload = buildEventBase(context, user);

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
        type: 'message.new',
        watcher_count: getWatcherCount(context),
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
        type: 'notification.message_new',
        watcher_count: getWatcherCount(context),
      };
    }
    case 'message.updated': {
      return {
        ...basePayload,
        message: {
          ...latestMessage,
          text: `${latestMessage.text || 'Synthetic chat traffic'} (updated)`,
          updated_at: nowNs(),
        },
        message_id: latestMessage.id,
        type: 'message.updated',
      };
    }
    case 'message.deleted': {
      return {
        ...basePayload,
        // `hard_delete` is required on this event; the simulator models the soft-delete path, which
        // is what leaves a tombstone row in the list for the benchmark to re-render.
        hard_delete: false,
        message: {
          ...latestMessage,
          deleted_at: nowNs(),
          text: '',
          type: 'deleted',
          updated_at: nowNs(),
        },
        message_id: latestMessage.id,
        type: 'message.deleted',
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
      return { ...basePayload, type: 'typing.start' };
    case 'typing.stop':
      return { ...basePayload, type: 'typing.stop' };
    default: {
      const unsupported: never = eventType;
      throw new Error(`WebSocket simulator: unsupported event '${unsupported}'.`);
    }
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
