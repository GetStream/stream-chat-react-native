import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { LatestMessagePreview } from './hooks/useLatestMessagePreview';

import { useTheme } from '../../contexts';
import { MessagePreview } from '../MessagePreview/MessagePreview';

export type ChannelPreviewMessageProps = {
  /**
   * Latest message on a channel, formatted for preview.
   */
  latestMessagePreview: LatestMessagePreview;
};

export const ChannelPreviewMessage = (props: ChannelPreviewMessageProps) => {
  const { latestMessagePreview } = props;

  const {
    theme: {
      channelPreview: {
        message: { container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <MessagePreview previews={latestMessagePreview.previews} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
