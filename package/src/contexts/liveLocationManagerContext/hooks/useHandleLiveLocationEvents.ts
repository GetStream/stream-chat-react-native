import { useEffect, useState } from 'react';

import { Channel, EventPayload, SharedLocationResponse } from 'stream-chat';

import { nowNs } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

export type UseLiveLocationsEventsParams = {
  /** The channel where the live location is shared. */
  channel: Channel;
  /** The ID of the message containing the shared location. */
  messageId: string;
  /** Called with the updated shared location whenever the message's location is updated. */
  onLocationUpdate?: (location: SharedLocationResponse) => void;
};

/**
 * Tracks the shared location of one message from its `message.updated` events.
 *
 * @param params.channel The channel to listen on.
 * @param params.messageId The ID of the message carrying the shared location.
 * @param params.onLocationUpdate Called with each updated shared location.
 * @returns The latest `locationResponse`, and `isLiveLocationStopped`, which is `true` once the
 * location's `end_at` has passed and `null` before that.
 */
export const useHandleLiveLocationEvents = ({
  channel,
  messageId,
  onLocationUpdate,
}: UseLiveLocationsEventsParams) => {
  const { client } = useChatContext();
  const [locationResponse, setLocationResponse] = useState<SharedLocationResponse | undefined>(
    undefined,
  );
  const [isLiveLocationStopped, setIsLiveLocationStopped] = useState<boolean | null>(null);

  useEffect(() => {
    const handleMessageUpdate = (event: EventPayload<'message.updated'>) => {
      const { message } = event;
      if (!message || !message.shared_location || message.id !== messageId) {
        return;
      }
      const { shared_location } = message;
      setLocationResponse(shared_location as SharedLocationResponse);
      onLocationUpdate?.(shared_location as SharedLocationResponse);
      if (shared_location.end_at != null && shared_location.end_at <= nowNs()) {
        setIsLiveLocationStopped(true);
      }
    };

    const listener = [channel.on('message.updated', handleMessageUpdate)];

    return () => {
      listener.forEach((l) => l.unsubscribe());
    };
  }, [channel, client, messageId, onLocationUpdate]);

  return { isLiveLocationStopped, locationResponse };
};
