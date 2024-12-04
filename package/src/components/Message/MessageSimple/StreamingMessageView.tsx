import React from 'react';

import { MessageTextContainer, MessageTextContainerProps } from './MessageTextContainer';

import { useMessageContext } from '../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { useStreamingMessage } from '../hooks/useStreamingMessage';

export type StreamingMessageViewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageTextContainerProps<StreamChatGenerics>, 'message'> & {
  letterInterval?: number;
  renderingLetterCount?: number;
};

export const StreamingMessageView = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: StreamingMessageViewProps<StreamChatGenerics>,
) => {
  const { letterInterval, message: messageFromProps, renderingLetterCount } = props;
  const { message: messageFromContext } = useMessageContext<StreamChatGenerics>();
  const message = messageFromProps || messageFromContext;
  const { text = '' } = message;
  const { streamedMessageText } = useStreamingMessage({
    letterInterval,
    renderingLetterCount,
    text,
  });

  return <MessageTextContainer message={{ ...message, text: streamedMessageText }} />;
};

StreamingMessageView.displayName = 'StreamingMessageView{messageSimple{content}}';
