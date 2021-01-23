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

Stream Chat components make extensive use of React Context to maintain state and provide an optimal user experience. To access these contexts screen, components, or the entire app must be wrapped in Stream Chat Context components.

#### Theme

The majority of components used in `stream-chat-react-native` can have custom styles applied to them via the theming system. To accurately create a theme we suggestion utilizing our exported types to create your own theme. We perform a deep merge on the styles so only styles designated in the custom theme overwrite the default styles. Where possible we have also used `displayName` to expose the the path to the style for components. For displayName `FileAttachment{messageSimple{file}}` we saying the component name is `FileAttachment` and the style keys are `messageSimple -> file`. There are often multiple keys on a designated display name corresponding to different sub-components styles. In this case `file` has five sub-component keys that can modify the styling.

```typescript
file: {
  container: ViewStyle;
  details: ViewStyle;
  fileSize: TextStyle;
  icon: IconProps;
  title: TextStyle;
};
```

Modifying the theme for this component is done by adding custom styles at the desired keys.

```typescript
import type { DeepPartial, Theme } from 'stream-chat-react-native';

const theme: DeepPartial<Theme> = {
  messageSimple: {
    file: {
      container: {
        backgroundColor: 'red',
      },
      icon: {
        height: 16,
        width: 16,
      },
    },
  },
};
```

<table>
  <tr>
    <td align='center'><img src='./screenshots/cookbook/DisplayNameTheme.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/UnmodifiedDisplayNameTheme.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/ModifiedDisplayNameTheme.png' width="200"/></td>
  </tr>
  <tr></tr>
  <tr>
    <td align='center'>Display Name in Inspector</td>
    <td align='center'>Non-Themed Component</td>
    <td align='center'>Themed Component</td>
  </tr>
</table>

**NOTE:** Most of the styles are standard React Native styles, but some styles applying to SVGs, Markdown, or custom components are numbers, strings, or other specified types. The TypeScript documentation of `Theme` should help you in this regard. Message text is an instance of an exception as it is rendered using [`react-native-markdown-package`](https://github.com/andangrd/react-native-markdown-package) and the [`MarkdownStyle`](https://github.com/andangrd/react-native-markdown-package/blob/master/styles.js) is added to the theme at key `messageSimple -> content -> markdown`. Standard React Native styles is a departure from the `2.x` version of `stream-chat-react-native` in which [`styled-components`](https://styled-components.com/) was utilized for theming.

#### OverlayProvider
The highest level of these components is the `OverlayProvider`. The `OverlayProvider` allows users to interact with messages on long press above the underlying views, use the full screen image viewer, and use the `AttachmentPicker` as a keyboard-esk view.

<table>
  <tr>
    <td align='center'><img src='./screenshots/cookbook/MessageOverlay.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/ImageViewer.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/AttachmentPickerWithInset.png' width="200"/></td>
  </tr>
  <tr></tr>
  <tr>
    <td align='center'>Message Interaction</td>
    <td align='center'>Image Viewer</td>
    <td align='center'>Attachment Picker</td>
  </tr>
</table>

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

The `OverlayProvider` can be used with no props provided, and there are a plethora of props for customizing the components in the overlay three core props that will you will likely want ot use are `bottomInset`, `i18nInstance`, and `value`. `value` is a `Partial` of the `OverlayContextValue`, it provides the theme to the components in the overlay and thus if you are using a custom theme you can provide it to the overlay as `value={{ style: theme }}`. `i18nInstance` is the instance of Streami18n you have for translations. **`bottomInset`** is important as it is required to determine the height of the `AttachmentPicker` and the underlying shift to the `MessageList` when it is opened. In the example shown the bottom safe are is and is not taken into account and the resulting UI difference is obvious. This can also be set via the `setBottomInset` function provided by the `useAttachmentPickerContext` hook.

```typescript
const streami18n = new Streami18n({ language: 'en' });
const { bottom } = useSafeAreaInsets();
const theme = useStreamChatTheme();

<OverlayProvider
  bottomInset={bottom}
  i18nInstance={streami18n}
  value={{ style: theme }}
>
```

Additionally a `topInset` must be set to ensure that when the picker is completely open it is opened to the desired height. This can be done via props, but can also be set via the `setTopInset` function provided by the `useAttachmentPickerContext` hook. The bottom sheet will not render without this height set, but it can be set to 0 to cover the entire screen, or the safe area top inset if desired. In the example it is being set using the `useHeaderHeight` hook from [React Navigation](https://reactnavigation.org/).

**IMPORTANT:** The current implementation of the scrolling bottom-sheet in which the image picker resides does not re-evaluate heights after the `topInset` is set. So only set this to one value.

```typescript
  const headerHeight = useHeaderHeight();
  const { setTopInset } = useAttachmentPickerContext();

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight]);
```

<table>
  <tr>
    <td align='center'><img src='./screenshots/cookbook/AttachmentPickerWithInset.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/AttachmentPickerWithoutInset.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/AttachmentPickerOpen.png' width="200"/></td>
  </tr>
  <tr></tr>
  <tr>
    <td align='center'>With bottomInset</td>
    <td align='center'>Without bottomInset</td>
    <td align='center'>With topInset</td>
  </tr>
</table>

**NOTE:** As mentioned there are many modifications that can be performed to the UI. Custom styling via the theme gives you the ability to shape the look of the application as a whole and/or implement dark mode. But additionally the majority of the UI can be modified or replaced via [`Stream Chat`](https://getstream.io/chat/) settings or props. It is trivial to replace or modify most UI elements.

<table>
  <tr>
    <td align='center'><img src='./screenshots/cookbook/ModifiedMessageOverlay.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/ModifiedImageViewer.png' width="200"/></td>
    <td align='center'><img src='./screenshots/cookbook/ModifiedAttachmentPickerOpen.png' width="200"/></td>
  </tr>
  <tr></tr>
  <tr>
    <td align='center'>No Reactions or Replies</td>
    <td align='center'>Custom Header and Footer</td>
    <td align='center'>Custom Grid Layout</td>
  </tr>
</table>
