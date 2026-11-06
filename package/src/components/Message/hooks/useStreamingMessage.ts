import { useEffect, useRef, useState } from 'react';

import { StreamingMessageViewProps } from '../MessageItemView/StreamingMessageView';

export type UseStreamingMessageProps = Pick<
  StreamingMessageViewProps,
  'letterInterval' | 'renderingLetterCount'
> & { text: string };

const DEFAULT_LETTER_INTERVAL = 0;
const DEFAULT_RENDERING_LETTER_COUNT = 2;

/**
 * Reveals `text` in a typewriter fashion. It starts from the full initial text, so only text added
 * later is animated. An unclosed code fence is closed while streaming.
 *
 * @param params.letterInterval Delay between typing steps in milliseconds. Defaults to 0.
 * @param params.renderingLetterCount Number of letters revealed per step. Defaults to 2.
 * @param params.text The text to reveal.
 * @returns `streamedMessageText`, the part of `text` revealed so far.
 */
export const useStreamingMessage = ({
  letterInterval = DEFAULT_LETTER_INTERVAL,
  renderingLetterCount = DEFAULT_RENDERING_LETTER_COUNT,
  text,
}: UseStreamingMessageProps): { streamedMessageText: string } => {
  const [streamedMessageText, setStreamedMessageText] = useState<string>(text);
  const textCursor = useRef<number>(text.length);

  useEffect(() => {
    const textLength = text.length;
    const interval = setInterval(() => {
      if (!text || textCursor.current >= textLength) {
        clearInterval(interval);
      }
      const newCursorValue = textCursor.current + renderingLetterCount;
      const newText = text.substring(0, newCursorValue);
      textCursor.current += newText.length - textCursor.current;
      const codeBlockCounts = (newText.match(/```/g) || []).length;
      const shouldOptimisticallyCloseCodeBlock = codeBlockCounts > 0 && codeBlockCounts % 2 > 0;
      setStreamedMessageText(shouldOptimisticallyCloseCodeBlock ? newText + '```' : newText);
    }, letterInterval);

    return () => {
      clearInterval(interval);
    };
  }, [letterInterval, renderingLetterCount, text]);

  return { streamedMessageText };
};
