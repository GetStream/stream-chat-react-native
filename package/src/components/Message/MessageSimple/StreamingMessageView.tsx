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
  const { text = '' } = message;
  const textLength = text.length;
  const [streamedMessageText, setStreamedMessageText] = useState<string>(text);
  const textCursor = useRef<number>(textLength);

  useEffect(() => {
    if (!text || textCursor.current >= textLength) {
      return;
    }
    // TODO: make this configurable maybe
    const newCursorValue = textCursor.current + 1;
    const newBatch = text?.substring(textCursor.current, newCursorValue);
    textCursor.current += newBatch.length;
    setTimeout(() => {
      setStreamedMessageText((prevStreamedMessageText) => prevStreamedMessageText.concat(newBatch));
    }, 0);
  }, [streamedMessageText, text, textLength]);

  return <MessageTextContainer message={{ ...message, text: streamedMessageText }} {...props} />;
};

StreamingMessageView.displayName = 'MessageTextContainer{messageSimple{content}}';
