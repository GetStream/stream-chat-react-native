import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from 'react-native';
import { useChatClient } from './useChatClient';
import { ChannelList, Chat, MessageInput, MessageList, OverlayProvider, Thread } from 'stream-chat-react-native';
import { StreamChat } from 'stream-chat';
import { chatApiKey, chatUserId } from './chatConfig';
import { Channel } from 'stream-chat-react-native-core/src';

const chatClient = StreamChat.getInstance(chatApiKey);

const Stack = createStackNavigator();

const filters = {
  members: {
    '$in': [chatUserId],
  },
};

const sort = {
  last_message_at: -1,
};

const ThreadScreen = props => {
  const { route } = props;
  const { params: { channel, message } } = route;

  return (
    <Channel channel={channel} thread={message} threadList>
      <Thread />
    </Channel>
  );};

const ChannelScreen = props => {
  const { route, navigation } = props;
  const { params: { channel } } = route;

  return (
    <Channel channel={channel}>
      <MessageList
        onThreadSelect={(message) => {
          if (channel?.id) {
            navigation.navigate('ThreadScreen', { channel, message });
          }
        }}
      />
      <MessageInput />
    </Channel>
  );
};

const ChannelListScreen = props => {
  return (
    <ChannelList
      filters={filters}
      sort={sort}
      onSelect={(channel) => {
        const { navigation } = props;
        navigation.navigate('ChannelScreen', { channel });
      }}
    />
  );
};

const NavigationStack = () => {
  const { clientIsReady } = useChatClient();

  if (!clientIsReady) {
    return <Text>Loading chat ...</Text>;
  }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>
        <Stack.Navigator>
          <Stack.Screen name='ChannelList' component={ChannelListScreen} />
          <Stack.Screen name='ChannelScreen' component={ChannelScreen} />
          <Stack.Screen name='ThreadScreen' component={ThreadScreen} />
        </Stack.Navigator>
      </Chat>
    </OverlayProvider>
  );
};
export default () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer>
          <NavigationStack />
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};
