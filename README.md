# React Native Chat Components

> The official React Native and Expo components for Stream Chat, a service for
> building chat applications.

[![NPM](https://img.shields.io/npm/v/stream-chat-react-native.svg)](https://www.npmjs.com/package/stream-chat-react-native)
[![Build Status](https://travis-ci.org/GetStream/stream-chat-react-native.svg?branch=master)](https://travis-ci.org/GetStream/stream-chat-react-native)
[![Component Reference](https://img.shields.io/badge/docs-component%20reference-blue.svg)](https://getstream.github.io/stream-chat-react-native/)

You can sign up for a Stream account at https://getstream.io/chat/get_started/.

You can find detailed and set-by-step tutorial at https://getstream.io/chat/react-native-chat/tutorial/

You can find the design kit for this project at https://getstream.io/chat/ui-kit/

## Keep in mind

1. Navigation between different component is something we expect consumers to
   implement. You can checkout the example given in this repository

Library currently exposes following components:

1. Avatar
2. Chat
3. Channel
4. MessageList
5. TypingIndicator
6. MessageInput
7. MessageSimple
8. ChannelList
9. Thread
10. ChannelPreviewMessenger
11. CloseButton
12. IconBadge

You can see detailed documentation about the components at https://getstream.github.io/stream-chat-react-native

## Usage (creating an example app)

### Expo package

```bash
yarn global add expo-cli
expo init StreamChatExpoExample
cd StreamChatExpoExample
yarn add stream-chat-expo
```

Please check [Example](https://github.com/GetStream/stream-chat-react-native/blob/v0.0.6/examples/one/App.js) to see usage of the components.

OR you can swap [this file](https://github.com/GetStream/stream-chat-react-native/blob/v0.0.6/examples/one/App.js) for your `App.js` in the root folder with additional following steps:

```bash
yarn add react-navigation
```

and finally

```bash
yarn start
```

### Native package:

#### For react native < 0.60

```bash
react-native init StreamChatReactNativeExample
cd StreamChatReactNativeExample
yarn add stream-chat-react-native
yarn add @react-native-community/netinfo react-native-image-picker react-native-document-picker
react-native link @react-native-community/netinfo

# if you are plannign to use image picker or file picker or both
react-native link react-native-image-picker
react-native link react-native-document-picker

```

Just to be sure, please verify you are using appropriate version of following packages as per your react-native version.

- netinfo : https://github.com/react-native-community/react-native-netinfo#react-native-compatibility

- react-native-image-picker : https://github.com/react-native-community/react-native-image-picker#react-native-compatibility

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

#### For react native >= 0.60

```bash
react-native init StreamChatReactNativeExample
cd StreamChatReactNativeExample
yarn add stream-chat-react-native
yarn add @react-native-community/netinfo react-native-image-picker react-native-document-picker
cd ios && pod install && cd ..

```

Just to be sure, please verify you are using appropriate version of following packages as per your react-native version.

- netinfo : https://github.com/react-native-community/react-native-netinfo#react-native-compatibility

- react-native-image-picker : https://github.com/react-native-community/react-native-image-picker#react-native-compatibility

Please check [Example](https://github.com/GetStream/stream-chat-react-native/blob/v0.0.6/examples/two/App.js) to see usage of components.

OR you can swap this file for your `App.js` in root folder with additional following steps:

```bash
yarn add react-navigation
yarn add react-native-gesture-handler
cd ios && pod install && cd ..
```

and finally

**iOS**:

```bash
react-native run-ios
```

**Note for Android**:

If you are using androidx app:

> AndroidX is a major step forward in the Android ecosystem, and the old support library artifacts are being deprecated. For 0.60, React Native has been migrated over to AndroidX. This is a breaking change, and your native code and dependencies will need to be migrated as well.

(reference: https://facebook.github.io/react-native/blog/2019/07/03/version-60#androidx-support)

In current context, dependencies such as `react-native-document-picker` and (if you are using `react-navigation`) `react-native-gesture-handler`, `react-native-reanimated` don't have androidx support. But awesome tool named [jetifier](https://github.com/mikehardy/jetifier) is quite usefull to patch these dependencies with androidx support.

**NOTE** If you are planning to use file picker functionality, make sure you enable iCloud capability in your app

![Enable iCloud capability](https://camo.githubusercontent.com/ac300ca7e3bbab573a76c151469a89efd8b31e72/68747470733a2f2f33313365353938373731386233343661616638332d66356538323532373066323961383466373838313432333431303338343334322e73736c2e6366312e7261636b63646e2e636f6d2f313431313932303637342d656e61626c652d69636c6f75642d64726976652e706e67)

## How to run example

### Expo example

1. Make sure node version is >= v10.13.0
2. ```bash
   yarn global add expo-cli
   git clone https://github.com/GetStream/stream-chat-react-native.git
   cd stream-chat-react-native
   make
   cd examples/one
   yarn start
   ```

### Native example

1. Please make sure you have installed necessary dependencies depending on your development OS and target OS. Follow the guidelines given on official react native documentation for installing dependencies: https://facebook.github.io/react-native/docs/getting-started#
2. Make sure node version is >= v10.13.0
3. Start the simulator

4. ```bash
   git clone https://github.com/GetStream/stream-chat-react-native.git
   cd stream-chat-react-native
   make
   cd examples/two
   ```
5. - For iOS
     ```bash
     react-native run-ios
     ```
   - For android
     ```bash
     react-native run-android
     ```

#### While running native example, you may (not necessarily) run into following issues:

1. When you execute `react-native run-ios` for the first time, it starts a metro bundler in parallel. It can result into some errors, since build process isn't complete yet. Try the following to fix this:
   1. Close/stop the metro bundler process.
   2. Let the build process finish completely, it can take usually around 2-3 minutes for the first time.
   3. Start the metro bundler manually by executing `yarn start` inside `stream-chat-react-native/examples/two` directory.
2. When you execute `react-native run-android`, you may (not necessarily) run into following error:

   ```ERROR
   info Starting JS server...
   info Building and installing the app on the device (cd android && ./gradlew app:installDebug)...
   Starting a Gradle Daemon, 1 incompatible Daemon could not be reused, use --status for details

   FAILURE: Build failed with an exception.

   * What went wrong:
   A problem occurred configuring project ':@react-native-community_netinfo'.
   > SDK location not found. Define location with sdk.dir in the local.properties file or with an ANDROID_HOME environment variable.

   * Try:
   Run with --stacktrace option to get the stack trace. Run with --info or --debug option to get more log output. Run with --scan to get full insights.

   * Get more help at https://help.gradle.org

   BUILD FAILED in 13s
   error Could not install the app on the device, read the error above for details.
   Make sure you have an Android emulator running or a device connected and have
   set up your Android development environment:
   https://facebook.github.io/react-native/docs/getting-started.html
   error Command failed: ./gradlew app:installDebug. Run CLI with --verbose flag for more details.
   ```

   To resolve this, do the following

   1. Craete a file named `local.properties` inside `stream-chat-react-native/examples/two/android` directory
   2. Put the this line in that file. Make sure sdk path is correctly mentioned as per your system:
      ```
      sdk.dir=/Users/{user_name}/Library/Android/sdk/
      ```
   3. Rerun `react-native run-android` in `stream-chat-react-native/examples/two` directory
