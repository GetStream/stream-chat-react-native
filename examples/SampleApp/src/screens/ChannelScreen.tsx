import React, { useCallback, useEffect, useState } from 'react';
import type { LocalMessage, Channel as StreamChatChannel } from 'stream-chat';
import { RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  AlsoSentToChannelHeaderPressPayload,
  Channel,
  MessageInput,
  MessageList,
  MessageFlashList,
  ThreadContextValue,
  useAttachmentPickerContext,
  useChannelPreviewDisplayName,
  useChatContext,
  useTheme,
  AITypingIndicatorView,
  useTranslationContext,
  MessageActionsParams,
  ChannelAvatar,
  PortalWhileClosingView,
} from 'stream-chat-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppContext } from '../context/AppContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';

import type { StackNavigatorParamList } from '../types';
import { NetworkDownIndicator } from '../components/NetworkDownIndicator';
import { useCreateDraftFocusEffect } from '../utils/useCreateDraftFocusEffect.tsx';
import { channelMessageActions } from '../utils/messageActions.tsx';
import { MessageLocation } from '../components/LocationSharing/MessageLocation.tsx';
import { useStreamChatContext } from '../context/StreamChatContext.tsx';
import { CustomAttachmentPickerSelectionBar } from '../components/AttachmentPickerSelectionBar.tsx';
import { MessageInfoBottomSheet } from '../components/MessageInfoBottomSheet.tsx';
import { CustomAttachmentPickerContent } from '../components/AttachmentPickerContent.tsx';
import { ThreadType } from 'stream-chat-react-native-core';

export type ChannelScreenNavigationProp = NativeStackNavigationProp<
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
          <ChannelAvatar channel={channel} size='lg' />
        </Pressable>
      )}
      showUnreadCountBadge
      Subtitle={isOnline ? undefined : NetworkDownIndicator}
      subtitleText={membersStatus}
      titleText={displayName}
    />
  );
};

// Either provide channel or channelId.
export const ChannelScreen: React.FC<ChannelScreenProps> = ({
  navigation,
  route,
}) => {
  const { channel: channelFromProp, channelId, messageId } = route.params;
  const {
    chatClient,
    messageListImplementation,
    messageListMode,
    messageListPruning,
    messageInputFloating,
  } = useAppContext();
  const {
    theme: { semantics, colors },
  } = useTheme();
  const { t } = useTranslationContext();
  const { setThread } = useStreamChatContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<LocalMessage | undefined>(undefined);

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
      if (!thread || !channel) {
        return;
      }

      if (messageId) {
        navigation.setParams({ messageId: undefined });
      }

      setSelectedThread(thread);
      setThread(thread);
      navigation.navigate('ThreadScreen', {
        channel,
        thread,
        targetedMessageId: undefined,
      });
    },
    [channel, messageId, navigation, setThread],
  );

  const onAlsoSentToChannelHeaderPress = useCallback(
    async ({ parentMessage, targetedMessageId }: AlsoSentToChannelHeaderPressPayload) => {
      if (!channel || !parentMessage) {
        return;
      }

      if (messageId) {
        navigation.setParams({ messageId: undefined });
      }

      setSelectedThread(parentMessage);
      setThread(parentMessage);
      const params: StackNavigatorParamList['ThreadScreen'] = {
        channel,
        targetedMessageId,
        thread: parentMessage,
      };
      const hasThreadInStack = navigation.getState().routes.some((stackRoute) => {
        if (stackRoute.name !== 'ThreadScreen') {
          return false;
        }
        const routeParams = stackRoute.params as StackNavigatorParamList['ThreadScreen'] | undefined;
        const routeThreadId =
          (routeParams?.thread as LocalMessage)?.id ??
          (routeParams?.thread as ThreadType)?.thread?.id;
        const routeChannelId = routeParams?.channel?.id;
        return routeThreadId === parentMessage.id && routeChannelId === channel.id;
      });

      if (hasThreadInStack) {
        navigation.popTo('ThreadScreen', params);
        return;
      }

      navigation.navigate('ThreadScreen', params);
    },
    [channel, messageId, navigation, setThread],
  );

  const handleMessageInfo = useCallback((message: LocalMessage) => {
    setSelectedMessage(message);
    setModalVisible(true);
  }, []);

  const handleMessageInfoClose = useCallback(() => {
    setModalVisible(false);
  }, []);

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
        semantics,
        handleMessageInfo,
      });
    },
    [chatClient, t, colors, semantics, handleMessageInfo],
  );

  if (!channel || !chatClient) {
    return null;
  }

  return (
    <View style={[styles.flex, { backgroundColor: 'transparent' }]}>
      <Channel
        audioRecordingEnabled={true}
        AttachmentPickerSelectionBar={CustomAttachmentPickerSelectionBar}
        AttachmentPickerContent={CustomAttachmentPickerContent}
        channel={channel}
        messageInputFloating={messageInputFloating}
        onPressMessage={onPressMessage}
        initialScrollToFirstUnreadMessage
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
        messageActions={messageActions}
        MessageLocation={MessageLocation}
        messageId={messageId}
        NetworkDownIndicator={() => null}
        onAlsoSentToChannelHeaderPress={onAlsoSentToChannelHeaderPress}
        thread={selectedThread}
        maximumMessageLimit={messageListPruning}
      >
        <PortalWhileClosingView
          portalHostName='overlay-header'
          portalName='channel-header'
        >
          <ChannelHeader channel={channel} />
        </PortalWhileClosingView>
        {messageListImplementation === 'flashlist' ? (
          <MessageFlashList
            onThreadSelect={onThreadSelect}
            isLiveStreaming={messageListMode === 'livestream'}
          />
        ) : (
          <MessageList
            onThreadSelect={onThreadSelect}
            isLiveStreaming={messageListMode === 'livestream'}
          />
        )}
        <AITypingIndicatorView channel={channel} />
        <MessageInput />
        {modalVisible && (
          <MessageInfoBottomSheet
            visible={modalVisible}
            message={selectedMessage}
            onClose={handleMessageInfoClose}
          />
        )}
      </Channel>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
