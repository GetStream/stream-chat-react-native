import { useMemo } from 'react';
import { generateMarkdownText } from './markdown';
import { Markdown } from './markdown';
import type { MarkdownRules, MarkdownStyle } from './markdown';
import { Linking } from 'react-native';

import { useStableCallback } from './internal/hooks/useStableCallback.ts';

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
