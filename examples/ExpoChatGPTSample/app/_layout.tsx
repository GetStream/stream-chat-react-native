import React, { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Drawer } from 'expo-router/drawer';

import type { LocalMessage, OperationRequestFn, StreamChat } from 'stream-chat';
import { Chat, OverlayProvider, useCreateChatClient } from 'stream-chat-expo';

import { StreamTheme } from 'stream-chat-expo/ai-components';

import { chatApiKey, chatUserId, chatUserName, chatUserToken } from '../chatConfig';
import { AppProvider } from '../contexts/AppContext';
import { startAI, summarize } from '../http/requests';

import { MenuDrawer } from '../screens/MenuDrawer';

const isMessageAIGenerated = (message: LocalMessage) => !!message.custom?.ai_generated;

// Creates the channel on its first message, names it after a summary of that message, and makes
// sure the AI bot is watching before the message goes out.
const createSendMessageRequest =
  (client: StreamChat): OperationRequestFn<'send'> =>
  async (params, defaultRequest) => {
    const { localMessage } = params;
    const [type, id] = localMessage.cid.split(':');
    const channel = client.channel(type, id);

    if (!channel.initialized) {
      await channel.watch();
      summarize(localMessage.text ?? '').then((response) => {
        // `post` resolves to undefined when the request fails; the channel then keeps its id.
        const summary = (response as { summary?: string } | undefined)?.summary;
        if (summary) {
          channel.updatePartial({ set: { name: summary } });
        }
      });
    }

    if (
      !Object.keys(channel.state.watchers).some((watcher) => watcher.startsWith('ai-bot')) &&
      channel.id
    ) {
      await startAI(channel.id);
    }

    return defaultRequest(params);
  };

export default function Layout() {
  const chatClient = useCreateChatClient({
    apiKey: chatApiKey,
    tokenOrProvider: chatUserToken,
    userData: { id: chatUserId, name: chatUserName },
  });

  useEffect(() => {
    if (!chatClient) {
      return;
    }
    chatClient.config.set({
      channel: { requestHandlers: { sendMessageRequest: createSendMessageRequest(chatClient) } },
      messageComposer: { attachments: { pendingUploadsEnabled: true } },
    });
  }, [chatClient]);

  if (!chatClient) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <AppProvider client={chatClient}>
        <StreamTheme>
          <GestureHandlerRootView style={styles.container}>
            <OverlayProvider>
              <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
                <Drawer drawerContent={MenuDrawer} screenOptions={{ drawerStyle: { width: 300 } }}>
                  <Drawer.Screen name={'index'} />
                </Drawer>
              </Chat>
            </OverlayProvider>
          </GestureHandlerRootView>
        </StreamTheme>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
