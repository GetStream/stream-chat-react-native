import React, { useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, LogBox, Platform, SafeAreaView, useColorScheme, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel as ChannelType, ChannelSort, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  DebugContextProvider,
  MessageInput,
  MessageList,
  OverlayProvider,
  Streami18n,
  Thread,
  ThreadContextValue,
  useAttachmentPickerContext,
  useOverlayContext,
} from 'stream-chat-react-native';

import { useStreamChatTheme } from './useStreamChatTheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFlipper } from 'stream-chat-react-native-devtools';

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

const options = {
  presence: true,
  state: true,
  watch: true,
  limit: 30,
};

I18nManager.forceRTL(false);

const chatClient = StreamChat.getInstance<StreamChatGenerics>('q95x9hkbyd6p');
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
      <ChannelList<StreamChatGenerics>
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

const ChannelScreen: React.FC<ChannelScreenProps> = ({ navigation }) => {
  const { channel, setThread, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const { setTopInset } = useAttachmentPickerContext();
  const { overlay } = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay]);

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight]);

  if (channel === undefined) {
    return null;
  }

  return (
    <SafeAreaView>
      <Channel channel={channel} keyboardVerticalOffset={headerHeight} thread={thread}>
        <View style={{ flex: 1 }}>
          <MessageList<StreamChatGenerics>
            onThreadSelect={(thread) => {
              setThread(thread);
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
  }, [overlay]);

  if (!channel) return;

  return (
    <SafeAreaView>
      <Channel channel={channel} keyboardVerticalOffset={headerHeight} thread={thread} threadList>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
          }}
        >
          <Thread<StreamChatGenerics> onThreadDismount={() => setThread(null)} />
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
  channel: ChannelType<StreamChatGenerics> | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelType<StreamChatGenerics> | undefined>>;
  setThread: React.Dispatch<
    React.SetStateAction<ThreadContextValue<StreamChatGenerics>['thread'] | undefined>
  >;
  thread: ThreadContextValue<StreamChatGenerics>['thread'] | undefined;
};

const AppContext = React.createContext({} as AppContextType);

const App = () => {
  const colorScheme = useColorScheme();
  const { bottom } = useSafeAreaInsets();
  const theme = useStreamChatTheme();

  const [channel, setChannel] = useState<ChannelType<StreamChatGenerics>>();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState<ThreadContextValue<StreamChatGenerics>['thread']>();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.connectUser(user, userToken);

      return setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <DebugContextProvider useFlipper={useFlipper}>
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
            <OverlayProvider<StreamChatGenerics>
              bottomInset={bottom}
              i18nInstance={streami18n}
              value={{ style: theme }}
            >
              <Chat client={chatClient} i18nInstance={streami18n}>
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
    </DebugContextProvider>
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
