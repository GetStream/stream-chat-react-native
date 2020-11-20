import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTypingString } from './hooks/useTypingString';

import { LoadingDots } from '../Indicators/LoadingDots';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FCFCFCE6',
    flexDirection: 'row',
    height: 24,
    justifyContent: 'flex-start',
  },
  loadingDots: {
    marginLeft: 8,
  },
  typingText: {
    color: '#7A7A7A',
    marginLeft: 8,
  },
});

export const TypingIndicator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>() => {
  const {
    theme: {
      typingIndicator: {
        container,
        text: { color, fontSize, ...text },
      },
    },
  } = useTheme();
  const typingString = useTypingString<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <View style={[styles.container, container]} testID='typing-indicator'>
      <LoadingDots style={styles.loadingDots} />
      <Text style={[styles.typingText, { color, fontSize }, text]}>
        {typingString}
      </Text>
    </View>
  );
};

TypingIndicator.displayName = 'TypingIndicator{typingIndicator}';
