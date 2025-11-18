import React, { useMemo } from 'react';
import { generateMarkdownText } from './markdown';
import { Markdown } from './markdown';
import type { MarkdownRules, MarkdownStyle } from './markdown';
import { Linking } from 'react-native';

import { useStableCallback } from './internal/hooks/useStableCallback';

// export const useStreamingMessage = ({
//   letterInterval = 0,
//   renderingLetterCount = 2,
//   text,
// }: UseStreamingMessageProps): { streamedMessageText: string } => {
//   const [streamedMessageText, setStreamedMessageText] = useState<string>(text);
//   const textCursor = useRef<number>(text.length);
//
//   useEffect(() => {
//     const textLength = text.length;
//     const interval = setInterval(() => {
//       if (!text || textCursor.current >= textLength) {
//         clearInterval(interval);
//       }
//       const newCursorValue = textCursor.current + renderingLetterCount;
//       const newText = text.substring(0, newCursorValue);
//       textCursor.current += newText.length - textCursor.current;
//       const codeBlockCounts = (newText.match(/```/g) || []).length;
//       const shouldOptimisticallyCloseCodeBlock =
//         codeBlockCounts > 0 && codeBlockCounts % 2 > 0;
//       setStreamedMessageText(
//         shouldOptimisticallyCloseCodeBlock ? newText + '```' : newText,
//       );
//     }, letterInterval);
//
//     return () => {
//       clearInterval(interval);
//     };
//   }, [letterInterval, renderingLetterCount, text]);
//
//   return { streamedMessageText };
// };

export const MarkdownRichText = ({
  text,
  paragraphNumberOfLines,
  rules,
  styles: markdownStyles,
  onLink: onLinkParam,
}: {
  text: string;
  paragraphNumberOfLines?: number;
  rules?: MarkdownRules;
  styles?: MarkdownStyle;
  onLink?: (url: string) => void;
}) => {
  const markdownText = useMemo(() => generateMarkdownText(text), [text]);

  // const { streamedMessageText } = useStreamingMessage({ text: markdownText });

  const onLink = useStableCallback((url: string) =>
    onLinkParam
      ? onLinkParam(url)
      : Linking.canOpenURL(url).then(
          (canOpenUrl) => canOpenUrl && Linking.openURL(url),
        ),
  );

  return (
    <Markdown
      rules={rules}
      styles={markdownStyles}
      onLink={onLink}
      paragraphNumberOfLines={paragraphNumberOfLines}
    >
      {markdownText}
    </Markdown>
  );
};
