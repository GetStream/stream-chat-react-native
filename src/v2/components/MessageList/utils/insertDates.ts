import type { ChannelState } from 'stream-chat';

import type {
  MessagesContextValue,
  MessageWithDates,
} from '../../../contexts/messagesContext/MessagesContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type InlineDateSeparator<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  date: Message<At, Ch, Co, Ev, Me, Re, Us>['created_at'] | string;
  type: 'message.date';
};

export type InlineUnreadIndicator = {
  type: 'message.unreadIndicator';
};

export type InlineSeparator<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = InlineDateSeparator<At, Ch, Co, Ev, Me, Re, Us> | InlineUnreadIndicator;

export type MessageOrInlineSeparator<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> =
  | Message<At, Ch, Co, Ev, Me, Re, Us>
  | InlineSeparator<At, Ch, Co, Ev, Me, Re, Us>;

export type InsertDatesResponse<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>[];

export const isInlineDateSeparator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>,
): message is InlineDateSeparator<At, Ch, Co, Ev, Me, Re, Us> =>
  message.type === 'message.date';

export const isInlineUnreadIndicator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>,
): message is InlineUnreadIndicator =>
  message.type === 'message.unreadIndicator';

export const isInlineSeparator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>,
): message is InlineSeparator<At, Ch, Co, Ev, Me, Re, Us> =>
  isInlineDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(message) ||
  isInlineUnreadIndicator(message);

export type Message<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> =
  | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
  | MessageWithDates<At, Ch, Co, Me, Re, Us>;

export const insertDates = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  messages:
    | MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages']
    | ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['threadMessages'],
  lastRead?: Date,
  userID?: string,
) => {
  let unread = false;

  const newMessages: InsertDatesResponse<At, Ch, Co, Ev, Me, Re, Us> = [];
  if (messages.length === 0) {
    return newMessages;
  }

  for (const [i, message] of messages.entries()) {
    if (!unread) {
      unread = !!lastRead && lastRead.getTime() < message.created_at.getTime();
      // userId check makes sure New is not shown for current user messages
      if (unread && message && message.user?.id !== userID)
        newMessages.push({
          type: 'message.unreadIndicator',
        });
    }

    /**
     * If message read or deleted don't consider for date labels
     */
    if (message.type === 'message.read' || message.deleted_at) {
      newMessages.push(message);
      continue;
    }

    /**
     * Get the date of the current message and create
     * variable for previous date (day)
     */
    const messageDate = message.created_at.getDay();

    /**
     * If this is not the last entry in the messages array
     * set the previous message date (day) to the date of the next
     * message in the array
     */
    const prevMessageDate =
      i < messages.length - 1
        ? messages[i + 1].created_at.getDay()
        : messageDate;

    /**
     * Before the first message insert a date object
     */
    if (i === 0) {
      newMessages.push(
        {
          date: message.created_at,
          type: 'message.date',
        } as InlineDateSeparator<At, Ch, Co, Ev, Me, Re, Us>,
        message,
      );

      /**
       * If the date (day) has changed between two messages
       * insert a date object
       */
    } else if (messageDate !== prevMessageDate) {
      newMessages.push(message, {
        date: messages[i + 1].created_at,
        type: 'message.date',
      } as InlineDateSeparator<At, Ch, Co, Ev, Me, Re, Us>);

      /**
       * Otherwise just add the message
       */
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};
