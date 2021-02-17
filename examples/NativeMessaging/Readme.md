# Native messaging example app

1. Please make sure you have installed necessary dependencies depending on your development OS and target OS. Follow the guidelines given on official React Native documentation for installing dependencies: <https://facebook.github.io/react-native/docs/getting-started>#
2. Make sure node version is >= v10.13.0
3. Start the simulator

4. ```bash
   git clone https://github.com/GetStream/stream-chat-react-native.git
   cd stream-chat-react-native
   yarn
   cd stream-chat-react-native/native-package
   yarn
   cd stream-chat-react-native/examples/TypeScriptMessaging
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
