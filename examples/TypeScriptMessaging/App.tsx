import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  I18nManager,
  LogBox,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel as ChannelType, ChannelSort } from 'stream-chat';
import {
  Archieve,
  Channel,
  ChannelList,
  ChannelPreviewStatus,
  ChannelPreviewStatusProps,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
  Pin,
  Streami18n,
  Thread,
  ThreadContextValue,
  Unpin,
  useAttachmentPickerContext,
  useChannelMembershipState,
  useCreateChatClient,
  useOverlayContext,
} from 'stream-chat-react-native';

import { useStreamChatTheme } from './useStreamChatTheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProgressLoader } from './AuthProgressLoader';

LogBox.ignoreAllLogs(true);

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;
type LocalPollOptionType = Record<string, unknown>;
type LocalPollType = Record<string, unknown>;
type LocalMemberType = Record<string, unknown>;

type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  memberType: LocalMemberType;
  messageType: LocalMessageType;
  pollOptionType: LocalPollOptionType;
  pollType: LocalPollType;
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

const apiKey = '8br4watad788';
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibHVrZV9za3l3YWxrZXIifQ.kFSLHRB5X62t0Zlc7nwczWUfsQMwfkpylC6jCUZ6Mc0';

const user = {
  id: 'luke_skywalker',
};
const filters = {
  archived: false,
  members: { $in: ['luke_skywalker'] },
  type: 'messaging',
};

const sort: ChannelSort<StreamChatGenerics> = [
  { pinned_at: -1 },
  { last_message_at: -1 },
  { updated_at: -1 },
];

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

const CustomChannelPreviewStatus = (props: ChannelPreviewStatusProps) => {
  const { channel } = props;
  const membership = useChannelMembershipState(channel);

  return (
    <View style={styles.statusContainer}>
      <ChannelPreviewStatus {...props} />
      <Pressable
        style={styles.iconContainer}
        onPress={async () => {
          if (membership.pinned_at) {
            await channel.unpin();
          } else {
            await channel.pin();
          }
        }}
      >
        {membership.pinned_at ? <Unpin height={24} width={24} pathFill='red' /> : <Pin size={24} />}
      </Pressable>
      <Pressable
        style={styles.iconContainer}
        onPress={async () => {
          if (membership.archived_at) {
            await channel.unarchive();
          } else {
            await channel.archive();
          }
        }}
      >
        <Archieve height={24} width={24} fill={membership.archived_at ? 'red' : 'grey'} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginLeft: 8,
  },
});

const ChannelListScreen: React.FC<ChannelListScreenProps> = ({ navigation }) => {
  const { setChannel } = useContext(AppContext);

  const memoizedFilters = useMemo(() => filters, []);

  return (
    <View style={{ height: '100%' }}>
      <ChannelList<StreamChatGenerics>
        PreviewStatus={CustomChannelPreviewStatus}
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
  const { setTopInset } = useAttachmentPickerContext();
  const { overlay } = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay, navigation]);

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight, setTopInset]);

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
          <MessageList<StreamChatGenerics>
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
  const { bottom } = useSafeAreaInsets();
  const theme = useStreamChatTheme();
  const { channel } = useContext(AppContext);

  const chatClient = useCreateChatClient({
    apiKey,
    userData: user,
    tokenOrProvider: userToken,
  });

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider<StreamChatGenerics>
      bottomInset={bottom}
      i18nInstance={streami18n}
      value={{ style: theme }}
    >
      <Chat client={chatClient} i18nInstance={streami18n} enableOfflineSupport>
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
            options={() => ({ headerLeft: EmptyHeader })}
          />
        </Stack.Navigator>
      </Chat>
    </OverlayProvider>
  );
};

export default () => {
  const [channel, setChannel] = useState<ChannelType<StreamChatGenerics>>();
  const [thread, setThread] = useState<ThreadContextValue<StreamChatGenerics>['thread']>();
  const theme = useStreamChatTheme();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors?.white_snow || '#FCFCFC' }}>
      <NavigationContainer
        theme={{
          colors: {
            ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
          },
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
