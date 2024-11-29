import React from 'react';

import { Text, View } from 'react-native';

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
