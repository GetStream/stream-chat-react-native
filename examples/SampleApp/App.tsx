import React from 'react';
import { LogBox } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Chat, OverlayProvider } from 'stream-chat-react-native/v2';

import { AppContext } from './src/context/AppContext';
import { AppOverlayProvider } from './src/context/AppOverlayContext';
import { useChatClient } from './src/hooks/useChatClient';
import { useStreamChatTheme } from './src/hooks/useStreamChatTheme';
import { ChannelFilesScreen } from './src/screens/ChannelFilesScreen';
import { ChannelImagesScreen } from './src/screens/ChannelImagesScreen';
import { ChannelScreen } from './src/screens/ChannelScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { GroupChannelDetailsScreen } from './src/screens/GroupChannelDetailsScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { MenuDrawer } from './src/screens/MenuDrawer';
import { NewDirectMessagingScreen } from './src/screens/NewDirectMessagingScreen';
import { NewGroupChannelAddMemberScreen } from './src/screens/NewGroupChannelAddMemberScreen';
import { NewGroupChannelAssignNameScreen } from './src/screens/NewGroupChannelAssignNameScreen';
import { OneOnOneChannelDetailScreen } from './src/screens/OneOnOneChannelDetailScreen';
import { SharedGroupsScreen } from './src/screens/SharedGroupsScreen';
import { ThreadScreen } from './src/screens/ThreadScreen';
import { UserSelectorScreen } from './src/screens/UserSelectorScreen';
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

import type { StreamChat } from 'stream-chat';

LogBox.ignoreAllLogs(true);
console.assert = () => null;

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator<StackNavigatorParamList>();

const App = () => {
  const { chatClient, isConnecting, switchUser } = useChatClient();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppContext.Provider value={{ chatClient, switchUser }}>
          {isConnecting ? (
            <LoadingScreen />
          ) : chatClient ? (
            <DrawerNavigator chatClient={chatClient} />
          ) : (
            <UserSelectorScreen />
          )}
        </AppContext.Provider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const DrawerNavigator: React.FC<{
  chatClient: StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  >;
}> = ({ chatClient }) => {
  const { bottom } = useSafeAreaInsets();
  const streamChatTheme = useStreamChatTheme();

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
      value={{ style: streamChatTheme }}
    >
      <Chat<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalEventType,
        LocalMessageType,
        LocalResponseType,
        LocalUserType
      >
        client={chatClient}
      >
        <AppOverlayProvider>
          <Drawer.Navigator
            drawerContent={(props) => <MenuDrawer {...props} />}
            drawerStyle={{
              width: 300,
            }}
          >
            <Drawer.Screen
              component={HomeScreen}
              name='HomeScreen'
              options={{ headerShown: false }}
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
    <Stack.Screen
      component={ThreadScreen}
      name='ThreadScreen'
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default App;
