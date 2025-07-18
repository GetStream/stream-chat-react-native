import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ChatWrapper } from '../components/ChatWrapper';
import { AppProvider } from '../context/AppContext';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LiveLocationManagerProvider } from 'stream-chat-expo';
import { watchLocation } from '../utils/watchLocation';

const getDeviceId = () => 'stream-chat-react-native-expo-sample-app';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <ChatWrapper>
          <LiveLocationManagerProvider watchLocation={watchLocation} getDeviceId={getDeviceId}>
            <AppProvider>
              <Stack />
            </AppProvider>
          </LiveLocationManagerProvider>
        </ChatWrapper>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
