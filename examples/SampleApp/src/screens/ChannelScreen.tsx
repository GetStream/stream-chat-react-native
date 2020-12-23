import React, { useContext } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../context/AppContext';
import { AppTheme, LocalReactionType, StackNavigatorParamList } from '../types';
import { streamTheme } from '../utils/streamTheme';
import { GoBack } from '../icons/GoBack';
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
  Chat,
  getChannelPreviewDisplayAvatar,
  getChannelPreviewDisplayName,
  MessageInput,
  MessageList,
  useChannelContext,
  useChannelPreviewDisplayName,
} from 'stream-chat-react-native/v2';
import { Channel as StreamChatChannel } from 'stream-chat';
import {
  ScreenHeader,
  useScreenHeaderHeight,
} from '../components/ScreenHeader';
import { useEffect } from 'react';
import { useState } from 'react';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';
import truncate from 'lodash/truncate';
import { useTypingString } from '../../../../src/v2/components/MessageList/hooks/useTypingString';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const typing = useTypingString();
  const displayName = useChannelPreviewDisplayName(channel, 30);
  const membersStatus = useChannelMembersStatus(channel);
  if (!chatClient || !channel) return null;

  const isOneOnOneConversation =
    Object.values(channel.state.members).length === 2;

  if (isOneOnOneConversation) {
    const { user } = Object.values(channel.state.members).find(
      (m) => m.user?.id !== chatClient?.user?.id,
    );
    return (
      <ScreenHeader
        RightContent={() => (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('OneOnOneChannelDetailScreen', {
                channel,
              });
            }}
          >
            <Avatar image={user.image} size={40} />
          </TouchableOpacity>
        )}
        subtitle={typing ? typing : getUserActivityStatus(user)}
        title={displayName}
      />
    );
  }

  return (
    <ScreenHeader
      RightContent={() => (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('GroupChannelDetailsScreen', { channel });
          }}
        >
          <Avatar
            {...getChannelPreviewDisplayAvatar(channel, chatClient)}
            size={40}
          />
        </TouchableOpacity>
      )}
      subtitle={typing ? typing : `${membersStatus}`}
      title={displayName}
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
  const insets = useSafeAreaInsets();
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
    <View style={{ height: '100%'}}>
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
