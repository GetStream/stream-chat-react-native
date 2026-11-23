import { useEffect } from 'react';

import type { Channel } from 'stream-chat';

import { useStableCallback } from './useStableCallback';

import { markPlayedMessage } from '../utils/markPlayedMessage';

/**
 * Marks a message played once its media has started playing, for a custom player that does not use
 * the SDK's audio or video players. A player created with a `messageId`, as by `useAudioPlayer`,
 * marks its message by itself.
 *
 * @param params.channel The channel the message belongs to.
 * @param params.hasStartedPlayback Whether playback has advanced, past any download and buffering.
 * @param params.messageId The ID of the played message.
 */
export const useMarkMessagePlayed = ({
  channel,
  hasStartedPlayback,
  messageId,
}: {
  channel?: Channel;
  hasStartedPlayback: boolean;
  messageId?: string;
}) => {
  const markPlayed = useStableCallback(() => markPlayedMessage(channel, messageId));

  useEffect(() => {
    if (hasStartedPlayback) {
      markPlayed();
    }
  }, [hasStartedPlayback, markPlayed]);
};
