import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Channel } from 'stream-chat';

import {
  ChannelDetailsContextProvider,
  type ChannelDetailsContextValue,
} from '../../contexts/channelDetailsContext/channelDetailsContext';
import { useChannelDetailsContext } from '../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { OwnCapabilitiesProvider } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useIsDirectChat } from '../../hooks/useIsDirectChat';
import { primitives } from '../../theme';

import { useCreateOwnCapabilitiesContext } from '../Channel/hooks/useCreateOwnCapabilitiesContext';

export type ChannelDetailsScreenProps = {
  channel: Channel;
  /**
   * Fired when the user taps the add-members button in the all-members bottom sheet.
   * The button is shown whenever the current user has the `update-channel-members`
   * capability; until this callback is provided the press is a no-op.
   */
  onAddMembersPress?: () => void;
  onBack?: () => void;
  /** Fired after the channel is no longer available to the current user (delete or leave). */
  onChannelDismiss?: () => void;
  /**
   * Override for the default "View all" members behavior. When provided, the member
   * section calls this callback instead of opening the built-in bottom-sheet — use it
   * to navigate to a dedicated members screen instead.
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
  const ownCapabilitiesContext = useCreateOwnCapabilitiesContext({ channel });
  const Content = ChannelDetailsScreenContentOverride ?? ChannelDetailsScreenContent;

  return (
    <ChannelDetailsContextProvider value={value}>
      <OwnCapabilitiesProvider value={ownCapabilitiesContext}>
        <Content />
      </OwnCapabilitiesProvider>
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
