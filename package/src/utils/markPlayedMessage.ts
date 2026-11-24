import type { Channel } from 'stream-chat';

import type { HandlePlaybackStarted } from '../types/types';

/**
 * Marks the message played through its channel. Sends nothing without a channel or a message ID.
 *
 * @param channel The channel the message belongs to.
 * @param messageId The ID of the played message.
 */
export const markPlayedMessage = (channel?: Channel, messageId?: string) => {
  if (!channel || !messageId) {
    return;
  }
  // Failures need no handling: an offline mark is queued, and a refused one is the app's policy.
  channel.markMessagePlayed(messageId).catch(() => undefined);
};

/** Marks the message played as soon as playback starts. */
export const defaultHandlePlaybackStarted: HandlePlaybackStarted = ({ markPlayed }) => {
  markPlayed();
  return true;
};
