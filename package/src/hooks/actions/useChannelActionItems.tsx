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
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import type { IconsMap } from '../../contexts/componentsContext/defaultComponents';
import type { TranslationContextValue } from '../../contexts/translationContext/TranslationContext';
import { IconProps } from '../../icons';
import { useChannelMembershipState } from '../useChannelMembershipState';
import { useIsDirectChat } from '../useIsDirectChat';
import { useStateStore } from '../useStateStore';

// Required lazily: a static import of defaultComponents.ts would form a cycle
// (defaultComponents -> ChannelDetails*/ChannelPreview* -> this file) and corrupt init order.
let cachedDefaultIcons: IconsMap | undefined;
const getDefaultIcons = (): IconsMap => {
  if (!cachedDefaultIcons) {
    cachedDefaultIcons = (
      require('../../contexts/componentsContext/defaultComponents') as { defaultIcons: IconsMap }
    ).defaultIcons;
  }
  return cachedDefaultIcons;
};

export type ChannelActionItem = ActionItem<
  'mute' | 'muteUser' | 'block' | 'leave' | 'deleteChannel' | 'pin' | string
> & {
  /**
   * Where the item shows in a channel preview: `'swipe'` (swipe-row chips only), `'sheet'` (the
   * options sheet opened from the swipe row only) or `'both'`. Only `<ChannelSwipableWrapper>`
   * reads it; the Channel Details screen does not, so use `surface` to vary items there.
   */
  placement: 'both' | 'sheet' | 'swipe';
};

/**
 * The UI surface requesting channel action items, passed through to `getChannelActionItems` so it
 * can drop or relabel items per surface.
 *
 * - `'list'`: ChannelList interactions, the swipe row of a channel preview and its options sheet
 *   (routed between the two by {@link ChannelActionItem.placement}).
 * - `'details'`: the standalone Channel Details screen.
 *
 * When omitted, the default builder applies no surface filtering.
 */
export type ChannelActionSurface = 'list' | 'details';

export type ChannelActionItemsParams = {
  actions: ChannelActions;
  channel: Channel;
  channelMuteActive: boolean;
  icons: IconsMap;
  isArchived: boolean;
  isBlocked: boolean | undefined;
  isDirectChat: boolean;
  isPinned: boolean;
  surface?: ChannelActionSurface;
  t: TranslationContextValue['t'];
  userMuteActive: boolean;
};

export type BuildDefaultChannelActionItems = (
  channelActionItemsParams: Omit<ChannelActionItemsParams, 'icons'> & { icons?: IconsMap },
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
    icons = getDefaultIcons(),
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
          <icons.Sound width={20} height={20} {...props} />
        ) : (
          <icons.Mute
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
          ? t('channel.unmuteChat.label', 'Unmute Chat')
          : t('channel.muteChat.label', 'Mute Chat')
        : channelMuteActive
          ? t('channel.unmuteGroup.label', 'Unmute Group')
          : t('channel.muteGroup.label', 'Mute Group'),
      placement: 'swipe',
      type: 'standard',
    },
  ];

  if (surface !== 'details') {
    actionItems.push({
      action: isPinned ? unpin : pin,
      Icon: (props) => <ChannelActionsIcon Icon={isPinned ? icons.Unpin : icons.Pin} {...props} />,
      id: 'pin',
      label: isDirectChat
        ? isPinned
          ? t('channel.unpinChat.label', 'Unpin Chat')
          : t('channel.pinChat.label', 'Pin Chat')
        : isPinned
          ? t('channel.unpinGroup.label', 'Unpin Group')
          : t('channel.pinGroup.label', 'Pin Group'),
      placement: 'sheet',
      type: 'standard',
    });
  }

  if (isDirectChat) {
    actionItems.push({
      action: userMuteActive ? unmuteUser : muteUser,
      Icon: (props) =>
        userMuteActive ? (
          <ChannelActionsIcon Icon={icons.Sound} {...props} />
        ) : (
          <ChannelActionsIcon
            Icon={icons.Mute}
            {...props}
            fill={props.fill ?? props.stroke}
            stroke={undefined}
          />
        ),
      id: 'muteUser',
      label: userMuteActive
        ? t('message.unmuteUser.label', 'Unmute User')
        : t('message.muteUser.label', 'Mute User'),
      placement: 'sheet',
      type: 'standard',
    });

    const blockUserWithConfirmation = (...args: Parameters<ChannelActionHandler>) => {
      const otherUser = getOtherUserInDirectChannel(channel)?.user;
      const name = otherUser?.name || otherUser?.id || '';

      Alert.alert(
        t('message.blockUserConfirm.title', 'Block {{ name }}', { name }),
        t(
          'message.blockUserConfirm.text',
          "They won't be able to message or call you. You can unblock them later.",
        ),
        [
          {
            style: 'cancel',
            text: t('common.cancel.label', 'Cancel'),
          },
          {
            onPress: async () => {
              await blockUser(...args);
            },
            style: 'destructive',
            text: t('message.blockUserConfirm.label', 'Block'),
          },
        ],
      );
    };

    actionItems.push({
      action: isBlocked ? unblockUser : blockUserWithConfirmation,
      Icon: (props) => <ChannelActionsIcon Icon={icons.BlockUser} {...props} />,
      id: 'block',
      label: isBlocked
        ? t('message.unblockUser.label', 'Unblock User')
        : t('message.blockUser.label', 'Block User'),
      placement: 'sheet',
      type: isBlocked ? 'standard' : 'destructive',
    });
  }

  const leaveWithConfirmation = (...args: Parameters<ChannelActionHandler>) => {
    const channelName = channel.data?.custom?.name;
    let name: string;
    if (channelName) {
      name = channelName;
    } else if (isDirectChat) {
      const otherUser = getOtherUserInDirectChannel(channel)?.user;
      name = otherUser?.name || otherUser?.id || '';
    } else {
      name = t('channel.leave.confirm.groupName.text', 'this group');
    }

    Alert.alert(
      isDirectChat
        ? t('channel.leaveChat.label', 'Leave Chat')
        : t('channel.leaveGroup.label', 'Leave Group'),
      t(
        'channel.leave.confirm.text',
        "You'll stop receiving messages from {{ name }}. You can rejoin anytime.",
        { name },
      ),
      [
        {
          style: 'cancel',
          text: t('common.cancel.label', 'Cancel'),
        },
        {
          onPress: async () => {
            await leave(...args);
          },
          style: 'destructive',
          text: t('channel.leave.confirm.label', 'Leave'),
        },
      ],
    );
  };

  actionItems.push({
    action: leaveWithConfirmation,
    Icon: (props) => <ChannelActionsIcon Icon={icons.ArrowBoxLeft} {...props} />,
    id: 'leave',
    label: isDirectChat
      ? t('channel.leaveChat.label', 'Leave Chat')
      : t('channel.leaveGroup.label', 'Leave Group'),
    placement: 'sheet',
    type: 'destructive',
  });

  if (channel.data?.created_by?.id === ownUserId) {
    actionItems.push({
      action: (...args: Parameters<ChannelActionHandler>) => {
        const title = isDirectChat
          ? t('channel.deleteChat.title', 'Delete chat')
          : t('channel.deleteGroup.title', 'Delete group');
        const message = isDirectChat
          ? t(
              'channel.deleteChat.confirm.text',
              "Are you sure you want to delete this chat? This can't be undone.",
            )
          : t(
              'channel.deleteGroup.confirm.text',
              "Are you sure you want to delete this group? This can't be undone.",
            );

        Alert.alert(title, message, [
          {
            style: 'cancel',
            text: t('common.cancel.label', 'Cancel'),
          },
          {
            onPress: async () => {
              await deleteChannel(...args);
            },
            style: 'destructive',
            text: t('message.deleteMessageConfirm.label', 'Delete'),
          },
        ]);
      },
      Icon: (props) => <ChannelActionsIcon Icon={icons.Delete} {...props} />,
      id: 'deleteChannel',
      label: isDirectChat
        ? t('channel.deleteChat.label', 'Delete Chat')
        : t('channel.deleteGroup.label', 'Delete Group'),
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
  const { icons } = useComponentsContext();
  const membership = useChannelMembershipState(channel);
  const channelActions = useChannelActions(channel);
  const isDirectChat = useIsDirectChat(channel);
  const isPinned = membership?.pinned_at != null;
  const isArchived = membership?.archived_at != null;

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
      icons,
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
      icons,
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
