import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ExtendableGenerics } from 'stream-chat';

import { useTypingString } from './hooks/useTypingString';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { LoadingDots } from '../Indicators/LoadingDots';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 24,
    justifyContent: 'flex-start',
  },
  loadingDots: {
    marginLeft: 8,
  },
  typingText: {
    marginLeft: 8,
  },
});

export const TypingIndicator = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>() => {
  const {
    theme: {
      colors: { grey, white_snow },
      typingIndicator: { container, text },
    },
  } = useTheme();
  const typingString = useTypingString<StreamChatClient>();

  return (
    <View
      style={[styles.container, { backgroundColor: `${white_snow}E6` }, container]}
      testID='typing-indicator'
    >
      <LoadingDots style={styles.loadingDots} />
      <Text style={[styles.typingText, { color: grey }, text]}>{typingString}</Text>
    </View>
  );
};

TypingIndicator.displayName = 'TypingIndicator{typingIndicator}';
