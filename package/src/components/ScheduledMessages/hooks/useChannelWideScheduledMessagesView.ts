import { useMemo } from 'react';

import type { Channel } from 'stream-chat';
import { ScheduledMessagesView } from 'stream-chat';

/**
 * Every scheduled message of the channel, thread replies included. `channel.scheduledMessages`
 * leaves the replies out, so this is a view of the channel's whole list.
 */
export const useChannelWideScheduledMessagesView = (channel: Channel) =>
  useMemo(
    () => new ScheduledMessagesView({ paginator: channel.scheduledMessagesPaginator }),
    [channel],
  );
