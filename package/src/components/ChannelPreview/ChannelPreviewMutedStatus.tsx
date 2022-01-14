import React from 'react';

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
      colors: { grey_dark },
    },
  } = useTheme();

  return muted ? (
    <Mute height={20} pathFill={grey_dark} style={{ marginRight: 8 }} width={20} />
  ) : null;
};
