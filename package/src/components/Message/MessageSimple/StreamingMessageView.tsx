import React from 'react';

import { MessageTextContainer, MessageTextContainerProps } from './MessageTextContainer';

import { useMessageContext } from '../../../contexts';

import { useStreamingMessage } from '../hooks/useStreamingMessage';

export type StreamingMessageViewProps = Pick<MessageTextContainerProps, 'message'> & {
  letterInterval?: number;
  renderingLetterCount?: number;
};

export const StreamingMessageView = (props: StreamingMessageViewProps) => {
  const { letterInterval, message: messageFromProps, renderingLetterCount } = props;
  const { message: messageFromContext } = useMessageContext();
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
