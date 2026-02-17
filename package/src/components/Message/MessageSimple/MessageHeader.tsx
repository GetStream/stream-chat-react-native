import React from 'react';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';

type MessageHeaderPropsWithContext = Pick<MessageContextValue, 'message'> &
  Pick<MessagesContextValue, 'MessagePinnedHeader'>;

const MessageHeaderWithContext = (props: MessageHeaderPropsWithContext) => {
  const { message, MessagePinnedHeader } = props;

  return <MessagePinnedHeader message={message} />;
};

const areEqual = (
  prevProps: MessageHeaderPropsWithContext,
  nextProps: MessageHeaderPropsWithContext,
) => {
  const { message: prevMessage } = prevProps;
  const { message: nextMessage } = nextProps;

  const messageEqual =
    prevMessage.id === nextMessage.id && prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageHeader = React.memo(
  MessageHeaderWithContext,
  areEqual,
) as typeof MessageHeaderWithContext;

export type MessageHeaderProps = Partial<Pick<MessageContextValue, 'message'>>;

export const MessageHeader = (props: MessageHeaderProps) => {
  const { message } = useMessageContext();
  const { MessagePinnedHeader } = useMessagesContext();

  return (
    <MemoizedMessageHeader message={message} MessagePinnedHeader={MessagePinnedHeader} {...props} />
  );
};
