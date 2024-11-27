import React, { useEffect, useRef, useState } from 'react';

import { MessageTextContainer, MessageTextContainerProps } from './MessageTextContainer';

import { useMessageContext } from '../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const StreamingMessageView = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageTextContainerProps<StreamChatGenerics>,
) => {
  const { message } = useMessageContext<StreamChatGenerics>();
  const { text } = message;
  const [streamedMessageText, setStreamedMessageText] = useState<string>(text || '');
  const textCursor = useRef<number>(text?.length || 0);

  useEffect(() => {
    if (!text || textCursor.current >= text.length) {
      return;
    }
    // TODO: make this configurable maybe
    const newCursorValue = textCursor.current + 1;
    const newBatch = text?.substring(textCursor.current, newCursorValue);
    setTimeout(() => {
      setStreamedMessageText((prevStreamedMessageText) => prevStreamedMessageText.concat(newBatch));
    }, 0);
    textCursor.current = newCursorValue;
  }, [streamedMessageText, text]);

  return <MessageTextContainer message={{ ...message, text: streamedMessageText }} {...props} />;
};

StreamingMessageView.displayName = 'MessageTextContainer{messageSimple{content}}';
