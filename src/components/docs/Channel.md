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

**Note:** The Channel component provides access to the values stored in [ChannelContext](#channelcontext) and exposes the [withChannelContext](#withchannelcontext) higher order components.

The example below shows how to write a component that consumes a context through a higher order component.

```json
class CustomChannelHeader extends React.PureComponent {
  const { channel, loading } = this.props;

  render() {
    if (loading) {
      return (
        <View>
          <Text>Channel is loading...</Text>
        </View>
      );
    }

    return (
      <View>
        <Text>Channel ID: {channel.cid}</Text>
        <Text>
          There are currently {channel.state.watcher_count} people online
        </Text>
      </View>
    );
  }
};

ContextAwareCustomChannelHeader = withChannelContext(CustomChannelHeader);

<View>
  <Chat client={chatClient}>
    <Channel channel={channel}>
      <ContextAwareCustomChannelHeader />
      <MessageList />
      <MessageInput />
    </Channel>
  </Chat>
</View>;
```
