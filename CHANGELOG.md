# Changelog

## [0.7.0] 2020-03-17

- Introducing internationalisation (i18n) support for the sdk - https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/docs/Streami18n.md

## [0.6.6] 2020-02-20

- Adding following props to KeyboardCompatibleView component [6650109](https://github.com/GetStream/stream-chat-react-native/commit/6650109669cdd13c3b2a5bc59cc235d7a2796b3e)

  - keyboardDismissAnimationDuration
  - keyboardOpenAnimationDuration
  - enabled

- Adding following props to Channel component [6650109](https://github.com/GetStream/stream-chat-react-native/commit/6650109669cdd13c3b2a5bc59cc235d7a2796b3e)

  - KeyboardCompatibleView
  - disableKeyboardCompatibleView

- Fixing title of send button [0990cb5](https://github.com/GetStream/stream-chat-react-native/commit/0990cb55982d7233d617950c5d6a679f9c13f133)

- Fixing channel preview avatar for one-on-one conversation [790b0b9](https://github.com/GetStream/stream-chat-react-native/commit/790b0b91b6cbb9d4d16bfa15b5b3fa42015381bc)

- Fixing types for context providers - [dc40c8a](https://github.com/GetStream/stream-chat-react-native/commit/dc40c8a92d0f9bc8244d5c211afdbf3064521a68)

## [0.6.5] 2020-02-04

- Adding a simple check to see if lastReceivedId has changed, before updating the state - to avoid infinite loop [3da5e4a](https://github.com/GetStream/stream-chat-react-native/commit/3da5e4a2a8fb6db0f86a031102e0d5b6cd5197cc)

## [0.6.4] 2020-02-04

- Fixing image index for Image viewer ([d16e86c](https://github.com/GetStream/stream-chat-react-native/commit/d16e86c555e2fb0d65a882fa7434b24a22e50d70))

  Issue - if attachment gallery, when you click/touch on 1st photo, it opens image viewer at 1st photo. But if you touch 2nd photo, it still opens image viewer at first photo.

## [0.6.3] 2020-01-29

- Adding support for prop `formatLatestMessageDate` in `ChannelPreviewMessenger` component ([9a8d9a3](https://github.com/GetStream/stream-chat-react-native/commit/9a8d9a3ca57fbc9474e24d60928fe92d377cb728))
- Adding support for prop `latestMessageLength` in `ChannelPreviewMessenger` component ([ef5b887](https://github.com/GetStream/stream-chat-react-native/commit/ef5b887b075d0a7dba60772dbffa95303a96193f))
- Adding types for `SendButton` to typescript file ([ad5c728](https://github.com/GetStream/stream-chat-react-native/commit/ad5c728bdea1929d0d6d39802efdf94a41eb4b0d))
- Fixing date issue in `MessageSystem` component. ([35c18e3](https://github.com/GetStream/stream-chat-react-native/commit/35c18e3da0503f152d8caec9011d9d2132529661))
- Adding prop for AttachButton to MessageInput ([600b1d2](https://github.com/GetStream/stream-chat-react-native/commit/600b1d28d87e837de7f1249880bb436065277e0f))
- Adding prop `formatDate` to `MessageSimple` component ([c3cfdf6](https://github.com/GetStream/stream-chat-react-native/commit/c3cfdf67b7887f7bb171f21daf1ed980da21f44b))
- Adding style and text customizability to LoadingIndicator ([232241c](https://github.com/GetStream/stream-chat-react-native/commit/232241c1b84a7cf9f6729039e8e1a404e092818e))

## [0.6.2] 2020-01-20

- Added support for following props to `Channel` component:
  1. doSendMessageRequest [c75be29](https://github.com/GetStream/stream-chat-react-native/commit/c75be290cbe4a44e84b10652615e3c21215353e6)
  2. doUpdateMessageRequest [7227c19](https://github.com/GetStream/stream-chat-react-native/commit/7227c1992148f8bf4cfd2871a09a8aa4acf889bb)

## [0.6.1] 2020-01-14

- When you change the filters prop on the ChannelList component this now we will refresh the channels with the new query

## [0.6.0] 2020-01-07

- Exporting all the missing components and utils
  - AutoCompleteInput
  - Card
  - CommandsItem
  - DateSeparator
  - EmptyStateIndicator
  - EventIndicator
  - FileAttachmentGroup
  - FileUploadPreview
  - Gallery
  - IconSquare
  - ImageUploadPreview
  - KeyboardCompatibleView
  - LoadingErrorIndicator
  - LoadingIndicator
  - MentionsItem
  - Message
  - MessageNotification
  - MessageSystem
  - ReactionList
  - Spinner
  - SuggestionsProvider
  - UploadProgressIndicator
- Refining prop-types and typescript types for components.
- Fixed issue about app crash when document picker is cancelled - [#110](https://github.com/GetStream/stream-chat-react-native/issues/110)
- Adding `onPress` and `onLongPress` props on `MessageSimple` component
  - Fixes issue [#108](https://github.com/GetStream/stream-chat-react-native/issues/108)
  - commit [9e3064d](https://github.com/GetStream/stream-chat-react-native/commit/8ffde0010a6e8a4a61c47063570350849fd995f4)
- Fixing theme paths for MessageNotification component.

#### Breaking Change

- Replacing theme path `messageList.messageNotificationText` with `messageList.messageNotification.text` ([#3593dfb](https://github.com/GetStream/stream-chat-react-native/commit/9ad366562996edaef09b66bbee4eb657a99fb89e#diff-bff2172a77e0b6357dc54230974c9a61))
- Replacing theme path `messageList.messageNotification` with `messageList.messageNotification.container` ([#3593dfb](https://github.com/GetStream/stream-chat-react-native/commit/9ad366562996edaef09b66bbee4eb657a99fb89e#diff-bff2172a77e0b6357dc54230974c9a61))

## [0.5.1] 2019-12-23

#### stream-chat-expo (Expo package)

- Adding support for following props
  - `additionalParentMessageProps`
  - `additionalMessageListProps`
  - `additionalMessageInputProps`
- Adding missing types for prop `additionalFlatListProps` in MessageList and ChannelList

#### stream-chat-react-native (Native package)

- Adding support for following props
  - `additionalParentMessageProps`
  - `additionalMessageListProps`
  - `additionalMessageInputProps`
- Adding missing types for prop `additionalFlatListProps` in MessageList and ChannelList

## [0.5.0] 2019-12-23

#### stream-chat-expo (Expo package)

- Changes to add compatibility for Expo 36. Adding [netinfo](https://github.com/react-native-community/react-native-netinfo) as peer dependency - https://github.com/GetStream/stream-chat-react-native/issues/97
- Disabling the longpress on image viewer (in Attachment) - https://github.com/GetStream/stream-chat-react-native/issues/100 to avoid freezing of UI.
- Fixing broken threads issue
- Support for `additionalFlatListProps` prop in `MessageList` and `ChannelList` component
- Changing proptype for component type props to `elementType` instead of `func`

#### stream-chat-react-native (Native package)

- Disabling the longpress on image viewer (in Attachment) - https://github.com/GetStream/stream-chat-react-native/issues/100 to avoid freezing of UI.
- Fixing broken threads issue
- Support for `additionalFlatListProps` prop in `MessageList` and `ChannelList` component
- Changing proptype for component type props to `elementType` instead of `func`

## [0.4.0] 2019-12-16

- Adding support for customizing markdown styles - https://github.com/GetStream/stream-chat-react-native/pull/99/files#diff-ede54911d9164ea37e65e92f2e18cb91R56
- Removing `text` property theme with `textContainer`.

## [0.3.12] 2019-12-03

- Adding support for `onChannelTruncated` prop to ChannelList
- Updating channel from channel list once `channel.truncated` event is received
- Fixed image picker for native package and examples

## [0.3.11] 2019-12-02

- Adding support for `onChannelDeleted` prop to ChannelList
- Removing channel from channel list once `channel.deleted` event is received

## [0.3.10] 2019-11-28

- Adding strict string type check for channel name
- Updated example apps
- Updated readme doc

## [0.3.9] 2019-11-20

- Showing TypingIndicatorContainer only when necessary

## [0.3.8] 2019-11-06

- Adding logs to Chat, ChannelList and Channel component
- Optimizing MessageList and ChannelList component - https://github.com/GetStream/stream-chat-react-native/pull/84

## [0.3.7] 2019-11-04

- Adding support for `AttachmentFileIcon` prop.

## [0.3.6] 2019-11-04

- Adding support for `actionSheetStyles` prop, so as to add more customizability for styles of actionsheet.

## [0.3.5] 2019-10-28

- Fixing some styles for actionsheet in MessageSimple component.

## [0.3.4] 2019-10-03

- Avoiding query channel api call when there are no more messages to render
- Making mardRead api call only if unread count is > 0

## [0.3.3] 2019-10-02

- Making empty value of `typing` object - immutable
- Adding support for `SendButton` UI component prop

## [0.3.2] 2019-10-01

- Fixing bug in themed HOC

## [0.3.1] 2019-09-30

- Adding typescript declaration file for expo and native package

## [0.3.0] 2019-09-30

- Adding typescript declaration file
- Adding style customization support for actionsheet

## [0.2.6] 2019-09-23

- Fixing expo package for NetInfo changes

## [0.2.5] 2019-09-23

- Fixing deprecated warnings coming from NetInfo library
- Adding onMessageTouch and dismissKeyboardOnMessageTouch prop for MessageList component
- Fixing style issue (background color) of MessageText component, introduced in 0.2.4

## [0.2.4] 2019-09-13

- Fixing bug in theme logic
- Adding ability to customize more the MessageSimple component

## [0.2.3] 2019-09-09

- Fixing pagination issue when oldest message is not received yet

## [0.2.2] 2019-09-06

- Updated example two to react native 0.60
- Fixing UX for image/file picker - closing keyboard when you open file/image picker actionsheet

## [0.2.1] 2019-09-02

- Making sdk compatible with Expo 33 and 34

## [0.2.0] 2019-08-26

- Making sdk compatible with react native 0.60

## [0.1.19] 2019-08-26

- Updating ChannePreviewMessanger component to show other member's name as channel title if channel has no explicate name in channel.data

## [0.1.18] 2019-08-12

- Fixing keyboard compatible view for android. Status bar height was not taken into account while calculating the height of channel after opening keyboard.

## [0.1.17] 2019-08-08

- Fixing prop to override Attachment UI component

## [0.1.16] 2019-08-07

- Attachment for URL preview were broken. Fixed.

## [0.1.15] 2019-07-18

- Adding prop function `onChannelUpdated` as callback for event `channel.updated`
- Bug fix - Channel list component doesn't update when custom data on channel is updated.
