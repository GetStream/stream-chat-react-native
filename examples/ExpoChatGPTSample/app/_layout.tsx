import React from 'react';

import { StyleSheet } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Drawer } from 'expo-router/drawer';

import type { LocalMessage } from 'stream-chat';
import { Chat, OverlayProvider, useCreateChatClient } from 'stream-chat-expo';

import { StreamTheme } from 'stream-chat-expo/ai-components';

import { chatApiKey, chatUserId, chatUserName, chatUserToken } from '../chatConfig';
import { AppProvider } from '../contexts/AppContext';

import { MenuDrawer } from '../screens/MenuDrawer';

const isMessageAIGenerated = (message: LocalMessage) => !!message.ai_generated;

export default function Layout() {
  const chatClient = useCreateChatClient({
    apiKey: chatApiKey,
    tokenOrProvider: chatUserToken,
    userData: { id: chatUserId, name: chatUserName },
  });

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
