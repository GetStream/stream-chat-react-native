import { useMemo } from 'react';

import { Channel } from 'stream-chat';

import { useStableCallback } from './useStableCallback';

import { useNotificationApi } from '../components/Notifications/hooks';
import { useChatContext, useTranslationContext } from '../contexts';

export type ChannelActionOptions = {
  onSuccess?: () => unknown;
};

export type ChannelActionHandler = (options?: ChannelActionOptions) => Promise<void>;

export type ChannelActions = {
  addMembers: (memberIds: string[], options?: ChannelActionOptions) => Promise<void>;
  archive: ChannelActionHandler;
  deleteChannel: ChannelActionHandler;
  leave: ChannelActionHandler;
  pin: ChannelActionHandler;
  unarchive: ChannelActionHandler;
  unpin: ChannelActionHandler;
  muteUser: ChannelActionHandler;
  unmuteUser: ChannelActionHandler;
  muteChannel: ChannelActionHandler;
  unmuteChannel: ChannelActionHandler;
  blockUser: ChannelActionHandler;
  unblockUser: ChannelActionHandler;
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

export const getNotificationErrorOptions = (error: unknown) => {
  const originalError = getNotificationError(error);
  return originalError ? { originalError } : {};
};

export const useChannelActions = (channel: Channel) => {
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const ownUserId = client.userID;

  const pin = useStableCallback(async (options?: ChannelActionOptions) => {
    try {
      if (!channel) {
        return;
      }
      await channel.pin();
      addNotification({
        message: t('Channel pinned'),
        options: { severity: 'success', type: 'api:channel:pin:success' },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to update channel pinned status'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:channel:pin:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const unpin = useStableCallback(async (options?: ChannelActionOptions) => {
    try {
      if (!channel) {
        return;
      }
      await channel.unpin();
      addNotification({
        message: t('Channel unpinned'),
        options: { severity: 'success', type: 'api:channel:unpin:success' },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to update channel pinned status'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:channel:pin:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const archive = useStableCallback(async (options?: ChannelActionOptions) => {
    try {
      if (!channel) {
        return;
      }
      await channel.archive();
      addNotification({
        message: t('Channel archived'),
        options: { severity: 'success', type: 'api:channel:archive:success' },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to update channel archive status'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:channel:archive:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const unarchive = useStableCallback(async (options?: ChannelActionOptions) => {
    try {
      if (!channel) {
        return;
      }
      await channel.unarchive();
      addNotification({
        message: t('Channel unarchived'),
        options: { severity: 'success', type: 'api:channel:unarchive:success' },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to update channel archive status'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:channel:archive:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const leave = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }
    if (ownUserId) {
      try {
        await channel.removeMembers([ownUserId]);
        addNotification({
          message: t('Left channel'),
          options: { severity: 'success', type: 'api:channel:leave:success' },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
        await options?.onSuccess?.();
      } catch (error) {
        addNotification({
          message: t('Failed to leave channel'),
          options: {
            ...getNotificationErrorOptions(error),
            severity: 'error',
            type: 'api:channel:leave:failed',
          },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
      }
    }
  });

  const addMembers = useStableCallback(
    async (memberIds: string[], options?: ChannelActionOptions) => {
      if (!channel) {
        return;
      }
      try {
        await channel.addMembers(memberIds);
        addNotification({
          message: t('{{count}} members added', { count: memberIds.length }),
          options: { severity: 'success', type: 'api:channel:add-members:success' },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
        await options?.onSuccess?.();
      } catch (error) {
        addNotification({
          message: t('Failed to add members'),
          options: {
            ...getNotificationErrorOptions(error),
            severity: 'error',
            type: 'api:channel:add-members:failed',
          },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
      }
    },
  );

  const deleteChannel = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }

    try {
      await channel.delete();
      addNotification({
        message: t('Channel deleted'),
        options: { severity: 'success', type: 'api:channel:delete:success' },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to delete channel'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:channel:delete:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const muteUser = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.muteUser(otherUser.user.id);
        addNotification({
          message: t('{{ user }} has been muted', {
            user: otherUser.user.name || otherUser.user.id,
          }),
          options: { severity: 'success', type: 'api:user:mute:success' },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
        await options?.onSuccess?.();
      }
    } catch (error) {
      addNotification({
        message: t('Error muting a user ...'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:mute:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const unmuteUser = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.unmuteUser(otherUser.user.id);
        addNotification({
          message: t('{{ user }} has been unmuted', {
            user: otherUser.user.name || otherUser.user.id,
          }),
          options: { severity: 'success', type: 'api:user:unmute:success' },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
        await options?.onSuccess?.();
      }
    } catch (error) {
      addNotification({
        message: t('Error unmuting a user ...'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:unmute:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const muteChannel = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }

    try {
      await channel.mute();
      addNotification({
        message: t('Channel muted'),
        options: { severity: 'success', type: 'api:channel:mute:success' },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to update channel mute status'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:channel:mute:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const unmuteChannel = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }

    try {
      await channel.unmute();
      addNotification({
        message: t('Channel unmuted'),
        options: { severity: 'success', type: 'api:channel:unmute:success' },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to update channel mute status'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:channel:mute:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const blockUser = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.blockUser(otherUser.user.id);
        addNotification({
          message: t('User blocked'),
          options: { severity: 'success', type: 'api:user:block:success' },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
        await options?.onSuccess?.();
      }
    } catch (error) {
      addNotification({
        message: t('Failed to block user'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:block:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  const unblockUser = useStableCallback(async (options?: ChannelActionOptions) => {
    if (!channel) {
      return;
    }

    const otherUser = getOtherUserInDirectChannel(channel);

    try {
      if (otherUser?.user?.id) {
        await client.unBlockUser(otherUser.user.id);
        addNotification({
          message: t('User unblocked'),
          options: { severity: 'success', type: 'api:user:unblock:success' },
          origin: { context: { channel }, emitter: 'ChannelActions' },
        });
        await options?.onSuccess?.();
      }
    } catch (error) {
      addNotification({
        message: t('Failed to block user'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:block:failed',
        },
        origin: { context: { channel }, emitter: 'ChannelActions' },
      });
    }
  });

  return useMemo<ChannelActions>(
    () => ({
      addMembers,
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
      addMembers,
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
