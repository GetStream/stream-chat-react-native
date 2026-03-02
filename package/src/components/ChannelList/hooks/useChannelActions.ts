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
  muteUser: () => Promise<void>;
  unmuteUser: () => Promise<void>;
  muteChannel: () => Promise<void>;
  unmuteChannel: () => Promise<void>;
  blockUser: () => Promise<void>;
  unblockUser: () => Promise<void>;
};

export const getOtherUserInDirectChannel = (channel: Channel) => {
  const members = Object.values(channel.state.members);
  return members.length === 2
    ? members.find((member) => member.user?.id !== channel.getClient().userID)
    : undefined;
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

  const muteUser = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.muteUser(otherUser.user.id);
      }
    } catch (error) {
      console.log('Error muting user', error);
    }
  });

  const unmuteUser = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.unmuteUser(otherUser.user.id);
      }
    } catch (error) {
      console.log('Error muting user', error);
    }
  });

  const muteChannel = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    try {
      await channel.mute();
    } catch (error) {
      console.log('Error muting channel', error);
    }
  });

  const unmuteChannel = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    try {
      await channel.unmute();
    } catch (error) {
      console.log('Error muting channel', error);
    }
  });

  const blockUser = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.blockUser(otherUser.user.id);
      }
    } catch (error) {
      console.log('Error blocking user', error);
    }
  });

  const unblockUser = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.unBlockUser(otherUser.user.id);
      }
    } catch (error) {
      console.log('Error unblocking user', error);
    }
  });

  return useMemo<ChannelActions>(
    () => ({
      pin,
      unpin,
      archive,
      unarchive,
      leave,
      deleteChannel,
      muteUser,
      unmuteUser,
      muteChannel,
      unmuteChannel,
      blockUser,
      unblockUser,
    }),
    [
      pin,
      unpin,
      archive,
      unarchive,
      leave,
      deleteChannel,
      muteUser,
      unmuteUser,
      muteChannel,
      unmuteChannel,
      blockUser,
      unblockUser,
    ],
  );
};
