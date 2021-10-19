import React from 'react';
import { Alert, LogBox, Platform, Text, useColorScheme, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Chat,
  MessageActionListItem,
  MessageActionListProps,
  OverlayProvider,
  ThemeProvider,
  useMessageActionAnimation,
  useOverlayContext,
} from 'stream-chat-react-native';
import { TapGestureHandler, TouchableOpacity } from 'react-native-gesture-handler';
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
import { MenuDrawer } from './src/screens/MenuDrawer';
import { NewDirectMessagingScreen } from './src/screens/NewDirectMessagingScreen';
import { NewGroupChannelAddMemberScreen } from './src/screens/NewGroupChannelAddMemberScreen';
import { NewGroupChannelAssignNameScreen } from './src/screens/NewGroupChannelAssignNameScreen';
import { OneOnOneChannelDetailScreen } from './src/screens/OneOnOneChannelDetailScreen';
import { SharedGroupsScreen } from './src/screens/SharedGroupsScreen';
import { ThreadScreen } from './src/screens/ThreadScreen';
import { UserSelectorScreen } from './src/screens/UserSelectorScreen';

import type { StreamChat } from 'stream-chat';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
  StackNavigatorParamList,
  UserSelectorParamList,
} from './src/types';
import Animated from 'react-native-reanimated';

LogBox.ignoreAllLogs(true);
console.assert = () => null;

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator<StackNavigatorParamList>();
const UserSelectorStack = createStackNavigator<UserSelectorParamList>();
const App = () => {
  const { chatClient, isConnecting, loginUser, logout, switchUser } = useChatClient();
  const colorScheme = useColorScheme();
  const streamChatTheme = useStreamChatTheme();

  return (
    <SafeAreaProvider
      style={{
        backgroundColor: streamChatTheme.colors?.white_snow || '#FCFCFC',
      }}
    >
      <NavigationContainer
        theme={{
          colors: {
            ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
            background: streamChatTheme.colors?.white_snow || '#FCFCFC',
          },
          dark: colorScheme === 'dark',
        }}
      >
        <AppContext.Provider value={{ chatClient, loginUser, logout, switchUser }}>
          {isConnecting ? (
            <LoadingScreen />
          ) : chatClient ? (
            <DrawerNavigatorWrapper chatClient={chatClient} />
          ) : (
            <UserSelector />
          )}
        </AppContext.Provider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const DrawerNavigator: React.FC = () => {
  const { overlay } = useOverlayContext();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <MenuDrawer {...props} />}
      drawerStyle={{
        width: 300,
      }}
      screenOptions={{
        gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
      }}
    >
      <Drawer.Screen component={HomeScreen} name='HomeScreen' options={{ headerShown: false }} />
    </Drawer.Navigator>
  );
};

const MessageActionListItemComponent = ({ action, actionType, ...rest }: MessageActionListItem) => {
  const { onTap } = useMessageActionAnimation({ action: action });
  if (actionType === 'pinMessage') {
    return (
      <TapGestureHandler onHandlerStateChange={onTap}>
        <Animated.View>
          <Text>{actionType}</Text>
        </Animated.View>
      </TapGestureHandler>
    );
  } else if (actionType === 'muteUser') {
    return (
      <TapGestureHandler onHandlerStateChange={onTap}>
        <Animated.View>
          <Text>{actionType}</Text>
        </Animated.View>
      </TapGestureHandler>
    );
  } else {
    return <MessageActionListItem action={action} actionType={actionType} {...rest} />;
  }
};

const MessageActionListComponent: React.ComponentType<
  MessageActionListProps<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >
> = () => {
  const { setOverlay } = useOverlayContext();
  const messageActions = [
    {
      action: function () {
        Alert.alert('Edit Message action called.');
        setOverlay('none');
      },
      actionType: 'editMessage',
      title: 'Edit messagee',
    },
    {
      action: function () {
        Alert.alert('Delete message action');
        setOverlay('none');
      },
      actionType: 'deleteMessage',
      title: 'Delete Message',
    },
  ];
  return (
    <View style={{ backgroundColor: 'white' }}>
      {messageActions.map(({ actionType, ...rest }) => (
        <MessageActionListItem actionType={actionType} key={actionType} {...rest} />
      ))}
    </View>
  );
};

const DrawerNavigatorWrapper: React.FC<{
  chatClient: StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
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
      LocalReactionType,
      LocalUserType
    >
      bottomInset={bottom}
      MessageActionList={MessageActionListComponent}
      // MessageActionListItem={MessageActionListItemComponent}
      value={{ style: streamChatTheme }}
    >
      <Chat<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalEventType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      >
        client={chatClient}
      >
        <AppOverlayProvider>
          <UserSearchProvider>
            <DrawerNavigator />
          </UserSearchProvider>
        </AppOverlayProvider>
      </Chat>
    </OverlayProvider>
  );
};

const UserSelector = () => {
  const streamChatTheme = useStreamChatTheme();

  return (
    <ThemeProvider style={streamChatTheme}>
      <UserSelectorStack.Navigator initialRouteName='UserSelectorScreen'>
        <UserSelectorStack.Screen
          component={AdvancedUserSelectorScreen}
          name='AdvancedUserSelectorScreen'
          options={{ gestureEnabled: false, headerShown: false }}
        />
        <UserSelectorStack.Screen
          component={UserSelectorScreen}
          name='UserSelectorScreen'
          options={{ gestureEnabled: false, headerShown: false }}
        />
      </UserSelectorStack.Navigator>
    </ThemeProvider>
  );
};

// TODO: Split the stack into multiple stacks - ChannelStack, CreateChannelStack etc.
const HomeScreen = () => {
  const { overlay } = useOverlayContext();

  return (
    <Stack.Navigator initialRouteName='ChatScreen'>
      <Stack.Screen component={ChatScreen} name='ChatScreen' options={{ headerShown: false }} />
      <Stack.Screen
        component={ChannelScreen}
        name='ChannelScreen'
        options={{
          gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
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
          gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default App;
