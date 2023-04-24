import { useHeaderHeight } from '@react-navigation/elements';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { LogBox, SafeAreaView, useColorScheme, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel as ChannelType, ChannelSort, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
  Streami18n,
  Thread,
  ThreadContextValue,
  useAttachmentPickerContext,
} from 'stream-chat-expo';

import { useStreamChatTheme } from './useStreamChatTheme';

LogBox.ignoreAllLogs(true);

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

type AppContextType = {
  channel: ChannelType<StreamChatGenerics> | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelType<StreamChatGenerics> | undefined>>;
  setThread: React.Dispatch<
    React.SetStateAction<ThreadContextValue<StreamChatGenerics>['thread'] | undefined>
  >;
  thread: ThreadContextValue<StreamChatGenerics>['thread'] | undefined;
};

const chatClient = StreamChat.getInstance('q95x9hkbyd6p');
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
const sort: ChannelSort<StreamChatGenerics> = { last_message_at: -1 };
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

const ChannelListScreen = ({ navigation }) => {
  const { setChannel } = useContext(AppContext);

  const memoizedFilters = useMemo(() => filters, []);

  return (
    <View style={{ height: '100%' }}>
      <ChannelList
        filters={memoizedFilters}
        onSelect={(channel) => {
          setChannel(channel);
          navigation.navigate('Channel');
        }}
        options={options}
        sort={sort}
      />
    </View>
  );
};

const ChannelScreen = ({ navigation }) => {
  const { channel, setThread, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const { setTopInset } = useAttachmentPickerContext();

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight]);

  return (
    <SafeAreaView>
      <Channel channel={channel} keyboardVerticalOffset={headerHeight} thread={thread}>
        <View style={{ flex: 1 }}>
          <MessageList
            onThreadSelect={(thread) => {
              setThread(thread);
              navigation.navigate('Thread');
            }}
          />
          <MessageInput />
        </View>
      </Channel>
    </SafeAreaView>
  );
};

const ThreadScreen = () => {
  const { channel, setThread, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView>
      <Channel channel={channel} keyboardVerticalOffset={headerHeight} thread={thread} threadList>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
          }}
        >
          <Thread onThreadDismount={() => setThread(null)} />
        </View>
      </Channel>
    </SafeAreaView>
  );
};

const Stack = createStackNavigator();

const AppContext = React.createContext<AppContextType>({
  channel: undefined,
  setChannel: undefined,
  setThread: undefined,
  thread: undefined,
});

const App = () => {
  const colorScheme = useColorScheme();
  const { bottom } = useSafeAreaInsets();
  const theme = useStreamChatTheme();

  const [channel, setChannel] = useState<ChannelType<StreamChatGenerics>>();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      const connectPromise = chatClient.connectUser(user, userToken);
      setClientReady(true);
      await connectPromise;
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer
      theme={{
        colors: {
          ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
          background: theme.colors?.white_snow || '#FCFCFC',
        },
        dark: colorScheme === 'dark',
      }}
    >
      <AppContext.Provider value={{ channel, setChannel, setThread, thread }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <OverlayProvider
            bottomInset={bottom}
            i18nInstance={streami18n}
            translucentStatusBar
            value={{ style: theme }}
          >
            <Chat client={chatClient} i18nInstance={streami18n} enableOfflineSupport>
              {clientReady && (
                <Stack.Navigator
                  initialRouteName='ChannelList'
                  screenOptions={{
                    headerTitleStyle: { alignSelf: 'center', fontWeight: 'bold' },
                  }}
                >
                  <Stack.Screen
                    component={ChannelScreen}
                    name='Channel'
                    options={() => ({
                      headerBackTitle: 'Back',
                      headerRight: () => <></>,
                      headerTitle: channel?.data?.name,
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
                    options={() => ({ headerLeft: () => <></> })}
                  />
                </Stack.Navigator>
              )}
            </Chat>
          </OverlayProvider>
        </GestureHandlerRootView>
      </AppContext.Provider>
    </NavigationContainer>
  );
};

export default () => {
  const theme = useStreamChatTheme();
  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors?.white_snow || '#FCFCFC' }}>
      <App />
    </SafeAreaProvider>
  );
};
