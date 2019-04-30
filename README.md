# Stream React Native Chat

Library currently exposes following components:

1. Chat
2. Channel
3. MessageList
4. MessageInput
5. ChannelList
6. Thread
7. ChannelPreviewMessenger

## Keep in mind

1. Navigation between different component is something we expect consumers to implement. You can checkout the example given in this repository
2. This library is still under development, so plenty of code-cleanup and performance related fixes will be on the way in next couple of weeks. So we won't really recommend integrating it right now.

## How to run example

```bash
git clone https://github.com/GetStream/stream-chat-react-native.git
cd stream-chat-react-native
make
cd examples/one
yarn start
```

## TODO:

1. Attach image/documents/video feature
2. Play media in app - currently it goes to browser when clicked on attachment
3. Add propTypes to each component
