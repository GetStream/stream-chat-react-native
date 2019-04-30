Team Style Example

```jsx
const StreamChat = require('stream-chat').StreamChat;

chatClient = new StreamChat('qk4nn7rpcn75');

chatClient.setUser(
  {
    id: 'John',
  },
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiSm9obiIsImlhdCI6MTU0ODI5ODUxN30.hyonbQnOLuFsr15mdmc_JF4sBOm2SURK4eBvTOx3ZIg',
);

const channel = chatClient.channel('team', 'docs', {
  image:
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01_green.jpg',
  name: 'Talk about the documentation',
});

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={chatClient}>
    <Channel channel={channel} Message={MessageTeam}>
      <div className="str-chat__main-panel">
        <ChannelHeader type="Team" />
        <MessageList />
        <MessageInput />
      </div>
      <Thread autoFocus={false} />
    </Channel>
  </Chat>
</div>;
```

If you want to write your own component which consumes the chat context, have a look at the example below:

```js
const data = require('./data');
const React = require('react');
const ChatComponents = require('../');

const MyContextAwareComponent = ChatComponents.withChatContext(
  class MyContextAwareComponent extends React.PureComponent {
    render() {
      return (
        <ol>
          <li>UserID: {this.props.client.userID}</li>
          <li>Active Channel: {this.props.channel.cid}</li>
          <li>Available Channels: {this.props.channels.length}</li>
        </ol>
      );
    }
  },
);

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <MyContextAwareComponent />
  </Chat>
</div>;
```
