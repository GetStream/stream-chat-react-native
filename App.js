import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { Chat } from './src/components/Chat';
import { Channel } from './src/components/Channel';
import { StreamChat } from 'stream-chat';
import { MessageList } from './src/components/MessageList';
import { MessageInput } from './src/components/MessageInput';
import { YellowBox } from 'react-native';

YellowBox.ignoreWarnings(['Remote debugger']);
const chatClient = new StreamChat('qk4nn7rpcn75');
const userToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYmlsbG93aW5nLWZpcmVmbHktOCJ9.CQTVyJ6INIM8u28BxkneY2gdYpamjLzSVUOTZKzfQlg';

chatClient.setUser(
  {
    id: 'billowing-firefly-8',
    name: 'Billowing firefly',
    image: 'https://cdn.pixabay.com/photo/2012/04/13/21/07/user-33638__340.png',
  },
  userToken,
);
const channel = chatClient.channel('messaging', 'godevs', {
  // add as many custom fields as you'd like
  name: 'Talk about Go',
});

export default class App extends React.Component {
  render() {
    return (
      <SafeAreaView>
        <Chat client={chatClient}>
          <Channel client={chatClient} channel={channel}>
            <View style={{ display: 'flex', height: '100%', padding: 10 }}>
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
