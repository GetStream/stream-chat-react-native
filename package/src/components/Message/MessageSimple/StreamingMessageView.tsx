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
  const [streamedMessageText, setStreamedMessageText] = useState<string>(text);
  const textCursor = useRef<number>(text.length);

  useEffect(() => {
    const textLength = text.length;
    const interval = setInterval(() => {
      if (!text || textCursor.current >= textLength) {
        clearInterval(interval);
      }
      // TODO: make this configurable maybe
      const newCursorValue = textCursor.current + 2;
      const newText = text.substring(0, newCursorValue);
      textCursor.current += newText.length - textCursor.current;
      setStreamedMessageText(newText);
    }, 0);

    return () => {
      clearInterval(interval);
    };
  }, [text]);

  return <MessageTextContainer message={{ ...message, text: streamedMessageText }} {...props} />;
};

StreamingMessageView.displayName = 'StreamingMessageView{messageSimple{content}}';
