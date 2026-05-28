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
import type { GetChannelActionItems } from '../../hooks/actions/useChannelActionItems';
import type { GetChannelMemberActionItems } from '../../hooks/actions/useChannelMemberActionItems';
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
   * Compress image with quality (from 0 to 1, where 1 is best quality).
   * On iOS, values larger than 0.8 don't produce a noticeable quality increase in most images,
   * while a value of 0.8 will reduce the file size by about half or less compared to a value of 1.
   * Image picker defaults to 0.8 for iOS and 1 for Android
   */
  compressImageQuality?: number;
  /**
   * Customize the list of action items rendered in the channel details actions section.
   *
   * Receives the default items the SDK produces for the current channel and returns the
   * final list to render. Use this to filter, reorder, replace, or add items.
   *
   * The SDK still wires `onChannelDismiss` into the resulting `leave` and `deleteChannel`
   * items (matched by `id`) after this callback runs, so those actions continue to dismiss
   * the screen on success regardless of how the items are customized.
   */
  getChannelActionItems?: GetChannelActionItems;
  /**
   * Customize the list of action items rendered in the per-member actions bottom sheet
   * (the sheet that opens when a member row is tapped).
   *
   * Receives the default items the SDK produces for the tapped member (e.g. `muteUser`,
   * `block`) and returns the final list to render. Use this to filter, reorder, replace,
   * or add items — for example, to inject a "Send Direct Message" action in your app.
   */
  getChannelMemberActionItems?: GetChannelMemberActionItems;
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
   * Fired when the user taps the "Edit" button in the channel details header.
   * The button is only rendered when the current user has the `update-channel`
   * capability. By default it opens the channel edit details modal. Not shown in direct (1:1) channels.
   */
  onEditChannelPress?: () => void;
  /**
   * Fired when the user taps a member row. Receives the tapped member.
   *
   * Applies both to the member preview on the channel details screen and to the full
   * list opened via the "view all members" modal. If omitted, the default behavior is
   * to open the per-member actions bottom sheet (mute, block, etc.).
   */
  onMemberPress?: (member: ChannelMemberResponse) => void;
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
  compressImageQuality,
  getChannelActionItems,
  getChannelMemberActionItems,
  getMemberRoleLabel,
  onAddMembersPress,
  onBack,
  onChannelDismiss,
  onEditChannelPress,
  onMemberPress,
  onViewAllMembersPress,
}: ChannelDetailsScreenProps) => {
  const { ChannelDetailsScreenContent: ChannelDetailsScreenContentOverride } =
    useComponentsContext();
  const value = useMemo<ChannelDetailsContextValue>(
    () => ({
      channel,
      compressImageQuality,
      getChannelActionItems,
      getChannelMemberActionItems,
      getMemberRoleLabel,
      onAddMembersPress,
      onBack,
      onChannelDismiss,
      onEditChannelPress,
      onMemberPress,
      onViewAllMembersPress,
    }),
    [
      channel,
      compressImageQuality,
      getChannelActionItems,
      getChannelMemberActionItems,
      getMemberRoleLabel,
      onAddMembersPress,
      onBack,
      onChannelDismiss,
      onEditChannelPress,
      onMemberPress,
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
