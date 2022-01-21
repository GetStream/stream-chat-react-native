import React from 'react';

import { StyleSheet } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Mute } from '../../icons';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  iconStyle: {
    marginRight: 8,
  },
});

export type ChannelPreviewMutedStatusProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> & {
  muted: boolean;
};

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelPreviewMutedStatus = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: ChannelPreviewMutedStatusProps<At, Ch, Co, Ev, Me, Re, Us>,
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
