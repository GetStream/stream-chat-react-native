The MessageInput is a higher level component that has provides all functionality to the Input it renders. In this example it renders the default component MessageInputLarge.

### Overriding Core Functions

Sometimes you'll want to use our components but will need custom functionality. Right now we support overriding the uploading of files and images. MessageInput takes two props to makes this possible:

- `onFileUploadRequest(file, channel)`
- `onImageUploadRequest(file, channel)`

Both functions have access to the selected file and the channel object and expect an object to be returned `{file: url}`.

```js
const data = require('./data');
<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput />
    </Channel>
  </Chat>
</div>;
```
