import React, { useMemo } from 'react';

import { ChannelPreviewProps } from './ChannelPreview';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
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
  const labelParams = useMemo(() => ({ count: unread ?? 0 }), [unread]);
  const accessibilityLabel = useA11yLabel('a11y/{{count}} unread messages', labelParams);
  if (!unread) {
    return null;
  }

  return (
    <BadgeNotification
      accessibilityLabel={accessibilityLabel}
      count={unread > maxUnreadCount ? maxUnreadCount : unread}
      size='sm'
      type='primary'
    />
  );
};
