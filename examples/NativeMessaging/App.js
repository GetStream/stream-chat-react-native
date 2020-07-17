import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  ChannelList,
  Thread,
  CloseButton,
  ChannelPreviewMessenger,
  Streami18n
} from 'stream-chat-react-native';

enableScreens();

// Read more about style customizations at - https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
const theme = {
  avatar: {
    image: {
      size: 32,
    },
  },
  colors: {
    primary: 'blue',
  },
  spinner: {
    css: `
      width: 15px;
      height: 15px;
    `,
  },
};

const chatClient = new StreamChat('q95x9hkbyd6p');
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
  const user = {
    id: 'ron',
  };
  
const filters = { type: 'messaging', example: 'example-apps', members: { '$in': ['ron'] } };
const sort = { last_message_at: -1 };
const options = {
  state: true,
  watch: true
}

/**
 * Start playing with streami18n instance here:
 * Please refer to description of this PR for details: https://github.com/GetStream/stream-chat-react-native/pull/150
 */
const streami18n = new Streami18n({
  language: 'en'
});


const ChannelListScreen = React.memo(({ navigation }) => {
  return (
    <SafeAreaView>
      <Chat client={chatClient} style={theme} i18nInstance={streami18n}>
        <View style={{ display: 'flex', height: '100%', padding: 10 }}>
          <ChannelList
            filters={filters}
            sort={sort}
            options={options}
            Preview={ChannelPreviewMessenger}
            onSelect={channel => {
              navigation.navigate('Channel', {
                channel,
              });
            }}
          />
        </View>
      </Chat>
    </SafeAreaView>
  );
});

const ChannelScreen = React.memo(({ navigation, route }) => {
  const [channel] = useState(route.params.channel);

  return (
    <SafeAreaView>
      <Chat client={chatClient} style={theme} i18nInstance={streami18n}>
        <Channel client={chatClient} channel={channel}>
          <View style={{ height: '100%' }}>
            <MessageList
              onThreadSelect={thread => {
                navigation.navigate('Thread', {
                  thread,
                  channel: channel.id,
                });
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

const ThreadScreen = React.memo(({ navigation, route }) => {
  const [thread] = useState(route.params.thread);
  const [channel] = useState(chatClient.channel('messaging', route.params.channel));

  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <Channel
          client={chatClient}
          channel={channel}
          thread={thread}
          dummyProp="DUMMY PROP">
          <View
            style={{
              height: '100%',
              justifyContent: 'flex-start',
            }}>
            <Thread thread={thread} />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

const Stack = createStackNavigator();

export default () => {
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.setUser(
        user,
        userToken,
      );

      setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer>
      {
        clientReady &&
          <Stack.Navigator initialRouteName='ChannelList' screenOptions={{ cardStyle: { backgroundColor: 'white' }, headerTitleStyle: { fontWeight: 'bold' }, }}>
            <Stack.Screen component={ChannelScreen} name='Channel' options={({ route }) => ({ headerBackTitle: 'Back', headerTitle: route.params.channel.data.name })} />
            <Stack.Screen component={ChannelListScreen} name='ChannelList' options={{ headerTitle: 'Channel List' }} />
            <Stack.Screen component={ThreadScreen} name='Thread' options={({ navigation }) => ({ headerLeft: null, headerRight: () => (
      <TouchableOpacity
        onPress={() => {
          navigation.goBack();
        }}
        style={{
          alignItems: 'center',
          backgroundColor: '#ebebeb',
          borderRadius: 20,
          height: 30,
          justifyContent: 'center',
          marginRight: 20,
          width: 30,
        }}>
        <CloseButton />
      </TouchableOpacity>
    ) })} />
          </Stack.Navigator>
      }
    </NavigationContainer>
  );
};
