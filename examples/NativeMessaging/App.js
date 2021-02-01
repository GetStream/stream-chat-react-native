/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useEffect, useState} from 'react';
import {LogBox, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator, useHeaderHeight} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';
import { Button, Text, StyleSheet, StatusBar, View } from "react-native";
import Constants from "expo-constants";
import {StreamChat} from 'stream-chat';
import {
  Channel,
  ChannelList,
  ChannelPreviewMessenger,
  Chat,
  MessageInput,
  MessageList,
  Streami18n,
  Thread,
} from 'stream-chat-react-native';

LogBox.ignoreAllLogs(true);
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
//status bar

const App = () => {
  const styleTypes = ['default','dark-content', 'light-content'];
  const [visibleStatusBar, setVisibleStatusBar] = useState(false);
  const [styleStatusBar, setStyleStatusBar] = useState(styleTypes[0]);

  const changeVisibilityStatusBar = () => {
    setVisibleStatusBar(!visibleStatusBar);
  };

  const changeStyleStatusBar = () => {
    const styleId = styleTypes.indexOf(styleStatusBar) + 1;

    if(styleId === styleTypes.length){
      return setStyleStatusBar(styleTypes[0]);
    }
    return setStyleStatusBar(styleTypes[styleId]);
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.textStyle}>StatusBar Style: {styleStatusBar}</Text>
        <Text style={styles.textStyle}>StatusBar Visibility: {!visibleStatusBar ? 'Visible': 'Hidden'}</Text>
      </View>
      <StatusBar backgroundColor="blue" barStyle={styleStatusBar} />
      <View>
        <StatusBar hidden={visibleStatusBar} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Toggle StatusBar" onPress={() => changeVisibilityStatusBar()} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Change StatusBar Style" onPress={() => changeStyleStatusBar()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ECF0F1',
    padding: 8
  },
  buttonContainer:{
    padding: 10
  },
  textStyle:{
    textAlign: 'center'
  }
});

export default App

render: function() {
  return (
    <ToolbarAndroid
      logo={require('./app_logo.png')}
      title="AwesomeApp"
      actions={[{title: 'Settings', icon: require('./icon_settings.png'), show: 'always'}]}
      onActionSelected={this.onActionSelected} />
  )
},
onActionSelected: function(position) {
  if (position === 0) { // index of 'Settings'
    showSettings();
  }
}

const chatClient = new StreamChat('q95x9hkbyd6p');
const userToken =
'jkndykrr7cepdnp5q8kyghrjjbbdgj8hrntn8n7jjwabqyh53axgj3h5h3kegp32';
const user = {
  id: 'ron',
};

const filters = {
  example: 'example-apps',
  members: {$in: ['ron']},
  type: 'messaging',
};
const sort = {last_message_at: -1};
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

const ChannelListScreen = React.memo(({navigation}) => {
  const {setChannel} = useContext(AppContext);
  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n} style={theme}>
        <View style={{height: '100%', padding: 10}}>
          <ChannelList
            filters={filters}
            onSelect={(channel) => {
              setChannel(channel);
              navigation.navigate('Channel');
            }}
            options={options}
            Preview={ChannelPreviewMessenger}
            sort={sort}
          />
        </View>
      </Chat>
    </SafeAreaView>
  );
});

const ChannelScreen = React.memo(({navigation}) => {
  const {channel, setThread} = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n} style={theme}>
        <Channel channel={channel} keyboardVerticalOffset={headerHeight}>
          <View style={{flex: 1}}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                navigation.navigate('Thread', {channelId: channel.id});
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

const ThreadScreen = React.memo(({route}) => {
  const {thread} = useContext(AppContext);
  const [channel] = useState(
    chatClient.channel('messaging', route.params.channelId),
  );
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <Channel
          channel={channel}
          keyboardVerticalOffset={headerHeight}
          thread={thread}>
          <View
            style={{
              flex: 1,
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

const AppContext = React.createContext();

export default () => {
  const [channel, setChannel] = useState();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.setUser(user, userToken);

      setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer>
      <AppContext.Provider value={{channel, setChannel, setThread, thread}}>
        {clientReady && (
          <Stack.Navigator
            initialRouteName="ChannelList"
            screenOptions={{
              cardStyle: {backgroundColor: 'white'},
              headerTitleStyle: {alignSelf: 'center', fontWeight: 'bold'},
            }}>
            <Stack.Screen
              component={ChannelScreen}
              name="Channel"
              options={() => ({
                headerBackTitle: 'Back',
                headerRight: () => <></>,
                headerTitle: channel.data.name,
              })}
            />
            <Stack.Screen
              component={ChannelListScreen}
              name="ChannelList"
              options={{headerTitle: 'Channel List'}}
            />
            <Stack.Screen
              component={ThreadScreen}
              name="Thread"
              options={({navigation}) => ({
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
                    }}>
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
                      }}>
                      <Text>X</Text>
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
