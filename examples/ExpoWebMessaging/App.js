import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, StyleSheet, Text, View, Button, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, useHeaderHeight } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StreamChat } from 'stream-chat';
import { Streami18n } from 'stream-chat-expo-web';

LogBox.ignoreAllLogs(true);

const chatClient = StreamChat.getInstance('q95x9hkbyd6p');
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
const user = {
  id: 'ron',
};

const filters = {
  example: 'example-apps',
  members: { $in: ['ron'] },
  type: 'messaging',
};
const sort = { last_message_at: -1 };
const options = {
  state: true,
  watch: true,
};

const AppContext = React.createContext();

const Stack = createStackNavigator();

const App = () => {
  const colorScheme = useColorScheme();
  const { bottom } = useSafeAreaInsets();

  const [channel, setChannel] = useState();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.connectUser(user, userToken);

      setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer
      theme={{
        colors: {
          ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
          background: '#FCFCFC',
        },
        dark: colorScheme === 'dark',
      }}
    >
      <AppContext.Provider value={{ channel, setChannel, setThread, thread }}>
        {clientReady && (
          <Stack.Navigator
            initialRouteName='ChannelList'
            screenOptions={{
              headerTitleStyle: { alignSelf: 'center', fontWeight: 'bold' },
            }}
          >
            <Stack.Screen
              component={ChannelScreen}
              name='Channel'
              options={() => ({
                headerBackTitle: 'Back',
                headerRight: () => <></>,
                headerTitle: channel?.data?.name,
              })}
            />
            <Stack.Screen
              component={ChannelListScreen}
              name='ChannelList'
              options={{ headerTitle: 'Channel List' }}
            />
            <Stack.Screen
              component={ThreadScreen}
              name='Thread'
              options={() => ({ headerLeft: () => <></> })}
            />
          </Stack.Navigator>
        )}
      </AppContext.Provider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default () => {
  return (
    <SafeAreaProvider style={{ backgroundColor: '#FCFCFC' }}>
      <App />
    </SafeAreaProvider>
  );
};
