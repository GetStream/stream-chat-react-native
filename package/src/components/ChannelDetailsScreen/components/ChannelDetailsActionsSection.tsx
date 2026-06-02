import React, { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { ChannelActionItem } from '../../../hooks/actions/useChannelActionItems';
import { getOtherUserInDirectChannel } from '../../../hooks/actions/useChannelActions';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';
import { primitives } from '../../../theme';
import { useRtlMirrorSwitchStyle } from '../../../utils/rtlMirrorSwitchStyle';
import { useMutedUsers } from '../../ChannelList/hooks/useMutedUsers';
import { useIsChannelMuted } from '../../ChannelPreview/hooks/useIsChannelMuted';
import { useChannelDetailsActionItems } from '../hooks';

const ChannelMuteToggleRow = ({ item }: { item: ChannelActionItem }) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelDetailsActionItem } = useComponentsContext();
  const rtlMirrorSwitchStyle = useRtlMirrorSwitchStyle();
  const { muted } = useIsChannelMuted(channel);
  const testID = `channel-details-action-${item.id}`;

  return (
    <ChannelDetailsActionItem
      destructive={item.type === 'destructive'}
      Icon={item.Icon}
      label={item.label}
      onPress={() => item.action()}
      testID={testID}
      trailing={
        <Switch
          onValueChange={() => item.action()}
          style={rtlMirrorSwitchStyle}
          testID={`${testID}-switch`}
          value={muted}
        />
      }
    />
  );
};

const UserMuteToggleRow = ({ item }: { item: ChannelActionItem }) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelDetailsActionItem } = useComponentsContext();
  const isDirect = useIsDirectChat(channel);
  const rtlMirrorSwitchStyle = useRtlMirrorSwitchStyle();
  const mutedUsers = useMutedUsers(channel);
  const otherUserId = isDirect ? getOtherUserInDirectChannel(channel)?.user?.id : undefined;
  const userMuted =
    isDirect && !!otherUserId
      ? mutedUsers.some((mutedUser) => mutedUser.target.id === otherUserId)
      : false;
  const testID = `channel-details-action-${item.id}`;

  return (
    <ChannelDetailsActionItem
      destructive={item.type === 'destructive'}
      Icon={item.Icon}
      label={item.label}
      onPress={() => item.action()}
      testID={testID}
      trailing={
        <Switch
          onValueChange={() => item.action()}
          style={rtlMirrorSwitchStyle}
          testID={`${testID}-switch`}
          value={userMuted}
        />
      }
    />
  );
};

export const ChannelDetailsActionsSection = () => {
  const {
    theme: {
      channelDetailsScreen: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const { ChannelDetailsActionItem } = useComponentsContext();
  const styles = useStyles();

  const items = useChannelDetailsActionItems();

  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: semantics.backgroundCoreSurfaceCard },
        sectionCardOverride,
      ]}
    >
      {items.map((item) => {
        if (item.id === 'mute') {
          return <ChannelMuteToggleRow item={item} key={item.id} />;
        }
        if (item.id === 'muteUser') {
          return <UserMuteToggleRow item={item} key={item.id} />;
        }

        return (
          <ChannelDetailsActionItem
            destructive={item.type === 'destructive'}
            Icon={item.Icon}
            key={item.id}
            label={item.label}
            onPress={() => item.action()}
            testID={`channel-details-action-${item.id}`}
          />
        );
      })}
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        sectionCard: {
          borderRadius: primitives.radiusLg,
          overflow: 'hidden',
          paddingVertical: primitives.spacingXs,
        },
      }),
    [],
  );
};
