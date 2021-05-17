import type { DateSeparators } from './getDateSeparators';

import type { GroupType } from '../hooks/useMessageList';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
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

export type GetGroupStylesParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  dateSeparators: DateSeparators;
  messages:
    | PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages']
    | ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['threadMessages'];
  hideDateSeparators?: boolean;
  maxTimeBetweenGroupedMessages?: number;
  noGroupByUser?: boolean;
  userId?: string;
};

export const getGroupStyles = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  params: GetGroupStylesParams<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    dateSeparators,
    hideDateSeparators,
    maxTimeBetweenGroupedMessages,
    messages,
    noGroupByUser,
    userId,
  } = params;
  const messageGroupStyles: { [key: string]: GroupType[] } = {};

  const messagesFilteredForNonUser = messages.filter(
    (message) => !message.deleted_at || userId === message.user?.id,
  );

  for (let i = 0; i < messagesFilteredForNonUser.length; i++) {
    const previousMessage = messagesFilteredForNonUser[i - 1] as
      | typeof messagesFilteredForNonUser[0]
      | undefined;
    const message = messagesFilteredForNonUser[i];
    const nextMessage = messagesFilteredForNonUser[i + 1] as
      | typeof messagesFilteredForNonUser[0]
      | undefined;
    const groupStyles: GroupType[] = [];

    const userId = message?.user?.id || null;

    const isTopMessage =
      !previousMessage ||
      previousMessage.type === 'system' ||
      userId !== previousMessage?.user?.id ||
      previousMessage.type === 'error' ||
      !!previousMessage.deleted_at ||
      (!hideDateSeparators && dateSeparators[message.id]) ||
      messageGroupStyles[previousMessage.id]?.includes('bottom');

    const isBottomMessage =
      !nextMessage ||
      nextMessage.type === 'system' ||
      userId !== nextMessage?.user?.id ||
      nextMessage.type === 'error' ||
      !!nextMessage.deleted_at ||
      (!hideDateSeparators && dateSeparators[nextMessage.id]) ||
      (maxTimeBetweenGroupedMessages !== undefined &&
        nextMessage.created_at.getTime() - message.created_at.getTime() >
          maxTimeBetweenGroupedMessages);

    /**
     * Add group styles key for top message
     */
    if (isTopMessage) {
      groupStyles.push('top');
    }

    /**
     * Add group styles key for bottom message
     */
    if (isBottomMessage) {
      /**
       * If the bottom message is also the top, or deleted, or an error,
       * add the key for single message instead of bottom
       */
      if (isTopMessage || message.deleted_at || message.type === 'error') {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('single');
      } else {
        groupStyles.push('bottom');
      }
    }

    /**
     * Add the key for all non top or bottom messages, if the message is
     * deleted or an error add the key for single otherwise middle
     */
    if (!isTopMessage && !isBottomMessage) {
      if (message.deleted_at || message.type === 'error') {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('single');
      } else {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('middle');
      }
    }

    /**
     * If noGroupByUser set add the key for single
     */
    if (noGroupByUser) {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
    }

    if (message.id) {
      messageGroupStyles[message.id] = groupStyles;
    }
  }

  return messageGroupStyles;
};
