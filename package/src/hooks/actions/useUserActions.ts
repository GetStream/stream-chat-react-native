import { useMemo } from 'react';

import { UserResponse } from 'stream-chat';

import type { ActionHandler, ActionOptions } from './type';
import { getNotificationErrorOptions } from './useChannelActions';

import { useNotificationApi } from '../../components/Notifications/hooks';
import { useChatContext, useTranslationContext } from '../../contexts';
import { useStableCallback } from '../useStableCallback';

export type UserActionOptions = ActionOptions;

export type UserActionHandler = ActionHandler;

export type UserActions = {
  blockUser: UserActionHandler;
  muteUser: UserActionHandler;
  unblockUser: UserActionHandler;
  unmuteUser: UserActionHandler;
};

export const useUserActions = (user: UserResponse | undefined): UserActions => {
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();

  const muteUser = useStableCallback(async (options?: UserActionOptions) => {
    if (!user?.id) {
      return;
    }

    try {
      await client.muteUser(user.id);
      addNotification({
        message: t('{{ user }} has been muted', { user: user.name || user.id }),
        options: { severity: 'success', type: 'api:user:mute:success' },
        origin: { context: { user }, emitter: 'UserActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Error muting a user ...'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:mute:failed',
        },
        origin: { context: { user }, emitter: 'UserActions' },
      });
    }
  });

  const unmuteUser = useStableCallback(async (options?: UserActionOptions) => {
    if (!user?.id) {
      return;
    }

    try {
      await client.unmuteUser(user.id);
      addNotification({
        message: t('{{ user }} has been unmuted', { user: user.name || user.id }),
        options: { severity: 'success', type: 'api:user:unmute:success' },
        origin: { context: { user }, emitter: 'UserActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Error unmuting a user ...'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:unmute:failed',
        },
        origin: { context: { user }, emitter: 'UserActions' },
      });
    }
  });

  const blockUser = useStableCallback(async (options?: UserActionOptions) => {
    if (!user?.id) {
      return;
    }

    try {
      await client.blockUser(user.id);
      addNotification({
        message: t('User blocked'),
        options: { severity: 'success', type: 'api:user:block:success' },
        origin: { context: { user }, emitter: 'UserActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to block user'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:block:failed',
        },
        origin: { context: { user }, emitter: 'UserActions' },
      });
    }
  });

  const unblockUser = useStableCallback(async (options?: UserActionOptions) => {
    if (!user?.id) {
      return;
    }

    try {
      await client.unBlockUser(user.id);
      addNotification({
        message: t('User unblocked'),
        options: { severity: 'success', type: 'api:user:unblock:success' },
        origin: { context: { user }, emitter: 'UserActions' },
      });
      await options?.onSuccess?.();
    } catch (error) {
      addNotification({
        message: t('Failed to block user'),
        options: {
          ...getNotificationErrorOptions(error),
          severity: 'error',
          type: 'api:user:block:failed',
        },
        origin: { context: { user }, emitter: 'UserActions' },
      });
    }
  });

  return useMemo<UserActions>(
    () => ({
      blockUser,
      muteUser,
      unblockUser,
      unmuteUser,
    }),
    [blockUser, muteUser, unblockUser, unmuteUser],
  );
};
