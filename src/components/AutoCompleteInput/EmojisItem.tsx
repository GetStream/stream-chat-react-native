import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { Emoji } from '../../emoji-data/compiled';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 14,
  },
});

export type EmojisItemProps = {
  /**
   * A EmojiResponse of suggested EmojiTypes with these properties
   *
   * - name: Name of emoji
   * - unicode: Emoji unicode value
   */
  item: Emoji;
};

export const EmojisItem: React.FC<EmojisItemProps> = ({
  item: { name, unicode },
}) => {
  const {
    theme: {
      colors: { black },
      messageInput: {
        suggestions: {
          emoji: { container, text },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Text
        style={[styles.text, { color: black }, text]}
        testID='emojis-item-unicode'
      >
        {unicode}
      </Text>
      <Text
        style={[styles.text, { color: black }, text]}
        testID='emojis-item-name'
      >
        {` ${name}`}
      </Text>
    </View>
  );
};

EmojisItem.displayName = 'EmojisItem{messageInput{suggestions{emoji}}}';
