import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';

import { MessageStatusTypes } from '../../../utils/utils';

export type UseMessageDataProps = Partial<
  Pick<MessageContextValue, 'groupStyles' | 'isMyMessage' | 'isVeryLastMessage' | 'message'>
>;

export const useMessageData = ({
  groupStyles: propGroupStyles,
  isMyMessage: propIsMyMessage,
  isVeryLastMessage: propIsVeryLastMessage,
  message: propMessage,
}: UseMessageDataProps) => {
  const {
    groupStyles: contextGroupStyles,
    isMyMessage: contextIsMyMessage,
    isVeryLastMessage: contextIsVeryLastMessage,
    message: contextMessage,
  } = useMessageContext();

  const groupStyles = propGroupStyles || contextGroupStyles;
  const isMyMessage = propIsMyMessage || contextIsMyMessage;
  const message = propMessage || contextMessage;

  const isVeryLastMessage = propIsVeryLastMessage ?? contextIsVeryLastMessage ?? false;

  const messageGroupedSingle = groupStyles.includes('single');
  const messageGroupedBottom = groupStyles.includes('bottom');
  const messageGroupedTop = groupStyles.includes('top');
  const messageGroupedMiddle = groupStyles.includes('middle');
  const messageGroupedSingleOrBottom = messageGroupedSingle || messageGroupedBottom;

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
    messageGroupedSingle,
    messageGroupedBottom,
    messageGroupedTop,
    messageGroupedSingleOrBottom,
    messageGroupedMiddle,
  };
};
