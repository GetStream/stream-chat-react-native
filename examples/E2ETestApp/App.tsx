import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChannelPaginator,
  Channel as ChannelType,
  SortParamRequest,
  StreamChat,
  Thread as ThreadType,
} from 'stream-chat';
import {
  AlsoSentToChannelHeaderPressPayload,
  Channel,
  ChannelActionItem,
  ChannelDetails,
  ChannelDetailsContextProvider,
  ChannelList,
  GetChannelActionItems,
  DEFAULT_HIGHLIGHT_DURATION,
  Chat,
  MessageComposer,
  MessageList,
  OverlayProvider,
  setupCommandUIMiddlewares,
  SqliteClient,
  Thread,
  ThreadList,
} from 'stream-chat-react-native';

import { apiKey, appUser, appUserToken, isJwtTest, mockServerUrl } from './src/config';
import { JwtScreen } from './src/JwtScreen';

// Same opt-in as the SampleApp, so the e2e suite sees the same accessibility tree.
const accessibility = { enabled: true };
const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

/** Lists the mock server's app user, like the SampleApp's user selector. */
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <SafeAreaView style={styles.container} testID='user-selector-screen'>
    <Text style={styles.title}>E2E Test App</Text>
    {mockServerUrl ? (
      <Pressable
        onPress={onLogin}
        style={styles.userRow}
        testID={`user-selector-button-${appUser.id}`}
      >
        <Text style={styles.userName}>{appUser.name}</Text>
      </Pressable>
    ) : (
      <Text style={styles.hint}>Launch with the MOCK_SERVER_URL argument (see e2e/README.md).</Text>
    )}
  </SafeAreaView>
);

/** Pops the screen on the Android back button, like a navigation stack. */
const useBackHandler = (onBack: (() => void) | undefined) => {
  useEffect(() => {
    if (!onBack) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);
};

const ScreenHeader = ({ onBack, title }: { onBack: () => void; title: string }) => {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: top + 12 }]}>
      <Pressable
        accessibilityLabel='Back'
        accessibilityRole='button'
        hitSlop={12}
        onPress={onBack}
        testID='back-button'
      >
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text numberOfLines={1} style={styles.headerTitle}>
        {title}
      </Text>
    </View>
  );
};

const ChannelScreen = ({
  channel,
  covered,
  onBack,
  onThreadSelect,
}: {
  channel: ChannelType;
  /** A thread is stacked over the channel: it stays mounted but is hidden, like a native stack. */
  covered: boolean;
  onBack: () => void;
  onThreadSelect: (thread: ThreadType, targetedMessageId?: string) => void;
}) => {
  useBackHandler(covered ? undefined : onBack);
  // "View" on a thread reply sent to the channel, and a quote of one, open the thread at that reply.
  const onAlsoSentToChannelHeaderPress = useCallback(
    ({ targetedMessageId, thread }: AlsoSentToChannelHeaderPressPayload) => {
      if (thread) {
        onThreadSelect(thread, targetedMessageId);
      }
    },
    [onThreadSelect],
  );

  // Laid out like the SampleApp's channel screen: the header lives inside <Channel>, which sizes
  // itself to the screen and handles the bottom inset and keyboard for the composer.
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[StyleSheet.absoluteFill, styles.container, covered && styles.hidden]}
    >
      <Channel
        channel={channel}
        keyboardVerticalOffset={0}
        onAlsoSentToChannelHeaderPress={onAlsoSentToChannelHeaderPress}
      >
        <ScreenHeader onBack={onBack} title={channel.id ?? ''} />
        <MessageList onThreadSelect={(selected) => onThreadSelect(selected)} />
        <MessageComposer />
      </Channel>
    </SafeAreaView>
  );
};

/** A thread stacked over its channel, like the SampleApp's thread screen. */
const ThreadScreen = ({
  onBack,
  targetedMessageId,
  thread,
}: {
  onBack: () => void;
  targetedMessageId?: string;
  thread: ThreadType;
}) => {
  useBackHandler(onBack);

  // Before the list picks its initial anchor (a passive effect), like the SampleApp's thread screen.
  useLayoutEffect(() => {
    if (targetedMessageId) {
      thread.messagePaginator
        .jumpToMessage(targetedMessageId, {
          focusReason: 'jump-to-message',
          focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
        })
        .catch((error: unknown) => console.warn('Jump to reply failed:', error));
    }
  }, [thread, targetedMessageId]);

  return (
    <SafeAreaView edges={['left', 'right']} style={[StyleSheet.absoluteFill, styles.container]}>
      <Thread keyboardVerticalOffset={0} thread={thread}>
        <ScreenHeader onBack={onBack} title='Thread Reply' />
        <MessageList />
        <MessageComposer />
      </Thread>
    </SafeAreaView>
  );
};

/** The SDK's channel details (members, pinned messages, files…), like the SampleApp's screen. */
const ChannelDetailsScreen = ({
  channel,
  onBack,
}: {
  channel: ChannelType;
  onBack: () => void;
}) => {
  useBackHandler(onBack);
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[StyleSheet.absoluteFill, styles.container]}
    >
      <ChannelDetailsContextProvider channel={channel}>
        <ChannelDetails onBack={onBack} />
      </ChannelDetailsContextProvider>
    </SafeAreaView>
  );
};

type Tab = 'channels' | 'threads';

/** The bottom bar of the root screen, like the SampleApp's channels and threads tabs. */
const TabBar = ({ onSelect, tab }: { onSelect: (tab: Tab) => void; tab: Tab }) => (
  <SafeAreaView edges={['bottom']} style={styles.tabBar}>
    {(['channels', 'threads'] as const).map((item) => (
      <Pressable
        accessibilityRole='tab'
        accessibilityState={{ selected: tab === item }}
        key={item}
        onPress={() => onSelect(item)}
        style={styles.tab}
        testID={`tab-${item}`}
      >
        <Text style={[styles.tabTitle, tab === item && styles.tabTitleSelected]}>
          {item === 'channels' ? 'Channels' : 'Threads'}
        </Text>
      </Pressable>
    ))}
  </SafeAreaView>
);

const ChatScreens = ({ client }: { client: StreamChat }) => {
  const [channel, setChannel] = useState<ChannelType>();
  const [thread, setThread] = useState<{ targetedMessageId?: string; thread: ThreadType }>();
  const openThread = useCallback(
    (nextThread: ThreadType, targetedMessageId?: string) =>
      setThread({ targetedMessageId, thread: nextThread }),
    [],
  );
  // The app owns the channel list's paginator, for as long as the connected client lives.
  const channelListPaginator = useMemo(
    () =>
      new ChannelPaginator({
        client,
        filters: { members: { $in: [client.userID ?? appUser.id] } },
        id: 'channel-list',
        requestOptions: { state: true, watch: true },
        sort,
      }),
    [client],
  );

  useEffect(() => {
    client.channelManager.insertPaginator({ paginator: channelListPaginator });
    return () => {
      client.channelManager.removePaginator(channelListPaginator);
      channelListPaginator.dispose();
    };
  }, [channelListPaginator, client]);

  const [detailsChannel, setDetailsChannel] = useState<ChannelType>();
  const [tab, setTab] = useState<Tab>('channels');
  const closeChannel = useCallback(() => setChannel(undefined), []);
  const closeDetails = useCallback(() => setDetailsChannel(undefined), []);
  // "View Info" in the channel actions sheet, as the SampleApp adds it.
  const getChannelActionItems = useCallback<GetChannelActionItems>(
    ({ context: { channel: actionChannel }, defaultItems }) => {
      const viewInfo: ChannelActionItem = {
        action: () => setDetailsChannel(actionChannel),
        Icon: () => null,
        id: 'info',
        label: 'View Info',
        placement: 'sheet',
        type: 'standard',
      };
      return [viewInfo, ...defaultItems];
    },
    [],
  );
  // A thread picked on the thread list opens over its channel.
  const onThreadListSelect = useCallback(
    (selected: ThreadType) => {
      setChannel(selected.channel);
      openThread(selected);
    },
    [openThread],
  );
  const closeThread = useCallback(() => setThread(undefined), []);

  return (
    // Offline support is on, as in the native test apps: sends and reactions made offline are
    // queued and synced on reconnect.
    <Chat client={client} enableOfflineSupport>
      {/* The list stays mounted under the channel, as in a navigation stack. */}
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={[styles.flex, tab !== 'channels' && styles.hidden]}>
          <ChannelList
            getChannelActionItems={getChannelActionItems}
            onSelect={setChannel}
            paginator={channelListPaginator}
          />
        </View>
        {tab === 'threads' ? (
          <View style={styles.flex} testID='thread-list-screen'>
            <ThreadList isFocused onThreadSelect={onThreadListSelect} />
          </View>
        ) : null}
        <TabBar onSelect={setTab} tab={tab} />
      </SafeAreaView>
      {detailsChannel ? (
        <ChannelDetailsScreen channel={detailsChannel} onBack={closeDetails} />
      ) : null}
      {channel ? (
        <ChannelScreen
          channel={channel}
          covered={!!thread}
          onBack={closeChannel}
          onThreadSelect={openThread}
        />
      ) : null}
      {channel && thread ? (
        <ThreadScreen
          onBack={closeThread}
          targetedMessageId={thread.targetedMessageId}
          thread={thread.thread}
        />
      ) : null}
    </Chat>
  );
};

const App = () => {
  const [client, setClient] = useState<StreamChat>();

  const login = useCallback(async () => {
    const chatClient = StreamChat.getInstance(apiKey, {
      client: { axiosRequestConfig: { timeout: 6000 }, baseURL: mockServerUrl },
    });
    // As the v10 guide says: the composer only sends a command picked from the suggestions with
    // these middlewares (RN-484).
    chatClient.config.setSetupFunction('messageComposer', ({ composer }) => {
      setupCommandUIMiddlewares(composer);
    });
    // Every test launches the app anew but keeps its data: start from an empty offline database so
    // nothing a previous test stored is hydrated into this one.
    await SqliteClient.initializeDatabase();
    await SqliteClient.resetDB();
    await chatClient.connectUser(appUser, appUserToken);
    setClient(chatClient);
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <OverlayProvider accessibility={accessibility}>
          {isJwtTest ? (
            <JwtScreen />
          ) : client ? (
            <ChatScreens client={client} />
          ) : (
            <LoginScreen onLogin={login} />
          )}
        </OverlayProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  back: { fontSize: 17, paddingRight: 12 },
  container: { backgroundColor: '#FFFFFF', flex: 1 },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  hidden: { display: 'none' },
  tab: { alignItems: 'center', flex: 1, paddingVertical: 12 },
  tabBar: { borderTopColor: '#E5E5E5', borderTopWidth: 1, flexDirection: 'row' },
  tabTitle: { color: '#7A7A7A', fontSize: 15 },
  tabTitleSelected: { color: '#005FFF', fontWeight: '600' },
  hint: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', padding: 16 },
  userName: { fontSize: 17 },
  userRow: { borderBottomColor: '#E5E5E5', borderBottomWidth: 1, padding: 16 },
});

export default App;
