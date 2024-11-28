import React from 'react';

import { Text, View } from 'react-native';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelContext, useTheme } from '../../contexts';
import type { DefaultStreamChatGenerics } from '../../types/types';

export const AITypingIndicatorView = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel: channelFromProps,
}: {
  channel: Channel<StreamChatGenerics>;
}) => {
  const { channel: channelFromContext } = useChannelContext();
  const channel = channelFromProps || channelFromContext;
  const { aiState } = useAIState(channel);
  // TODO: Translations
  const allowedStates = {
    [AIStates.Thinking]: 'Thinking...',
    [AIStates.Generating]: 'Generating...',
  };

  const {
    theme: {
      colors: { black, grey_gainsboro },
    },
  } = useTheme();

  return aiState in allowedStates ? (
    <View style={{ backgroundColor: grey_gainsboro, paddingHorizontal: 16, paddingVertical: 18 }}>
      <Text style={{ color: black }}>{allowedStates[aiState]}</Text>
    </View>
  ) : null;
};

AITypingIndicatorView.displayName = 'AITypingIndicatorView{messageSimple{content}}';
