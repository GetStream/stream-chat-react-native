import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelContext, useTheme, useTranslationContext } from '../../contexts';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type AITypingIndicatorViewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  channel?: Channel<StreamChatGenerics>;
};

export const AITypingIndicatorView = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel: channelFromProps,
}: AITypingIndicatorViewProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { channel: channelFromContext } = useChannelContext<StreamChatGenerics>();
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
