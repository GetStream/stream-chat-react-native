# Official React Native SDK for [Stream Chat](https://getstream.io/chat/)

<p align="center">
  <a href="https://getstream.io/chat/react-native-chat/tutorial/"><img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/readme/cover.png" alt="react native chat" width="100%" /></a>
</p>

> The official React Native and Expo components for Stream Chat, a service for
> building chat applications.

---

## **Important Note**

Currently we are working on publishing v3.0.0-beta. For v2.x.x (stable), please follow the docs [here](https://github.com/GetStream/stream-chat-react-native/tree/v2-legacy)

---

[![NPM](https://img.shields.io/npm/v/stream-chat-react-native.svg)](https://www.npmjs.com/package/stream-chat-react-native)
[![Build Status](https://github.com/GetStream/stream-chat-react-native/workflows/test/badge.svg?branch=master)](https://github.com/GetStream/stream-chat-react-native/actions)
[![Component Reference](https://img.shields.io/badge/docs-component%20reference-blue.svg)](https://getstream.github.io/stream-chat-react-native/v3/)

<img align="right" src="https://getstream.imgix.net/images/ios-chat-tutorial/iphone_chat_art@3x.png?auto=format,enhance" width="50%" />

**Quick Links**

- [Stream Chat API](https://getstream.io/chat/) product overview
- [Register](https://getstream.io/chat/trial/) to get an API key for Stream Chat
- [React Native Chat Tutorial](https://github.com/GetStream/stream-chat-react-native/wiki/Tutorial-v3.0)
- [Chat UI Kit](https://getstream.io/chat/ui-kit/)
- [Release Notes](https://github.com/GetStream/stream-chat-react-native/releases)
- [Internationalization (i18n)](https://github.com/GetStream/stream-chat-react-native/wiki/Internationalization-(i18n))
- [Cookbook](https://github.com/GetStream/stream-chat-react-native/wiki#v30-beta) 🚀

## Contents

- [React Native Compatibility](#-react-native-compatibility)
- [React Native Chat Tutorial](#-react-native-chat-tutorial)
- [Example Apps](#-example-apps)
- [Docs](#-docs)
- [Keep in mind](#-keep-in-mind)
- [Setup](#-Setup-(Setting-up-a-chat-app))
- [TypeScript Support](#-TypeScript-Support)
- [Internationalization](#-Internationalization)
- [Upgrade](#-Upgrading)
- [Common issues](#-common-issues)
- [Contributing](#-contributing)

## 🔐 React Native Compatibility

To use this library you need to ensure you match up with the correct version of React Native you are using.

| `stream-chat-react-native` version | Required React Native Version |
| ----------------------------------------- | --------- |
| `3.x.x` (beta)                           | `>= 0.60` |
| `2.x.x`                                   | `>= 0.60` |
| `1.x.x`                                   | `>= 0.59` |
| `0.x.x`                                   | `*` |

## 📖 React Native Chat Tutorial

The best place to start is the [React Native Chat Tutorial](https://github.com/GetStream/stream-chat-react-native/wiki/Tutorial-v3.0). It teaches you how to use this SDK and also shows how to make frequently required changes.

## 🔮 Example Apps

This repo includes 4 example apps. One made with Expo, one Native JavaScript code, and two in TypeScript. One TypeScript app is a simple implementation for reference, the other is a more full featured app example.

<div style="display: inline">
  <img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/readme/readmeChannel.png" alt="Channels" width="250" border="1" style="margin-right: 30px" />
  <img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/readme/readmeMessages.png" alt="Messages" width="250" border="1" style="margin-right: 30px" />
  <img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/readme/readmeOverlay.png" alt="Overlay" width="250" border="1" />
</div>

- [Expo example](./examples/ExpoMessaging)
- [Native example](./examples/NativeMessaging)
- [Typescript example](./examples/TypescriptMessaging)
- [Fully featured messaging application](./examples/SampleApp)

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

Please check following url for all the detailed documentation - https://github.com/GetStream/stream-chat-react-native/wiki#v30-beta

## 💬 Keep in mind

1. Navigation between different components is something we expect consumers to implement. You can check out the example given in this repository

2. Minor releases may come with some breaking changes, so always check the release notes before upgrading the minor version.

You can see detailed documentation about the components at <https://getstream.github.io/stream-chat-react-native>

## 🛠 Setup (Setting up a chat app)

Please follow this doc for setup - [Setup Docs](https://github.com/GetStream/stream-chat-react-native/wiki/Installation-and-usage---v3.0#installation)
## 💪 TypeScript Support

As of version `2.0.0` `stream-chat-react-native` has been converted to TypeScript. Please read [Typescript guide](https://github.com/GetStream/stream-chat-react-native/wiki/Typescript-support) for details.

## ✈️ Internationalization

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
