import React, { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { getOtherUserInDirectChannel } from '../../../hooks/actions/useChannelActions';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';
import { primitives } from '../../../theme';
import { useRtlMirrorSwitchStyle } from '../../../utils/rtlMirrorSwitchStyle';
import { useMutedUsers } from '../../ChannelList/hooks/useMutedUsers';
import { useIsChannelMuted } from '../../ChannelPreview/hooks/useIsChannelMuted';
import { useChannelDetailsActionItems } from '../hooks';

export const ChannelDetailsActionsSection = () => {
  const { channel } = useChannelDetailsContext();
  const {
    theme: {
      channelDetailsScreen: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const { ChannelDetailsActionItem } = useComponentsContext();
  const isDirect = useIsDirectChat(channel);
  const styles = useStyles();
  const rtlMirrorSwitchStyle = useRtlMirrorSwitchStyle();

  const items = useChannelDetailsActionItems();
  const { muted: channelMuted } = useIsChannelMuted(channel);
  const mutedUsers = useMutedUsers(channel);
  const otherUserId = isDirect ? getOtherUserInDirectChannel(channel)?.user?.id : undefined;
  const userMuted =
    isDirect && !!otherUserId
      ? mutedUsers.some((mutedUser) => mutedUser.target.id === otherUserId)
      : false;

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
        const testID = `channel-details-action-${item.id}`;
        const isMuteToggle = item.id === 'mute' || item.id === 'muteUser';
        const trailing = isMuteToggle ? (
          <Switch
            onValueChange={() => item.action()}
            style={rtlMirrorSwitchStyle}
            testID={`${testID}-switch`}
            value={item.id === 'mute' ? channelMuted : userMuted}
          />
        ) : undefined;

        return (
          <ChannelDetailsActionItem
            destructive={item.type === 'destructive'}
            Icon={item.Icon}
            key={item.id}
            label={item.label}
            onPress={() => item.action()}
            testID={testID}
            trailing={trailing}
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
