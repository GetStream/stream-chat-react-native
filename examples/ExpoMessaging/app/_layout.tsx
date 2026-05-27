import React from 'react';

import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import { LiveLocationManagerProvider } from 'stream-chat-expo';

import { ChatWrapper } from '../components/ChatWrapper';
import { AppProvider } from '../context/AppContext';

import { watchLocation } from '../utils/watchLocation';

import UserLogin from '@/components/UserLogin';
import { UserProvider, useUserContext } from '@/context/UserContext';

function Layout() {
  const { user } = useUserContext();

  if (!user) {
    return <UserLogin />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <ChatWrapper>
          <LiveLocationManagerProvider watchLocation={watchLocation}>
            <AppProvider>
              <Stack />
            </AppProvider>
          </LiveLocationManagerProvider>
        </ChatWrapper>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Layout />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
