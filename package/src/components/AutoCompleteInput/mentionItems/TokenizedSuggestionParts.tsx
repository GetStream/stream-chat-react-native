import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import type { TokenizationPayload } from 'stream-chat';

export type TokenizedSuggestionPartsProps = {
  /**
   * Display name split into parts around the matched token. Parts equal to the token, ignoring
   * case, are rendered with `matchStyle`.
   */
  tokenizedDisplayName?: TokenizationPayload['tokenizedDisplayName'];
  /** Rendered when `tokenizedDisplayName` is absent or has no parts. */
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
