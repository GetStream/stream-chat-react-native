import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { Channel as ChannelType, StreamChat } from 'stream-chat';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from './src/types';
import { AppContext } from './src/context/AppContext';
import { ChatScreen } from './src/screens/ChatScreen';
import { MenuDrawer } from './src/screens/MenuDrawer';
import { LogBox, useColorScheme } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { DarkTheme, LightTheme } from './src/appTheme';
import { NewDirectMessagingScreen } from './src/screens/NewDirectMessagingScreen';
import { NewGroupChannelScreen } from './src/screens/NewGroupChannelScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { UserSelectorScreen } from './src/screens/UserSelectorScreen';
import { USER_TOKENS, USERS } from './src/ChatUsers';
import AsyncStore from './src/utils/AsyncStore';
import { ChannelScreen } from './src/screens/ChannelScreen';

// LogBox.ignoreAllLogs(true);
enableScreens();
console.assert = () => null;

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const App = () => {
  const scheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  useEffect(() => {
    const init = async () => {
      const userId: string = await AsyncStore.getItem(
        '@stream-rn-sampleapp-user-id',
        false,
      );
      if (!userId) {
        setIsUserLoggedIn(false);
      } else {
        setIsUserLoggedIn(true);
      }

      setReady(true);
    };

    init();
  }, []);

  if (!ready) return null;
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : LightTheme}>
      <Stack.Navigator
        initialRouteName={isUserLoggedIn ? 'HomeScreen' : 'UserSelectorScreen'}
      >
        <Stack.Screen
          component={HomeScreen}
          name='HomeScreen'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          component={UserSelectorScreen}
          name='UserSelectorScreen'
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const HomeScreen = () => {
  const [chatClient, setChatClient] = useState<StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  > | null>(null);

  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    const setupClient = async () => {
      try {
        const userId: string = await AsyncStore.getItem(
          '@stream-rn-sampleapp-user-id',
          false,
        );

        const user = USERS[userId];
        const userToken = USER_TOKENS[userId];
        const client = new StreamChat<
          LocalAttachmentType,
          LocalChannelType,
          LocalCommandType,
          LocalEventType,
          LocalMessageType,
          LocalResponseType,
          LocalUserType
        >('q95x9hkbyd6p');

        await client.setUser(user, userToken);
        setChatClient(client);
      } catch (e) {
        setClientReady(false);
      }

      setClientReady(true);
    };

    setupClient();

    return () => {
      chatClient && chatClient.disconnect();
    };
  }, []);
  if (!clientReady || !chatClient) return null;

  return (
    <AppContext.Provider value={{ chatClient }}>
      <Drawer.Navigator
        drawerContent={(props) => <MenuDrawer {...props} />}
        drawerStyle={{
          width: 300,
        }}
        initialRouteName='Chat'
      >
        <Drawer.Screen component={ChatScreen} name='Chat' />
        <Drawer.Screen component={ChannelScreen} name='ChannelScreen' />
        <Drawer.Screen
          component={NewDirectMessagingScreen}
          name='NewDirectMessagingScreen'
        />
        <Drawer.Screen
          component={NewGroupChannelScreen}
          name='NewGroupChannelScreen'
        />
      </Drawer.Navigator>
    </AppContext.Provider>
  );
};
export default App;
