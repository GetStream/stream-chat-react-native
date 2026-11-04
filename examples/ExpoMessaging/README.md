# Expo Chat example app

This is a bare minimum Chat application using Stream Chat SDK build using Expo without any customization.

## Opt-in Expo UI attachment picker

This demo uses the native modal sheet from `@expo/ui/community/bottom-sheet` (Expo SDK 58).
The SDK continues to use Gorhom by default. To compare the original picker, start the demo with
`EXPO_PUBLIC_ATTACHMENT_PICKER=gorhom yarn workspace ExpoMessaging start` and reload the app.
The Expo picker applies to channels and threads. Close the sheet to return to the composer and send
selected attachments; camera, files, polls, and command selection dismiss it before opening another
native surface or focusing the input.

Downstream apps can opt in with `npx expo install @expo/ui`, then:

```tsx
import { Channel, WithComponents } from 'stream-chat-expo';
import { ExpoAttachmentPicker } from 'stream-chat-expo/attachment-picker';

const overrides = { AttachmentPicker: ExpoAttachmentPicker };

<WithComponents overrides={overrides}>
  <Channel channel={channel} attachmentPickerPresentation='modal'>
    {/* MessageList and MessageComposer */}
  </Channel>
</WithComponents>;
```

Rebuild the native app after installing `@expo/ui`; a Metro reload alone cannot add its native module.
This demo uses Expo 58.0.9 or later for the Xcode 27 precompiled-module launch fix
(`expo-modules-core` 58.0.17 and `expo-modules-jsi` 58.0.12).
`@expo/ui` is an optional peer and is loaded only by the `attachment-picker` entry point. Gorhom remains
an installed dependency for compatibility in this first opt-in integration. The other SDK sheets are
unchanged. The modal uses native sizing and dismissal rather than Gorhom animation/gesture options.

## How to run the app

- Install the expo command line tool and other requirements as specified in the [expo official installation documentation](https://docs.expo.dev/get-started/installation/)

### Clone the Project

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

3. Move to the `package/expo-package` directory and install the dependencies:

```bash
cd expo-package && yarn install
```

4. Finally, Move to the app directory and install the dependencies:

```bash
cd ../../examples/ExpoMessaging && yarn install
```

### Run

To run the application for different platforms, use the following commands:

- For iOS

```bash
yarn ios
```

- For android

```bash
yarn android
```

**Note:**

If your Android build fails please add the following snippet on the `android/gradle.properties` to make it work.

```
# Disabled hermes in favour of broken Android build due to the package `react-native-quick-sqlite`:
# To Fix:
# A problem occurred evaluating project ':react-native-quick-sqlite'.
# > Cannot get property 'hermesEnabled' on extra properties extension as it does not exist
hermesEnabled=true

# disables the check for multiple instances for gesture handler
# this is needed for react-native-gesture-handler to be both a devDep of core and be a dep on the expo sample app
disableMultipleInstancesCheck=true
```
