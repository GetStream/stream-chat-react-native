import { useMemo } from 'react';

import { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';

export type ChannelActions = {
  archive: () => Promise<void>;
  deleteChannel: () => Promise<void>;
  leave: () => Promise<void>;
  pin: () => Promise<void>;
  unarchive: () => Promise<void>;
  unpin: () => Promise<void>;
};

export const useChannelActions = (channel: Channel) => {
  const { client } = useChatContext();
  const ownUserId = client.userID;

  const pin = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.pin();
    } catch (error) {
      console.log('Error pinning channel', error);
    }
  });

  const unpin = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.unpin();
    } catch (error) {
      console.log('Error unpinning channel', error);
    }
  });

  const archive = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.archive();
    } catch (error) {
      console.log('Error archiving channel', error);
    }
  });

  const unarchive = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.unarchive();
    } catch (error) {
      console.log('Error unarchiving channel', error);
    }
  });

  const leave = useStableCallback(async () => {
    if (!channel) {
      return;
    }
    if (ownUserId) {
      await channel.removeMembers([ownUserId]);
    }
  });

  const deleteChannel = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    try {
      await channel.delete();
    } catch (error) {
      console.log('Error deleting channel', error);
    }
  });

  return useMemo<ChannelActions>(
    () => ({ pin, unpin, archive, unarchive, leave, deleteChannel }),
    [archive, deleteChannel, leave, pin, unarchive, unpin],
  );
};
