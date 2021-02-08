# Official React Native SDK for [Stream Chat](https://getstream.io/chat/)

<p align="center">
  <a href="https://getstream.io/chat/react-native-chat/tutorial/"><img src="https://i.imgur.com/SRkDlFX.png" alt="react native chat" width="60%" /></a>
</p>

> The official React Native and Expo components for Stream Chat, a service for
> building chat applications.

[![NPM](https://img.shields.io/npm/v/stream-chat-react-native.svg)](https://www.npmjs.com/package/stream-chat-react-native)
[![Build Status](https://github.com/GetStream/stream-chat-react-native/workflows/test/badge.svg?branch=master)](https://github.com/GetStream/stream-chat-react-native/actions)
[![Component Reference](https://img.shields.io/badge/docs-component%20reference-blue.svg)](https://getstream.github.io/stream-chat-react-native/)

<img align="right" src="https://getstream.imgix.net/images/ios-chat-tutorial/iphone_chat_art@3x.png?auto=format,enhance" width="50%" />

**Quick Links**

- [Stream Chat API](https://getstream.io/chat/) product overview
- [Register](https://getstream.io/chat/trial/) to get an API key for Stream Chat
- [React Native Chat Tutorial](https://getstream.io/chat/react-native-chat/tutorial/)
- [Chat UI Kit](https://getstream.io/chat/ui-kit/)
- [Release Notes](https://github.com/GetStream/stream-chat-react-native/releases)
- [Internationalisation (i18n)](https://github.com/GetStream/stream-chat-react-native/wiki/Internationalization-(i18n))
- [Cookbook](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-(2.x.x))  :rocket:

## Contents

- [React Native Compatibility](#react-native-compatibility)
- [React Native Chat Tutorial](#react-native-chat-tutorial)
- [Example Apps](#-example-apps)
  - [Expo example](#expo-example)
  - [Native example](#native-example)
  - [Slack clone](#slack-clone)
- [Docs](#docs)
- [Keep in mind](#-keep-in-mind)
- [Setup](#setup-setting-up-a-chat-app)
  - [Expo package](#expo-package)
  - [Native package](#native-package)
  - Native Web package _(currently under development. Please follow progress at [#206](https://github.com/GetStream/stream-chat-react-native/issues/206))_
  - [TypeScript Support](https://github.com/GetStream/stream-chat-react-native/wiki/Typescript-support)
  - [Upgrade](https://github.com/GetStream/stream-chat-react-native/wiki/Upgrade-helper)
  - [Common issues](#common-issues)
  - [Contributing](#contributing)

## 🔐 React Native Compatibility

To use this library you need to ensure you match up with the correct version of React Native you are using.

| `stream-chat-react-native` version | Required React Native Version |
| ----------------------------------------- | --------- |
| `2.x.x`                                   | `>= 0.60` |
| `1.x.x`                                   | `>= 0.59` |
| `0.x.x`                                   | `*` |

## 📖 React Native Chat Tutorial

The best place to start is the [React Native Chat Tutorial](https://getstream.io/chat/react-native-chat/tutorial/). It teaches you how to use this SDK and also shows how to make frequently required changes.

## 🔮 Example Apps

This repo includes 3 example apps. One made with Expo, one Native JavaScript code, and one in TypeScript.

<div style="display: inline">
  <img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/1.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" style="margin-right: 30px" />
  <img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/2.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" style="margin-right: 30px" />
  <img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/3.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" />
</div>

### Expo example

1. Make sure node version is >= v10.13.0
2. ```bash
   yarn global add expo-cli
   git clone https://github.com/GetStream/stream-chat-react-native.git
   cd stream-chat-react-native/examples/ExpoMessaging
   yarn && yarn start
   ```

### Native example

1. Please make sure you have installed necessary dependencies depending on your development OS and target OS. Follow the guidelines given on official React Native documentation for installing dependencies: <https://facebook.github.io/react-native/docs/getting-started>#
2. Make sure node version is >= v10.13.0
3. Start the simulator

4. ```bash
   git clone https://github.com/GetStream/stream-chat-react-native.git
   cd stream-chat-react-native
   yarn
   cd stream-chat-react-native/native-package
   yarn
   cd stream-chat-react-native/examples/NativeMessaging
   yarn
   ```

5. - For iOS

     ```bash
     cd ios && pod install && cd ..
     yarn ios
     ```

   - For android

     ```bash
     yarn android
     ```

   If you run into following error on android:

   ```bash
   Execution failed for task ':app:validateSigningDebug'.
   > Keystore file '/path_to_project/stream-chat-react-native/examples/NativeMessaging/android/app/debug.keystore' not found for signing config 'debug'.
   ```

   You can generate the debug Keystore by running this command in the `android/app/` directory: `keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000` - [Reference](https://github.com/facebook/react-native/issues/25629#issuecomment-511209583)

### Slack clone

Check out our tutorial on how to build a slack clone using react-native and stream-chat-react-native

<div style="display: inline">
  <img src="https://camo.githubusercontent.com/386a2991e444ecff465372637699f1dba6913de1224effbb4b2520ae3a9d7593/68747470733a2f2f73747265616d2d626c6f672d76322e696d6769782e6e65742f626c6f672f77702d636f6e74656e742f75706c6f6164732f38306166346662623734613737613434363536373966363131386166373432372f696d6167652e706e67" alt="IMAGE ALT TEXT HERE"/>
</div>

- **Tutorial** [https://dev.to/vishalnarkhede/how-to-build-slack-clone-with-react-native-part-2-g5](https://dev.to/vishalnarkhede/how-to-build-slack-clone-with-react-native-part-2-g5)

- **Source code for app**

  - **react native** <https://github.com/GetStream/slack-clone-react-native/>
  - **expo** <https://github.com/GetStream/slack-clone-expo/>

## 📋 Docs

The [styleguidist docs for stream-chat-react-native](https://getstream.github.io/stream-chat-react-native/) document how all the components work.

The React Native components are created using the stream-chat-js library. If you're customizing the components, it's essential to learn how the Chat Server API works. You'll want to review our [JS chat API docs](https://getstream.io/chat/docs/js/).

## 💬 Keep in mind

1. Navigation between different components is something we expect consumers to implement. You can check out the example given in this repository

2. Minor releases may come with some breaking changes, so always check the release notes before upgrading the minor version.

You can see detailed documentation about the components at <https://getstream.github.io/stream-chat-react-native>

## 🛠 Setup (Setting up a chat app)

### Expo package

```bash
yarn global add expo-cli
# expo-cli supports following Node.js versions:
# * >=8.9.0 <9.0.0 (Maintenance LTS)
# * >=10.13.0 <11.0.0 (Active LTS)
# * >=12.0.0 (Current Release)
expo init StreamChatExpoExample
cd StreamChatExpoExample

# Add chat expo package
yarn add stream-chat-expo

# If you are using stream-chat-expo <= 0.4.0 and expo <= 34, then you don't need to add @react-native-community/netinfo as dependency, since previously we used NetInfo from react-native package.
expo install @react-native-community/netinfo expo-document-picker expo-image-picker expo-permissions
```

Please check the [example](https://github.com/GetStream/stream-chat-react-native/blob/master/examples/ExpoMessaging/App.js) to see usage of the components.

OR you can swap [this file](https://github.com/GetStream/stream-chat-react-native/blob/master/examples/ExpoMessaging/App.js) for your `App.js` in the root folder and follow these additional steps:

```bash
yarn add @react-native-community/masked-view @react-navigation/native @react-navigation/stack react-native-gesture-handler react-native-get-random-values react-native-reanimated react-native-safe-area-context react-native-screens
```

and finally

```bash
yarn start
```

### Native package

#### For react native < 0.60

```bash
react-native init StreamChatReactNativeExample
cd StreamChatReactNativeExample
yarn add stream-chat-react-native

# https://github.com/react-native-community/react-native-netinfo#react-native-compatibility
# For React native 0.59.x - use @react-native-community/netinfo@3.2.1
# For React native <= 0.58.x - use @react-native-community/netinfo@2.0.7
yarn add @react-native-community/netinfo@3.2.1

# https://github.com/ivpusic/react-native-image-crop-picker#important-note
yarn add react-native-image-crop-picker@0.25.0
yarn add react-native-document-picker

react-native link @react-native-community/netinfo

# if you are planning to use image picker or file picker or both
react-native link react-native-image-crop-picker
react-native link react-native-document-picker

```

Please check the [example](https://github.com/GetStream/stream-chat-react-native/blob/master/examples/NativeMessaging/App.js) to see the usage of these components.

OR you can swap this file for your `App.js` in the root folder and follow this guide for your installed version <https://reactnavigation.org/docs/getting-started#installing-dependencies-into-a-bare-react-native-project>

If you are planning to use the image crop picker, there are some additional steps to be done. You can find them here - <https://github.com/ivpusic/react-native-image-crop-picker/blob/v0.25.0/README.md#install>

If you are planning to use file/document picker, you need to enable iCloud capability in your app - <https://github.com/Elyx0/react-native-document-picker#reminder>

and finally

```bash
react-native run-ios
```

#### For react native >= 0.60

```bash
react-native init StreamChatReactNativeExample
cd StreamChatReactNativeExample
yarn add stream-chat-react-native
yarn add @react-native-community/netinfo react-native-image-crop-picker react-native-document-picker react-native-get-random-values
cd ios && pod install && cd ..
```

**You also need to import `react-native-get-random-values` in your index.js in root directory, before importing your main app component.**

Just to be sure, please verify you are using the appropriate version of the following packages as per your react-native version.

- netinfo : <https://github.com/react-native-community/react-native-netinfo#react-native-compatibility>

- react-native-image-crop-picker : <https://github.com/ivpusic/react-native-image-crop-picker#important-note>

Please check the [example](https://github.com/GetStream/stream-chat-react-native/blob/master/examples/NativeMessaging/App.js) to see the usage of components.

OR you can swap this file for your `App.js` in the root folder by following these additional steps:

```bash
yarn add @react-native-community/masked-view @react-navigation/native @react-navigation/stack react-native-gesture-handler  react-native-reanimated react-native-safe-area-context react-native-screens
cd ios && pod install && cd ..
```

If you are planning to use an image crop picker, there are some additional steps to be done. You can find them here - <https://github.com/ivpusic/react-native-image-crop-picker#install>

If you are planning to use file/document picker, you need to enable iCloud capability in your app - <https://github.com/Elyx0/react-native-document-picker#reminder>

and finally

**iOS**:

```bash
yarn ios
```

**Note for Android**:

If you are using AndroidX app:

> AndroidX is a major step forward in the Android ecosystem, and the old support library artifacts are being deprecated. For 0.60, React Native has been migrated over to AndroidX. This is a breaking change, and your native code and dependencies will need to be migrated as well.

(Reference: <https://facebook.github.io/react-native/blog/2019/07/03/version-60#androidx-support>)

In current context, dependencies such as `react-native-document-picker` and (if you are using `react-navigation`) `react-native-gesture-handler`, `react-native-reanimated` don't have AndroidX support. But an awesome tool named [jetifier](https://github.com/mikehardy/jetifier) is quite useful to patch these dependencies with AndroidX support.

**NOTE** If you are planning to use file picker functionality, make sure you enable iCloud capability in your app

![Enable iCloud capability](https://camo.githubusercontent.com/ac300ca7e3bbab573a76c151469a89efd8b31e72/68747470733a2f2f33313365353938373731386233343661616638332d66356538323532373066323961383466373838313432333431303338343334322e73736c2e6366312e7261636b63646e2e636f6d2f313431313932303637342d656e61626c652d69636c6f75642d64726976652e706e67)

## 💪 TypeScript Support

As of version `2.0.0` `stream-chat-react-native` has been converted to TypeScript. Please read [Typescript guide](https://github.com/GetStream/stream-chat-react-native/wiki/Typescript-support) for details.

## ✈️ Internationalisation

Please read [Internationalization doc](https://github.com/GetStream/stream-chat-react-native/wiki/Internationalization-(i18n)) for details.

## 🚀 Upgrading

Please refer to [Upgrade Helper](https://github.com/GetStream/stream-chat-react-native/wiki/Upgrade-helper)

## ⚠️ Common issues

#### While running native example, you may (not necessarily) run into the following issues

1. When you execute `yarn ios` for the first time, it starts a metro bundler in parallel. It can result in some errors since the build process isn't complete yet. Try the following to fix this:
   1. Close/stop the metro bundler process.
   2. Let the build process finish. It can usually take around 2-3 minutes for the first time.
   3. Start the metro bundler manually by executing `yarn start` inside `stream-chat-react-native/examples/NativeMessaging` directory.
2. When you execute `yarn android`, you may (not necessarily) run into following error:

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

   To resolve this, do the following.

   1. Create a file named `local.properties` inside `stream-chat-react-native/examples/NativeMessaging/android` directory
   2. Put the this line in that file. Make sure sdk path is correctly mentioned as per your system:

      ```
      sdk.dir=/Users/{user_name}/Library/Android/sdk/
      ```

   3. Rerun `yarn android` in `stream-chat-react-native/examples/NativeMessaging` directory

## 👏 Contributing

We welcome code changes that improve this library or fix a problem, and please make sure to follow all best practices and test all the changes. Please check our [dev setup docs](https://github.com/GetStream/stream-chat-react-native/wiki/Dev-setup-for-contributing-to-the-library) to get you started. We are pleased to merge your code into the official repository. Make sure to sign our [Contributor License Agreement (CLA)](https://docs.google.com/forms/d/e/1FAIpQLScFKsKkAJI7mhCr7K9rEIOpqIDThrWxuvxnwUq2XkHyG154vQ/viewform) first. See our license file for more details.
