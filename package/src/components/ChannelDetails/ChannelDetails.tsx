import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChannelDetailsContext } from '../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useIsDirectChat } from '../../hooks/useIsDirectChat';
import { primitives } from '../../theme';
import { NotificationList } from '../Notifications/NotificationList';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export type ChannelDetailsProps = {
  /**
   * Fired when the back button is pressed on the channel details header.
   */
  onBack?: () => void;
};

export const ChannelDetailsContent = ({ onBack }: Pick<ChannelDetailsProps, 'onBack'>) => {
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
      <ChannelDetailsNavHeader
        action={
          isDirect ? undefined : (
            <View style={{ flexShrink: 0, flexGrow: 0 }}>
              <ChannelDetailsEditButton />
            </View>
          )
        }
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={[styles.scrollContent, scrollContentOverride]}>
        <ChannelDetailsProfile />
        <ChannelDetailsNavigationSection />
        {isDirect ? null : <ChannelDetailsMemberSection />}
        <ChannelDetailsActionsSection />
      </ScrollView>
    </View>
  );
};

export const ChannelDetails = ({ onBack }: ChannelDetailsProps) => {
  const { ChannelDetailsContent: ChannelDetailsContentOverride } = useComponentsContext();
  const { channel } = useChannelDetailsContext();
  const Content = ChannelDetailsContentOverride ?? ChannelDetailsContent;
  const notificationHostId = channel?.cid ? `channel-details:${channel.cid}` : undefined;

  return notificationHostId ? (
    <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
      <Content onBack={onBack} />
      <NotificationList />
    </NotificationTargetProvider>
  ) : (
    <Content onBack={onBack} />
  );
};

const useStyles = () => {
  const insets = useSafeAreaInsets();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        scrollContent: {
          gap: primitives.spacingMd,
          paddingBottom: primitives.spacing3xl,
          // Not on the outer container: the nav header already insets itself.
          paddingLeft: insets.left + primitives.spacingMd,
          paddingRight: insets.right + primitives.spacingMd,
          paddingTop: primitives.spacing2xl,
        },
      }),
    [insets.left, insets.right],
  );
};
