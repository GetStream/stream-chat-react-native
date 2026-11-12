import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '../contexts';
import { primitives } from '../internal/tokens';

export type AISuggestionsProps = {
  /** Called with the suggestion the person picked, such as to send it. */
  onSelect: (suggestion: string) => void;
  /** Starters for a conversation, such as "What's on my calendar today?". */
  suggestions: string[];
};

/**
 * A row of starter chips for an empty conversation, scrolling sideways. Picking one hands its text
 * to `onSelect`.
 */
export const AISuggestions = ({ onSelect, suggestions }: AISuggestionsProps) => {
  const {
    theme: { suggestions: theme },
  } = useTheme();
  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, theme?.content]}
      horizontal
      keyboardShouldPersistTaps='handled'
      showsHorizontalScrollIndicator={false}
      style={[styles.container, theme?.container]}
      testID='ai-suggestions'
    >
      {suggestions.map((suggestion) => (
        <Pressable
          accessibilityRole='button'
          key={suggestion}
          onPress={() => onSelect(suggestion)}
          style={({ pressed }) => [
            styles.item,
            { backgroundColor: theme?.background, opacity: pressed ? 0.7 : 1 },
            theme?.item,
          ]}
        >
          <Text
            numberOfLines={2}
            style={[styles.itemText, { color: theme?.text }, theme?.itemText]}
          >
            {suggestion}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 0 },
  content: {
    gap: primitives.spacingXs,
    paddingHorizontal: primitives.spacingMd,
    paddingVertical: primitives.spacingXs,
  },
  item: {
    borderRadius: primitives.radiusXl,
    justifyContent: 'center',
    maxWidth: 160,
    padding: primitives.spacingMd,
  },
  itemText: {
    fontSize: primitives.typographyFontSizeSm,
    lineHeight: primitives.typographyLineHeightNormal,
  },
});
