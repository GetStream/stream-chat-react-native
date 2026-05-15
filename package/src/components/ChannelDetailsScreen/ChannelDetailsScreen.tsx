import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Channel } from 'stream-chat';

import {
  ChannelDetailsContextProvider,
  type ChannelDetailsContextValue,
} from '../../contexts/channelDetailsContext/channelDetailsContext';
import { useChannelDetailsContext } from '../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useIsDirectChat } from '../../hooks/useIsDirectChat';
import { primitives } from '../../theme';

export type ChannelDetailsScreenProps = {
  channel: Channel;
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
  onAddMembersPress,
  onBack,
  onChannelDismiss,
  onViewAllMembersPress,
}: ChannelDetailsScreenProps) => {
  const { ChannelDetailsScreenContent: ChannelDetailsScreenContentOverride } =
    useComponentsContext();
  const value = useMemo<ChannelDetailsContextValue>(
    () => ({ channel, onAddMembersPress, onBack, onChannelDismiss, onViewAllMembersPress }),
    [channel, onAddMembersPress, onBack, onChannelDismiss, onViewAllMembersPress],
  );
  const Content = ChannelDetailsScreenContentOverride ?? ChannelDetailsScreenContent;

  return (
    <ChannelDetailsContextProvider value={value}>
      <Content />
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
