import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { Chat } from './src/components/Chat';
import { Channel } from './src/components/Channel';
import { StreamChat } from 'stream-chat';
import { MessageList } from './src/components/MessageList';
import { MessageInput } from './src/components/MessageInput';
import { ChannelList } from './src/components/ChannelList';
import { ChannelPreviewMessenger } from './src/components/ChannelPreviewMessenger';

import { createAppContainer, createStackNavigator } from 'react-navigation';

import { YellowBox } from 'react-native';

YellowBox.ignoreWarnings(['Remote debugger']);
const chatClient = new StreamChat('qk4nn7rpcn75');
const userToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYmlsbG93aW5nLWZpcmVmbHktOCJ9.CQTVyJ6INIM8u28BxkneY2gdYpamjLzSVUOTZKzfQlg';

chatClient.setUser(
  {
    id: 'billowing-firefly-8',
    name: 'Billowing firefly',
    image:
      'https://stepupandlive.files.wordpress.com/2014/09/3d-animated-frog-image.jpg',
  },
  userToken,
);

const filters = { type: 'messaging' };
const sort = { last_message_at: -1 };
const channels = chatClient.queryChannels(filters, sort, {
  subscribe: true,
});

class ChannelListScreen extends React.Component {
  render() {
    return (
      <SafeAreaView>
        <Chat client={chatClient}>
          <View style={{ display: 'flex', height: '100%', padding: 10 }}>
            <ChannelList
              channels={channels}
              Preview={ChannelPreviewMessenger}
              onSelect={(channel) => {
                this.props.navigation.navigate(
                  'Channel',
                  {
                    channel
                  }
                );
              }}
            />
          </View>
        </Chat>
      </SafeAreaView>
    );
  }
}

class ChannelScreen extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    const { navigation } = this.props;
    const channel = navigation.getParam('channel');

    return (
      <SafeAreaView>
        <Chat client={chatClient}>
          <Channel client={chatClient} channel={channel}>
            <View style={{ display: 'flex', height: '100%' }}>
              <MessageList />
              <MessageInput />
            </View>
          </Channel>
        </Chat>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const RootStack = createStackNavigator(
  {
    ChannelList: {
      screen: ChannelListScreen,
    },
    Channel: {
      screen: ChannelScreen,
    },
  },
  {
    initialRouteName: 'ChannelList',
  }
);

const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component {
  render() {
    return <AppContainer />;
  }
}