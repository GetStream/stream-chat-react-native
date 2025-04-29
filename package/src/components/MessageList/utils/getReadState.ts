import { ChannelState, LocalMessage } from 'stream-chat';

/**
 * Get the number of users who have read the message
 * @param message - The message to get the read state for
 * @param read - The read state of the channel
 * @returns The number of users who have read the message
 */
export const getReadState = (message: LocalMessage, read?: ChannelState['read']) => {
  if (!read) {
    return 0;
  }

  const readState = Object.values(read).reduce((acc, readState) => {
    if (!readState.last_read) {
      return acc;
    }

    if (message.created_at && message.created_at < readState.last_read) {
      return acc + 1;
    }

    return acc;
  }, 0);

  return readState;
};
