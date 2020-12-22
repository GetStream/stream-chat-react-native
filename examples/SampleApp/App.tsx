import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

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
import { Chat, OverlayProvider } from 'stream-chat-react-native/v2';
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
import { OneOnOneChannelDetailScreen } from './src/screens/OneOnOneChannelDetailScreen';
import { ChannelImagesScreen } from './src/screens/ChannelImagesScreen';
import { ChannelFilesScreen } from './src/screens/ChannelFilesScreen';
import { SharedGroupsScreen } from './src/screens/SharedGroupsScreen';
import { GroupChannelDetailsScreen } from './src/screens/GroupChannelDetailsScreen';
import { streamTheme } from './src/utils/streamTheme';
import { useStreamChatTheme } from './src/hooks/useStreamChatTheme';
import { AppOverlayProvider } from './src/context/AppOverlayContext';

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
        <DrawerNavigator chatClient={chatClient} />
      </AppContext.Provider>
    </NavigationContainer>
  );
};

const DrawerNavigator = ({ chatClient }) => {
  const streamChatTheme = useStreamChatTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <OverlayProvider<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalResponseType,
      LocalUserType
    >
      bottomInset={bottom}
      value={{ style: streamTheme }}
    >
      <Chat client={chatClient} style={streamChatTheme}>
        <AppOverlayProvider>
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
        </AppOverlayProvider>
      </Chat>
    </OverlayProvider>
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
      component={SharedGroupsScreen}
      name='SharedGroupsScreen'
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);
