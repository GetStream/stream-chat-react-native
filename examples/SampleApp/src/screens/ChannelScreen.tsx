import React, { useContext } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../context/AppContext';
import { AppTheme, LocalReactionType, StackNavigatorParamList } from '../types';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from '../types';
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
} from 'stream-chat-react-native/v2';
import { Channel as StreamChatChannel } from 'stream-chat';
import { ScreenHeader } from '../components/ScreenHeader';
import { useEffect } from 'react';
import { useState } from 'react';
import { useTypingString } from 'stream-chat-react-native/v2';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';

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
  const { colors } = useTheme() as AppTheme;
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row' }}>
      <Spinner />
      <Text
        style={{
          color: colors.textLight,
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
              navigation.navigate('OneOnOneChannelDetailScreen', {
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
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <Channel
          channel={channel}
          disableTypingIndicator
          enforceUniqueReaction
          initialScrollToFirstUnreadMessage
          keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : -300}
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
