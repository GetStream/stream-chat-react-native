import React, { useEffect, useState } from 'react';
import { LogBox, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { Channel as ChannelType, StreamChat } from 'stream-chat';
import {
  OverlayProvider,
  ThreadContextValue,
} from 'stream-chat-react-native/v2';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  NavigationParamsList,
} from './types';
import { AppContext } from './context/AppContext';
import { ChannelScreen } from './screens/ChannelScreen';
import { ChannelListScreen } from './screens/ChannelListScreen';
import { ThreadScreen } from './screens/ThreadScreen';

LogBox.ignoreAllLogs(true);
enableScreens();

const chatClient = new StreamChat<
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType
>('q95x9hkbyd6p');
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
const user = {
  id: 'ron',
};

const Stack = createStackNavigator<NavigationParamsList>();

const App = () => {
  const [channel, setChannel] = useState<
    ChannelType<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalResponseType,
      LocalUserType
    >
  >();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState<
    ThreadContextValue<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalResponseType,
      LocalUserType
    >['thread']
  >();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.setUser(user, userToken);

      return setClientReady(true);
    };

    setupClient();
  }, []);

  if (!clientReady) return null;
  return (
    <NavigationContainer>
      <AppContext.Provider
        value={{ channel, chatClient, setChannel, setThread, thread }}
      >
        <OverlayProvider>
          <Stack.Navigator
            initialRouteName='ChannelList'
            screenOptions={{
              cardStyle: { backgroundColor: 'white' },
              headerTitleStyle: { alignSelf: 'center', fontWeight: 'bold' },
            }}
          >
            <Stack.Screen
              component={ChannelScreen}
              name='Channel'
              options={() => ({
                headerBackTitle: 'Back',
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
              options={({ navigation }) => ({
                // eslint-disable-next-line react/display-name
                headerLeft: () => <></>,
                // eslint-disable-next-line react/display-name
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.goBack();
                    }}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 20,
                    }}
                  >
                    <View
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'white',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: 3,
                        borderStyle: 'solid',
                        borderWidth: 1,
                        height: 30,
                        justifyContent: 'center',
                        width: 30,
                      }}
                    >
                      <Text>X</Text>
                    </View>
                  </TouchableOpacity>
                ),
              })}
            />
          </Stack.Navigator>
        </OverlayProvider>
      </AppContext.Provider>
    </NavigationContainer>
  );
};

export default App;
