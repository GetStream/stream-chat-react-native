import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelContext, useTheme, useTranslationContext } from '../../contexts';

export type AITypingIndicatorViewProps = {
  channel?: Channel;
};

export const AITypingIndicatorView = ({
  channel: channelFromProps,
}: AITypingIndicatorViewProps) => {
  const { t } = useTranslationContext();
  const { channel: channelFromContext } = useChannelContext();
  const channel = channelFromProps || channelFromContext;
  const { aiState } = useAIState(channel);
  const allowedStates = {
    [AIStates.Thinking]: t('Thinking...'),
    [AIStates.Generating]: t('Generating...'),
  };

  const {
    theme: {
      aiTypingIndicatorView: { container, text },
      colors: { black, grey_gainsboro },
    },
  } = useTheme();

  return aiState in allowedStates ? (
    <View style={[styles.container, { backgroundColor: grey_gainsboro }, container]}>
      <Text style={[{ color: black }, text]}>{allowedStates[aiState]}</Text>
    </View>
  ) : null;
};

AITypingIndicatorView.displayName = 'AITypingIndicatorView{messageSimple{content}}';

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 18 },
});
