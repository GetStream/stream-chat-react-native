import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Channel as ChannelType, ChannelFilters, ChannelSort, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageComposer,
  MessageList,
  OverlayProvider,
} from 'stream-chat-react-native';

import { apiKey, appUser, appUserToken, mockServerUrl } from './src/config';

// Same opt-in as the SampleApp, so the e2e suite sees the same accessibility tree.
const accessibility = { enabled: true };
const sort: ChannelSort = { last_message_at: -1 };

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

const ChannelScreen = ({ channel, onBack }: { channel: ChannelType; onBack: () => void }) => {
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  // Laid out like the SampleApp's channel screen: the header lives inside <Channel>, which sizes
  // itself to the screen and handles the bottom inset and keyboard for the composer.
  return (
    <SafeAreaView edges={['left', 'right']} style={[StyleSheet.absoluteFill, styles.container]}>
      <Channel channel={channel} keyboardVerticalOffset={0}>
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
            {channel.id}
          </Text>
        </View>
        <MessageList />
        <MessageComposer />
      </Channel>
    </SafeAreaView>
  );
};

const ChatScreens = ({ client }: { client: StreamChat }) => {
  const [channel, setChannel] = useState<ChannelType>();
  const filters = useMemo<ChannelFilters>(
    () => ({ members: { $in: [client.userID ?? appUser.id] } }),
    [client.userID],
  );
  const closeChannel = useCallback(() => setChannel(undefined), []);

  return (
    <Chat client={client}>
      {/* The list stays mounted under the channel, as in a navigation stack. */}
      <SafeAreaView edges={['top']} style={styles.container}>
        <ChannelList filters={filters} onSelect={setChannel} sort={sort} />
      </SafeAreaView>
      {channel ? <ChannelScreen channel={channel} onBack={closeChannel} /> : null}
    </Chat>
  );
};

const App = () => {
  const [client, setClient] = useState<StreamChat>();

  const login = useCallback(async () => {
    const chatClient = StreamChat.getInstance(apiKey, { baseURL: mockServerUrl, timeout: 6000 });
    await chatClient.connectUser(appUser, appUserToken);
    setClient(chatClient);
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <OverlayProvider accessibility={accessibility}>
          {client ? <ChatScreens client={client} /> : <LoginScreen onLogin={login} />}
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
  hint: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', padding: 16 },
  userName: { fontSize: 17 },
  userRow: { borderBottomColor: '#E5E5E5', borderBottomWidth: 1, padding: 16 },
});

export default App;
