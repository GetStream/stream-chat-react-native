import React, { useMemo } from 'react';

import type { BlockedUsersState, Channel, ChannelMemberResponse } from 'stream-chat';

import type { ActionItem } from './types';
import { useUserActions, UserActions } from './useUserActions';

import { useUserMuteActive } from '../../components/Message/hooks/useUserMuteActive';
import { useTheme, useTranslationContext } from '../../contexts';
import type { TranslationContextValue } from '../../contexts/translationContext/TranslationContext';
import { BlockUser, IconProps, Mute, Sound } from '../../icons';
import { useStateStore } from '../useStateStore';

export type ChannelMemberActionItem = ActionItem<'muteUser' | 'block' | string>;

export type ChannelMemberActionItemsParams = {
  actions: UserActions;
  channel: Channel;
  isBlocked: boolean;
  isCurrentUser: boolean;
  member: ChannelMemberResponse;
  t: TranslationContextValue['t'];
  userMuteActive: boolean;
};

export type BuildDefaultChannelMemberActionItems = (
  channelMemberActionItemsParams: ChannelMemberActionItemsParams,
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
    actions: { blockUser, muteUser, unblockUser, unmuteUser },
    isBlocked,
    isCurrentUser,
    t,
    userMuteActive,
  } = channelMemberActionItemsParams;

  const actionItems: ChannelMemberActionItem[] = [];

  // Muting or blocking yourself is meaningless, so these actions are only
  // added for other members.
  if (!isCurrentUser) {
    actionItems.push(
      {
        action: userMuteActive ? unmuteUser : muteUser,
        Icon: (props) =>
          userMuteActive ? (
            <ChannelMemberActionsIcon Icon={Sound} {...props} />
          ) : (
            <ChannelMemberActionsIcon
              Icon={Mute}
              {...props}
              fill={props.fill ?? props.stroke}
              stroke={undefined}
            />
          ),
        id: 'muteUser',
        label: userMuteActive ? t('Unmute User') : t('Mute User'),
        type: 'standard',
      },
      {
        action: isBlocked ? unblockUser : blockUser,
        Icon: (props) => <ChannelMemberActionsIcon Icon={BlockUser} {...props} />,
        id: 'block',
        label: isBlocked ? t('Unblock User') : t('Block User'),
        type: isBlocked ? 'standard' : 'destructive',
      },
    );
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
  const userActions = useUserActions(member.user);

  const userMuteActive = useUserMuteActive(member.user);

  const { userIds: blockedUserIds } = useStateStore(
    channel.getClient().blockedUsers,
    blockedUsersStateSelector,
  );

  const isBlocked = blockedUserIds.includes(member.user?.id ?? '');

  const isCurrentUser = member.user?.id === channel.getClient().userID;

  const channelMemberActionItemsParams = useMemo<ChannelMemberActionItemsParams>(
    () => ({
      actions: userActions,
      channel,
      isBlocked,
      isCurrentUser,
      member,
      t,
      userMuteActive,
    }),
    [channel, isBlocked, isCurrentUser, member, t, userActions, userMuteActive],
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
