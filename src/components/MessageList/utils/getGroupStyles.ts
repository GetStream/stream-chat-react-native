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
  messages:
    | PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages']
    | ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['threadMessages'];
  noGroupByUser?: boolean;
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
  const { messages, noGroupByUser } = params;
  const messageGroupStyles: { [key: string]: GroupType[] } = {};

  for (let i = 0; i < messages.length; i++) {
    const previousMessage = messages[i - 1];
    const message = messages[i];
    const nextMessage = messages[i + 1];
    const groupStyles: GroupType[] = [];

    /**
     * Skip event and date messages
     */
    if (message.type === 'channel.event') {
      continue;
    }

    const userId = message?.user?.id || null;

    const isTopMessage =
      !previousMessage ||
      previousMessage.type === 'system' ||
      previousMessage.type === 'channel.event' ||
      (previousMessage.attachments &&
        previousMessage.attachments.length !== 0) ||
      userId !== previousMessage?.user?.id ||
      previousMessage.type === 'error' ||
      !!previousMessage.deleted_at;

    const isBottomMessage =
      !nextMessage ||
      nextMessage.type === 'system' ||
      nextMessage.type === 'channel.event' ||
      (nextMessage.attachments && nextMessage.attachments.length !== 0) ||
      userId !== nextMessage?.user?.id ||
      nextMessage.type === 'error' ||
      !!nextMessage.deleted_at;

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
     * If there are attachments add the key for single
     */
    if (message.attachments && message.attachments.length !== 0) {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
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
