## Upgrade from 0.x.x to 2.x.x

### Dependency changes:

- Peer dependency of `react-native-image-picker` has been changed to [`react-native-image-crop-picker`](https://github.com/ivpusic/react-native-image-crop-picker) for following two reasons.

    1. To fix the issue with image uploads - https://github.com/GetStream/stream-chat-react-native/issues/241
    2. `react-native-image-picker` didn't offer any option for image compression, which slows down uploads of heavy images.

    So you will need to install this new dependency on app level.

    ```sh
    yarn remove react-native-image-picker # Remove previous dependency if you don't need it
    yarn add react-native-image-crop-picker
    cd ios && pod install && cd ..
    ```

    There are few additional changes that you need to do separately for iOS and android
    - For iOS - https://github.com/ivpusic/react-native-image-crop-picker#step-3
    - For android - https://github.com/ivpusic/react-native-image-crop-picker#android

    There are two reasons for this change:

- You will need to install https://github.com/LinusU/react-native-get-random-values and add this line `import 'react-native-get-random-values';` to your `index.js`

- Expo 39 is now the lowest supported version from 2.x.x

### Keyboard changes

- Changes to Keyboard functionality: Internally we use `KeyboardCompatibleView` component to sync Channel height according to keyboard state. As part of 1.3.x we updated have the implementation for `KeyboardCompatibleView`. Updated KeyboardCompatibleView's implentation is mostly same as [`KeyboardAvoidingView`](https://reactnative.dev/docs/keyboardavoidingview), with few additional fixes for app state (background | foreground). And thus, following props on Channel component won't be supported anymore:

    - keyboardDismissAnimationDuration
    - keyboardOpenAnimationDuration

    Following new props have been introduced on Channel component. They are the same props accepted by KeyboardAvoidingView of react-native.

    - keyboardBehavior ['height' | 'position' | 'padding']
    - keyboardVerticalOffset


### `this` reference removal

- All the components were moved from class based components to functional components, gradually as part of 1.x.x. This caused some breaking changes on `ChannelList` component's custom event handlers. ChannelList component has its own default logic for handling different types of events. Although these default event handlers can still be overridden by providing custom prop functions to the ChannelList component. Custom logic can be provided for the following events.

  - `onAddedToChannel` overrides `notification.added_to_channel` default
  - `onChannelDeleted` overrides `channel.deleted` default
  - `onChannelHidden` overrides `channel.hidden` default
  - `onChannelTruncated` overrides `channel.truncated` default
  - `onChannelUpdated` overrides `channel.updated` default
  - `onMessageNew` overrides `notification.message_new` default
  - `onRemovedFromChannel` overrides `notification.removed_from_channel` default

    These props were already present in 0.x.x as well. Breaking change is on the parameters of these event handlers. In 0.x.x, these event handlers used to have `this` as its first argument, which was reference ChannelList component (class based).

    From 1.3.x, these handlers will accept following params:

  - 1st argument: `setChannels` reference to the `useState` hook that sets the `channels` in the React Native FlatList
  - 2nd argument: `event` object returned by the StreamChat instance

- Similar breaking change was introduced in `MessageSimple` component as well. For example, if you wish to override the SDK's standard long press behavior on a message, the `onLongPress` or `onPress` function passed in to `MessageSimple` no longer takes the `this` component reference as it's first argument. The message and the event object become the first and second arguments, respectively.

### Context changes

- If you are using `withChannelContext` function inside your app, then you may want to pay attention for context related changes. We have split the `ChannelContext` into three separate contexts to further modularize the code and reduce renders as items in context change. The following contexts now contain the following values, previously all held within the `ChannelContext`:

    - `ChannelContext`:
      
      `channel`, `disabled`, `EmptyStateIndicator`, `error`, `eventHistory`, `lastRead`, `loading`, `LoadingIndicator`, `markRead`, `members`, `read`, `setLastRead`, `typing`, `watcherCount`, `watchers`

    - `MessagesContext`:
    
      `Attachment`, `clearEditingState`, `editing`, `editMessage`, `emojiData`, `hasMore`, `loadingMore`, `loadMore`, `Message`, `messages`, `removeMessage`, `retrySendMessage`, `sendMessage`, `setEditingState`, `updateMessage`

    - `ThreadContext`:
    
      `closeThread`, `loadMoreThread`, `openThread`, `thread`, `threadHasMore`, `threadLoadingMore`, `threadMessages`

### miscellaneous prop changes 

... in progress


## Upgrade from 1.2.x to 1.3.x:
  - 1.3.x replaced native dependency support for react-native-image-picker in favor of react-native-image-crop-picker for multi-image selection capabilities


## Upgrade from 0.1.x to 0.2.x:

  - 0.2.x added support for react native 0.60. Dependencies like `react-native-image-picker`, `react-native-document-picker` and `netinfo` have been taken out of hard dependencies and moved to peer dependencies and thus will have to be installed manually on consumer end ([Reference](https://github.com/GetStream/stream-chat-react-native/pull/52/files#diff-83a54d8caab0ea9fcdd5f832b03a5d83))
  - React Native 0.60 came with auto-linking functionality that means if some native libraries are linked manually before the upgrade, they will have to be unlinked, so that React Native can auto-link them ([Reference](https://facebook.github.io/react-native/blog/2019/07/03/version-60#native-modules-are-now-autolinked))

    ```
    react-native unlink react-native-image-picker
    react-native unlink react-native-document-picker
    react-native unlink @react-native-community/netinfo
    ```

  - React Native 0.60 has been migrated over to AndroidX. In the current context, dependencies such as `react-native-document-picker` and (if you are using `react-navigation`) `react-native-gesture-handler`, `react-native-reanimated` don't have AndroidX support. But an excellent tool named [jetifier](https://github.com/mikehardy/jetifier) is quite useful to patch these dependencies with AndroidX support.

  - CocoaPods are not part of React Native's iOS project ([ref](https://facebook.github.io/react-native/blog/2019/07/03/version-60#cocoapods-by-default)). Thus make sure to install all the pod dependencies.

    ```
    cd ios && pod install && cd ..
    ```