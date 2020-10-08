import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { ChannelSort, Channel as ChannelType, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Streami18n,
  Thread,
  ThreadContextValue,
} from 'stream-chat-react-native';

enableScreens();

type LocalAttachmentType = {};
type LocalChannelType = {};
type LocalCommandType = '';
type LocalEventType = {};
type LocalMessageType = {};
type LocalResponseType = {};
type LocalUserType = {};

// Read more about style customizations at - https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
const theme = {
  avatar: {
    image: {
      css: `
        height: 32px;
        width: 32px;
      `,
    },
  },
  colors: {
    primary: 'blue',
  },
  spinner: {
    css: `
      height: 15px;
      width: 15px;
    `,
  },
};

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

const filters = {
  type: 'messaging',
  example: 'example-apps',
  members: { $in: ['ron'] },
};
const sort: ChannelSort<LocalChannelType> = { last_message_at: -1 };
const options = {
  state: true,
  watch: true,
};

/**
 * Start playing with streami18n instance here:
 * Please refer to description of this PR for details: https://github.com/GetStream/stream-chat-react-native/pull/150
 */
const streami18n = new Streami18n({
  language: 'en',
});

type ChannelListScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'ChannelList'>;
};

const ChannelListScreen: React.FC<ChannelListScreenProps> = ({
  navigation,
}) => {
  const { setChannel } = useContext(AppContext);
  return (
    <SafeAreaView>
      <Chat
        client={chatClient}
        i18nInstance={streami18n}
        style={theme}
      >
        <View style={{ height: '100%', padding: 10 }}>
          <ChannelList<
            LocalAttachmentType,
            LocalChannelType,
            LocalCommandType,
            LocalEventType,
            LocalMessageType,
            LocalResponseType,
            LocalUserType
          >
            filters={filters}
            onSelect={(channel) => {
              setChannel(channel);
              navigation.navigate('Channel');
            }}
            options={options}
            sort={sort}
          />
        </View>
      </Chat>
    </SafeAreaView>
  );
};

type ChannelScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'Channel'>;
};

const ChannelScreen: React.FC<ChannelScreenProps> = ({ navigation }) => {
  const { channel, setThread } = useContext(AppContext);

  return (
    <SafeAreaView>
      <Chat
        client={chatClient}
        i18nInstance={streami18n}
        style={theme}
      >
        <Channel
          channel={channel}
        >
          <View style={{ height: '100%' }}>
            <MessageList<
              LocalAttachmentType,
              LocalChannelType,
              LocalCommandType,
              LocalEventType,
              LocalMessageType,
              LocalResponseType,
              LocalUserType
            >
              onThreadSelect={(thread) => {
                setThread(thread);
                if (channel?.id) {
                  navigation.navigate('Thread', { channelId: channel.id });
                }
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
};

type ThreadScreenProps = {
  route: RouteProp<ThreadRoute, 'Thread'>;
};

const ThreadScreen: React.FC<ThreadScreenProps> = ({ route }) => {
  const { thread } = useContext(AppContext);
  const [channel] = useState(
    chatClient.channel('messaging', route.params.channelId),
  );

  return (
    <SafeAreaView>
      <Chat
        client={chatClient}
        i18nInstance={streami18n}
      >
        <Channel
          channel={channel}
          thread={thread}
        >
          <View
            style={{
              height: '100%',
              justifyContent: 'flex-start',
            }}
          >
            <Thread<
              LocalAttachmentType,
              LocalChannelType,
              LocalCommandType,
              LocalEventType,
              LocalMessageType,
              LocalResponseType,
              LocalUserType
            > />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
};

type ChannelRoute = { Channel: undefined };
type ChannelListRoute = { ChannelList: undefined };
type ThreadRoute = { Thread: { channelId: string } };
type NavigationParamsList = ChannelRoute & ChannelListRoute & ThreadRoute;

const Stack = createStackNavigator<NavigationParamsList>();

type AppContextType = {
  channel:
    | ChannelType<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalEventType,
        LocalMessageType,
        LocalResponseType,
        LocalUserType
      >
    | undefined;
  setChannel: React.Dispatch<
    React.SetStateAction<
      | ChannelType<
          LocalAttachmentType,
          LocalChannelType,
          LocalCommandType,
          LocalEventType,
          LocalMessageType,
          LocalResponseType,
          LocalUserType
        >
      | undefined
    >
  >;
  setThread: React.Dispatch<
    React.SetStateAction<
      | ThreadContextValue<
          LocalAttachmentType,
          LocalChannelType,
          LocalCommandType,
          LocalEventType,
          LocalMessageType,
          LocalResponseType,
          LocalUserType
        >['thread']
      | undefined
    >
  >;
  thread:
    | ThreadContextValue<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalEventType,
        LocalMessageType,
        LocalResponseType,
        LocalUserType
      >['thread']
    | undefined;
};

const AppContext = React.createContext({} as AppContextType);

export default () => {
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

  return (
    <NavigationContainer>
      <AppContext.Provider value={{ channel, setChannel, setThread, thread }}>
        {clientReady && (
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
              options={({ navigation }) => ({
                headerLeft: () => <></>,
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
                    <View style={{
                      alignItems: 'center',
                      backgroundColor: 'white',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: 3,
                      borderStyle: 'solid',
                      borderWidth: 1,
                      height: 30,
                      justifyContent: 'center',
                      width: 30,
                    }}>
                      <Text>
                        X
                      </Text>
                    </View>
                  </TouchableOpacity>
                ),
              })}
            />
          </Stack.Navigator>
        )}
      </AppContext.Provider>
    </NavigationContainer>
  );
};
