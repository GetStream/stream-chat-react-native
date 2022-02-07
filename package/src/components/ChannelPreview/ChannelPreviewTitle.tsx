import React from 'react';
import { StyleSheet, Text } from 'react-native';

import type { ExtendableGenerics } from 'stream-chat';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700' },
});

export type ChannelPreviewTitleProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelPreviewProps<StreamChatClient>, 'channel'> & {
  displayName: string;
};

export const ChannelPreviewTitle = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewTitleProps<StreamChatClient>,
) => {
  const { displayName } = props;
  const {
    theme: {
      channelPreview: { title },
      colors: { black },
    },
  } = useTheme();

  return (
    <Text numberOfLines={1} style={[styles.title, { color: black }, title]}>
      {displayName}
    </Text>
  );
};
