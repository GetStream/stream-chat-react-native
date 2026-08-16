import React, { useMemo } from 'react';
import { Alert } from 'react-native';

import type { BlockedUsersState, Channel, ChannelMemberResponse } from 'stream-chat';

import type { ActionItem } from './types';
import { ChannelActions, useChannelActions } from './useChannelActions';
import { useUserActions, UserActions } from './useUserActions';

import { useUserMuteActive } from '../../components/Message/hooks/useUserMuteActive';
import { useTheme, useTranslationContext } from '../../contexts';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import type { IconsMap } from '../../contexts/componentsContext/defaultComponents';
import type { TranslationContextValue } from '../../contexts/translationContext/TranslationContext';
import { IconProps } from '../../icons';
import { useChannelOwnCapabilities } from '../useChannelOwnCapabilities';
import { useStateStore } from '../useStateStore';

// Lazily resolved to avoid a static import cycle with defaultComponents.ts
// (defaultComponents → ChannelDetails*/ChannelPreview* → this file). Statically
// importing defaultIcons corrupts module-init order; require it at call time
// instead. Same pattern as ComponentsContext's getDefaults().
let cachedDefaultIcons: IconsMap | undefined;
const getDefaultIcons = (): IconsMap => {
  if (!cachedDefaultIcons) {
    cachedDefaultIcons = (
      require('../../contexts/componentsContext/defaultComponents') as { defaultIcons: IconsMap }
    ).defaultIcons;
  }
  return cachedDefaultIcons;
};

export type ChannelMemberActionItem = ActionItem<'muteUser' | 'block' | string>;

export type ChannelMemberActionItemsParams = {
  channel: Channel;
  channelActions: ChannelActions;
  icons: IconsMap;
  isBlocked: boolean;
  isCurrentUser: boolean;
  member: ChannelMemberResponse;
  ownCapabilities: string[] | undefined;
  t: TranslationContextValue['t'];
  userActions: UserActions;
  userMuteActive: boolean;
};

export type BuildDefaultChannelMemberActionItems = (
  channelMemberActionItemsParams: Omit<ChannelMemberActionItemsParams, 'icons'> & {
    icons?: IconsMap;
  },
) => ChannelMemberActionItem[];

const ChannelMemberActionsIcon = ({
  Icon,
  ...rest
}: { Icon: React.ComponentType<IconProps> } & IconProps) => {
  const {
    theme: { semantics },
  } = useTheme();

  return <Icon stroke={semantics.textSecondary} width={20} height={20} {...rest} />;
};

export const buildDefaultChannelMemberActionItems: BuildDefaultChannelMemberActionItems = (
  channelMemberActionItemsParams,
) => {
  const {
    channelActions: { removeMembers },
    icons = getDefaultIcons(),
    isBlocked,
    isCurrentUser,
    member,
    ownCapabilities,
    t,
    userActions: { blockUser, muteUser, unblockUser, unmuteUser },
    userMuteActive,
  } = channelMemberActionItemsParams;

  const canRemoveMember = ownCapabilities?.includes('update-channel-members') ?? false;

  const actionItems: ChannelMemberActionItem[] = [];

  // Muting or blocking yourself is meaningless, so these actions are only
  // added for other members.
  if (!isCurrentUser) {
    actionItems.push(
      {
        action: userMuteActive ? unmuteUser : muteUser,
        Icon: (props) =>
          userMuteActive ? (
            <ChannelMemberActionsIcon Icon={icons.Sound} {...props} />
          ) : (
            <ChannelMemberActionsIcon
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
        type: 'standard',
      },
      {
        action: isBlocked
          ? unblockUser
          : (...args: Parameters<UserActions['blockUser']>) => {
              const name = member.user?.name || member.user?.id || '';

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
            },
        Icon: (props) => <ChannelMemberActionsIcon Icon={icons.BlockUser} {...props} />,
        id: 'block',
        label: isBlocked
          ? t('message.unblockUser.label', 'Unblock User')
          : t('message.blockUser.label', 'Block User'),
        type: isBlocked ? 'standard' : 'destructive',
      },
    );

    if (canRemoveMember) {
      actionItems.push({
        action: () => {
          const memberId = member.user?.id;
          if (!memberId) {
            return;
          }
          Alert.alert(
            t('channel.removeUser.label', 'Remove User'),
            t(
              'channel.removeUser.confirm.text',
              'Are you sure you want to remove this member from the channel?',
            ),
            [
              { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
              {
                onPress: async () => {
                  await removeMembers([memberId]);
                },
                style: 'destructive',
                text: t('channel.removeUser.confirm.label', 'Remove'),
              },
            ],
          );
        },
        Icon: (props) => <ChannelMemberActionsIcon Icon={icons.UserDelete} {...props} />,
        id: 'removeMember',
        label: t('channel.removeUser.label', 'Remove User'),
        type: 'destructive',
      });
    }
  }

  return actionItems;
};

export type GetChannelMemberActionItems = (params: {
  context: ChannelMemberActionItemsParams;
  defaultItems: ChannelMemberActionItem[];
}) => ChannelMemberActionItem[];

export const getChannelMemberActionItems: GetChannelMemberActionItems = ({ defaultItems }) =>
  defaultItems;

type UseChannelMemberActionItemsParams = {
  channel: Channel;
  member: ChannelMemberResponse;
  getChannelMemberActionItems?: GetChannelMemberActionItems;
};

const blockedUsersStateSelector = (state: BlockedUsersState) =>
  ({ userIds: state.userIds }) as const;

export const useChannelMemberActionItems = ({
  channel,
  member,
  getChannelMemberActionItems: getChannelMemberActionItemsProp = getChannelMemberActionItems,
}: UseChannelMemberActionItemsParams) => {
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();
  const userActions = useUserActions(member.user);
  const channelActions = useChannelActions(channel);

  const ownCapabilities = useChannelOwnCapabilities(channel);

  const userMuteActive = useUserMuteActive(member.user);

  const { userIds: blockedUserIds } = useStateStore(
    channel.getClient().blockedUsers,
    blockedUsersStateSelector,
  );

  const isBlocked = blockedUserIds.includes(member.user?.id ?? '');

  const isCurrentUser = member.user?.id === channel.getClient().userID;

  const channelMemberActionItemsParams = useMemo<ChannelMemberActionItemsParams>(
    () => ({
      channel,
      channelActions,
      icons,
      isBlocked,
      isCurrentUser,
      member,
      ownCapabilities,
      t,
      userActions,
      userMuteActive,
    }),
    [
      channel,
      channelActions,
      icons,
      isBlocked,
      isCurrentUser,
      member,
      ownCapabilities,
      t,
      userActions,
      userMuteActive,
    ],
  );

  const defaultItems = useMemo(
    () => buildDefaultChannelMemberActionItems(channelMemberActionItemsParams),
    [channelMemberActionItemsParams],
  );

  return useMemo(
    () =>
      getChannelMemberActionItemsProp({
        context: channelMemberActionItemsParams,
        defaultItems,
      }),
    [channelMemberActionItemsParams, defaultItems, getChannelMemberActionItemsProp],
  );
};
