import React from 'react';
import { StyleSheet, Text } from 'react-native';

import type { LatestMessagePreview } from './hooks/useLatestMessagePreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  bold: { fontWeight: '600' },
  message: {
    flexShrink: 1,
    fontSize: 12,
  },
});

export type ChannelPreviewMessageProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  latestMessagePreview: LatestMessagePreview<StreamChatClient>;
};

export const ChannelPreviewMessage = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewMessageProps<StreamChatClient>,
) => {
  const { latestMessagePreview } = props;

  const {
    theme: {
      channelPreview: { message },
      colors: { grey },
    },
  } = useTheme();

  return (
    <Text numberOfLines={1} style={[styles.message, { color: grey }, message]}>
      {latestMessagePreview.previews.map((preview, index) =>
        preview.text ? (
          <Text
            key={`${preview.text}_${index}`}
            style={[{ color: grey }, preview.bold ? styles.bold : {}, message]}
          >
            {preview.text}
          </Text>
        ) : null,
      )}
    </Text>
  );
};
