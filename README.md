# React Native Chat Components

> The official React Native and Expo components for Stream Chat, a service for
> building chat applications.

[![NPM](https://img.shields.io/npm/v/stream-chat-react-native.svg)](https://www.npmjs.com/package/stream-chat-react-native)
[![Build Status](https://travis-ci.org/GetStream/stream-chat-react-native.svg?branch=master)](https://travis-ci.org/GetStream/stream-chat-react-native)
[![Component Reference](https://img.shields.io/badge/docs-component%20reference-blue.svg)](https://getstream.github.io/stream-chat-react-native/)

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

## Usage (creating an example app)

### Expo package

```bash
expo init StreamChatExpoExample
cd StreamChatExpoExample
yarn add stream-chat-expo
```

Please check [Example](https://github.com/GetStream/stream-chat-react-native/blob/v0.0.6/examples/one/App.js) to see usage of components.

OR you can swap this file for your `App.js` in root folder with additional following steps:

```bash
yarn add react-navigation
```

and finally

```bash
yarn start
```

### Native package:

```bash
react-native init StreamChatReactNativeExample
cd StreamChatReactNativeExample
yarn add stream-chat-react-native
react-native link @react-native-community/netinfo

# if you are plannign to use image picker or file picker or both
react-native link react-native-image-picker
react-native link react-native-document-picker

```

Please check [Example](https://github.com/GetStream/stream-chat-react-native/blob/v0.0.6/examples/two/App.js) to see usage of components.

OR you can swap this file for your `App.js` in root folder with additional following steps:

```bash
yarn add react-navigation
yarn add react-native-gesture-handler
react-native link react-native-gesture-handler
```

and finally

```bash
react-native run-ios
```

**NOTE** If you are planning to use file picker functionality, make sure you enable iCloud capability in your app

![Enable iCloud capability](https://camo.githubusercontent.com/ac300ca7e3bbab573a76c151469a89efd8b31e72/68747470733a2f2f33313365353938373731386233343661616638332d66356538323532373066323961383466373838313432333431303338343334322e73736c2e6366312e7261636b63646e2e636f6d2f313431313932303637342d656e61626c652d69636c6f75642d64726976652e706e67)

## How to run example

```bash
git clone https://github.com/GetStream/stream-chat-react-native.git
cd stream-chat-react-native
make
cd examples/one
yarn start
```

## TODO:

1. Play media in app - currently it goes to browser when clicked on attachment
2. Add propTypes to each component
3. Command support for inputbox
