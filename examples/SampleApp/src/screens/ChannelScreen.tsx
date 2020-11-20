import React, { useContext } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../context/AppContext';
import { AppTheme, StackNavigatorParamList } from '../types';
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
} from 'stream-chat-react-native/v2';
import { Channel as StreamChatChannel } from 'stream-chat';
import { ScreenHeader } from '../components/ScreenHeader';
import { useEffect } from 'react';
import { useState } from 'react';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';
import truncate from 'lodash/truncate';

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
  const { channel } = useChannelContext();
  const { colors } = useTheme() as AppTheme;
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
        subtitle={getUserActivityStatus(user)}
        title={getChannelPreviewDisplayName(channel, chatClient)}
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
      title={getChannelPreviewDisplayName(channel, chatClient)}
      subtitle={`${Object.keys(channel?.state.members).length} members`}
    />
  );
};

export const ChannelScreen: React.FC<ChannelScreenProps> = ({
  route: {
    params: { channelId },
  },
}) => {
  const { chatClient } = useContext(AppContext);
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    const initChannel = async () => {
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
      <Chat client={chatClient} style={streamTheme}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Channel channel={channel}>
            <ChannelHeader />
            <MessageList<
              LocalAttachmentType,
              LocalChannelType,
              LocalCommandType,
              LocalEventType,
              LocalMessageType,
              LocalResponseType,
              LocalUserType
            > />
            <MessageInput />
          </Channel>
        </View>
      </Chat>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    borderBottomColor: 'rgba(0, 0, 0, 0.0677)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
