import { useMemo } from 'react';

import { Channel } from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';
import { useNotificationApi } from '../../Notifications';

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

const getNotificationError = (error: unknown): Error | undefined => {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string') return new Error(message);
  }
  return undefined;
};

export const useChannelActions = (channel: Channel) => {
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const ownUserId = client.userID;

  const pin = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.pin();
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        message: t('Channel pinned'),
        severity: 'success',
        type: 'api:channel:pin:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to update channel pinned status'),
        severity: 'error',
        type: 'api:channel:pin:failed',
      });
    }
  });

  const unpin = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.unpin();
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        message: t('Channel unpinned'),
        severity: 'success',
        type: 'api:channel:unpin:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to update channel pinned status'),
        severity: 'error',
        type: 'api:channel:pin:failed',
      });
    }
  });

  const archive = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.archive();
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        message: t('Channel archived'),
        severity: 'success',
        type: 'api:channel:archive:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to update channel archive status'),
        severity: 'error',
        type: 'api:channel:archive:failed',
      });
    }
  });

  const unarchive = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      await channel.unarchive();
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        message: t('Channel unarchived'),
        severity: 'success',
        type: 'api:channel:unarchive:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to update channel archive status'),
        severity: 'error',
        type: 'api:channel:archive:failed',
      });
    }
  });

  const leave = useStableCallback(async () => {
    if (!channel) {
      return;
    }
    if (ownUserId) {
      try {
        await channel.removeMembers([ownUserId]);
        addNotification({
          context: { channel },
          emitter: 'ChannelActions',
          message: t('Left channel'),
          severity: 'success',
          type: 'api:channel:leave:success',
        });
      } catch (error) {
        addNotification({
          context: { channel },
          emitter: 'ChannelActions',
          error: getNotificationError(error),
          message: t('Failed to leave channel'),
          severity: 'error',
          type: 'api:channel:leave:failed',
        });
      }
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
        addNotification({
          context: { channel },
          emitter: 'ChannelActions',
          message: t('{{ user }} has been muted', {
            user: otherUser.user.name || otherUser.user.id,
          }),
          severity: 'success',
          type: 'api:user:mute:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Error muting a user ...'),
        severity: 'error',
        type: 'api:user:mute:failed',
      });
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
        addNotification({
          context: { channel },
          emitter: 'ChannelActions',
          message: t('{{ user }} has been unmuted', {
            user: otherUser.user.name || otherUser.user.id,
          }),
          severity: 'success',
          type: 'api:user:unmute:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Error unmuting a user ...'),
        severity: 'error',
        type: 'api:user:unmute:failed',
      });
    }
  });

  const muteChannel = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    try {
      await channel.mute();
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        message: t('Channel muted'),
        severity: 'success',
        type: 'api:channel:mute:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to update channel mute status'),
        severity: 'error',
        type: 'api:channel:mute:failed',
      });
    }
  });

  const unmuteChannel = useStableCallback(async () => {
    if (!channel) {
      return;
    }

    try {
      await channel.unmute();
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        message: t('Channel unmuted'),
        severity: 'success',
        type: 'api:channel:unmute:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to update channel mute status'),
        severity: 'error',
        type: 'api:channel:mute:failed',
      });
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
        addNotification({
          context: { channel },
          emitter: 'ChannelActions',
          message: t('User blocked'),
          severity: 'success',
          type: 'api:user:block:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to block user'),
        severity: 'error',
        type: 'api:user:block:failed',
      });
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
        addNotification({
          context: { channel },
          emitter: 'ChannelActions',
          message: t('User unblocked'),
          severity: 'success',
          type: 'api:user:unblock:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelActions',
        error: getNotificationError(error),
        message: t('Failed to block user'),
        severity: 'error',
        type: 'api:user:block:failed',
      });
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
