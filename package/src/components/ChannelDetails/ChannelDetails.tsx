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
import { NotificationList } from '../Notifications/NotificationList';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export type ChannelDetailsProps = {
  channel: Channel;
  /**
   * Fired when the back button is pressed on the channel details header.
   */
  onBack?: () => void;
};

export const ChannelDetailsContent = () => {
  const { channel } = useChannelDetailsContext();
  const {
    theme: {
      channelDetails: { container: containerOverride, scrollContent: scrollContentOverride },
      semantics,
    },
  } = useTheme();
  const {
    ChannelDetailsActionsSection,
    ChannelDetailsEditButton,
    ChannelDetailsMemberSection,
    ChannelDetailsNavigationSection,
    ChannelDetailsProfile,
    ChannelDetailsNavHeader,
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
      <ChannelDetailsNavHeader action={<ChannelDetailsEditButton />} />
      <ScrollView contentContainerStyle={[styles.scrollContent, scrollContentOverride]}>
        <ChannelDetailsProfile />
        <ChannelDetailsNavigationSection />
        {isDirect ? null : <ChannelDetailsMemberSection />}
        <ChannelDetailsActionsSection />
      </ScrollView>
    </View>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetails = ({ channel, onBack }: ChannelDetailsProps) => {
  const { ChannelDetailsContent: ChannelDetailsContentOverride } = useComponentsContext();
  const value = useMemo<ChannelDetailsContextValue>(
    () => ({
      channel,
      onBack,
    }),
    [channel, onBack],
  );
  const Content = ChannelDetailsContentOverride ?? ChannelDetailsContent;
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
