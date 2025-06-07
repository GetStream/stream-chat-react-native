import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  DevSettings,
  I18nManager,
  LogBox,
  Platform,
  SafeAreaView,
  useColorScheme,
  View,
} from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Channel as ChannelType, ChannelSort } from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
  SqliteClient,
  Streami18n,
  Thread,
  ThreadContextValue,
  useCreateChatClient,
  useOverlayContext,
} from 'stream-chat-react-native';

import { useStreamChatTheme } from './useStreamChatTheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProgressLoader } from './AuthProgressLoader';

LogBox.ignoreAllLogs(true);

const options = {
  presence: true,
  state: true,
  watch: true,
  limit: 30,
};

I18nManager.forceRTL(false);

if (__DEV__) {
  DevSettings.addMenuItem('Reset local DB (offline storage)', () => {
    SqliteClient.resetDB();
    console.info('Local DB reset');
  });
}

const apiKey = 'q95x9hkbyd6p';
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

const sort: ChannelSort = [{ pinned_at: -1 }, { last_message_at: -1 }, { updated_at: -1 }];

/**
 * Start playing with streami18n instance here:
 * Please refer to description of this PR for details: https://github.com/GetStream/stream-chat-react-native/pull/150
 */
const streami18n = new Streami18n({
  language: 'en',
});

type ChannelListScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'ChannelList'>;
};

const ChannelListScreen: React.FC<ChannelListScreenProps> = ({ navigation }) => {
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

type ChannelScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'Channel'>;
};

const EmptyHeader = () => <></>;

const ChannelScreen: React.FC<ChannelScreenProps> = ({ navigation }) => {
  const { channel, setThread, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const { overlay } = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay, navigation]);

  if (channel === undefined) {
    return null;
  }

  return (
    <SafeAreaView>
      <Channel
        audioRecordingEnabled={true}
        channel={channel}
        keyboardVerticalOffset={headerHeight}
        thread={thread}
      >
        <View style={{ flex: 1 }}>
          <MessageList
            onThreadSelect={(selectedThread) => {
              setThread(selectedThread);
              if (channel?.id) {
                navigation.navigate('Thread');
              }
            }}
          />
          <MessageInput />
        </View>
      </Channel>
    </SafeAreaView>
  );
};

type ThreadScreenProps = {
  navigation: StackNavigationProp<ThreadRoute, 'Thread'>;
  route: RouteProp<ThreadRoute, 'Thread'>;
};

const ThreadScreen: React.FC<ThreadScreenProps> = ({ navigation }) => {
  const { channel, setThread, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const { overlay } = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay, navigation]);

  if (!channel) {
    return null;
  }

  return (
    <SafeAreaView>
      <Channel
        audioRecordingEnabled={true}
        channel={channel}
        keyboardVerticalOffset={headerHeight}
        thread={thread}
        threadList
      >
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

type ChannelRoute = { Channel: undefined };
type ChannelListRoute = { ChannelList: undefined };
type ThreadRoute = { Thread: undefined };
type NavigationParamsList = ChannelRoute & ChannelListRoute & ThreadRoute;

const Stack = createStackNavigator<NavigationParamsList>();

type AppContextType = {
  channel: ChannelType | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelType | undefined>>;
  setThread: React.Dispatch<React.SetStateAction<ThreadContextValue['thread'] | undefined>>;
  thread: ThreadContextValue['thread'] | undefined;
};

const AppContext = React.createContext({} as AppContextType);

const StackNavigator = () => {
  const { channel } = useContext(AppContext);

  return (
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
          headerRight: EmptyHeader,
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
        options={() => ({
          headerBackTitle: 'Back',
          headerRight: EmptyHeader,
        })}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  const theme = useStreamChatTheme();

  const chatClient = useCreateChatClient({
    apiKey,
    userData: user,
    tokenOrProvider: userToken,
  });

  useEffect(() => {
    if (!chatClient) {
      return;
    }
    chatClient.setMessageComposerSetupFunction(({ composer }) => {
      composer.updateConfig({
        drafts: {
          enabled: true,
        },
      });
    });
  }, [chatClient]);

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider i18nInstance={streami18n} value={{ style: theme }}>
      <Chat client={chatClient} i18nInstance={streami18n} enableOfflineSupport>
        <StackNavigator />
      </Chat>
    </OverlayProvider>
  );
};

export default () => {
  const [channel, setChannel] = useState<ChannelType>();
  const [thread, setThread] = useState<ThreadContextValue['thread']>();
  const theme = useStreamChatTheme();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors?.white_snow || '#FCFCFC' }}>
      <NavigationContainer
        theme={{
          colors: {
            ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
          },
          fonts: (colorScheme === 'dark' ? DarkTheme : DefaultTheme).fonts,
          dark: colorScheme === 'dark',
        }}
      >
        <AppContext.Provider value={{ channel, setChannel, setThread, thread }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <App />
          </GestureHandlerRootView>
        </AppContext.Provider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
