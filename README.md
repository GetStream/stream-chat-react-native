# Stream React Native Chat

> The official React Native and Expo client for Stream Chat, a service for
building chat applications.

[![NPM](https://img.shields.io/npm/v/react-file-utils.svg)](https://www.npmjs.com/package/react-file-utils)
[![Build Status](https://travis-ci.org/GetStream/react-file-utils.svg?branch=master)](https://travis-ci.org/GetStream/react-file-utils)

You can sign up for a Stream account at https://getstream.io/chat/get_started/.

## Keep in mind

1. Navigation between different component is something we expect consumers to
   implement. You can checkout the example given in this repository
2. This library is still under development, so breaking changes are to be
   expected in next couple of weeks. So we won't really recommend integrating it
   right now.

Library currently exposes following components:

1. Chat
2. Channel
3. MessageList
4. MessageInput
5. ChannelList
6. Thread
7. ChannelPreviewMessenger

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
