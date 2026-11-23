import { useEffect } from 'react';

import type { Channel, LocalMessage } from 'stream-chat';

import { useStableCallback } from './useStableCallback';

/**
 * Marks the message played whenever its media starts playing, however playback started. Sends
 * nothing without a channel or a message.
 *
 * @param params.channel The channel the message belongs to.
 * @param params.isPlaying Whether the message's audio or video is playing.
 * @param params.message The played message.
 */
export const useMarkMessagePlayed = ({
  channel,
  isPlaying,
  message,
}: {
  channel?: Channel;
  isPlaying: boolean;
  message?: LocalMessage;
}) => {
  const markPlayed = useStableCallback(() => {
    if (!channel || !message) {
      return;
    }
    channel
      .markMessagePlayed(message)
      .catch((error: unknown) => console.warn('Marking the message played failed:', error));
  });

  useEffect(() => {
    if (isPlaying) {
      markPlayed();
    }
  }, [isPlaying, markPlayed]);
};
