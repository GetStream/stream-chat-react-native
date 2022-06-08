# Change Log

## [4.7.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.6.1...v4.7.0) (2022-06-07)


### Features

* ability to customize onPress handler for urls ([e5b840f](https://github.com/GetStream/stream-chat-react-native/commit/e5b840f07983c71cc58322194c5b62ebbefa9252))
* allow video upload from image picker and file picker ([6009d36](https://github.com/GetStream/stream-chat-react-native/commit/6009d3626bed416c1bd043fbf1c6ebb156186677))
* inline video renderer/player support for SDK ([862c4bb](https://github.com/GetStream/stream-chat-react-native/commit/862c4bb990f98f26c6c81e2335692569a44018b9))


### Bug Fixes

* correctly truncate channel name in useChannelPreviewDisplayName ([cdabaa3](https://github.com/GetStream/stream-chat-react-native/commit/cdabaa3682747c3590df37a2ad86380c67e0ef29))
* filePicker appearing issue on tapping the attachment picker icon after file is selected ([ae19950](https://github.com/GetStream/stream-chat-react-native/commit/ae19950b397b5e999e10c9ae7f1a41ad5dfdec12))
* issue with the link text overflowing the reply view ([1c5aa3e](https://github.com/GetStream/stream-chat-react-native/commit/1c5aa3eac161f115a4c6799dfecd48966f770c06))
* issues with video upload in expo from attachment picker and component displayname ([d8d621d](https://github.com/GetStream/stream-chat-react-native/commit/d8d621d0754d0d7962791a8756142955b2d661d6))
* smart gallery rendering while optimistically adding a message to list ([748f36b](https://github.com/GetStream/stream-chat-react-native/commit/748f36b7db4ce69c8d39cad24d9588359b6346f3))

### [4.6.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.6.0...v4.6.1) (2022-05-25)


### Bug Fixes

* hotfixes borderRadius ([1dd116d](https://github.com/GetStream/stream-chat-react-native/commit/1dd116de7d402a8b301438c88e996a28ba15970e))

## [4.6.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.5.0...v4.6.0) (2022-05-25)


### Features

* allow video upload from image picker ([6989c1d](https://github.com/GetStream/stream-chat-react-native/commit/6989c1d72133518687a5c94f2e44ee38f46efacd))


### Bug Fixes

* race condition when bottom sheet is closed during keyboard show ([994addf](https://github.com/GetStream/stream-chat-react-native/commit/994addf9e907f5ba78e81cd9fb46a93221a6070f))

## [4.5.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.4.0...v4.5.0) (2022-05-17)


### Features

* ability to add onPress handler for mentioned user names - [Documentation link](https://getstream.io/chat/docs/sdk/reactnative/core-components/channel/#onpressmessage) ([7894bf9](https://github.com/GetStream/stream-chat-react-native/commit/7894bf92eeb5a02cc0e5028f25f19486214f6306))
* add theming support for the chevron icon in scroll to bottom button ([2a4bc9a](https://github.com/GetStream/stream-chat-react-native/commit/2a4bc9a647595aff0ea2f3e57718219d0b60f7e2))


### Bug Fixes

* url without http/s opening issue ([46da678](https://github.com/GetStream/stream-chat-react-native/commit/46da6787423f751f7e1de02d1d865b1e5fe8a07a))

### [4.3.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.3.0...v4.3.1) (2022-04-12)


### Bug Fixes

* fixes the broken giphy "shuffle" behaviour ([16f139a](https://github.com/GetStream/stream-chat-react-native/commit/16f139ab609304193d3d19488bd5227d0078e17d))
* typescript for "giphyVersion" prop on `OverlayProvider` component ([35c1c10](https://github.com/GetStream/stream-chat-react-native/commit/35c1c10889d30106002bcd0b7b2e55ca27fbcbcb))


### Reverts

* "feat: add appSettings to ChatContext" ([5d947a3](https://github.com/GetStream/stream-chat-react-native/commit/5d947a30222ef99c50d6568cff4f8770bf16a237))

## [4.3.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.2.0...v4.3.0) (2022-04-04)


### Features

* add isAttachmentEqual props around memoization of custom properties [CRNS - 290] ([cd51ee8](https://github.com/GetStream/stream-chat-react-native/commit/cd51ee89ab959cd3e38bbdbd5e949bc401b40ec4))
* editing state header, reply state header and giphy input customization [CRNS - 535] ([4c1d67d](https://github.com/GetStream/stream-chat-react-native/commit/4c1d67d9a4e45050a45a402a53c2cf9b6fbc39b8))
* open giphy in image viewer when pressed [CRNS - 540] ([3cc2e93](https://github.com/GetStream/stream-chat-react-native/commit/3cc2e939bb4f935e245e46006d4fb607f4cde47c))


### Bug Fixes

* handling the case of undefined updated_at on message ([bad1f45](https://github.com/GetStream/stream-chat-react-native/commit/bad1f45d1d6466532d8b5cbc4d2806221b639f03))
* issues with opening old Giphy on ImageGallery ([7f21b6c](https://github.com/GetStream/stream-chat-react-native/commit/7f21b6c5c98dca210d8b77030c4442c644bb86a1))
* re-render ownCapabilitiesContext when channel capabilities are u… ([9bbf25e](https://github.com/GetStream/stream-chat-react-native/commit/9bbf25e9237c1a0bf770bd194b67e0737046def8))

## [4.2.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.4...v4.2.0) (2022-03-17)


### Features

* add giphy size customisation [CRNS-514] ([90c87da](https://github.com/GetStream/stream-chat-react-native/commit/90c87da095bd6f243613853091f11a9b6564632e))
* update core to rn 0.67 [CRNS-539] ([46e9b37](https://github.com/GetStream/stream-chat-react-native/commit/46e9b3761021c0f6ddbe03f5afb81e3426877625))
* upgrade react native gesture handler version to 2.3.1 ([f9eba70](https://github.com/GetStream/stream-chat-react-native/commit/f9eba70d5f961f2aed7f52eeb458b4ea6f18678e))


### Bug Fixes

* show background for Giphy on long press ([459a595](https://github.com/GetStream/stream-chat-react-native/commit/459a59522c7acb9d20b5e78809efc31084201257))

### [4.1.4](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.3...v4.1.4) (2022-03-13)


### Bug Fixes

* overrideOwnCapabilities typescript issue ([a8010ef](https://github.com/GetStream/stream-chat-react-native/commit/a8010efe6d841d447c32bf7f1fe0e3ecab2761c3))

### [4.1.3](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.2...v4.1.3) (2022-03-10)


### Bug Fixes

* add missing own_capabilities field after channel.updated event [CRNS-537] ([0a27963](https://github.com/GetStream/stream-chat-react-native/commit/0a279637dbf0cc4474b0ffc3052f6df6cdbfacf1))
* cleanup of keyboard listeners ([7f4d6f2](https://github.com/GetStream/stream-chat-react-native/commit/7f4d6f27e061c66a8f6631a3840a7a911650c423))
* pull to refresh functionality [CRNS-536] ([df6e6df](https://github.com/GetStream/stream-chat-react-native/commit/df6e6df3b70a6c9f986723b9328c8a99def67511))

### [4.1.2](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.1...v4.1.2) (2022-03-07)


### Bug Fixes

* export ownCapabilitiesContext from SDK ([e0a9f75](https://github.com/GetStream/stream-chat-react-native/commit/e0a9f757e431bd29310e8bfc16f4abf5fdca0ae2))

### [4.1.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.0...v4.1.1) (2022-03-03)


### Bug Fixes

* image gallery cleanup and fixing race condition ([4c53f33](https://github.com/GetStream/stream-chat-react-native/commit/4c53f3374a7ebe7e42f61473480acd7642de489d))
* mark channel as read when messages length is less than visible screen ([2dd87b3](https://github.com/GetStream/stream-chat-react-native/commit/2dd87b340d4d5d66911c9306b58d8307e089ed33))

### [3.10.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.10.1...v3.10.2) (2021-11-23)


### Bug Fixes

* 'Block User' message action ([9959955](https://github.com/GetStream/stream-chat-react-native/commit/9959955fd665b708172d27fc0bbeb4cee4d104eb))

### [3.10.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.10.0...v3.10.1) (2021-11-15)


### Bug Fixes

* render attachment type video in FileAttachment view [CRNS-480] ([1649ee3](https://github.com/GetStream/stream-chat-react-native/commit/1649ee3bee43b3062ed1998d7683025429aad5a9))

## [3.10.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.9.2...v3.10.0) (2021-11-11)


### Features

* added support for channelListSkeleton.maskFillColor theme property [CRNS-471] ([e20e6c7](https://github.com/GetStream/stream-chat-react-native/commit/e20e6c7d3bbc34e9e9ce8f5c912236005c1e9aed))

### [3.9.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.9.1...v3.9.2) (2021-11-02)


### Bug Fixes

* handling the errors when channel which is open gets deleted [CRNS-468] ([2598091](https://github.com/GetStream/stream-chat-react-native/commit/25980911841c8dc213a0b799036eca6e3638d588))
* update message text when theme changes [CRNS-467] ([17ad925](https://github.com/GetStream/stream-chat-react-native/commit/17ad92519e328b0453f1c1d760ed5b3883978c71))

### [3.9.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.9.0...v3.9.1) (2021-10-22)


### Bug Fixes

* fixed react warnings - Can not perform a React state update on an unmounted component [CRNS-444] ([6240948](https://github.com/GetStream/stream-chat-react-native/commit/6240948d731ea8a6d98c3aa9c8896344392d1a40))

## [3.9.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.3...v3.9.0) (2021-10-12)


### Features

* added 'stateUpdateThrottleInterval' prop on Channel component ([ce471fc](https://github.com/GetStream/stream-chat-react-native/commit/ce471fcf14fcedbb307fdc7fb9d3adbc6c7fab19))
* added a support for prop 'newMessageStateUpdateThrottleInterval' ([04b0b83](https://github.com/GetStream/stream-chat-react-native/commit/04b0b83ac5e6876f054400c8eed7dac121c47f2d))
* added support for 'enableMessageGroupingByUser' prop ([e704519](https://github.com/GetStream/stream-chat-react-native/commit/e704519c8755ac65908f83864f0bf7ca2cbba123))
* added support for 'hideStickyDateHeader' prop ([969575e](https://github.com/GetStream/stream-chat-react-native/commit/969575e00e78775648890d7b1daffb8d5592eb45))
* added support for prop 'legacyImageViewerSwipeBehaviour' ([95d15e0](https://github.com/GetStream/stream-chat-react-native/commit/95d15e08f9d6f43f1d9e314fc200d60e1ce04413))


### Bug Fixes

* avoid unnecessary gallery image re-rendering upon message update ([198c437](https://github.com/GetStream/stream-chat-react-native/commit/198c437dafd1d531f7c9cd537bfaebaa46406f52))
* fixed AppState subscription logic to support RN 0.65 ([8a1ec82](https://github.com/GetStream/stream-chat-react-native/commit/8a1ec82b306542d931056932defaea779af61c57))
* fixed markRead() logic when Channel is mounted ([53e495e](https://github.com/GetStream/stream-chat-react-native/commit/53e495e9fd1d7d2a1becd5fc65b2e100632f9fd4))
* fixed offset-limit logic for channel list pagination ([cd77227](https://github.com/GetStream/stream-chat-react-native/commit/cd77227fb321d67617c00f86d78e972f00418fc9))
* fixed UX of removing of failed attachment ([ef91d30](https://github.com/GetStream/stream-chat-react-native/commit/ef91d3065e67758aea6030658e8e465c129577cc))
* fixing deprecated warning around AppState for RN 0.65 compatibility ([08679d5](https://github.com/GetStream/stream-chat-react-native/commit/08679d593064c80a252adb86c1376dbc2edb2dc8))
* issue with autocomplete suggestions for channel with more than 100 members ([f91b4be](https://github.com/GetStream/stream-chat-react-native/commit/f91b4befbf359c8ce07feae6c0b18848784d62b7))
* **Channel:** Copy channel state on leading edge of throttling ([56a47d4](https://github.com/GetStream/stream-chat-react-native/commit/56a47d4f3fa5e67ef84f9ed5d000edc595e03145))

### [3.8.3](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.2...v3.8.3) (2021-09-16)


### Bug Fixes

* type definition directory structure ([9a4d2c3](https://github.com/GetStream/stream-chat-react-native/commit/9a4d2c30fef18222f25396e7453686d503a69462))

### [3.8.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.1...v3.8.2) (2021-09-14)


### Bug Fixes

* fixed markdown issues with lists ([e40777a](https://github.com/GetStream/stream-chat-react-native/commit/e40777a7dedeb8f89ba8f03e295d06b9c7df610f))

### [3.8.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.0...v3.8.1) (2021-09-13)


### Bug Fixes

* allow images attached through file picker to display in gallery view ([afd84a9](https://github.com/GetStream/stream-chat-react-native/commit/afd84a9d7536f2e47ce1e7888ca29c46a9f81e32))
* delegate content type detection to backend for image/file uploads ([8de7d8d](https://github.com/GetStream/stream-chat-react-native/commit/8de7d8d22a3e6152185db3f86ce705af904e75c6))
* share photo functionality ([41231a0](https://github.com/GetStream/stream-chat-react-native/commit/41231a0eee5e74a7063bdc6f901862c028e55880))

## [3.8.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.3...v3.8.0) (2021-08-30)


### Features

* added support for japanese and korean language ([5708201](https://github.com/GetStream/stream-chat-react-native/commit/5708201c43b7e12c4cb96879527ccd59026b73a8))
* added support for props - `autoCompleteSuggestionsLimit`, `mentionAllAppUsersEnabled` and `mentionAllAppUsersQuery` on Channel component ([ff15650](https://github.com/GetStream/stream-chat-react-native/commit/ff1565085182516fb02c8699c198332b71a2cc35))

## [4.0.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.3...v4.0.0) (2021-08-22)


### ⚠ BREAKING CHANGES

* Parent channels rendering threads should add a threadList prop if thread is active

### Features

* added support for props - `autoCompleteSuggestionsLimit`, `mentionAllAppUsersEnabled` and `mentionAllAppUsersQuery` on Channel component ([ff15650](https://github.com/GetStream/stream-chat-react-native/commit/ff1565085182516fb02c8699c198332b71a2cc35))


### Bug Fixes

* **concurrency:** Channels concurrency general improvements ([bfb9f66](https://github.com/GetStream/stream-chat-react-native/commit/bfb9f66f309bbfaf6b96e9b0afbfca6601cf1143))
* Channel concurrency fixes ([eab95f0](https://github.com/GetStream/stream-chat-react-native/commit/eab95f0be97226793f9bc8bc2bc2ad4cfe2c93aa))
* move channel states to parent level & filter out active channels on channel list refresh ([7c7b714](https://github.com/GetStream/stream-chat-react-native/commit/7c7b71426fd3bacf029f1af68dc894fc01e7348d))

### [3.7.3](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.2...v3.7.3) (2021-08-20)


### Bug Fixes

* Hotfix for peer deps collision ([83cf002](https://github.com/GetStream/stream-chat-react-native/commit/83cf002a86c3ccd683b2ad7440388f8e781baa11))

### [3.7.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.1...v3.7.2) (2021-08-04)


### Bug Fixes

* **attachment-picker:** fixing sync logic between `imageUploads` and `selectedImages` ([46de905](https://github.com/GetStream/stream-chat-react-native/commit/46de9055b1df3e0a9cedbe2018628f7025f5cb27))
* Fix infinite loop in bottom sheet or image gallery on notched iOS phones ([1bc81f0](https://github.com/GetStream/stream-chat-react-native/commit/1bc81f0aabedbd42d70624d4b3a13abe2e77d826))

### [3.7.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.0...v3.7.1) (2021-07-30)


### Bug Fixes

* Fix giphy and attachment icon hiding issue ([1b1f8fe](https://github.com/GetStream/stream-chat-react-native/commit/1b1f8fef5a263a735922cd2dc2057b384676866c))

## [3.7.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.7...v3.7.0) (2021-07-29)


### Features

* added mutesEnabled prop on Channel component, to toggle  "Mute User" action ([b5c1f38](https://github.com/GetStream/stream-chat-react-native/commit/b5c1f38cf5a4510283a2ff30c2884eaf73662577))
* Allow images and attachments on the same message ([9a36352](https://github.com/GetStream/stream-chat-react-native/commit/9a36352cd34c36b0dcf0552fe5dc50c5ebc9f513))


### Bug Fixes

* Fix messages disappearing on reconnect ([dc0fc3d](https://github.com/GetStream/stream-chat-react-native/commit/dc0fc3d21cbb38d3442f8f94d30bd1f795fb2ba8))
* Fix quoted images/attachments ([2bb1f14](https://github.com/GetStream/stream-chat-react-native/commit/2bb1f14ce60d7455c4ff7272440965be0a7e32c8))


### [3.6.7](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.6...v3.6.7) (2021-07-20)


### Bug Fixes

* Clean user's typing state when app goes to background ([d4b9f3e](https://github.com/GetStream/stream-chat-react-native/commit/d4b9f3e1b18af62b02620f68eb341624ebcfa5d3))


### [3.6.6](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.5...v3.6.6) (2021-07-19)


### Bug Fixes

* Fix missing translations for message deleted ([7e7f653](https://github.com/GetStream/stream-chat-react-native/commit/7e7f6533904510fa0f02a22f5c7b45d4171cdefc))


### [3.6.5](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.4...v3.6.5) (2021-07-15)


### Bug Fixes

* **reactions:** Fix overflowing reactions list and double scroll on Android ([04dbc9b](https://github.com/GetStream/stream-chat-react-native/commit/04dbc9bf3e0f334215b6bac3221a8963951e97e2))



## [3.6.4](https://github.com/GetStream/stream-chat-react-native/compare/stream-chat-react-native-core@3.6.3...stream-chat-react-native-core@3.6.4) (2021-07-13)

**Note:** Version bump only for package stream-chat-react-native-core





## [3.6.3](https://github.com/GetStream/stream-chat-react-native/compare/stream-chat-react-native-core@3.6.2...stream-chat-react-native-core@3.6.3) (2021-07-13)

**Note:** Version bump only for package stream-chat-react-native-core





## 3.6.2 (2021-07-13)


### Bug Fixes

* **android:** use react native FlatList instead of RNGH's on ChannelListMessenger ([1267f64](https://github.com/GetStream/stream-chat-react-native/commit/1267f64d2f003477e12edbb8b1e833872416510d))





## 3.6.2-rc.0 (2021-07-13)


### Bug Fixes

* **android:** use react native FlatList instead of RNGH's on ChannelListMessenger ([1267f64](https://github.com/GetStream/stream-chat-react-native/commit/1267f64d2f003477e12edbb8b1e833872416510d))





## [3.6.1] (2021-07-07)

- Fixed problem where it wasn't possible to clear giphy messages inside of a thread [6d8977d](https://github.com/GetStream/stream-chat-react-native/commit/6d8977d43e804db95c44d95b7a546f6534d0f5c7)

## [3.6.0] (2021-06-22)

This release provides full support for Expo 41 and React Native 0.64

Please make sure to upgrade following packages to specified versions:

- `react-native-reanimated@2.1.0`
- `react-native-share@6.0.1`

## [3.5.0] (2021-05-28)

###  **🛑 BREAKING**

Following props have been renamed:

- `reply` -> `quotedReply`
- `handleReply` -> `handleQuotedReply`
- `handleReplyMessage` -> `handleQuotedReplyMessage`
### Features

- Added new props to Channel component [219b307](https://github.com/GetStream/stream-chat-react-native/commit/219b307e3d2db36a6974e4870dc0eb00213bcca2)

  - maxMessageLength (number)
  - reactionsEnabled (boolean)
  - readEventsEnabled (boolean)
  - repliesEnabled (boolean)
  - typingEventsEnabled (boolean)
  - uploadsEnabled (boolean)
  - quoteRepliesEnabled (boolean)
  - threadRepliesEnabled (boolean)

### Bug fixes
- Update messages when mute status updates [885f8c2](https://github.com/GetStream/stream-chat-react-native/commit/885f8c20306ef46eb6ad20cd2942618acf967741)
- Fixed broken "Resend message" functionality for failed messages [359c192](https://github.com/GetStream/stream-chat-react-native/commit/359c192903b3e34836ffadcca55f2a4e0a7fc509)
- Fixed read receipts [f7510e8](https://github.com/GetStream/stream-chat-react-native/commit/f7510e8134ad14fbfa1d920e68267d3080d2b1ba)
- Fixed images as attachment from File Picker [5ca1a25](https://github.com/GetStream/stream-chat-react-native/commit/5ca1a250a9d1c75c86e9c89dda1c116dd77bb1b3)

## [3.4.0] (2021-05-14)

### Features
- Updated implementation around network recovery for smooth UX [#658](https://github.com/GetStream/stream-chat-react-native/pull/658)
- Added support for `MessageDeleted` prop on Channel component, for overriding default deleted message component [65861d9](https://github.com/GetStream/stream-chat-react-native/commit/65861d9a52e8d289d6e66bbc63d2814aa6f87c9e)
- Refresh channel list when `sort` prop updates, on ChannelList [42450fa](https://github.com/GetStream/stream-chat-react-native/commit/42450fa23d6221931b0b14d5f39fba2484b7dadf)
- Added support for typing indicator in threads [6f518ca](https://github.com/GetStream/stream-chat-react-native/commit/6f518ca1879943edaa6606209c2f63672df1dd75)
- Added handler for `channel.visible` event [476c36e](https://github.com/GetStream/stream-chat-react-native/commit/476c36e30eb41ca5843c0f679c18880e46d7564e)

### Bug fixes

- Added default sizes to Icons in `OverlayReactionList` component. [6b4db5f](https://github.com/GetStream/stream-chat-react-native/commit/6b4db5fd1ad4816506a2f567409201374d6d3f3c)
- Miscellaneous fixes around image picker opening and closing [950f746](https://github.com/GetStream/stream-chat-react-native/commit/950f746412422cdb2fb6b358a24a3bc694a9032a) [4845e4e](https://github.com/GetStream/stream-chat-react-native/commit/4845e4e08e6725b612f17360d1fe031c0acf6578)

##  [3.3.2] (2021-04-13)

- Allow re-rerendering of MessageInput component, on changes to `additionalTextInputProps` [1b95a64](https://github.com/GetStream/stream-chat-react-native/commit/1b95a64f15642829d2b4296615c2d8572065f213)
- Fixed Android camera permissions check [5b77516](https://github.com/GetStream/stream-chat-react-native/commit/5b775160b814c9d69fdb5f9879662c76064581af)

##  [3.3.1] (2021-04-09)

- Fixed `supportedReactions` prop support on `OverlayReactions` [#594](https://github.com/GetStream/stream-chat-react-native/pull/594/files)
- Fixed mentions autocomplete functionality for channels with > 100 members [e8c93d3](https://github.com/GetStream/stream-chat-react-native/commit/e8c93d39825ecf7e3fb01dc6da8a1096cef50bf3)
- Fixed theming issue on overlay for sent message (or my message) [7f11364](https://github.com/GetStream/stream-chat-react-native/commit/7f113649975620391dca1ff447e70ae89c08b5bb)
- Exporting following components and hooks from SDK
  - ChannelListLoadingIndicator
  - ChannelPreviewMessage
  - ChannelPreviewStatus
  - ChannelPreviewTitle
  - ChannelPreviewUnreadCount
  - InputButtons
  - useAppStateListener

##  [3.3.0] (2021-04-07)

### New Features 🎉

- Added inline date separators, which can be customized by adding your own UI component [#581](https://github.com/GetStream/stream-chat-react-native/pull/581/files)

  ```jsx
  <Channel
    InlineDateSeparator={({ date }) => { /** Your custom UI */ }}
    maxTimeBetweenGroupedMessages={40000} // number of ms, after which further messages will be considered part of new group.
  >
  ```

- Added ability to override default onLongPress, onPress, onPressIn and onDoubleTap handlers using following props on Channel component:

  - onLongPressMessage
  - onPressMessage
  - onPressInMessage
  - onDoubleTapMessage

  You will have access to payload of that handler as param:

  ```jsx
  <Channel
    ...
    onLongPressMessage={({
      actionHandlers: {
          deleteMessage, // () => Promise<void>;
          editMessage, // () => void;
          reply, // () => void;
          resendMessage, // () => Promise<void>;
          showMessageOverlay, // () => void;
          toggleBanUser, // () => Promise<void>;
          toggleMuteUser, // () => Promise<void>;
          toggleReaction, // (reactionType: string) => Promise<void>;
      },
      defaultHandler, // () => void
      event, // any event object corresponding to touchable feedback
      emitter, // which component trigged this touchable feedback e.g. card, fileAttachment, gallery, message ... etc
      message // message object on which longPress occured
    }) => {
      /** Your custom action */
    }}
  />
  ```

###  **🛑 BREAKING**

- Following props are no longer accessible on `Input` component (which is used to customize underlying input box). They should be accessed from `MessageInputContext` (or corresponding hook - `useMessageInputContext`)

  - openAttachmentPicker
  - closeAttachmentPicker
  - toggleAttachmentPicker
  - openCommandsPicker
  - openMentionsPicker
  - openFilePicker

- Value `typing` (which is list of users who are typing), has been moved from `ChannelContext` to its own separate context - `TypingContext` [c450719](https://github.com/GetStream/stream-chat-react-native/commit/c4507194956360ae27731fc81fed1d7dc1ed1861)


### Fixes

- [#522](https://github.com/GetStream/stream-chat-react-native/issues/522) `initialValue` not being set for inputbox [63b3d79](https://github.com/GetStream/stream-chat-react-native/pull/572/commits/63b3d7995b30dccf23aece51cbc7479388890fd0)
- Fixed goToMessage functionality (when you press on quotedMessage) in MessageList [#580](https://github.com/GetStream/stream-chat-react-native/pull/580)
- Fixed image picker not loading when swapping from keyboard [a180ad4](https://github.com/GetStream/stream-chat-react-native/commit/a180ad43fb1766f0252467c4d6aec84ca7c9e26d)

##  [3.2.0] (2021-03-23)

###  **🛑 BREAKING**

- Minimum required `stream-chat` version is `3.5.1`.
- Following values have been moved from `MessagesContext` a separate context - `PaginatedMessageListContext`
  - hasMore
  - messages
  - loadMore
  - loadMoreRecent
  - loadMoreThread
  - loadingMore
  - loadingMoreRecent

### Non breaking:

#### Websocket and Push

From this release when app goes to background, websocket connection will be dropped by default.
This is necessary to allow push notifications.

We only send push notification, when user doesn't have any active websocket connection (which is established when you call `client.connectUser`). When your app goes to background, your device will keep the ws connection alive for around 15-20 seconds, and so within this period you won't receive any push notification. Until now, it was upto end user to drop the connection by explicitly calling `client.closeConnection()` or `client.wsConnection.disconnect()`, when app goes to background.
But from this release, we have moved this functionality to OOTB.

- If you don't have push system configured for your application, you can disable this functionality by adding a prop on Chat component - `closeConnectionOnBackground={false}`
- As described earlier, please make sure you are on `stream-chat >= 3.5.1`

#### Other

- Allow use of Channel component with uninitialized channel
- Allow custom config of i18next config
- UI fixes and animation improvements for reactions

## [3.1.2] (2021-03-17)

**NO CODE CHANGE**

Fixed version.json during package publishing, which we use to track the version of RN sdk through
`client.setUserAgent` call

## [3.1.1] (2021-03-17)

Fixed type definition pointers in package.json

- [Issue #560](https://github.com/GetStream/stream-chat-react-native/issues/560)

## [3.1.0] (2021-03-15)

- **🛑 BREAKING**: Removed a prop `handleOnPress` on `Input` component.
- Added support for new props on `Input` component, which can be used on Channel component as prop to replace undelying input component ([reference](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#how-to-change-the-layout-of-messageinput-component))
    - closeAttachmentPicker (function)
    - openAttachmentPicker (function)
    - openCommandsPicker (function)
    - toggleAttachmentPicker (function)

- Added support for new prop on `Channel` component - `InputButtons`, to replace the extra buttons on the left on input box [#536](https://github.com/GetStream/stream-chat-react-native/pull/536)

- Added support for `messageActions` prop as callback. Also added support for prop `messageActions` on Channel component [#548](https://github.com/GetStream/stream-chat-react-native/pull/548)
  Earlier you could override messageActions prop as following:

  ```jsx
  <Channel
    messageActions=[
      {
        action: () => { /** Some message action logic */ };
        title: "Pin Message";
        icon: PinIcon;
        titleStyle: {};
      },
      {
        action: () => { /** Some message action logic */ };
        title: "Delete Message";
        icon: PinIcon;
        titleStyle: {};
      }
    ]
  >
    {/** MessageList and MessageInput component here */}
  </Channel>
  ```

  But now, you can selectly keep certain action and remove some:

  ```jsx
  /** Lets say you only want to keep threadReply and copyMessage actions */
  <Channel
    messageActions={({
      blockUser,
      copyMessage,
      deleteMessage,
      editMessage,
      flagMessage,
      muteUser,
      reply,
      retry,
      threadReply,
    }) => ([
      threadReply, copyMessage
    ])}
  >
    {/** MessageList and MessageInput component here */}
  </Channel>
  ```

- Issue fix: make OverlayReactions customizable through props. [c7a83b8](https://github.com/GetStream/stream-chat-react-native/commit/c7a83b87804d9492ce01ef0dfa63fe9b6cc203ad)
- Issue fix: Image upload for expo and assets-library [5a2d0e8](https://github.com/GetStream/stream-chat-react-native/commit/5a2d0e827dd4a4067058787b49b07c584f3e370c)
- Issue fix: Compatibility with jest as described in [#508](https://github.com/GetStream/stream-chat-react-native/issues/508) [a172c15](https://github.com/GetStream/stream-chat-react-native/commit/a172c15b1304932051f0f699daf47981e488fde4)


## [3.0.0] (2021-02-23)

Version 3.x is a major revamp of the SDK and comes with **many breaking changes**. The new implementation takes advantage of React Context along with many popular community libraries such as Reanimated V2 to deliver a superior chat experience. **Upgrading will require re-implementing** your integration but will yield performance and functional benefits. It is highly recommended you read the Cookbook and examine the SampleApp / TypeScriptMessaging apps before upgrading to understand what is required.

### New features

  - Modern UX around reaction picker functionality, similar to iMessage
  - Inline replies
  - "Also send to channel" option on Threads
  - In app attachment picker
  - Improved avatars for grouped channels.
  - Rich image viewers with options to share the image outside the app, or view the image in gallery view.
  - "Copy Message" action as part of message actions.

### Improvements

- In previous versions, we did a lot of prop drilling throughout component trees, which makes it quite hard for end user to decide exactly where to set a particular prop. We have tried to centralize component customization on following three higher order components:

  - OverlayProvider
  - ChannelList
  - Channel

  We have prepared a visual guide to help you with component customizations - [Guide](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#custom-components)

- In v2.x.x, we decided to move away from class based components, towards functional components along with react hooks. React hooks are definitely a big addition to react eco-system, but when not careful it has potential to hammer the performance. We have handled all these issues as part of v3.0.0 using careful revamp around all the contexts and memoizations, which improves the app performance by a great margin.

- We have decided to abondon styled-components, are decided to have our own implementation

  - Removed dot notation for theming applications
  - Removed css string notation for styles on theme
  - Added displayName to components with bracket notation denoting the theme path e.g. `MessageStatus.displayName = 'MessageStatus{message{status}}';` indicates the theme path would be modified via `const customTheme: DeepPartial<Theme> = { message: { status: { ...customizations } } }`. Please check our [theme docs](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#theme) for more details.

### Dependency changes:

- Added peer dependencies for:
  - BlurView using one of these
    - Expo: [expo-blur](https://docs.expo.io/versions/latest/sdk/blur-view/#installation)
    - React Native: [@react-native-community/blur](https://github.com/Kureev/react-native-blur#installation)
  - Image Compression using one of these
    - Expo: [expo-image-manipulator](https://docs.expo.io/versions/latest/sdk/imagemanipulator/#installation)
    - React Native: [react-native-image-resizer](https://github.com/bamlab/react-native-image-resizer#setup)
  - FileSystem using one of these
    - Expo: [expo-file-system](https://docs.expo.io/versions/latest/sdk/filesystem/#installation)
    - React Native: [react-native-fs](https://github.com/itinance/react-native-fs/)
  - Share using one of these
    - Expo [expo-sharing](https://docs.expo.io/versions/latest/sdk/sharing/#installation)
    - React Native: [react-native-share](https://github.com/react-native-share/react-native-share#getting-started)
  - Image Picking using one of these
    - Expo [expo-media-library](https://docs.expo.io/versions/latest/sdk/media-library/#installation)
    - React Native: [react-native-cameraroll](https://github.com/react-native-cameraroll/react-native-cameraroll#getting-started)
  - [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/#installation)
  - [react-native-reanimated v2](https://docs.swmansion.com/react-native-reanimated/docs/installation)
  - [react-native-svg](https://github.com/react-native-svg/react-native-svg#installation)

- Removed peer dependencies for:
  - [react-native-get-random-values](https://github.com/LinusU/react-native-get-random-values)

- Removed seamless-immutable
- Removed styled-components:

Please find detailed docs about this release in our [wiki](https://github.com/GetStream/stream-chat-react-native/wiki#v300)


### Note for Expo

- As of this release, expo is on version 40 which uses a version of React Native with a bug in the Dimensions API that occurs upon reloading an app in the simulator. Version 3.x uses relative sizing widely and depends on this API so issues will be visible in Expo until they update the custom React Native version they ship.

- [Android] As part of this release, we implemented a new feature - inline replies, similar to whatsapp. Bi-directional scrolling/pagination was necessary for this feature. To keep smooth scrolling experience, we implemented our [own solution](https://github.com/GetStream/flat-list-mvcp#maintainvisiblecontentposition-prop-support-for-android-react-native) for react-native. Although, Expo being close-source project, we can't do any such thing for Expo. So inline reply feature is not recommended to use in Expo, since you will not have a good scroll experience on Android, while scrolling down in message list.


## [2.2.2] 2021-02-07

Handling the case of standlone Channel component (without ChannelList) on top of fix in [v2.2.1](https://github.com/GetStream/stream-chat-react-native/releases/tag/v2.2.1) - [ba7d744](https://github.com/GetStream/stream-chat-react-native/commit/ba7d744dcdf76e16bcee29a9daa6f8879ef0ec79)

## [2.2.1] 2021-02-03

For push notifications, we usually recommend users to disconnect websocket when app goes to background and reconnect when app comes to foreground. But channel list UI doesn't update properly once the ws is re-connected. This issue has been fixed in this commit [8a35e50](https://github.com/GetStream/stream-chat-react-native/commit/8a35e505fadb059b0a3b48fdc33a3a72021bd158)

## [2.2.0] 2021-02-02

- Switched to `react-native-markdown-package` for markdown of message text [#505](https://github.com/GetStream/stream-chat-react-native/pull/505/files)

## [2.1.4] 2021-01-29

Fixed broken re-send message functionality, upon failure [b3c028f](https://github.com/GetStream/stream-chat-react-native/commit/b3c028f7bb91d00286717564764cb0fcf42b75b3)

## [2.1.3] 2021-01-26

- Fix markdown on message
  - fixes [#498](https://github.com/GetStream/stream-chat-react-native/issues/498)
  - commit [d4713aa](https://github.com/GetStream/stream-chat-react-native/commit/d4713aa32515df8c4726860508661645ade13598)
- Fixes issue with un-necessary queryChannels api call, when filters are provided as inline object [9f4528b](https://github.com/GetStream/stream-chat-react-native/commit/9f4528b0035cbcc5898f5da88109e703413b2f4f)
## [2.1.2] 2021-01-09

- Fixed infinite re-rendering issue on mentions suggestion box [5fd521a](https://github.com/GetStream/stream-chat-react-native/commit/5fd521a075170004fe551dd3ffbac111256274fe)

## [2.1.1] 2020-12-21

- Fixed broken mentions autocomplete feature for channels with more than 100 members. #457
- Added a new prop autocompleteSuggestionsLimit on MessageInput - Max number of suggestions to display in list. Defaults to 10.

## [2.1.0] 2020-12-07

### Dependency changes
- Bumping dependency to stream-chat@2.9.0

### Fixes
- Fixed plenty of issues around reload/refresh of channellist upon failures.
- Fixing retry message functionality [7a423f7](https://github.com/GetStream/stream-chat-react-native/commit/7a423f7c059336f770fd107ff8cc6f2bd6e4a939)

### New Props:
- MessageList component
  - MessageNotification [5b5c2ac](https://github.com/GetStream/stream-chat-react-native/commit/5b5c2ac1a021018834696b57c4dfb030635c9cb8)
  - onListScroll [5b5c2ac](https://github.com/GetStream/stream-chat-react-native/commit/5b5c2ac1a021018834696b57c4dfb030635c9cb8)
  - FooterComponent [d803bab](https://github.com/GetStream/stream-chat-react-native/commit/d803bab3d25a4e34bb8192e06fd41db5bfd07ea7)
  - inverted [d803bab](https://github.com/GetStream/stream-chat-react-native/commit/d803bab3d25a4e34bb8192e06fd41db5bfd07ea7)
  - NetworkDownIndicator [e09b9fc](https://github.com/GetStream/stream-chat-react-native/commit/e09b9fc93fb5064efe16b1c6c7572116d8f2ee69)

## [2.0.2] 2020-11-16

- Fixing issue - when you cancel 'edit message' flow, input box attachments don't get cleared [425db22](https://github.com/GetStream/stream-chat-react-native/commit/425db22cc1ad51be651e61e64af92128763f51ca)

- Adding reload behaviour on error indicator on messagelist [6047671](https://github.com/GetStream/stream-chat-react-native/commit/604767192daeb1c621b3763d4a56be95688bff12)

## [2.0.1] 2020-11-16

- Fixed issue - When you edit a message which has image attachments, images disappear from message - [68c0acb](https://github.com/GetStream/stream-chat-react-native/commit/68c0acbbb66e2f116db84be503054c8d2046778f)
- Fixed maxFiles value on image picker and file picker taking into account already selected number of attachments - [176f675](https://github.com/GetStream/stream-chat-react-native/commit/176f6751d2240cd502d1d84b91fa07b849c943ea)

## [2.0.0] 2020-10-29

Please check [Upgrade Docs](https://github.com/GetStream/stream-chat-react-native/wiki/Upgrade-helper#upgrade-from-0xx-to-2xx) for upgrading from 0.x.x to 2.x.x

**BREAKING CHANGES**

- You will need to install https://github.com/LinusU/react-native-get-random-values and add this line `import 'react-native-get-random-values';` to your `index.js`
- Expo 39 is now the lowest supported version

### Typescript

This library has been moved to full typescript. Please check [Typescript doc](https://github.com/GetStream/stream-chat-react-native/wiki/Typescript-support) for details

### Component prop changes

*Channel*
- add `additionalKeyboardAvoidingViewProps` prop to allow custom keyboard props

*ChannelListMessenger*
- remove `setActiveChannel` prop

*ChannelPreviewMessenger*
- renamed the `latestMessage` prop to `latestMessagePreview`. This name change is more semantic to what the prop does and reduces confusion with the `lastMessage` prop

*MessageContent*
- removed `retrySendMessage` prop in favor of `retrySendMessage` within `MessagesContext`

*MessageInput*
- remove `parent` prop to `parent_id` as it needs to be just an id string instead of the entire parent object
- add `setInputRef` prop to actually allow forwarding of the TextInput ref controls

*MessageSystem*
- add `formatDate` prop to allow custom date formatting

*ChannelContext*

- We have split the `ChannelContext` into three separate contexts to further modularize the code and reduce renders as items in context change. The following contexts now contain the following values, previously all held within the `ChannelContext`:

  - `ChannelContext`:

    - `channel`
    - `disabled`
    - `EmptyStateIndicator`
    - `error`
    - `eventHistory`
    - `lastRead`
    - `loading`
    - `LoadingIndicator`
    - `markRead`
    - `members`
    - `read`
    - `setLastRead`
    - `typing`
    - `watcherCount`
    - `watchers`

  - `MessagesContext`

    - `Attachment`
    - `clearEditingState`
    - `editing`
    - `editMessage`
    - `emojiData`
    - `hasMore`
    - `loadingMore`
    - `loadMore`
    - `Message`
    - `messages`
    - `removeMessage`
    - `retrySendMessage`
    - `sendMessage`
    - `setEditingState`
    - `updateMessage`

  - `ThreadContext`

    - `closeThread`
    - `loadMoreThread`
    - `openThread`
    - `thread`
    - `threadHasMore`
    - `threadLoadingMore`
    - `threadMessages`

- All contexts are exported and any values can be accessed through a higher order component (ex: `withMessagesContext`) or with one of our custom context hooks (ex: access `MessagesContext` by `const { messages } = useMessagesContext();`).

## [1.3.5] 2020-10-27

- Fixing [keyboard issue](https://github.com/GetStream/stream-chat-react-native/issues/397) during app state change [a8aa4ed](https://github.com/GetStream/stream-chat-react-native/commit/a8aa4edebd723120ea41d88b2f9d45df5a75f848)

## [1.3.4] 2020-10-13

- Fixing keyboard glitch functionality for android [a7f94b9](https://github.com/GetStream/stream-chat-react-native/commit/a7f94b93a12c997055a706316902aafbd256f29b)

## [1.3.3] 2020-10-05

- Fixing retry upload functionality [e89b87f](https://github.com/GetStream/stream-chat-react-native/commit/e89b87fb6b519d5433717d14ba12591236459586)

## [1.3.2] 2020-10-02

- SuggestionsList (for user-mentions feature in MessageInput) doesn't update the position as per keyboard position. For the time being, we have fixed this by dismissing the suggestions list when keyboard gets dismissed  - [0fdff4f](https://github.com/GetStream/stream-chat-react-native/commit/0fdff4f327908d4b554b8d4172028e666df65242)

- Exported IconBadge and IconSquare components, to fix the tutorial [f1b6a39](https://github.com/GetStream/stream-chat-react-native/commit/f1b6a393930e7fcd1571d7d80b56937154454b47)

- Added file size to file attachment [7e653a4](https://github.com/GetStream/stream-chat-react-native/commit/7e653a4a302ba24e5f9b664d2fccba778084ed0b)

## [1.3.1] 2020-09-29

**No changes**

## [1.3.0] 2020-09-25

**BREAKING CHANGES**

## MessageInput

- Replaced the default image picker [react-native-image-picker](https://github.com/react-native-community/react-native-image-picker) for [react-native-image-crop-picker](https://github.com/ivpusic/react-native-image-crop-picker) and added `compressImageQuality` prop to support image compression out-of-the-box
- Added `FileUploadPreview` and `ImageUploadPreview` props to support custom overrides to those components

## KeyboardCompatibleView and Channel component

Implementation of internal KeyboardCompatibleView has been changed so as to make animations smoother and fix existing issues with keyboard behavior.
Support for following props have been dropped from Channel and KeyboardCompatibleView

- keyboardDismissAnimationDuration
- keyboardOpenAnimationDuration

Following new props have been introduced on `Channel` component. They are the same props accepted by KeyboardAvoidingView of react-native.

- keyboardBehavior ['height' | 'position' | 'padding']
- keyboardVerticalOffset


## ChannelList

- We converted the ChannelList component from a class to a function and abstracted the event listener logic into custom hooks. The default event handlers can still be overridden by providing custom prop functions to the ChannelList component. Custom logic can be provided for the following events:

  - `onAddedToChannel` overrides `notification.added_to_channel` default
  - `onChannelDeleted` overrides `channel.deleted` default
  - `onChannelHidden` overrides `channel.hidden` default
  - `onChannelTruncated` overrides `channel.truncated` default
  - `onChannelUpdated` overrides `channel.updated` default
  - `onMessageNew` overrides `notification.message_new` default
  - `onRemovedFromChannel` overrides `notification.removed_from_channel` default

- All custom event handlers now accept two arguments, with the `this` reference no longer needed in the functional component.

  - 1st argument: `setChannels` reference to the `useState` hook that sets the `channels` in the React Native FlatList
  - 2nd argument: `event` object returned by the StreamChat instance

e.g.,

```js
// In following example we will override the default handler for notification.added_to_channel
<ChannelList
  filters={}
  onAddedToChannel={(setChannels, event) => {
    setChannels(channels => {
      // Do additional actions on channels array.
      return channels;
    })
  }}
>
```
- On upgrading to this release, ensure events and any custom handling functions (ex: `onAddedToChannel` or `onMessageNew`) are properly processed and update the list UI as expected.

## FileUploadPreview

- We fixed a bug for being unable to remove a file from the `MessageInput` and made it consistent to `ImageUploadPreview`
- We have removed support for the `fileUploadPreview.dismissText` theme value
- We have added support for `fileUploadPreview.dismiss`, `fileUploadPreview.dismissImage`, and `fileUploadPreview.imageContainer` theme values

## MessageInput

- We replaced the default image picker [react-native-image-picker](https://github.com/react-native-community/react-native-image-picker) for [react-native-image-crop-picker](https://github.com/ivpusic/react-native-image-crop-picker) and added `compressImageQuality` prop to support image compression out-of-the-box
- Added `FileUploadPreview` and `ImageUploadPreview` props to support custom overrides to those components

## MessageSystem

- Added `formatDate` prop to support custom date formatting

## Deprecated Props

- We have removed support for the `MessageList` component's `onMessageTouch` prop. Please use the `onPress` prop on the `MessageSimple` component to perform an action on touch of a message.

- We have removed support for the `Message` component's `readOnly` prop. Please use the `disabled` value from the `ChannelContext` instead.

- We renamed the `latestMessage` prop on the `ChannelPreviewMessenger` component to `latestMessagePreview`. This name change is more semantic to what the prop does and reduces confusion with the `lastMessage` prop.

- We have also dropped support for the following `MessageList` props:
  - `dateSeparator` (use DateSeparator instead)
  - `headerComponent` (use HeaderComponent instead)

## this Reference Removal

- We have removed the `this` class component reference from the prop functions in `MessageSimple`. For example, if you wish to override the SDK's standard long press behavior on a message, the `onLongPress` function passed in to `MessageSimple` no longer takes the `this` component reference as it's first argument. The message and the event object become the first and second arguments, respectively.

## renderText Function

- The `renderText` function utilized in the `MessageTextContainer` component now accepts a single object containing `markdownRules`, `markdownStyles`, and `message`. Previously each value was a separate function parameter.

## [1.2.0] 2020-08-21

**NO BREAKING CHANGES**

- Following components have been converted to functional component from class based component.

  - Chat
  - KeyboardCompatibleView
  - SuggestionsProvider
  - AutoCompleteInput
  - Spinner

- So far we exported bundled/transpiled version of components from package as single file - dist/index.js, dist/index.es using rollup. But now we are moving away from this approach and instead distributing original source of components since react-native handles bundling/transpiling part anyways. This also makes it easy for end-users to debug components exported from stream-chat-react-native.

## [1.1.1] 2020-08-03

- Fixed [#270](https://github.com/GetStream/stream-chat-react-native/issues/270) - [8ec70bd](https://github.com/GetStream/stream-chat-react-native/pull/273/commits/8ec70bdd2bae4f03c595466ba60d247c44f4c474)

- Upgraded `@testing-library/react-native` to v7 [4c687b4](https://github.com/GetStream/stream-chat-react-native/commit/4c687b48d689abb97ba00228224169d70c245076)

## [1.1.0] 2020-07-31

- Fixed exports of MessageStatus, MessageContent, MessageAvatar, MessageTextContainer components [#268](https://github.com/GetStream/stream-chat-react-native/pull/268)

- Moving following components to functional components

  - ChannelPreview
  - ChannelPreviewMessenger
  - Attachment
  - Card
  - FileAttachment
  - EmptyStateIndicator, LoadingIndicator, LoadingErrorIndicator

- Decoupled actionsheet from MessageInput component [59618ad](https://github.com/GetStream/stream-chat-react-native/commit/59618adbc238763cf7fd3d5ba3dd0304012877de)

## [1.0.0] 2020-07-29

We've already been on a v1 release for a while but never updated our versioning. Right now we're in the process of rewriting our components to be more future proof and we started using hooks, hence the v1.0.0 today.

Breaking change: stream-chat-react-native now relies on hooks and will need react-native >= 0.59.0 to work

Rewrite will involve following changes:

1. Functional components instead of class based components
2. Static typing using typescript
3. UI tests

We are going to incrementally implement these changes and will try to keep everything backwards compatible unless really necessary.

## [0.15.2] 2020-07-29

- Exporting `AutoCompleteInput` component [d41d0d5](https://github.com/GetStream/stream-chat-react-native/commit/d41d0d58ce02556cedf1825a2adb6a5c366a770c)

## [0.15.1] 2020-07-29 (Bad release)

## [0.15.0] 2020-07-27

- Upgrading @stream-io/react-native-simple-markdown to 1.2.1 [d89f012](https://github.com/GetStream/react-native-simple-markdown/commit/d89f0128e6c4f179f2afe9f9a896b289288e2afd)

  It fixes the issue with markdown where text like "#stream" was treated as heading, thus disallowing anyone to use hashtags in chat.

- Internal directory restructuring of components

## [0.14.0] 2020-07-16

- Fixing compatibility issues with react-native 0.63 [88721a0](https://github.com/GetStream/stream-chat-react-native/commit/88721a077b3bb3369c3d8dbde9451d84f6761d87)
- Updating stream-chat to 0.13.x [4af1b1d](https://github.com/GetStream/stream-chat-react-native/commit/4af1b1d63a3c7dec662f8c75426ea7a7082f26a4)

## [0.13.1] 2020-07-14

- [84ded29](https://github.com/GetStream/stream-chat-react-native/commit/84ded29bf7afd9e9e5178e76e79953d8b27dc77c) Bug fix - **Only** set active channel in ChannelList component on complete reload, which happens in following cases:

  - first load on chat
  - changes in filters

## [0.13.0] 2020-07-08

- Upgrading `@stream-io/react-native-simple-markdown` to 1.2.0. It fixes markdown related issues regarding line breaks
- Added a new prop to the MessageInput component - `sendImageAsync`. It’s value defaults to false, but when set to true, if the user hits send on a message before an attached image has finished uploading, the message text will be sent immediately and the image will be sent as a follow-up message as soon as a successful response has been received by the CDN [455571d](https://github.com/GetStream/stream-chat-react-native/commit/455571d68db5e617882b59a81e15f934f0365952)
- Fixed typescript for isMyMessage function [7d55134](https://github.com/GetStream/stream-chat-react-native/commit/7d5513479e55b014562b7d07082628f4215e4a92)

## [0.12.4] 2020-06-30

- Improving MessageInput component, to better handle the case of rapid typing [3fddf06](https://github.com/GetStream/stream-chat-react-native/commit/3fddf06426cce5a9cc8dad1e80f9dec1efb4751d)
- Fixing fallback avatar for MentionsItem component [159fcb8](https://github.com/GetStream/stream-chat-react-native/commit/159fcb856171eaa1f0e2f57f5e9442177eb10b88)

## [0.12.3 2020-06-17

- Fixing `enabled` prop on KeyboardCompatibleView

## [0.12.2] 2020-06-17

- Fixing broken file upload functionality on android [2cb26e7](https://github.com/GetStream/stream-chat-react-native/commit/2cb26e7951e2030f1c319ad82c55bf0273ef6532)

## [0.12.1] 2020-06-16

- Allow search for special characters in mentions autocomplete [a2cb083](https://github.com/GetStream/stream-chat-react-native/commit/a2cb083a3d6657b5c3a122fcd5843d0c9f51a5a6)

## [0.12.0] 2020-06-15

- **Improvements to autocomplete feature in MessageInput component**.

Until now if your channel had more than 100 members, then you couldn't see members (besides first 100) in mentions popup box. This was because queryChannels api only populates 100 members in channel state and mentions feature was based on searching for members in channel state.

From now on, autocomplete input (specifically mentions autocomplete) will be api based search. So that mentions feature will work even for the channels with more than 100 members.

## [0.11.0] 2020-06-01

**Non breaking changes**

### UX improvements of ChannelList component

  <div style="display: inline">
    <img src="./screenshots/7.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" style="margin-right: 30px" />
    <img src="./screenshots/8.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" style="margin-right: 30px" />
    <img src="./screenshots/9.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" />
  </div>

  - So far we only had `LoadingErrorIndicator` (which can be customized using prop `LoadingErrorIndicator`). This error indicator replaces the entire channel
  list on screen. So if your 2nd page of list results in error, we used to remove all the already fetched channels and show this full screen error indicator.
  Instead we have introduced following error indicators, which will be displayed at top of the list in case or error. Please note that if first page of
  queryChannels api results in error, we will display LoadingErrorIndicator

    - HeaderErrorIndicator
    - HeaderNetworkDownIndicator

  - Introducing following new props to ChannelList component

    - `FooterLoadingIndicator` {UI Component} To override default spinner at footer of channel list (introduced in this release)
    - `HeaderErrorIndicator` {UI Component} To override default HeaderErrorIndicator
    - `HeaderNetworkDownIndicator`{UI Component} To override default HeaderNetworkDownIndicator

  - Introduced pull to refresh functionality, to refresh the ChannelList in case of failure.
  - Adding following prop to `LoadingErrorIndicator`

    - `retry` {func} If you are using custom `LoadingErrorIndicator` for your ChannelList component, you can attach this function to CTA button
    to reload the ChannelList.

  - Added retry mechanism to ChannelList's queryChannels api call. In case of failure, api will be retried 3 times (max) at the interval of 2 seconds.

## [0.10.3] 2020-05-15

- Updating `stream-chat` to `1.10.1` in add [token refresh functionality](https://github.com/GetStream/stream-chat-js/blob/main/docs/userToken.md)
- Disable longPress on Image gallery [f7aacb5](https://github.com/GetStream/stream-chat-react-native/commit/f7aacb5741e85811de37d5e3b550d2be539b89a4)
- Fixing markdown issue [ac621f0](https://github.com/GetStream/stream-chat-react-native/commit/ac621f0eb1f6be7f0496b82ee425f3bc90c10839)

## [0.10.2] 2020-04-29

- Fixing crashes in KeyboardCompatibleView and better handling of AppState changes
  - https://github.com/GetStream/stream-chat-react-native/pull/193
  - [84cf8f7](https://github.com/GetStream/stream-chat-react-native/commit/84cf8f772d454b471c0e9ad81a10acd219ba6be2)

- Fixes with message component [2d21b19](https://github.com/GetStream/stream-chat-react-native/commit/2d21b19ad3856f516efcc3c0a19c52f145f7fcec)

   - Adding support for prop `additionalTouchableProps` in `MessageSimple` to allow adding additional prop to inner TouchableOpacity components
   - Same (additionalTouchableProps) prop gets forwarded to all inner components which has some touchable feedback attached such as Gallery, FileAttachment, etc

- Adding `setFlatListRef` function prop to ChannelList and MessageList to get access to ref to inner FlatList component [4c49373](https://github.com/GetStream/stream-chat-react-native/commit/4c4937334c10e71a918d360bf6c95daf74222b5b)
- Fix for threadMessages in event handler for Channel component - [17f32df](https://github.com/GetStream/stream-chat-react-native/commit/17f32df69cb06237e9c5590a3745a3d557c56b1b)
- Adding margin for very last MessageSystem [f4661d6](https://github.com/GetStream/stream-chat-react-native/commit/f4661d6ec842d6a1a797d01a5953125a7fb1f863)
- Hiding AttachButton if both `hasImagePicker` and `hasFilePicker` props are false [7de46b5](https://github.com/GetStream/stream-chat-react-native/commit/7de46b55b7f431df4d957bf9502af370c6221782)
- Fixing custom reactions [5deea55](https://github.com/GetStream/stream-chat-react-native/commit/5deea5529a0647f42e259185b547b24effc9c15f)


## [0.10.1] 2020-04-15

- Adding following theme keys [7ae43d4](https://github.com/GetStream/stream-chat-react-native/commit/7ae43d4d1788b14ee9cd7c6d0f3d6d49ac5ebdf5)
  - messageInput.suggestions.command.args
  - messageInput.suggestions.command.description

- Handling `channel.hidden` event in  `ChannelList` component
- Adding support for function prop `onChannelHide` on `ChannelList`
- Avoid breaking markRead api call if channel is disconnected [a1cfd96](https://github.com/GetStream/stream-chat-react-native/commit/a1cfd96ebfcd2859164c60a0535abe8791f826ac)
- Updating `stream-chat` version to `1.7.3`
- Fixing the error: `[Unhandled promise rejection: TypeError: mimeType.startsWith is not a function. (In 'mimeType.startsWith('image/')', 'mimeType.startsWith' is undefined)]` [451b2a4](https://github.com/GetStream/stream-chat-react-native/commit/451b2a4e19ad202f5c5f428b369301ee312e0c3f)

## [0.10.0] 2020-04-09

**All the changes are non-breaking**

- Adding support for custom UI component prop - `Input` to `MessageInput`. It allows shuffling of UI inside MessageInput

- Adding support for following UI component props to `MessageSimple`

  - UrlPreview
  - Giphy
  - FileAttachment
  - FileAttachmentGroup
  - Card
  - CardHeader
  - CardCover
  - CardFooter

- Adding support for following UI component props to `Attachment`

  - UrlPreview
  - Giphy
  - FileAttachment
  - FileAttachmentGroup
  - Card
  - CardHeader
  - CardCover
  - CardFooter

- Adding support for following UI component props to `Card`

  - Header
  - Cover
  - Footer

- Adding following theme keys:

  - `message.card.footer.title` (Text)
  - `message.card.footer.description` (Text)
  - `message.card.footer.link` (Text)
  - `message.card.footer.logo` (Image)
  - `iconSquare.container` (TouchableOpacity or View)

- Fixing typos in docs
- Updating format of message date time to `LT` from `hh:ssA`, to allow i18n
- Fixing pagination logic for ChannelList in case of duplicates

## [0.9.2] 2020-04-04

**NOTE** Please make sure to use `stream-chat@^1.7.0`

- Fixing moderator, owner, admin checks for message actions [80dfb86](https://github.com/GetStream/stream-chat-react-native/commit/80dfb86ff7f07d1eb223be0c766eef991fb438db)

## [0.9.1] 2020-04-02

- Adding support for following props on MessageInput component [c5ada59](https://github.com/GetStream/stream-chat-react-native/commit/c5ada5951a9528eaab7945bf4ed2e74b4c9724f2)

  - onChangeText
  - initialValue

## [0.9.0] 2020-04-02

- Disabling (disabling `TouchableOpacity` wrapper) `SendButton` if message is not valid (empty text and no attachments)
- Syncing this `rc` with latest master (0.8.1)
- Moving external expo dependencies to peerDependencies
- Fixing issue with MessageStatus not showing up on mount [61388c3](https://github.com/GetStream/stream-chat-react-native/commit/61388c3ac4f80cf264bda3fc3a5fed2f7ede9761)

### Prop changes to components (non-breaking)

- MessageSimple

  **new props**

  - `MessageReplies` UI component to override default `2 replies` text/component
  - `MessageHeader` UI component to add some content on top of message content (text, attachments)
  - `ReactionList` UI component to override default ReactionList component
  - `supportedReactions` Array of reactions which should be available or supported in reaction picker. [Example](https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-with-custom-reactions)

  **deprecated props**

  - `emojiDate` Please use supportedReactions instead

- MessageAvatar

  **new props**

  - `alignment` ('right' | 'left')

- MessageContent

  **new props**

  - All the new props to MessageSimple are available in MessageContent
  - `alignment` ('right' | 'left')

- ReactionPickerWrapper

  In previous version, you could open reaction picker only after clicking/pressing `ReactionList`, which made it hard to change the
  functionality of `ReactionList` without copy pasting lots of code regarding opening of `ReactionPicker`. And also ReactionPicker
  logic was tightly coupled with MessageContent component (which meant added complexity)
  With ReactionPickerWrapper, we are taking out all the ReactionPicker related logic (setting the position of reaction picker
  at message which was touched) from MessageContent. So you can now add _open reaction picker on press_ functionality
  on any component that you wish. You just need to wrap your component with `ReactionPickerWrapper` component.

  You can also adjust the relative position at which ReactionPicker opens up or shows up by altering `offset`
  prop on ReactionPickerWrapper.

  Default value is:

  ```
  {
      top: 40,
      left: 30,
      right: 10,
  }
  ```

  NOTE: This component was present in repository in previous versions as well, but it was super buggy.

  **TL;DR** Enables you to build custom ReactionList, on touch of which, ReactionPicker will open up

  Please check this example from cookbook for details - https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-bubble-with-reactions-at-bottom-of-message

- Channel

  - Update the component, when `channel` prop changes.


## [0.9.0-rc.3] 2020-04-02

- Fixing issue with MessageStatus not showing up on mount [61388c3](https://github.com/GetStream/stream-chat-react-native/commit/61388c3ac4f80cf264bda3fc3a5fed2f7ede9761)

## [0.9.0-rc.2] 2020-04-02

- Moving external expo dependencies to peerDependencies

## [0.9.0-rc.1] 2020-04-02

- Disabling (disabling `TouchableOpacity` wrapper) `SendButton` if message is not valid (empty text and no attachments)
- Syncing this `rc` with latest master (0.8.1)

## [0.8.1] 2020-04-01

- Disabling interactions with MessageList and MessageInput if channel is frozen. [2c4e1a2](https://github.com/GetStream/stream-chat-react-native/commit/2c4e1a2713825b861717e002da483c182e80213c)
- Adding missing `style` to all our component in typescript [a2ac0b4](https://github.com/GetStream/stream-chat-react-native/commit/a2ac0b44882913db065e8099bd03a7b286255d47)

## [0.9.0-rc.0] 2020-03-31

### Non-breaking changes

- MessageSimple

  **new props**

  - `MessageReplies` UI component to override default `2 replies` text/component
  - `MessageHeader` UI component to add some content on top of message content (text, attachments)
  - `ReactionList` UI component to override default ReactionList component
  - `supportedReactions` Array of reactions which should be available or supported in reaction picker. [Example](https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-with-custom-reactions)

  **deprecated props**

  - `emojiDate` Please use supportedReactions instead

- MessageAvatar

  **new props**

  - `alignment` ('right' | 'left')

- MessageContent

  **new props**

  - All the new props to MessageSimple are available in MessageContent
  - `alignment` ('right' | 'left')

- ReactionPickerWrapper

  In previous version, you could open reaction picker only after clicking/pressing `ReactionList`, which made it hard to change the
  functionality of `ReactionList` without copy pasting lots of code regarding opening of `ReactionPicker`. And also ReactionPicker
  logic was tightly coupled with MessageContent component (which meant added complexity)
  With ReactionPickerWrapper, we are taking out all the ReactionPicker related logic (setting the position of reaction picker
  at message which was touched) from MessageContent. So you can now add _open reaction picker on press_ functionality
  on any component that you wish. You just need to wrap your component with `ReactionPickerWrapper` component.

  You can also adjust the relative position at which ReactionPicker opens up or shows up by altering `offset`
  prop on ReactionPickerWrapper.

  Default value is:

  ```
  {
      top: 40,
      left: 30,
      right: 10,
  }
  ```

  NOTE: This component was present in repository in previous versions as well, but it was super buggy.

  **TL;DR** Enables you to build custom ReactionList, on touch of which, ReactionPicker will open up

  Please check this example from cookbook for details - https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-bubble-with-reactions-at-bottom-of-message

- Channel

  - Update the component, when `channel` prop changes.

## [0.8.0] 2020-03-30

- Replacing momentjs with dayjs
  - [8294baf](https://github.com/GetStream/stream-chat-react-native/commit/8294bafcdfcb6078cd8f3a18690da70aa5b93539)
  - [a81e69e](https://github.com/GetStream/stream-chat-react-native/commit/a81e69ef18d0ad8c2257a52ca3c14fb168fdc577)
  - [0a119bd](https://github.com/GetStream/stream-chat-react-native/commit/0a119bde5b9105448aa1fadc605e778099fa02ce)
- Changes to `Streami18n` constructor options:
  - **Breaking change:** replacing `momentLocaleConfigForLanguage` with `dayjsLocaleConfigForLanguage`
  - deprecating `Moment`. Instead use `DateTimeParser`
- Updating `stream-chat` to `1.6.0` [b62fa95](https://github.com/GetStream/stream-chat-react-native/commit/b62fa9542bc82192a4ffc7a9e9bf61b52155c932)
- Avoid showing empty cover if image url is empty [ddbbadb](https://github.com/GetStream/stream-chat-react-native/commit/ddbbadba8f125cca6196495ceaf5d9442afb4fdb)
- Subscribing ChannelList to `user.updated` event [7ea6110](https://github.com/GetStream/stream-chat-react-native/commit/7ea6110c0238319833033e39356b7b2055164ea2)
- Fixing channel.updated and channel.deleted event handler to not break if channel is not in list [1404860](https://github.com/GetStream/stream-chat-react-native/commit/140486018f8eecf17d2bea27bdc65f26360aa016)

## [0.7.2] 2020-03-20

- Extending style support for `TypingIndicator` component, [5874b73](https://github.com/GetStream/stream-chat-react-native/commit/5874b7368890fd1de5247b521381f3e076201fec)
- Added styling support for editing box of `MessageInput`. [2968684](https://github.com/GetStream/stream-chat-react-native/commit/2968684d459bbeeb16bf836c0de731eda5807aaf)
- Adding prop `doMarkReadRequest` to Channel component, to override markRead api call. [1afda94](https://github.com/GetStream/stream-chat-react-native/commit/1afda948360eb80a4af763111b5bb4de86744f25)
- Adding boolean prop `hideReactionCount` and `hideReactionOwners` in `MessageSimple` component. [3814266](https://github.com/GetStream/stream-chat-react-native/commit/38142667fb3290b4c81495a5a92fbfda7856bfe4)
- `MessageInput` and `MessageList` component as prop in `Thread` component. [db97289](https://github.com/GetStream/stream-chat-react-native/commit/db97289f7f79c055816cfdc6377b590076e178ee)
- Disabling keyboard listeners when app goes to background [8a372e6](https://github.com/GetStream/stream-chat-react-native/commit/8a372e62f56cdd9389d73dfc4ab5ba8d5077a37e)
- Dismiss keyboard when opening action sheet. [bb12a55](https://github.com/GetStream/stream-chat-react-native/commit/bb12a55c9125c6168289f642f10d0340ea3b3abe)
- Disable escaping in translator function. [a5118dc](https://github.com/GetStream/stream-chat-react-native/commit/a5118dc9606878242de3a2c9015a88fc6ccd7021)
- Allow moderator to edit/delete message. [44165f6](https://github.com/GetStream/stream-chat-react-native/commit/44165f677d5883ab53c908a615bbd914ccb9401b)

## [0.7.1] 2020-03-18

- Adding support for custom moment object in Streami18n class [7557c70](https://github.com/GetStream/stream-chat-react-native/commit/7557c70687181d40db3f6f0dda7ddf86c063abd5)

## [0.7.0] 2020-03-17

- Introducing internationalization (i18n) support for the sdk https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/docs/Streami18n.md

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
- Adding style and text customization to LoadingIndicator ([232241c](https://github.com/GetStream/stream-chat-react-native/commit/232241c1b84a7cf9f6729039e8e1a404e092818e))

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
- Disabling the long press on image viewer (in Attachment) - https://github.com/GetStream/stream-chat-react-native/issues/100 to avoid freezing of UI.
- Fixing broken threads issue
- Support for `additionalFlatListProps` prop in `MessageList` and `ChannelList` component
- Changing prop-type for component type props to `elementType` instead of `func`

#### stream-chat-react-native (Native package)

- Disabling the long press on image viewer (in Attachment) - https://github.com/GetStream/stream-chat-react-native/issues/100 to avoid freezing of UI.
- Fixing broken threads issue
- Support for `additionalFlatListProps` prop in `MessageList` and `ChannelList` component
- Changing prop-type for component type props to `elementType` instead of `func`

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

- Adding support for `actionSheetStyles` prop, so as to add more customization for styles of action sheet.

## [0.3.5] 2019-10-28

- Fixing some styles for action sheet in MessageSimple component.

## [0.3.4] 2019-10-03

- Avoiding query channel api call when there are no more messages to render
- Making markRead api call only if unread count is > 0

## [0.3.3] 2019-10-02

- Making empty value of `typing` object - immutable
- Adding support for `SendButton` UI component prop

## [0.3.2] 2019-10-01

- Fixing bug in themed HOC

## [0.3.1] 2019-09-30

- Adding typescript declaration file for expo and native package

## [0.3.0] 2019-09-30

- Adding typescript declaration file
- Adding style customization support for action sheet

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
- Fixing UX for image/file picker - closing keyboard when you open file/image picker action sheet

## [0.2.1] 2019-09-02

- Making sdk compatible with Expo 33 and 34

## [0.2.0] 2019-08-26

- Making sdk compatible with react native 0.60

## [0.1.19] 2019-08-26

- Updating ChannelPreviewMessenger component to show other member's name as channel title if channel has no explicate name in channel.data

## [0.1.18] 2019-08-12

- Fixing keyboard compatible view for android. Status bar height was not taken into account while calculating the height of channel after opening keyboard.

## [0.1.17] 2019-08-08

- Fixing prop to override Attachment UI component

## [0.1.16] 2019-08-07

- Attachment for URL preview were broken. Fixed.

## [0.1.15] 2019-07-18

- Adding prop function `onChannelUpdated` as callback for event `channel.updated`
- Bug fix - Channel list component doesn't update when custom data on channel is updated.
