# Fully featured messaging application

<p align="center">
  <a href="https://getstream.io/chat/react-native-chat/tutorial/"><img src="https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/readme/cover.png" alt="react native chat" width="100%" /></a>
</p>

## How to run the app

- Please make sure you have installed necessary dependencies depending on your development OS and target OS. Follow the guidelines given on official React Native documentation for installing dependencies: <https://facebook.github.io/react-native/docs/getting-started>#
- Make sure node version is >= v10.13.0

- Clone the project

```bash
   git clone https://github.com/GetStream/stream-chat-react-native.git
   cd stream-chat-react-native/package
   make
   cd ../examples/SampleApp
```

- Run

   - For iOS

     ```bash
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
