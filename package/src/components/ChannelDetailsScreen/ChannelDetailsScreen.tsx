import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import {
  ChannelDetailsContextProvider,
  type ChannelDetailsContextValue,
} from '../../contexts/channelDetailsContext/channelDetailsContext';
import { useChannelDetailsContext } from '../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { TranslationContextValue } from '../../contexts/translationContext/TranslationContext';
import { useIsDirectChat } from '../../hooks/useIsDirectChat';
import { primitives } from '../../theme';
import { NotificationList } from '../Notifications/NotificationList';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

/**
 * Resolves the trailing role label rendered next to a member row in the channel details screen.
 *
 * Return `null` or `undefined` to render no label for the given member.
 */
export type GetMemberRoleLabel = (params: {
  channel: Channel;
  member: ChannelMemberResponse;
  t: TranslationContextValue['t'];
}) => string | null | undefined;

export type ChannelDetailsScreenProps = {
  channel: Channel;
  /**
   * Override the role label shown next to each member in the channel details screen.
   *
   * The default implementation labels members as `Owner` (channel creator),
   * `Admin` (`user.role === 'admin'`), or `Moderator` (`channel_role === 'channel_moderator'`),
   * with priority Owner > Admin > Moderator. Return `null` to render no label.
   */
  getMemberRoleLabel?: GetMemberRoleLabel;
  /**
   * Fired when the user taps the "add members" button, by default it opens the add members bottom sheet. Only visible if the current user has the `update-channel-members` capability.
   */
  onAddMembersPress?: () => void;
  /**
   * Fired when the back button is pressed on the channel details header.
   */
  onBack?: () => void;
  /** Fired after the channel is no longer available to the current user (delete or leave actions). */
  onChannelDismiss?: () => void;
  /**
   * Fired when the user taps the "view all members" button, by default it opens the members bottom sheet.
   */
  onViewAllMembersPress?: () => void;
};

export const ChannelDetailsScreenContent = () => {
  const { channel } = useChannelDetailsContext();
  const {
    theme: {
      channelDetailsScreen: { container: containerOverride, scrollContent: scrollContentOverride },
      semantics,
    },
  } = useTheme();
  const {
    ChannelDetailsActionsSection,
    ChannelDetailsMemberSection,
    ChannelDetailsNavigationSection,
    ChannelDetailsProfile,
    ChannelDetailsScreenHeader,
  } = useComponentsContext();
  const isDirect = useIsDirectChat(channel);
  const styles = useStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: semantics.backgroundCoreApp },
        containerOverride,
      ]}
    >
      <ChannelDetailsScreenHeader />
      <ScrollView contentContainerStyle={[styles.scrollContent, scrollContentOverride]}>
        <ChannelDetailsProfile />
        <ChannelDetailsNavigationSection />
        {isDirect ? null : <ChannelDetailsMemberSection />}
        <ChannelDetailsActionsSection />
      </ScrollView>
    </View>
  );
};

export const ChannelDetailsScreen = ({
  channel,
  getMemberRoleLabel,
  onAddMembersPress,
  onBack,
  onChannelDismiss,
  onViewAllMembersPress,
}: ChannelDetailsScreenProps) => {
  const { ChannelDetailsScreenContent: ChannelDetailsScreenContentOverride } =
    useComponentsContext();
  const value = useMemo<ChannelDetailsContextValue>(
    () => ({
      channel,
      getMemberRoleLabel,
      onAddMembersPress,
      onBack,
      onChannelDismiss,
      onViewAllMembersPress,
    }),
    [
      channel,
      getMemberRoleLabel,
      onAddMembersPress,
      onBack,
      onChannelDismiss,
      onViewAllMembersPress,
    ],
  );
  const Content = ChannelDetailsScreenContentOverride ?? ChannelDetailsScreenContent;
  const notificationHostId = channel?.cid ? `channel-details:${channel.cid}` : undefined;

  return (
    <ChannelDetailsContextProvider value={value}>
      {notificationHostId ? (
        <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
          <Content />
          <NotificationList />
        </NotificationTargetProvider>
      ) : (
        <Content />
      )}
    </ChannelDetailsContextProvider>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        scrollContent: {
          gap: primitives.spacingMd,
          paddingBottom: primitives.spacing3xl,
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacing2xl,
        },
      }),
    [],
  );
};
