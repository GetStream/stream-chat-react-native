import React, { useCallback, useEffect, useState } from 'react';
import type { LocalMessage, Channel as StreamChatChannel } from 'stream-chat';
import { RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Channel,
  ChannelAvatar,
  MessageInput,
  MessageList,
  ThreadContextValue,
  useAttachmentPickerContext,
  useChannelPreviewDisplayName,
  useChatContext,
  useTheme,
  useTypingString,
  AITypingIndicatorView,
  useTranslationContext,
  MessageActionsParams,
} from 'stream-chat-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';

import type { StackNavigatorParamList } from '../types';
import { NetworkDownIndicator } from '../components/NetworkDownIndicator';
import { useCreateDraftFocusEffect } from '../utils/useCreateDraftFocusEffect.tsx';
import { MessageReminderHeader } from '../components/Reminders/MessageReminderHeader.tsx';
import { channelMessageActions } from '../utils/messageActions.tsx';
import { MessageLocation } from '../components/LocationSharing/MessageLocation.tsx';
import { useStreamChatContext } from '../context/StreamChatContext.tsx';
import { CustomAttachmentPickerSelectionBar } from '../components/AttachmentPickerSelectionBar.tsx';

export type ChannelScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChannelScreen'
>;
export type ChannelScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelScreen'>;
export type ChannelScreenProps = {
  navigation: ChannelScreenNavigationProp;
  route: ChannelScreenRouteProp;
};

export type ChannelHeaderProps = {
  channel: StreamChatChannel;
};

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
  const { closePicker } = useAttachmentPickerContext();
  const membersStatus = useChannelMembersStatus(channel);
  const displayName = useChannelPreviewDisplayName(channel, 30);
  const { isOnline } = useChatContext();
  const { chatClient } = useAppContext();
  const navigation = useNavigation<ChannelScreenNavigationProp>();
  const typing = useTypingString();

  const isOneOnOneConversation =
    channel &&
    Object.values(channel.state.members).length === 2 &&
    channel.id?.indexOf('!members-') === 0;

  const onBackPress = useCallback(() => {
    if (!navigation.canGoBack()) {
      // if no previous screen was present in history, go to the list screen
      // this can happen when opened through push notification
      navigation.reset({ index: 0, routes: [{ name: 'MessagingScreen' }] });
    } else {
      navigation.goBack();
    }
  }, [navigation]);

  useCreateDraftFocusEffect();

  const onRightContentPress = useCallback(() => {
    closePicker();
    if (isOneOnOneConversation) {
      navigation.navigate('OneOnOneChannelDetailScreen', {
        channel,
      });
    } else {
      navigation.navigate('GroupChannelDetailsScreen', {
        channel,
      });
    }
  }, [channel, closePicker, isOneOnOneConversation, navigation]);

  if (!channel || !chatClient) {
    return null;
  }

  return (
    <ScreenHeader
      onBack={onBackPress}
      // eslint-disable-next-line react/no-unstable-nested-components
      RightContent={() => (
        <Pressable
          onPress={onRightContentPress}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <ChannelAvatar channel={channel} />
        </Pressable>
      )}
      showUnreadCountBadge
      Subtitle={isOnline ? undefined : NetworkDownIndicator}
      subtitleText={typing ? typing : membersStatus}
      titleText={displayName}
    />
  );
};

// Either provide channel or channelId.
export const ChannelScreen: React.FC<ChannelScreenProps> = ({
  route: {
    params: { channel: channelFromProp, channelId, messageId },
  },
}) => {
  const { chatClient } = useAppContext();
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const {
    theme: { colors },
  } = useTheme();
  const { t } = useTranslationContext();
  const { setThread } = useStreamChatContext();

  const [channel, setChannel] = useState<StreamChatChannel | undefined>(channelFromProp);

  const [selectedThread, setSelectedThread] = useState<ThreadContextValue['thread']>();

  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient || !channelId || channelFromProp) {
        return;
      }

      const newChannel = chatClient?.channel('messaging', channelId);
      try {
        if (!newChannel?.initialized) {
          await newChannel?.watch();
        }
      } catch (error) {
        console.log('An error has occurred while watching the channel: ', error);
      }
      setChannel(newChannel);
    };

    initChannel();
  }, [channelFromProp, channelId, chatClient]);

  useFocusEffect(() => {
    setSelectedThread(undefined);
  });

  const onPressMessage: NonNullable<React.ComponentProps<typeof Channel>['onPressMessage']> = (
    payload,
  ) => {
    const { message, defaultHandler, emitter } = payload;
    const { shared_location } = message ?? {};
    if (emitter === 'messageContent' && shared_location) {
      navigation.navigate('MapScreen', shared_location);
    }
    defaultHandler?.();
  };

  const onThreadSelect = useCallback(
    (thread: LocalMessage | null) => {
      setSelectedThread(thread);
      setThread(thread);
      navigation.navigate('ThreadScreen', {
        channel,
        thread,
      });
    },
    [channel, navigation, setThread],
  );

  const messageActions = useCallback(
    (params: MessageActionsParams) => {
      if (!chatClient) {
        return [];
      }
      return channelMessageActions({
        params,
        chatClient,
        t,
        colors,
      });
    },
    [chatClient, colors, t],
  );

  if (!channel || !chatClient) {
    return null;
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.white, paddingBottom: bottom }]}>
      <Channel
        audioRecordingEnabled={true}
        AttachmentPickerSelectionBar={CustomAttachmentPickerSelectionBar}
        channel={channel}
        onPressMessage={onPressMessage}
        disableTypingIndicator
        enforceUniqueReaction
        initialScrollToFirstUnreadMessage
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
        messageActions={messageActions}
        MessageHeader={MessageReminderHeader}
        MessageLocation={MessageLocation}
        messageId={messageId}
        NetworkDownIndicator={() => null}
        thread={selectedThread}
      >
        <ChannelHeader channel={channel} />
        <MessageList onThreadSelect={onThreadSelect} />
        <AITypingIndicatorView channel={channel} />
        <MessageInput />
      </Channel>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
