import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { Channel as ChannelType, StreamChat } from 'stream-chat';

import { AppContext } from './src/context/AppContext';
import { ChatScreen } from './src/screens/ChatScreen';
import { MenuDrawer } from './src/screens/MenuDrawer';
import {
  ActivityIndicator,
  LogBox,
  SafeAreaView,
  useColorScheme,
  Vibration,
  View,
} from 'react-native';
import { enableScreens } from 'react-native-screens';
import { DarkTheme, LightTheme } from './src/appTheme';
import { NewDirectMessagingScreen } from './src/screens/NewDirectMessagingScreen';
import { NewGroupChannelScreen } from './src/screens/NewGroupChannelScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { UserSelectorScreen } from './src/screens/UserSelectorScreen';
import { ChannelScreen } from './src/screens/ChannelScreen';
import { useChatClient } from './src/hooks/useChatClient';
import { OverlayProvider } from 'stream-chat-react-native/v2';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  StackNavigatorParamList,
} from './src/types';
import { LoadingScreen } from './src/screens/LoadingScreen';
LogBox.ignoreAllLogs(true);
enableScreens();
console.assert = () => null;

const Stack = createStackNavigator<StackNavigatorParamList>();
const Drawer = createDrawerNavigator();

const App = () => {
  const scheme = useColorScheme();

  const { chatClient, isConnecting, switchUser } = useChatClient();

  if (isConnecting) {
    return (
      <NavigationContainer theme={scheme === 'dark' ? DarkTheme : LightTheme}>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : LightTheme}>
      <AppContext.Provider value={{ chatClient, switchUser }}>
        <OverlayProvider<
          LocalAttachmentType,
          LocalChannelType,
          LocalCommandType,
          LocalEventType,
          LocalMessageType,
          LocalResponseType,
          LocalUserType
        >>
          <Drawer.Navigator
            drawerContent={(props) => <MenuDrawer {...props} />}
            drawerStyle={{
              width: 300,
            }}
            initialRouteName={chatClient ? 'HomeScreen' : 'UserSelectorScreen'}
          >
            <Drawer.Screen
              component={HomeScreen}
              name='HomeScreen'
              options={{ headerShown: false }}
            />
            <Drawer.Screen
              component={UserSelectorScreen}
              name='UserSelectorScreen'
              options={{ gestureEnabled: false, headerShown: false }}
            />
          </Drawer.Navigator>
        </OverlayProvider>
      </AppContext.Provider>
    </NavigationContainer>
  );
};

const HomeScreen = () => (
  <Stack.Navigator initialRouteName='ChatScreen'>
    <Stack.Screen
      component={ChatScreen}
      name='ChatScreen'
      options={{ headerShown: false }}
    />
    <Stack.Screen
      component={ChannelScreen}
      name='ChannelScreen'
      options={{ headerShown: false }}
    />
    <Stack.Screen
      component={NewDirectMessagingScreen}
      name='NewDirectMessagingScreen'
      options={{ headerShown: false }}
    />
    <Stack.Screen
      component={NewGroupChannelScreen}
      name='NewGroupChannelScreen'
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
export default App;
