import React, { useContext } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/stack';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
} from 'stream-chat-react-native/v2';
import { AppContext } from '../context/AppContext';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  NavigationParamsList,
} from '../types';
import streamTheme from '../utils/streamTheme';

export type ChannelScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'Channel'>;
};

export const ChannelScreen: React.FC<ChannelScreenProps> = () => {
  const { channel, chatClient, setThread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();

  return (
    <SafeAreaView>
      <Chat client={chatClient} style={streamTheme}>
        <Channel channel={channel} keyboardVerticalOffset={headerHeight}>
          <View style={{ flex: 1 }}>
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
                setThread(thread);
                if (channel?.id) {
                  navigation.navigate('Thread', { channelId: channel.id });
                }
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
};
