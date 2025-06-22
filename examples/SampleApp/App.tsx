import React, { useEffect } from 'react';
import { DevSettings, LogBox, Platform, Text, useColorScheme, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMessaging } from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { AppContext } from './src/context/AppContext';
import { AppOverlayProvider } from './src/context/AppOverlayProvider';
import { UserSearchProvider } from './src/context/UserSearchContext';
import { useChatClient } from './src/hooks/useChatClient';
import { useStreamChatTheme } from './src/hooks/useStreamChatTheme';
import { AdvancedUserSelectorScreen } from './src/screens/AdvancedUserSelectorScreen';
import { ChannelFilesScreen } from './src/screens/ChannelFilesScreen';
import { ChannelImagesScreen } from './src/screens/ChannelImagesScreen';
import { ChannelScreen } from './src/screens/ChannelScreen';
import { ChannelPinnedMessagesScreen } from './src/screens/ChannelPinnedMessagesScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { GroupChannelDetailsScreen } from './src/screens/GroupChannelDetailsScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { NewDirectMessagingScreen } from './src/screens/NewDirectMessagingScreen';
import { NewGroupChannelAddMemberScreen } from './src/screens/NewGroupChannelAddMemberScreen';
import { NewGroupChannelAssignNameScreen } from './src/screens/NewGroupChannelAssignNameScreen';
import { OneOnOneChannelDetailScreen } from './src/screens/OneOnOneChannelDetailScreen';
import { SharedGroupsScreen } from './src/screens/SharedGroupsScreen';
import { ThreadScreen } from './src/screens/ThreadScreen';
import { UserSelectorScreen } from './src/screens/UserSelectorScreen';

if (__DEV__) {
  DevSettings.addMenuItem('Reset local DB (offline storage)', () => {
    console.info('Local DB reset');
  });
}

import type { StackNavigatorParamList, UserSelectorParamList } from './src/types';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { navigateToChannel, RootNavigationRef } from './src/utils/RootNavigation';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);
console.assert = () => null;

// when a channel id is set here, the intial route is the channel screen
const initialChannelIdGlobalRef = { current: '' };

notifee.onBackgroundEvent(async ({ detail, type }) => {
  // user press on notification detected while app was on background on Android
  if (type === EventType.PRESS) {
    const channelId = detail.notification?.data?.channel_id as string;
    if (channelId) {
      navigateToChannel(channelId);
    }
    await Promise.resolve();
  }
});

const Stack = createStackNavigator<StackNavigatorParamList>();
const UserSelectorStack = createStackNavigator<UserSelectorParamList>();
const App = () => {
  const { chatClient, isConnecting, loginUser, logout, switchUser } = useChatClient();
  const colorScheme = useColorScheme();
  const streamChatTheme = useStreamChatTheme();

  useEffect(() => {
    const messaging = getMessaging();
    const unsubscribeOnNotificationOpen = messaging.onNotificationOpenedApp((remoteMessage) => {
      // Notification caused app to open from background state on iOS
      const channelId = remoteMessage.data?.channel_id as string;
      if (channelId) {
        navigateToChannel(channelId);
      }
    });
    // handle notification clicks on foreground
    const unsubscribeForegroundEvent = notifee.onForegroundEvent(({ detail, type }) => {
      if (type === EventType.PRESS) {
        // user has pressed the foreground notification
        const channelId = detail.notification?.data?.channel_id as string;
        if (channelId) {
          navigateToChannel(channelId);
        }
      }
    });
    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification) {
        // Notification caused app to open from quit state on Android
        const channelId = initialNotification.notification.data?.channel_id as string;
        if (channelId) {
          initialChannelIdGlobalRef.current = channelId;
        }
      }
    });
    messaging.getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        // Notification caused app to open from quit state on iOS
        const channelId = remoteMessage.data?.channel_id as string;
        if (channelId) {
          // this will make the app to start with the channel screen with this channel id
          initialChannelIdGlobalRef.current = channelId;
        }
      }
    });
    return () => {
      unsubscribeOnNotificationOpen();
      unsubscribeForegroundEvent();
    };
  }, []);

  return (
    <SafeAreaProvider
      style={{
        backgroundColor: '#FCFCFC',
      }}
    >
      <View><Text>This is a test build, please disregard it.</Text></View>
    </SafeAreaProvider>
  );
};

// TODO: Split the stack into multiple stacks - ChannelStack, CreateChannelStack etc.
const HomeScreen = () => {
  return (
    <Stack.Navigator
      initialRouteName={initialChannelIdGlobalRef.current ? 'ChannelScreen' : 'MessagingScreen'}
    >
      <Stack.Screen
        component={ChatScreen}
        name='MessagingScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ChannelScreen}
        initialParams={
          initialChannelIdGlobalRef.current
            ? { channelId: initialChannelIdGlobalRef.current }
            : undefined
        }
        name='ChannelScreen'
        options={{
          gestureEnabled: Platform.OS === 'ios',
          headerShown: false,
        }}
      />
      <Stack.Screen
        component={NewDirectMessagingScreen}
        name='NewDirectMessagingScreen'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        component={NewGroupChannelAddMemberScreen}
        name='NewGroupChannelAddMemberScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={NewGroupChannelAssignNameScreen}
        name='NewGroupChannelAssignNameScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={OneOnOneChannelDetailScreen}
        name='OneOnOneChannelDetailScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={GroupChannelDetailsScreen}
        name='GroupChannelDetailsScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ChannelImagesScreen}
        name='ChannelImagesScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ChannelFilesScreen}
        name='ChannelFilesScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ChannelPinnedMessagesScreen}
        name='ChannelPinnedMessagesScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={SharedGroupsScreen}
        name='SharedGroupsScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ThreadScreen}
        name='ThreadScreen'
        options={{
          gestureEnabled: Platform.OS === 'ios',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default App;
