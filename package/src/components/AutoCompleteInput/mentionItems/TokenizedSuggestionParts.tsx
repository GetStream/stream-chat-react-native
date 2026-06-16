import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import type { TokenizationPayload } from 'stream-chat';

export type TokenizedSuggestionPartsProps = {
  /**
   * Token + parts payload produced by the stream-chat-js text composer search
   * source. When the consumer matches against a display name the source splits
   * the name into substrings around the matched token; we render each part and
   * bold whichever part case-insensitively equals the token.
   */
  tokenizedDisplayName?: TokenizationPayload['tokenizedDisplayName'];
  /**
   * Fallback string rendered when the tokenized payload is absent (or empty).
   */
  fallback?: string;
  style?: StyleProp<TextStyle>;
  matchStyle?: StyleProp<TextStyle>;
  testID?: string;
};

const partMatchesToken = (part: string, token: string) =>
  token.length > 0 && part.toLowerCase() === token.toLowerCase();

export const TokenizedSuggestionParts = ({
  fallback,
  matchStyle,
  style,
  tokenizedDisplayName,
  testID,
}: TokenizedSuggestionPartsProps) => {
  if (!tokenizedDisplayName || tokenizedDisplayName.parts.length === 0) {
    if (!fallback) return null;
    return (
      <Text style={style} testID={testID}>
        {fallback}
      </Text>
    );
  }

  const { parts, token } = tokenizedDisplayName;
  return (
    <Text style={style} testID={testID}>
      {parts.map((part, index) =>
        partMatchesToken(part, token) ? (
          <Text key={index} style={matchStyle}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
};
