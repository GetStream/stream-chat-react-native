import React, { useMemo } from 'react';
import { Alert } from 'react-native';

import type { BlockedUsersState, Channel } from 'stream-chat';

import type { ActionItem } from './types';
import {
  ChannelActionHandler,
  ChannelActions,
  getOtherUserInDirectChannel,
  useChannelActions,
} from './useChannelActions';

import { useIsChannelMuted } from '../../components/ChannelPreview/hooks/useIsChannelMuted';
import { useUserMuteActive } from '../../components/Message/hooks/useUserMuteActive';
import { useTheme, useTranslationContext } from '../../contexts';
import type { TranslationContextValue } from '../../contexts/translationContext/TranslationContext';
import { IconProps, Mute, BlockUser, Delete, Pin, Sound, Unpin } from '../../icons';
import { ArrowBoxLeft } from '../../icons/leave';
import { useChannelMembershipState } from '../useChannelMembershipState';
import { useIsDirectChat } from '../useIsDirectChat';
import { useStateStore } from '../useStateStore';

export type ChannelActionItem = ActionItem<
  'mute' | 'muteUser' | 'block' | 'leave' | 'deleteChannel' | 'pin' | string
> & {
  /**
   * Per item routing **within a channel preview interaction** (swipe row vs
   * the sheet that opens from it). Only meaningful when the items are consumed
   * from `<ChannelSwipableWrapper>`:
   *
   * - `'swipe'`: shown only in the swipe-row chips.
   * - `'sheet'`: shown only in the swipe-triggered options sheet.
   * - `'both'`: shown in both swipe row and sheet.
   *
   * The standalone Channel Details screen does **not** filter by `placement` -
   * use {@link ChannelActionSurface} (`surface`) instead to vary items between
   * the channel list and the Channel Details screen.
   */
  placement: 'both' | 'sheet' | 'swipe';
};

/**
 * Identifies which top level UI surface is requesting channel action items.
 * Passed verbatim into {@link ChannelActionItemsParams} so the default builder
 * and any integrator supplied `getChannelActionItems` can branch on it - i.e.
 * to drop or relabel an item on a specific surface or to provide an entirely
 * different builder per surface.
 *
 * - `'list'`: anything driven by a ChannelList interaction, the swipe row
 *   chips on a channel preview and the bottom sheet that opens from them.
 *   Subrouting between the swipe row and the sheet is handled by the per item
 *   {@link ChannelActionItem.placement} field.
 * - `'details'`: items for the standalone Channel Details screen.
 *
 * `surface` operates at the call site level (which UI is asking). It is
 * optional and when omitted, the default builder applies no surface specific
 * filtering and returns every item it would otherwise produce.
 */
export type ChannelActionSurface = 'list' | 'details';

export type ChannelActionItemsParams = {
  actions: ChannelActions;
  channel: Channel;
  channelMuteActive: boolean;
  isArchived: boolean;
  isBlocked: boolean | undefined;
  isDirectChat: boolean;
  isPinned: boolean;
  surface?: ChannelActionSurface;
  t: TranslationContextValue['t'];
  userMuteActive: boolean;
};

export type BuildDefaultChannelActionItems = (
  channelActionItemsParams: ChannelActionItemsParams,
) => ChannelActionItem[];

const ChannelActionsIcon = ({
  Icon,
  ...rest
}: { Icon: React.ComponentType<IconProps> } & IconProps) => {
  const {
    theme: { semantics },
  } = useTheme();

  return <Icon stroke={semantics.textSecondary} width={20} height={20} {...rest} />;
};

export const buildDefaultChannelActionItems: BuildDefaultChannelActionItems = (
  channelActionItemsParams,
) => {
  const {
    actions: {
      deleteChannel,
      leave,
      muteChannel,
      unmuteChannel,
      muteUser,
      unmuteUser,
      blockUser,
      unblockUser,
      pin,
      unpin,
    },
    channelMuteActive,
    isBlocked,
    isDirectChat,
    isPinned,
    surface,
    userMuteActive,
    t,
    channel,
  } = channelActionItemsParams;
  const ownUserId = channel.getClient().userID;

  const actionItems: ChannelActionItem[] = [
    {
      action: channelMuteActive ? unmuteChannel : muteChannel,
      Icon: (props) =>
        channelMuteActive ? (
          <Sound width={20} height={20} {...props} />
        ) : (
          <Mute
            width={20}
            height={20}
            {...props}
            stroke={undefined}
            fill={props.fill ?? props.stroke}
          />
        ),
      id: 'mute',
      label: isDirectChat
        ? channelMuteActive
          ? t('Unmute Chat')
          : t('Mute Chat')
        : channelMuteActive
          ? t('Unmute Group')
          : t('Mute Group'),
      placement: 'swipe',
      type: 'standard',
    },
  ];

  if (surface !== 'details') {
    actionItems.push({
      action: isPinned ? unpin : pin,
      Icon: (props) => <ChannelActionsIcon Icon={isPinned ? Unpin : Pin} {...props} />,
      id: 'pin',
      label: isDirectChat
        ? isPinned
          ? t('Unpin Chat')
          : t('Pin Chat')
        : isPinned
          ? t('Unpin Group')
          : t('Pin Group'),
      placement: 'sheet',
      type: 'standard',
    });
  }

  if (isDirectChat) {
    actionItems.push({
      action: userMuteActive ? unmuteUser : muteUser,
      Icon: (props) =>
        userMuteActive ? (
          <ChannelActionsIcon Icon={Sound} {...props} />
        ) : (
          <ChannelActionsIcon
            Icon={Mute}
            {...props}
            fill={props.fill ?? props.stroke}
            stroke={undefined}
          />
        ),
      id: 'muteUser',
      label: userMuteActive ? t('Unmute User') : t('Mute User'),
      placement: 'sheet',
      type: 'standard',
    });

    const blockUserWithConfirmation = (...args: Parameters<ChannelActionHandler>) => {
      const otherUser = getOtherUserInDirectChannel(channel)?.user;
      const name = otherUser?.name || otherUser?.id || '';

      Alert.alert(
        t('Block {{ name }}', { name }),
        t("They won't be able to message or call you. You can unblock them later."),
        [
          {
            style: 'cancel',
            text: t('Cancel'),
          },
          {
            onPress: async () => {
              await blockUser(...args);
            },
            style: 'destructive',
            text: t('Block'),
          },
        ],
      );
    };

    actionItems.push({
      action: isBlocked ? unblockUser : blockUserWithConfirmation,
      Icon: (props) => <ChannelActionsIcon Icon={BlockUser} {...props} />,
      id: 'block',
      label: isBlocked ? t('Unblock User') : t('Block User'),
      placement: 'sheet',
      type: isBlocked ? 'standard' : 'destructive',
    });
  }

  actionItems.push({
    action: leave,
    Icon: (props) => <ChannelActionsIcon Icon={ArrowBoxLeft} {...props} />,
    id: 'leave',
    label: isDirectChat ? t('Leave Chat') : t('Leave Group'),
    placement: 'sheet',
    type: 'destructive',
  });

  if (channel.data?.created_by?.id === ownUserId) {
    actionItems.push({
      action: (...args: Parameters<ChannelActionHandler>) => {
        const title = isDirectChat ? t('Delete chat') : t('Delete group');
        const message = isDirectChat
          ? t("Are you sure you want to delete this chat? This can't be undone.")
          : t("Are you sure you want to delete this group? This can't be undone.");

        Alert.alert(title, message, [
          {
            style: 'cancel',
            text: t('Cancel'),
          },
          {
            onPress: async () => {
              await deleteChannel(...args);
            },
            style: 'destructive',
            text: t('Delete'),
          },
        ]);
      },
      Icon: (props) => <ChannelActionsIcon Icon={Delete} {...props} />,
      id: 'deleteChannel',
      label: isDirectChat ? t('Delete Chat') : t('Delete Group'),
      placement: 'sheet',
      type: 'destructive',
    });
  }

  return actionItems;
};

export type GetChannelActionItems = (params: {
  context: ChannelActionItemsParams;
  defaultItems: ChannelActionItem[];
}) => ChannelActionItem[];

export const getChannelActionItems: GetChannelActionItems = ({ defaultItems }) => defaultItems;

type UseChannelActionItemsParams = {
  channel: Channel;
  surface?: ChannelActionSurface;
  getChannelActionItems?: GetChannelActionItems;
};

const blockedUsersStateSelector = (state: BlockedUsersState) =>
  ({ userIds: state.userIds }) as const;

export const useChannelActionItems = ({
  channel,
  surface,
  getChannelActionItems: getChannelActionItemsProp = getChannelActionItems,
}: UseChannelActionItemsParams) => {
  const { t } = useTranslationContext();
  const membership = useChannelMembershipState(channel);
  const channelActions = useChannelActions(channel);
  const isDirectChat = useIsDirectChat(channel);
  const isPinned = Boolean(membership?.pinned_at);
  const isArchived = Boolean(membership?.archived_at);

  const { muted: channelMuteActive } = useIsChannelMuted(channel);
  const otherUser = isDirectChat ? getOtherUserInDirectChannel(channel)?.user : undefined;
  const userMuteActive = useUserMuteActive(otherUser);

  const { userIds: blockedUserIds } = useStateStore(
    channel.getClient().blockedUsers,
    blockedUsersStateSelector,
  );

  const isBlocked = isDirectChat
    ? blockedUserIds.includes(getOtherUserInDirectChannel(channel)?.user?.id ?? '')
    : undefined;

  const channelActionItemsParams = useMemo(
    () => ({
      actions: channelActions,
      channel,
      channelMuteActive,
      isArchived,
      isBlocked,
      isDirectChat,
      isPinned,
      surface,
      t,
      userMuteActive,
    }),
    [
      channel,
      channelActions,
      channelMuteActive,
      isArchived,
      isBlocked,
      isDirectChat,
      isPinned,
      surface,
      t,
      userMuteActive,
    ],
  );

  const defaultItems = useMemo(
    () => buildDefaultChannelActionItems(channelActionItemsParams),
    [channelActionItemsParams],
  );

  return useMemo(
    () =>
      getChannelActionItemsProp({
        context: channelActionItemsParams,
        defaultItems,
      }),
    [channelActionItemsParams, defaultItems, getChannelActionItemsProp],
  );
};
