import React, { PureComponent } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
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
} from 'stream-chat-react-native';

import { createAppContainer, createStackNavigator } from 'react-navigation';

// Read more about style customizations at - https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
const theme = {
  avatar: {
    image: {
      size: 32,
    },
  },
  colors: {
    primary: 'magenta',
  },
  spinner: {
    css: `
      width: 15px;
      height: 15px;
    `,
  },
};

const chatClient = new StreamChat('qk4nn7rpcn75');
const userToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYmlsbG93aW5nLWZpcmVmbHktOCJ9.CQTVyJ6INIM8u28BxkneY2gdYpamjLzSVUOTZKzfQlg';
  const user = {
    id: 'billowing-firefly-8',
    name: 'Billowing firefly',
    image:
      'https://stepupandlive.files.wordpress.com/2014/09/3d-animated-frog-image.jpg',
  };
  
const filters = { type: 'messaging' };
const sort = { last_message_at: -1 };
const options = {
  state: true,
  watch: true
}

class ChannelListScreen extends PureComponent {
  static navigationOptions = () => ({
    headerTitle: <Text style={{ fontWeight: 'bold' }}>Channel List</Text>,
  });

  render() {
    return (
      <SafeAreaView>
        <Chat client={chatClient} style={theme}>
          <View style={{ display: 'flex', height: '100%', padding: 10 }}>
            <ChannelList
              filters={filters}
              sort={sort}
              options={options}
              Preview={ChannelPreviewMessenger}
              onSelect={channel => {
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
  static navigationOptions = ({ navigation }) => {
    const channel = navigation.getParam('channel');
    return {
      headerTitle: (
        <Text style={{ fontWeight: 'bold' }}>{channel.data.name}</Text>
      ),
    };
  };

  render() {
    const { navigation } = this.props;
    const channel = navigation.getParam('channel');

    return (
      <SafeAreaView>
        <Chat client={chatClient} style={theme}>
          <Channel client={chatClient} channel={channel}>
            <View style={{ display: 'flex', height: '100%' }}>
              <MessageList
                onThreadSelect={thread => {
                  this.props.navigation.navigate('Thread', {
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
  }
}

class ThreadScreen extends PureComponent {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: <Text style={{ fontWeight: 'bold' }}>Thread</Text>,
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
          borderRadius: 20,
        }}>
        <CloseButton />
      </TouchableOpacity>
    ),
  });

  render() {
    const { navigation } = this.props;
    const thread = navigation.getParam('thread');
    const channel = chatClient.channel(
      'messaging',
      navigation.getParam('channel'),
    );

    return (
      <SafeAreaView>
        <Chat client={chatClient}>
          <Channel
            client={chatClient}
            channel={channel}
            thread={thread}
            dummyProp="DUMMY PROP">
            <View
              style={{
                display: 'flex',
                height: '100%',
                justifyContent: 'flex-start',
              }}>
              <Thread thread={thread} />
            </View>
          </Channel>
        </Chat>
      </SafeAreaView>
    );
  }
}

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
    initialRouteName: 'ChannelList',
  },
);

const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clientReady: false
    }
  }

  async componentDidMount() {

    await chatClient.setUser(
      user,
      userToken,
    );

    this.setState({
      clientReady: true
    })
  }
  render() {
    if (this.state.clientReady)
      return <AppContainer />;
    else return null;
  }
}
