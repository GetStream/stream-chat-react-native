import { type AIConversationStatus, isAIConversationAnswering } from './types';

import type { AIMessageRating, AIReplyActionsProps } from '../../message/AIReplyActions';
import type { AIMessage } from '../types';

type Offerer<Message extends AIMessage> = {
  actions: { edit: boolean; rate: boolean; regenerate: boolean };
  edit: (message: Message) => void;
  rate: (reply: Message, rating: AIMessageRating | null) => void;
  regenerate: (reply: Message) => void;
};

// What the person can do with a finished reply: rate it, and write it again while it is the
// latest and the agent isn't answering.
export const replyActionsOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  {
    ratings,
    status,
  }: { ratings: Readonly<Record<string, AIMessageRating>>; status: AIConversationStatus },
  reply: Message,
  isLatestReply: boolean,
): Omit<AIReplyActionsProps, 'text'> => ({
  onRate: offerer.actions.rate ? (rating) => offerer.rate(reply, rating) : undefined,
  onRegenerate:
    offerer.actions.regenerate && isLatestReply && !isAIConversationAnswering(status)
      ? () => offerer.regenerate(reply)
      : undefined,
  rating: ratings[reply.id] ?? null,
});

/** The id of the person's latest message, the one they can edit. */
export const latestUserMessageIdOf = (messages: readonly AIMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') return messages[index].id;
  }
  return undefined;
};

// Edits a message of the person's, when it is their latest and the agent isn't answering.
export const editActionOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  {
    latestUserMessageId,
    status,
  }: { latestUserMessageId: string | undefined; status: AIConversationStatus },
  message: Message,
): (() => void) | undefined => {
  if (!offerer.actions.edit || message.role !== 'user' || isAIConversationAnswering(status)) {
    return undefined;
  }
  return latestUserMessageId === message.id ? () => offerer.edit(message) : undefined;
};
