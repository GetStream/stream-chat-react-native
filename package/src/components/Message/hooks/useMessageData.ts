import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';

import { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageStatusTypes } from '../../../utils/utils';

export type UseMessageDataProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessageContextValue<StreamChatGenerics>,
    'channel' | 'groupStyles' | 'isMyMessage' | 'message'
  >
>;

export const useMessageData = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel: propChannel,
  groupStyles: propGroupStyles,
  isMyMessage: propIsMyMessage,
  message: propMessage,
}: UseMessageDataProps<StreamChatGenerics>) => {
  const {
    channel: contextChannel,
    groupStyles: contextGroupStyles,
    isMyMessage: contextIsMyMessage,
    message: contextMessage,
  } = useMessageContext();

  const channel = propChannel || contextChannel;
  const groupStyles = propGroupStyles || contextGroupStyles;
  const isMyMessage = propIsMyMessage || contextIsMyMessage;
  const message = propMessage || contextMessage;

  const isVeryLastMessage =
    channel?.state.messages[channel?.state.messages.length - 1]?.id === message.id;

  const messageGroupedSingleOrBottom =
    groupStyles.includes('single') || groupStyles.includes('bottom');

  const isMessageErrorType =
    message.type === 'error' || message.status === MessageStatusTypes.FAILED;
  const isMessageTypeDeleted = message.type === 'deleted';
  const isMessageReceivedOrErrorType = !isMyMessage || isMessageErrorType;

  const hasThreadReplies = !!message?.reply_count;

  return {
    hasThreadReplies,
    isMessageErrorType,
    isMessageReceivedOrErrorType,
    isMessageTypeDeleted,
    isVeryLastMessage,
    messageGroupedSingleOrBottom,
  };
};
