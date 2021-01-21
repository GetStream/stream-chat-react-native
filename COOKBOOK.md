# Stream Chat React Native - 3.x

## Getting Started

What follows is the most important aspects of Stream Chat React Native. It should cover enough to integrate the out of the box Stream Chat in an application and give the basic knowledge of the library so that you may utilize, modify, and extend the functionality as you see fit.

### Installation

Install the required packages in your React Native project:

`yarn add stream-chat-react-native`

Stream Chat has a number of peer dependencies that are required to take advantage of all of the out of the box features. It is suggested you follow the install instructions for each package to ensure it is properly setup. Most if not all of the required packages now support auto-linking so setup should be minimal.

- [`@react-native-community/blur`](https://github.com/Kureev/react-native-blur)
- [`@react-native-community/cameraroll`](https://github.com/react-native-cameraroll/react-native-cameraroll)
- [`@react-native-community/netinfo`](https://github.com/react-native-netinfo/react-native-netinfo)
- [`@stream-io/flat-list-mvcp`](https://github.com/GetStream/flat-list-mvcp)
- [`react-native-document-picker`](https://github.com/rnmods/react-native-document-picker)
- [`react-native-fs`](https://github.com/itinance/react-native-fs)
- [`react-native-gesture-handler`](https://github.com/software-mansion/react-native-gesture-handler)
- [`react-native-haptic-feedback`](https://github.com/junina-de/react-native-haptic-feedback)
- [`react-native-image-crop-picker`](https://github.com/ivpusic/react-native-image-crop-picker)
- [`react-native-reanimated`](https://github.com/software-mansion/react-native-reanimated)
- [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context)
- [`react-native-share`](https://github.com/react-native-share/react-native-share)
- [`react-native-svg`](https://github.com/react-native-svg/react-native-svg)

`yarn add @react-native-community/blur @react-native-community/cameraroll @react-native-community/netinfo @stream-io/flat-list-mvcp react-native-document-picker react-native-fs react-native-gesture-handler react-native-haptic-feedback react-native-haptic-feedback react-native-image-crop-picker react-native-reanimated react-native-safe-area-context react-native-share react-native-svg`

For iOS on a Mac install the pods `npx pod-install ios`.

`react-native-gesture-handler` requires the package to be imported at the **top of the entry file** before anything else, this is usually your `App.js` or `index.js` file.

```js
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

#### Installing dependencies for Expo

Stream Chat React Native is set up for parity on Expo, expo requires a different set of dependencies, in your project directory run:

`expo install @react-native-community/netinfo expo-blur expo-document-picker expo-file-system expo-haptics expo-image-picker expo-media-library expo-permissions expo-sharing react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-svg`

### Hello Stream Chat - 3.x

Stream Chat components make extensive use of React Context to maintain state and provide an optimal user experience. To access these contexts screen, components, or the entire app must be wrapped in Stream Chat Context components. The highest level of these components is the `OverlayProvider`. The `OverlayProvider` allows users to interact with messages on long press above the underlying views, use the full screen image viewer, and use the `AttachmentPicker` as a keyboard-esk view.

Because these views must exist above all others `OverlayProvider` should wrap your navigation stack as well, assuming [`React Navigation`](https://reactnavigation.org/) is being used your highest level navigation stack should be wrapped in the provider:

```js
<NavigationContainer>
  <OverlayProvider>
    <Stack.Navigator>
      <Stack.Screen />
    </Stack.Navigator>
  </OverlayProvider>
</NavigationContainer>
```

`stream-chat-react-native` like [`stream-chat-js`](https://github.com/GetStream/stream-chat-js) is written in TypeScript with full support for custom object types via provided generics. These generics are given to components as designated in the [TypeScript language docs](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9.html#generic-type-arguments-in-jsx-elements) but can appear unusual if you have not used them before. The previous code snippet with all 7 possible generics given to the `OverlayProvider` would be written as:

```typescript
<NavigationContainer>
  <OverlayProvider<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ResponseType,
    UserType
  >>
    <Stack.Navigator>
      <Stack.Screen />
    </Stack.Navigator>
  </OverlayProvider>
</NavigationContainer>
```

The `OverlayProvider` can be used with no props provided, and there are a plethora of props for customizing the components in the overlay, but three core props that will you will likely want ot use are `bottomInset`, `i18nInstance`, and `value`. `value` is a `Partial` of the `OverlayContextValue`, it provides the theme to the components in the overlay and thus if you are using a custom theme you can provide it to the overlay as `value={{ style: theme }}`. `i18nInstance` is the instance of Streami18n you have for translations. `bottomInset` is important as it is required to determine the height of the `AttachmentPicker` and the underlying shift to the `MessageList` when it is opened.

<div style='display:flex;justify-content:space-between;'>
  <img src='./screenshots/cookbook/AttachmentPickerWithInset.png' width="200"/>
  <img src="./screenshots/cookbook/AttachmentPickerWithoutInset.png"  width="200"/>
</div>