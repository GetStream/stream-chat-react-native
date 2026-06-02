import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const switchColors = useSwitchColors();
  const [isMuted, setIsMuted] = useState(muted);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  const handleValueChange = useCallback(
    (value: boolean) => {
      setIsMuted(value);
      const onFailure = () => {
        setIsMuted(!value);
      };
      item.action({ onFailure });
    },
    [item],
  );

  const testID = `channel-details-action-${item.id}`;

  return (
    <ChannelDetailsActionItem
      destructive={item.type === 'destructive'}
      Icon={item.Icon}
      label={item.label}
      testID={testID}
      trailing={
        <Switch
          {...switchColors}
          onValueChange={handleValueChange}
          style={rtlMirrorSwitchStyle}
          testID={`${testID}-switch`}
          value={isMuted}
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
  const switchColors = useSwitchColors();
  const mutedUsers = useMutedUsers(channel);
  const otherUserId = isDirect ? getOtherUserInDirectChannel(channel)?.user?.id : undefined;
  const userMuted =
    isDirect && !!otherUserId
      ? mutedUsers.some((mutedUser) => mutedUser.target.id === otherUserId)
      : false;
  const [isUserMuted, setIsUserMuted] = useState(userMuted);

  useEffect(() => {
    setIsUserMuted(userMuted);
  }, [userMuted]);

  const handleValueChange = useCallback(
    (value: boolean) => {
      setIsUserMuted(value);
      item.action({ onFailure: () => setIsUserMuted(!value) });
    },
    [item],
  );

  const testID = `channel-details-action-${item.id}`;

  return (
    <ChannelDetailsActionItem
      destructive={item.type === 'destructive'}
      Icon={item.Icon}
      label={item.label}
      testID={testID}
      trailing={
        <Switch
          {...switchColors}
          onValueChange={handleValueChange}
          style={rtlMirrorSwitchStyle}
          testID={`${testID}-switch`}
          value={isUserMuted}
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

const useSwitchColors = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () => ({
      ios_backgroundColor: semantics.controlToggleSwitchBg,
      thumbColor: semantics.controlToggleSwitchKnob,
      trackColor: {
        false: semantics.controlToggleSwitchBg,
        true: semantics.controlToggleSwitchBgSelected,
      },
    }),
    [semantics],
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
