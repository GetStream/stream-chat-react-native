import { useEffect } from 'react';

import type { ChannelConfig, ChannelStateData, ScheduledMessagesView } from 'stream-chat';

import { useScheduledMessages } from './useScheduledMessages';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';

const loadConditionsSelector = ({
  initialized,
  ownCapabilities,
}: Pick<ChannelStateData, 'initialized' | 'ownCapabilities'>) => ({
  initialized,
  ownCapabilities,
});

const enabledByConfigSelector = ({ scheduledMessages }: ChannelConfig) => ({
  isEnabledByConfig: scheduledMessages.enabled,
});

/**
 * The messages of a channel's scheduled-message view, such as `thread.scheduledMessages` or the
 * channel-wide view. The channel query usually fills the list. This loads it only for a channel
 * queried without it, once the channel is initialized, and again when the user's capabilities or
 * the scheduled messages config change.
 */
export const useChannelScheduledMessages = (view: ScheduledMessagesView) => {
  const { client } = useChatContext();
  const { cid } = view.paginator;
  const channel = cid ? client.channelManager.get(cid) : undefined;
  const { initialized, ownCapabilities } =
    useStateStore(channel?.state, loadConditionsSelector) ?? {};
  const { isEnabledByConfig } = useStateStore(channel?.configState, enabledByConfigSelector) ?? {};

  useEffect(() => {
    if (!channel || !initialized) return;
    channel.ensureScheduledMessagesLoaded();
  }, [channel, initialized, isEnabledByConfig, ownCapabilities]);

  return useScheduledMessages(view);
};
