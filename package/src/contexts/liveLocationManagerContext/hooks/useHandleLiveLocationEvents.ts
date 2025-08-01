import { useEffect, useState } from 'react';

import { Channel, Event, SharedLocationResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

export type UseLiveLocationsEventsParams = {
  /**
   * The channel where the live location is shared.
   */
  channel: Channel;
  /**
   * The ID of the message containing the shared location.
   */
  messageId: string;
  /**
   * Callback function to handle location updates.
   * It receives the updated shared location response.
   */
  onLocationUpdate?: (location: SharedLocationResponse) => void;
};

/**
 * Custom hook to handle live location events.
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
    const handleMessageUpdate = (event: Event) => {
      const { message } = event;
      if (!message || !message.shared_location) {
        return;
      }
      const { shared_location } = message;
      if (message.id === messageId) {
        setLocationResponse(message.shared_location);
        onLocationUpdate?.(message.shared_location);
      }
      if (shared_location.end_at && shared_location.end_at <= new Date().toISOString()) {
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
