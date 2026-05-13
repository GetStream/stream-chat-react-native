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
  onBack?: () => void;
  /** Fired after the channel is no longer available to the current user (delete or leave). */
  onChannelDismiss?: () => void;
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
  onBack,
  onChannelDismiss,
}: ChannelDetailsScreenProps) => {
  const { ChannelDetailsScreenContent: ChannelDetailsScreenContentOverride } =
    useComponentsContext();
  const value = useMemo<ChannelDetailsContextValue>(
    () => ({ channel, onBack, onChannelDismiss }),
    [channel, onBack, onChannelDismiss],
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
