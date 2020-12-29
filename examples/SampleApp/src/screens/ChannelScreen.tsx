import React, { useContext, useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Channel as StreamChatChannel } from 'stream-chat';
import {
  Avatar,
  Channel,
  getChannelPreviewDisplayAvatar,
  MessageInput,
  MessageList,
  Spinner,
  useChannelContext,
  useChannelPreviewDisplayName,
  useChatContext,
  useTheme,
  useTypingString,
} from 'stream-chat-react-native/v2';

import { ScreenHeader } from '../components/ScreenHeader';
import { AppContext } from '../context/AppContext';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalResponseType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ChannelScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChannelScreen'
>;
export type ChannelScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'ChannelScreen'
>;
export type ChannelScreenProps = {
  navigation: ChannelScreenNavigationProp;
  route: ChannelScreenRouteProp;
};

export type ChannelHeaderProps = unknown;

export const NetworkDownIndicator = () => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row' }}>
      <Spinner />
      <Text
        style={{
          color: grey,
          fontSize: 12,
          fontWeight: '400',
          marginLeft: 5,
        }}
      >
        Searching for network
      </Text>
    </View>
  );
};

const ChannelHeader: React.FC<ChannelHeaderProps> = () => {
  const navigation = useNavigation<ChannelScreenNavigationProp>();
  const { chatClient } = useContext(AppContext);
  const { channel } = useChannelContext<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >();
  const displayName = useChannelPreviewDisplayName(channel, 30);
  const membersStatus = useChannelMembersStatus(channel);
  const { isOnline } = useChatContext();
  const typing = useTypingString();

  if (!chatClient || !channel) return null;

  const isOneOnOneConversation =
    Object.values(channel.state.members).length === 2 &&
    channel.id?.indexOf('!members-') === 0;

  return (
    <ScreenHeader
      RightContent={() => (
        <TouchableOpacity
          onPress={() => {
            if (isOneOnOneConversation) {
              navigation.navigate('OneOnOneChannelDetailScreen', {
                channel,
              });
            } else {
              navigation.navigate('GroupChannelDetailsScreen', {
                channel,
              });
            }
          }}
        >
          <Avatar
            {...getChannelPreviewDisplayAvatar(channel, chatClient)}
            size={40}
          />
        </TouchableOpacity>
      )}
      Subtitle={isOnline ? null : NetworkDownIndicator}
      subtitleText={typing ? typing : membersStatus}
      titleText={displayName}
    />
  );
};

export const ChannelScreen: React.FC<ChannelScreenProps> = ({
  route: {
    params: { channelId, messageId },
  },
}) => {
  const { chatClient } = useContext(AppContext);
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const [channel, setChannel] = useState<StreamChatChannel<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  > | null>(null);

  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient) return;

      const channel = chatClient?.channel('messaging', channelId);
      if (!channel?.initialized) {
        await channel?.watch();
      }
      setChannel(channel);
    };

    initChannel();
  }, []);

  if (!channel || !chatClient) return null;

  return (
    <View style={{ height: '100%' }}>
      <View style={{ flexGrow: 1, flexShrink: 1, paddingBottom: bottom }}>
        <Channel
          channel={channel}
          disableTypingIndicator
          enforceUniqueReaction
          initialScrollToFirstUnreadMessage
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
          messageId={messageId}
        >
          <ChannelHeader />
          <MessageList<
            LocalAttachmentType,
            LocalChannelType,
            LocalCommandType,
            LocalEventType,
            LocalMessageType,
            LocalResponseType,
            LocalUserType
          >
            onThreadSelect={(thread) => {
              navigation.navigate('ThreadScreen', {
                channel,
                thread,
              });
            }}
          />
          <MessageInput />
        </Channel>
      </View>
    </View>
  );
};
