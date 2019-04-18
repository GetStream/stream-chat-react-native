import React, { PureComponent } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Chat } from './src/components/Chat';
import { Channel } from './src/components/Channel';
import { StreamChat } from 'stream-chat';
import { MessageList } from './src/components/MessageList';
import { MessageInput } from './src/components/MessageInput';
import { ChannelList } from './src/components/ChannelList';
import { Thread } from './src/components/Thread';
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

const channel = chatClient.channel('messaging', 'godevs', {
  // add as many custom fields as you'd like
  name: 'Talk about Go',
});

const filters = { type: 'messaging' };
const sort = { last_message_at: -1 };
const channels = chatClient.queryChannels(filters, sort, {
  subscribe: true,
});

class ChannelListScreen extends PureComponent {
  render() {
    return (
      <SafeAreaView>
        <Chat client={chatClient}>
          <View style={{ display: 'flex', height: '100%', padding: 10 }}>
            <ChannelList
              channels={channels}
              Preview={ChannelPreviewMessenger}
              onSelect={(channel) => {
                this.props.navigation.navigate('Channel', {
                  channel,
                });
              }}
            />
          </View>
        </Chat>
      </SafeAreaView>
    );
  }
}

class ChannelScreen extends PureComponent {
  render() {
    const { navigation } = this.props;
    const channel = navigation.getParam('channel');

    return (
        <SafeAreaView>
          <Chat client={chatClient}>
            <Channel client={chatClient} channel={channel}>
              <View style={{ display: 'flex', height: '100%' }}>
                <MessageList
                  onThreadSelect={(thread) => {
                    this.props.navigation.navigate('Thread', {
                      thread,
                      channel,
                    });
                  }}
                />
                <MessageInput />
              </View>
            </Channel>
          </Chat>
        </SafeAreaView>
    );
  }
}

class ThreadScreen extends PureComponent {
  static navigationOptions = ({ navigation }) => {
    return {
      headerTitle: <Text>Thread</Text>,
      headerLeft: null,
      headerRight: (
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
          style={{
            backgroundColor: '#ebebeb',
            width: 30,
            height: 30,
            marginRight: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text>X</Text>
        </TouchableOpacity>
      ),
    };
  };

  render() {
    const { navigation } = this.props;
    const thread = navigation.getParam('thread');
    const channel = navigation.getParam('channel');

    return (
      <SafeAreaView>
        <Chat client={chatClient}>
          <Channel client={chatClient} channel={channel} thread={thread}>
            <View style={{ display: 'flex', height: '100%' }}>
              <Thread thread={thread} />
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
    Thread: {
      screen: ThreadScreen,
    },
  },
  {
    initialRouteName: 'ChannelList'
  },
);

const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component {
  render() {
    return <AppContainer />;
  }
}
