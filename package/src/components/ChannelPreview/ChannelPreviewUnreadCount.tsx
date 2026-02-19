import React from 'react';

import { ChannelPreviewProps } from './ChannelPreview';

import type { ChannelsContextValue } from '../../contexts/channelsContext/ChannelsContext';
import { BadgeNotification } from '../ui/Badge';

export type ChannelPreviewUnreadCountProps = Pick<ChannelsContextValue, 'maxUnreadCount'> &
  Pick<ChannelPreviewProps, 'channel'> & {
    /**
     * Number of unread messages on the channel
     */
    unread?: number;
  };

export const ChannelPreviewUnreadCount = (props: ChannelPreviewUnreadCountProps) => {
  const { maxUnreadCount, unread } = props;
  if (!unread) {
    return null;
  }

  return (
    <BadgeNotification
      count={unread > maxUnreadCount ? maxUnreadCount : unread}
      size='sm'
      type='primary'
    />
  );
};
