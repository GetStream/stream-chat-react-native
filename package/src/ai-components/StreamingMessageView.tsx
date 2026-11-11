import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Linking } from 'react-native';

import { useStableCallback } from './internal/hooks/useStableCallback';
import { generateMarkdownText } from './markdown';
import { Markdown } from './markdown';
import type { MarkdownRules } from './markdown';

export type UseStreamingMessageProps = {
  text: string;
  /**
   * The milliseconds between steps, for a fixed pace. Without it and `renderingLetterCount`, the
   * text keeps up with what arrives: each new part is typed out within about 0.4 seconds.
   */
  letterInterval?: number;
  /** The letters typed each step, for a fixed pace. */
  renderingLetterCount?: number;
};

// How long text that arrives takes to type out, when no fixed pace is given.
const CATCH_UP_MS = 400;
// How often the text steps on when it keeps up with what arrives: about one frame.
const FRAME_MS = 16;

export const useStreamingMessage = ({
  letterInterval,
  renderingLetterCount,
  text,
}: UseStreamingMessageProps): {
  isWriting: boolean;
  /** Shows the whole text at once, such as when the person doesn't want to wait for it. */
  skipAnimation: () => void;
  streamedMessageText: string;
} => {
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
  const isFixedPace = letterInterval !== undefined || renderingLetterCount !== undefined;

  useEffect(() => {
    const textLength = text.length;
    if (!text.startsWith(typedToward.current)) textCursor.current = textLength;
    typedToward.current = text;
    const step = isFixedPace
      ? (renderingLetterCount ?? 2)
      : Math.max(1, Math.ceil(((textLength - textCursor.current) * FRAME_MS) / CATCH_UP_MS));
    const interval = setInterval(
      () => {
        if (!text || textCursor.current >= textLength) {
          clearInterval(interval);
        }
        const newCursorValue = textCursor.current + step;
        const newText = text.substring(0, newCursorValue);
        textCursor.current += newText.length - textCursor.current;
        const codeBlockCounts = (newText.match(/```/g) || []).length;
        const shouldOptimisticallyCloseCodeBlock = codeBlockCounts > 0 && codeBlockCounts % 2 > 0;
        setStreamedMessageText(shouldOptimisticallyCloseCodeBlock ? newText + '```' : newText);
        setTypedLength(textCursor.current);
      },
      isFixedPace ? (letterInterval ?? 0) : FRAME_MS,
    );

    return () => {
      clearInterval(interval);
    };
  }, [isFixedPace, letterInterval, renderingLetterCount, text]);

  const skipAnimation = useStableCallback(() => {
    textCursor.current = text.length;
    setStreamedMessageText(text);
    setTypedLength(text.length);
  });

  return { isWriting: typedLength < text.length, skipAnimation, streamedMessageText };
};

/** What a `StreamingMessageView`'s ref offers. */
export type StreamingMessageViewRef = {
  /** Shows the whole text at once, such as when the person doesn't want to wait for it. */
  skipAnimation: () => void;
};

export type StreamingMessageViewProps = {
  text: string;
  paragraphNumberOfLines?: number;
  rules?: MarkdownRules;
  onLink?: (url: string) => void;
  /**
   * The milliseconds between steps, for a fixed pace. Without it and `renderingLetterCount`, the
   * text keeps up with what arrives: each new part is typed out within about 0.4 seconds.
   */
  letterInterval?: number;
  /** Called when the text starts or stops being typed out, such as to show what follows it once it is. */
  onWritingChange?: (isWriting: boolean) => void;
  /** The letters typed each step, for a fixed pace. */
  renderingLetterCount?: number;
};

export const StreamingMessageView = forwardRef<StreamingMessageViewRef, StreamingMessageViewProps>(
  (
    {
      text,
      paragraphNumberOfLines,
      rules,
      onLink: onLinkParam,
      letterInterval,
      onWritingChange,
      renderingLetterCount,
    },
    ref,
  ) => {
    const markdownText = useMemo(() => generateMarkdownText(text), [text]);

    const { isWriting, skipAnimation, streamedMessageText } = useStreamingMessage({
      text: markdownText ?? '',
      letterInterval,
      renderingLetterCount,
    });
    useImperativeHandle(ref, () => ({ skipAnimation }), [skipAnimation]);
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
  },
);

StreamingMessageView.displayName = 'StreamingMessageView';
