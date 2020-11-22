import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { AppContext } from './src/context/AppContext';
import { ChatScreen } from './src/screens/ChatScreen';
import { MenuDrawer } from './src/screens/MenuDrawer';
import { LogBox, useColorScheme } from 'react-native';
import { DarkTheme, LightTheme } from './src/appTheme';
import { NewDirectMessagingScreen } from './src/screens/NewDirectMessagingScreen';
import { NewGroupChannelAddMemberScreen } from './src/screens/NewGroupChannelAddMemberScreen';
import { NewGroupChannelAssignNameScreen } from './src/screens/NewGroupChannelAssignNameScreen';
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
import { UserDetailsScreen } from './src/screens/UserDetailsScreen';
import { streamTheme } from './src/utils/streamTheme';
LogBox.ignoreAllLogs(true);
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
        >
          value={{ style: streamTheme }}
        >
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

// TODO: Split the stack into multiple stacks - ChannelStack, CreateChannelStack etc.
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
      component={UserDetailsScreen}
      name='UserDetailsScreen'
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
export default App;
