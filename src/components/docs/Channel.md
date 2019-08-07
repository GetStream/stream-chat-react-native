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

**NOTE** The Channel produces the [ChannelContext](#channelcontext) and exposes a [withChannelContext](#withchannelcontext) HOC.

The example below shows you how to write components that consume the channel context.

```json
class CustomChannelHeader extends React.PureComponent {
  render() {
    return (
      <div>
        There are currently {this.props.watcher_count} people online in channel
        {this.props.channel.cid}. These users are typing:
        <span className="str-chat__input-footer--typing">
          {ChatComponents.formatArray(Object.keys(this.props.typing))}
        </span>
      </div>
    );
  }
}

ContextAwareCustomChannelHeader = ChatComponents.withChannelContext(CustomChannelHeader);

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <Channel channel={data.channel}>
      <div className="str-chat__main-panel" style={{ height: '500px' }}>
        <ContextAwareCustomChannelHeader />
        <MessageList />
        <MessageInput />
      </div>
    </Channel>
  </Chat>
</div>;
```
