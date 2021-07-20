**Note:** The Channel component provides access to the values stored in [ChannelContext](#channelcontext), [MessagesContext](#messagescontext), and [ThreadContext](#threadcontext) and exposes their hooks or the [withChannelContext](#withchannelcontext), [withMessagesContext](#withmessagescontext), and [withThreadContext](#withthreadcontext) higher order components.

The example below shows how to write a component that consumes a context and uses hooks.

```jsx static
import React from 'react';
import { Text, View } from 'react-native';

import { Chat, Channel, MessageInput, MessageList, useChannelContext } from 'stream-chat-react-native';

const CustomChannelHeader = () => {
  const { channel, loading } = useChannelContext();

  return loading ? (
    <View>
      <Text>Channel is loading...</Text>
    </View>
  ) : (
    <View>
      <Text>Channel ID: {channel.cid}</Text>
      <Text>
        There are currently {channel.state.watcher_count} people online
      </Text>
    </View>
  );
};

<OverlayProvider>
  <View>
    <Chat client={chat}>
      <Channel channel={dataChannel}>
        <CustomChannelHeader />
        <MessageList />
        <MessageInput />
      </Channel>
    </Chat>
  </View>
</OverlayProvider>
```
