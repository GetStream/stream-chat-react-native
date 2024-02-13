# Typescript Chat Messaging app

This is a bare minimum Chat application using Stream Chat SDK built using Native CLI platform without any customization.

## How to run the app

Make sure you have the Native CLI development setup ready in your system. Please follow [this guide](https://reactnative.dev/docs/environment-setup?guide=native) for the same.

### Clone the project

```bash
git clone https://github.com/GetStream/stream-chat-react-native.git
```

### Install dependencies
  
1. In the root install the dependencies:

```bash
yarn install
```

2. Move to the `package` directory and install the dependencies:

```bash
cd package && yarn install
```

3. Move to the `native-package` directory and install the dependencies:

```bash
cd native-package && yarn install
```

4. Finally, Move to the app directory and install the dependencies:

```bash
cd ../../examples/TypeScriptMessaging && yarn install
```

### Install Pods for iOS

```bash
cd ios && pod install
```

### Run

To run the application for different platforms, use the following commands:

```bash
yarn start
```

- For iOS

```bash
yarn ios
```

- For android

```bash
yarn android
```