/* eslint-disable react/display-name */
import 'react-native-gesture-handler';
import React, { useContext, useEffect, useState } from 'react';
import {
  LogBox,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, useHeaderHeight } from '@react-navigation/stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelList,
  ChannelPreviewMessenger,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
  Streami18n,
  Thread,
  useAttachmentPickerContext,
} from 'stream-chat-expo/v2';

LogBox.ignoreAllLogs(true);

// Read more about style customizations at - https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
const theme = {
  avatar: {
    image: {
      height: 32,
      width: 32,
    },
  },
  spinner: {
    height: 15,
    width: 15,
  },
};

const chatClient = new StreamChat('q95x9hkbyd6p');
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
const user = {
  id: 'ron',
};

const filters = {
  example: 'example-apps',
  members: { $in: ['ron'] },
  type: 'messaging',
};
const sort = { last_message_at: -1 };
const options = {
  state: true,
  watch: true,
};

/**
 * Start playing with streami18n instance here:
 * Please refer to description of this PR for details: https://github.com/GetStream/stream-chat-react-native/pull/150
 */
const streami18n = new Streami18n({
  language: 'en',
});

const ChannelListScreen = React.memo(({ navigation }) => {
  const { setChannel } = useContext(AppContext);
  return (
    <Chat client={chatClient} i18nInstance={streami18n}>
      <View style={{ height: '100%', padding: 10 }}>
        <ChannelList
          filters={filters}
          onSelect={(channel) => {
            setChannel(channel);
            navigation.navigate('Channel');
          }}
          options={options}
          Preview={ChannelPreviewMessenger}
          sort={sort}
        />
      </View>
    </Chat>
  );
});

const ChannelScreen = React.memo(({ navigation }) => {
  const { channel, setThread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const { setTopInset } = useAttachmentPickerContext();

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight]);

  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <Channel channel={channel} keyboardVerticalOffset={headerHeight}>
          <View style={{ flex: 1 }}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                navigation.navigate('Thread', { channelId: channel.id });
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

const ThreadScreen = React.memo(({ route }) => {
  const { thread } = useContext(AppContext);
  const [channel] = useState(
    chatClient.channel('messaging', route.params.channelId),
  );
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <Channel
          channel={channel}
          keyboardVerticalOffset={headerHeight}
          thread={thread}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-start',
            }}
          >
            <Thread thread={thread} />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

const Stack = createStackNavigator();

const AppContext = React.createContext();

const App = () => {
  const { bottom } = useSafeAreaInsets();
  const [channel, setChannel] = useState();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.connectUser(user, userToken);

      setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer>
      <AppContext.Provider value={{ channel, setChannel, setThread, thread }}>
        <OverlayProvider bottomInset={bottom} value={{ style: theme }}>
          {clientReady && (
            <Stack.Navigator
              initialRouteName='ChannelList'
              screenOptions={{
                cardStyle: { backgroundColor: 'white' },
                headerTitleStyle: { alignSelf: 'center', fontWeight: 'bold' },
              }}
            >
              <Stack.Screen
                component={ChannelScreen}
                name='Channel'
                options={() => ({
                  headerBackTitle: 'Back',
                  headerRight: () => <></>,
                  headerTitle: channel.data.name,
                })}
              />
              <Stack.Screen
                component={ChannelListScreen}
                name='ChannelList'
                options={{ headerTitle: 'Channel List' }}
              />
              <Stack.Screen
                component={ThreadScreen}
                name='Thread'
                options={({ navigation }) => ({
                  headerLeft: () => <></>,
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.goBack();
                      }}
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 20,
                      }}
                    >
                      <View
                        style={{
                          alignItems: 'center',
                          backgroundColor: 'white',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: 3,
                          borderStyle: 'solid',
                          borderWidth: 1,
                          height: 30,
                          justifyContent: 'center',
                          width: 30,
                        }}
                      >
                        <Text>X</Text>
                      </View>
                    </TouchableOpacity>
                  ),
                })}
              />
            </Stack.Navigator>
          )}
        </OverlayProvider>
      </AppContext.Provider>
    </NavigationContainer>
  );
};

export default () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);
