import React from 'react';

import { Text, View } from 'react-native';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useChannelContext } from '../../contexts';
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

  // TODO: Make it not ugly.
  return aiState in allowedStates ? (
    <View style={{ paddingHorizontal: 16, paddingVertical: 18 }}>
      <Text>{allowedStates[aiState]}</Text>
    </View>
  ) : null;
};

AITypingIndicatorView.displayName = 'AITypingIndicatorView{messageSimple{content}}';
