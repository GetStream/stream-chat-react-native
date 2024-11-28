import React, { useEffect, useRef, useState } from 'react';

import { MessageTextContainer, MessageTextContainerProps } from './MessageTextContainer';

import { useMessageContext } from '../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../types/types';

const DEFAULT_LETTER_INTERVAL = 0;
const DEFAULT_RENDERING_LETTER_COUNT = 2;

export type StreamingMessageViewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = MessageTextContainerProps<StreamChatGenerics> & {
  letterInterval?: number;
  renderingLetterCount?: number;
};

export const StreamingMessageView = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: StreamingMessageViewProps<StreamChatGenerics>,
) => {
  const {
    letterInterval = DEFAULT_LETTER_INTERVAL,
    renderingLetterCount = DEFAULT_RENDERING_LETTER_COUNT,
    ...restProps
  } = props;
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
      const newCursorValue = textCursor.current + renderingLetterCount;
      const newText = text.substring(0, newCursorValue);
      textCursor.current += newText.length - textCursor.current;
      setStreamedMessageText(newText);
    }, letterInterval);

    return () => {
      clearInterval(interval);
    };
  }, [text]);

  return (
    <MessageTextContainer message={{ ...message, text: streamedMessageText }} {...restProps} />
  );
};

StreamingMessageView.displayName = 'StreamingMessageView{messageSimple{content}}';
