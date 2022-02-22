import React from 'react';
import { StyleSheet, Text } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700' },
});

export type ChannelPreviewTitleProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelPreviewProps<StreamChatGenerics>, 'channel'> & {
  displayName: string;
};

export const ChannelPreviewTitle = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewTitleProps<StreamChatGenerics>,
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
