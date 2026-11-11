import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Linking } from 'react-native';

import { useStableCallback } from './internal/hooks/useStableCallback';
import { generateMarkdownText } from './markdown';
import { Markdown } from './markdown';
import type { MarkdownRules } from './markdown';

export type UseStreamingMessageProps = {
  text: string;
  letterInterval?: number;
  renderingLetterCount?: number;
};

export const useStreamingMessage = ({
  letterInterval = 0,
  renderingLetterCount = 2,
  text,
}: UseStreamingMessageProps): { isWriting: boolean; streamedMessageText: string } => {
  const [streamedMessageText, setStreamedMessageText] = useState<string>(text);
  const textCursor = useRef<number>(text.length);
  // How much of the text is typed out, to say whether it still is.
  const [typedLength, setTypedLength] = useState(text.length);

  // Only text added to the end is typed out. Another text, such as another message's when a list
  // reuses this view, shows at once, from this render rather than after the old text's.
  const [lastText, setLastText] = useState(text);
  if (text !== lastText) {
    setLastText(text);
    if (!text.startsWith(lastText)) {
      setStreamedMessageText(text);
      setTypedLength(text.length);
    }
  }
  const typedToward = useRef(text);

  useEffect(() => {
    const textLength = text.length;
    if (!text.startsWith(typedToward.current)) textCursor.current = textLength;
    typedToward.current = text;
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
      setTypedLength(textCursor.current);
    }, letterInterval);

    return () => {
      clearInterval(interval);
    };
  }, [letterInterval, renderingLetterCount, text]);

  return { isWriting: typedLength < text.length, streamedMessageText };
};

export const StreamingMessageView = ({
  text,
  paragraphNumberOfLines,
  rules,
  onLink: onLinkParam,
  letterInterval,
  onWritingChange,
  renderingLetterCount,
}: {
  text: string;
  paragraphNumberOfLines?: number;
  rules?: MarkdownRules;
  onLink?: (url: string) => void;
  letterInterval?: number;
  /** Called when the text starts or stops being typed out, such as to show what follows it once it is. */
  onWritingChange?: (isWriting: boolean) => void;
  renderingLetterCount?: number;
}) => {
  const markdownText = useMemo(() => generateMarkdownText(text), [text]);

  const { isWriting, streamedMessageText } = useStreamingMessage({
    text: markdownText ?? '',
    letterInterval,
    renderingLetterCount,
  });
  const reportWriting = useStableCallback((writing: boolean) => onWritingChange?.(writing));
  useEffect(() => {
    reportWriting(isWriting);
  }, [isWriting, reportWriting]);

  const onLink = useStableCallback((url: string): void | Promise<void> =>
    onLinkParam
      ? onLinkParam(url)
      : Linking.canOpenURL(url).then((canOpenUrl) => {
          if (canOpenUrl) {
            return Linking.openURL(url);
          }
          return undefined;
        }),
  );

  return (
    <Markdown rules={rules} onLink={onLink} paragraphNumberOfLines={paragraphNumberOfLines}>
      {streamedMessageText}
    </Markdown>
  );
};
