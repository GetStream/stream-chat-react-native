import React from 'react';

import { StyleSheet } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Mute } from '../../icons';
import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  iconStyle: {
    marginRight: 8,
  },
});

export type ChannelPreviewMutedStatusProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelPreviewProps<StreamChatGenerics>, 'channel'> & {
  muted: boolean;
};

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelPreviewMutedStatus = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewMutedStatusProps<StreamChatGenerics>,
) => {
  const { muted } = props;

  const {
    theme: {
      channelPreview: {
        mutedStatus: { height, iconStyle, width },
      },
      colors: { grey_dark },
    },
  } = useTheme('ChannelPreviewMutedStatus');

  return muted ? (
    <Mute
      height={height}
      pathFill={grey_dark}
      style={[styles.iconStyle, iconStyle]}
      width={width}
    />
  ) : null;
};
