import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ChatWrapper } from '../components/ChatWrapper';
import { AppProvider } from '../context/AppContext';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LiveLocationManagerProvider } from 'stream-chat-expo';
import { watchLocation } from '../utils/watchLocation';
import { UserProvider, useUserContext } from '@/context/UserContext';
import UserLogin from '@/components/UserLogin';

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
