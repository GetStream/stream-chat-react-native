```js
<div
  data-snack-id="@vishalnarkhede/messagelist-example"
  data-snack-platform="android"
  data-snack-preview="true"
  data-snack-theme="light"
  style={{
    overflow: 'hidden',
    background: '#fafafa',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: '4px',
    height: '505px',
    width: '100',
  }}
></div>
```

**Note:** The Channel component provides access to the values stored in [ChannelContext](#channelcontext), [MessagesContext](#messagescontext), and [ThreadContext](#threadcontext) and exposes their hooks or the [withChannelContext](#withchannelcontext), [withMessagesContext](#withmessagescontext), and [withThreadContext](#withthreadcontext) higher order components.

The example below shows how to write a component that consumes a context and uses hooks.

```js static
import React from 'react';
import { Text, View } from 'react-native';

import { Channel } from './Channel';

import { Chat } from '../Chat/Chat';
import { chat, channel as dataChannel, } from '../docs/data';
import { MessageInput } from '../MessageInput/MessageInput';
import { MessageList } from '../MessageList/MessageList';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';

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

<View>
  <Chat client={chat}>
    <Channel channel={dataChannel}>
      <CustomChannelHeader />
      <MessageList />
      <MessageInput />
    </Channel>
  </Chat>
</View>;
```
