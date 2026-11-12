# Change Log

## [5.1.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v5.0.1...sampleapp@v5.1.0) (2026-11-12)

### Features

* **ai-components:** bring the AI agent work to V10 ([#3979](https://github.com/GetStream/stream-chat-react-native/issues/3979)) ([bd5d70b](https://github.com/GetStream/stream-chat-react-native/commit/bd5d70bbda3062146e5f318b60ce5462b53065ec)), closes [#3920](https://github.com/GetStream/stream-chat-react-native/issues/3920) [#3921](https://github.com/GetStream/stream-chat-react-native/issues/3921) [#3924](https://github.com/GetStream/stream-chat-react-native/issues/3924) [#3926](https://github.com/GetStream/stream-chat-react-native/issues/3926) [#3928](https://github.com/GetStream/stream-chat-react-native/issues/3928) [#3929](https://github.com/GetStream/stream-chat-react-native/issues/3929) [#3931](https://github.com/GetStream/stream-chat-react-native/issues/3931) [#3933](https://github.com/GetStream/stream-chat-react-native/issues/3933) [#3934](https://github.com/GetStream/stream-chat-react-native/issues/3934) [#3936](https://github.com/GetStream/stream-chat-react-native/issues/3936) [#3944](https://github.com/GetStream/stream-chat-react-native/issues/3944) [#3958](https://github.com/GetStream/stream-chat-react-native/issues/3958) [#3957](https://github.com/GetStream/stream-chat-react-native/issues/3957) [#3960](https://github.com/GetStream/stream-chat-react-native/issues/3960) [#3963](https://github.com/GetStream/stream-chat-react-native/issues/3963) [#3974](https://github.com/GetStream/stream-chat-react-native/issues/3974) [#3975](https://github.com/GetStream/stream-chat-react-native/issues/3975) [#3976](https://github.com/GetStream/stream-chat-react-native/issues/3976) [#3978](https://github.com/GetStream/stream-chat-react-native/issues/3978)

## [5.0.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v5.0.0...sampleapp@v5.0.1) (2026-11-10)

### Bug Fixes

* **ReactionListClustered:** show the total reaction count per design ([#3961](https://github.com/GetStream/stream-chat-react-native/issues/3961)) ([321c6a2](https://github.com/GetStream/stream-chat-react-native/commit/321c6a2f8b7373c4b120b718c6a1e442ee913cb5))
* **SampleApp:** start new conversations the way the UI cookbook does ([#3953](https://github.com/GetStream/stream-chat-react-native/issues/3953)) ([e6ad005](https://github.com/GetStream/stream-chat-react-native/commit/e6ad005c1024a4871f0f1ea613f88501f4717175)), closes [GetStream/stream-chat-js#2007](https://github.com/GetStream/stream-chat-js/issues/2007) [GetStream/stream-chat-js#2007](https://github.com/GetStream/stream-chat-js/issues/2007) [GetStream/stream-chat-js#2007](https://github.com/GetStream/stream-chat-js/issues/2007)

## [5.0.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.16.5...sampleapp@v5.0.0) (2026-11-06)

### ⚠ BREAKING CHANGES

* for integrators who used the removed context fields,
props and exports; every one is listed with its replacement in
`ai-docs/ai-migration-v9-to-v10.md`.

It is also part 1/2 of a larger cleanup pass in SCRN, which will come in
a separate PR.

## 🛠 Implementation details

The work is split into one commit per area.

### 1. Dead code (`8d149acd5`)

- Removed code with no callers left since the v10 rewrite:
`useSelectedChannelState`, `reduceMessagesToString`,
`findInMessagesById`, `findInMessagesByDate`, `getLastReceivedMessage`,
`DebugContext`, the unused `ChannelList` hook utils, and offline-store
functions nothing called.
- Removed context fields and props that were never read or never set
(`isChannelActive`, `scrollToFirstUnreadThreshold`,
`MessagesContext.quotedMessage`, `<Channel isOnline>` and others).
- `useIsOnline` is renamed to `useConnectionLifecycle`, since it returns
nothing in v10.
- `useMutedChannels()` no longer takes an argument.
- `OfflineStoreApis` uses `userId` instead of `currentUserId`.

### 2. Message lists (`ce99291d3`)

- `MessageList` and `MessageFlashList` page the paginator they render
(the channel's, or the thread's in a thread list) and track their own
loading flags. The `loadMore` / `loadMoreRecent` / `hasMore` props are
gone.
- The logic shared by both lists moved into hooks under
`MessageList/hooks`.
- Thread lists used to drive the channel's paginator for viewing-live
state and the scroll-to-bottom jump. They now use the thread's. This
fixes the "1 new messages" separator that stuck after returning from a
thread.
- A failed page no longer leaves that edge of the list unable to
paginate.
- Removing a message no longer scrolls `MessageList` to the bottom.

### 3. `ChatContext` (`a04468e10`)

- `ChatContext` holds only `client`, `getAppSettings` and
`isMessageAIGenerated`. `channel`, `setActiveChannel`, `appSettings`,
`mutedUsers` and `enableOfflineSupport` are removed.
- The context no longer rebuilds on mute changes or on returning from
the background, so its ~65 consumers no longer re-render then.
- `getAppSettings()` follows `stream-chat-react`: it fetches once per
user, falls back to the offline database, and does not cache a failure.
- `<Chat>` follows the connected user reactively. It used to read
`client.userID` during render, so the offline database could miss a user
that connected after mount.

### 4. `<Channel>` (`0a75ced25`)

- `frozen` is read reactively, so `disabled` updates on freeze and
unfreeze.
- Contexts are keyed on the channel instance instead of its `cid`.
- `<Channel>` no longer re-renders on channel updates that leave its
capabilities unchanged, and `overrideOwnCapabilities` merges correctly.
- `typing.stop` is sent on background only if the user was typing.
- `<Channel>` keeps rendering a deleted channel, as in
`stream-chat-react`. The app decides what to show from the channel's
`pendingDisposal` state. The SampleApp does this in
`useLeaveGoneChannel`.

### 5. Composer (`5a7abceaa`)

- Sending and editing go through `messageComposer.send()` / `update()`.
The SDK's own send and edit wrappers are removed.
- `<Channel preSendMessageRequest>` is replaced by the
`sendMessageRequest` request handler.
- Failures come from `client.notifications`, mapped to the same toast
copy as before.
- The composer is resolved once in `MessageComposerProvider`. Each
`useMessageComposer()` call used to create its own subscriptions.
- An edit composer is re-initialised from the message each time. This
fixes text left over from a cancelled edit showing up in the next one.
- `SendMessageDisallowedIndicator`, the commands button and the commands
sheet follow capabilities and config that arrive after mount.
- Attachment picker cells re-render only when their own selection
changes, not on every upload progress tick.
- The moderation command rewrite (`patchMessageTextCommand`) is removed,
since the backend now resolves the target from the mentioned users.

### 6. Channel list (`5cf121467`)

- `ChannelsContext` holds the list's configuration and its
`ChannelPaginator`. The query state (`channels`, `loadingChannels`,
`refreshing`, ...) goes to `ChannelListView` as props. The memo key
built from every channel's name, unread count and member presence is
gone.
- The list's `FlatList` sets `strictMode`. Channel rows now re-render
only when their own channel changes, instead of all of them on every
list update.
- Config props (`onSelect`, `getChannelActionItems`, `maxUnreadCount`,
...) take effect when changed at runtime.
- A mounted list reloads after `disconnectUser()` once a user connects
again. It used to stay on its skeleton.
- Channel rows show drafts that only have attachments.

### 7. Thread list (`71a373a53`)

- A thread row reads its latest reply from
`thread.messagePaginator.aggregateState`, as `stream-chat-react` does.
It used to take the last reply of the loaded page, which is an older
reply once the thread has been scrolled back.

## 🎨 UI Changes

/

## 🧪 Testing
/

## ☑️ Checklist

- [ ] I have signed the [Stream
CLA](https://docs.google.com/forms/d/e/1FAIpQLScFKsKkAJI7mhCr7K9rEIOpqIDThrWxuvxnwUq2XkHyG154vQ/viewform)
(required)
- [ ] PR targets the `V10` branch
- [x] Documentation is updated (`ai-docs/ai-migration-v9-to-v10.md`,
Part P)
- [ ] New code is tested in main example apps, including all possible
scenarios
  - [ ] SampleApp iOS and Android
  - [ ] Expo iOS and Android
* adopt stream-chat's branded TimestampNS (#3822)
* **i18n:** consume the shared runtime from @stream-io/i18n (#3801)
* move to timestamps in response models
* **i18n:** adopt the shared i18n layer from stream-chat/i18n (#3777)

### Bug Fixes

* adapt to removed stream-chat-js hand-written types ([#3783](https://github.com/GetStream/stream-chat-react-native/issues/3783)) ([da80439](https://github.com/GetStream/stream-chat-react-native/commit/da80439da2d20cf888a3ac45791fb81f70e10760))
* bump llc and fix tests ([0dd7dd1](https://github.com/GetStream/stream-chat-react-native/commit/0dd7dd1a6b229df5a9dc061904117aeaea45d9ba))
* bump stream-chat-js to latest rc ([0470226](https://github.com/GetStream/stream-chat-react-native/commit/0470226fdfc41546e96a9b5f8612dfef7a8ea8eb))
* consolidate llc versions and merge master ([#3906](https://github.com/GetStream/stream-chat-react-native/issues/3906)) ([91d63e7](https://github.com/GetStream/stream-chat-react-native/commit/91d63e77deb1f138e53294d03e4f09a386b346ae))
* date null checks in sample apps ([872e4e1](https://github.com/GetStream/stream-chat-react-native/commit/872e4e185afb3719cb050b8a73164fc4f469af18))
* **deps:** bump [@stream-io](https://github.com/stream-io) toolkit packages to the .mjs/.cjs builds ([#3915](https://github.com/GetStream/stream-chat-react-native/issues/3915)) ([657fdf5](https://github.com/GetStream/stream-chat-react-native/commit/657fdf5cf6a4602846194b59eccb8c2c94fbb214)), closes [GetStream/js-toolkit#58](https://github.com/GetStream/js-toolkit/issues/58)
* docs fixes ([#3891](https://github.com/GetStream/stream-chat-react-native/issues/3891)) ([5767715](https://github.com/GetStream/stream-chat-react-native/commit/57677154690b5c2d820c9ac1f28576767dc90eee))
* guard required timestamps from the offline store ([cdc393d](https://github.com/GetStream/stream-chat-react-native/commit/cdc393d4ba7b9308f0dd606696fc9ee9cdeefa35))
* handle missing initial_build_number in Fastfile ([8c6ca1a](https://github.com/GetStream/stream-chat-react-native/commit/8c6ca1a252d0f8370c665d79bb1a81b406233dba))
* issues found by the e2e tests and rc.33 compatibility ([#3935](https://github.com/GetStream/stream-chat-react-native/issues/3935)) ([b8485aa](https://github.com/GetStream/stream-chat-react-native/commit/b8485aaa6f6e5b15191cce88d5bad3dba78bb36f))
* more review fixes ([1693793](https://github.com/GetStream/stream-chat-react-native/commit/1693793fc1d3b35d23dfb5d4fc9d55ff3711b318))
* properly update yarn.lock ([f8efba9](https://github.com/GetStream/stream-chat-react-native/commit/f8efba94a7f616fc93ac08fea410eb13c7599418))
* review fixes ([ad8dc9a](https://github.com/GetStream/stream-chat-react-native/commit/ad8dc9a61d825ceb5a17456fccf26d16a4e8d711))
* sample apps typecheck ([#3817](https://github.com/GetStream/stream-chat-react-native/issues/3817)) ([9791e0d](https://github.com/GetStream/stream-chat-react-native/commit/9791e0d61343997698ec6119d019af1ae4e91df1))
* stability and perf fixes ([#3854](https://github.com/GetStream/stream-chat-react-native/issues/3854)) ([ebfac3a](https://github.com/GetStream/stream-chat-react-native/commit/ebfac3aefeb1d10ef7e6ac5e03b8197b7316e22a))
* stream-chat rc.31 compatibility ([#3919](https://github.com/GetStream/stream-chat-react-native/issues/3919)) ([e7794a7](https://github.com/GetStream/stream-chat-react-native/commit/e7794a7816dc5f59cdf2b28d9b1cec6b77054437)), closes [GetStream/stream-chat-js#1982](https://github.com/GetStream/stream-chat-js/issues/1982) [GetStream/stream-chat-js#1985](https://github.com/GetStream/stream-chat-js/issues/1985) [GetStream/stream-chat-js#1986](https://github.com/GetStream/stream-chat-js/issues/1986) [GetStream/stream-chat-js#1987](https://github.com/GetStream/stream-chat-js/issues/1987) [GetStream/stream-chat-js#1982](https://github.com/GetStream/stream-chat-js/issues/1982) [GetStream/stream-chat-js#1986](https://github.com/GetStream/stream-chat-js/issues/1986)
* type errors in sample app ([4db36f7](https://github.com/GetStream/stream-chat-react-native/commit/4db36f7eb73f47398b34583533a747ba190e4b5e))
* unified unread count state ([6ce7903](https://github.com/GetStream/stream-chat-react-native/commit/6ce7903959a499a7b11367b8656c4c55fb729ad9))
* v10 in depth review hotfixes ([#3876](https://github.com/GetStream/stream-chat-react-native/issues/3876)) ([dc3cb90](https://github.com/GetStream/stream-chat-react-native/commit/dc3cb902e39dc5601bce626caf796a2118f8af45))
* v10 issues found in the comment cleanup ([#3885](https://github.com/GetStream/stream-chat-react-native/issues/3885)) ([a121e6e](https://github.com/GetStream/stream-chat-react-native/commit/a121e6e7fc63a78ee0928e45a5e3e13d6de2b14b)), closes [#3884](https://github.com/GetStream/stream-chat-react-native/issues/3884) [#3884](https://github.com/GetStream/stream-chat-react-native/issues/3884) [#3241](https://github.com/GetStream/stream-chat-react-native/issues/3241) [#3884](https://github.com/GetStream/stream-chat-react-native/issues/3884)
* v10 sdk regressions ([#3916](https://github.com/GetStream/stream-chat-react-native/issues/3916)) ([74884ff](https://github.com/GetStream/stream-chat-react-native/commit/74884ff553c60787de76eafe406b41dfe97f252f)), closes [GetStream/stream-chat-js#1975](https://github.com/GetStream/stream-chat-js/issues/1975)

### Features

* adopt stream-chat's branded TimestampNS ([#3822](https://github.com/GetStream/stream-chat-react-native/issues/3822)) ([23e7fdc](https://github.com/GetStream/stream-chat-react-native/commit/23e7fdc731b7ed17d9ff74b1726ca14bd009fbcd)), closes [GetStream/stream-chat-js#1884](https://github.com/GetStream/stream-chat-js/issues/1884) [GetStream/stream-chat-js#1884](https://github.com/GetStream/stream-chat-js/issues/1884) [#1881](https://github.com/GetStream/stream-chat-react-native/issues/1881)
* adopt TS generator changes ([#3836](https://github.com/GetStream/stream-chat-react-native/issues/3836)) ([e2e1d05](https://github.com/GetStream/stream-chat-react-native/commit/e2e1d05544cda2ecab43b9973100c718a200f3b2))
* bump stream-chat and introduce new hooks ([87d7d71](https://github.com/GetStream/stream-chat-react-native/commit/87d7d71ea5434a103f0c786ffc2da55258840894))
* bump stream-chat-js ([8d6314a](https://github.com/GetStream/stream-chat-react-native/commit/8d6314a59b6174d574ee85c86c72af30e2f59cf2))
* channel state migration ([#3779](https://github.com/GetStream/stream-chat-react-native/issues/3779)) ([2273037](https://github.com/GetStream/stream-chat-react-native/commit/227303748244b857bebb82aa5ce0829304006122))
* **i18n:** port the v10 English-only translation architecture ([#3776](https://github.com/GetStream/stream-chat-react-native/issues/3776)) ([1a7daa2](https://github.com/GetStream/stream-chat-react-native/commit/1a7daa2e11926c3e8e8e0c7e1cfc26b89f9513c8))
* include message action handlers ([3888d48](https://github.com/GetStream/stream-chat-react-native/commit/3888d4843a82e14136c52c15b8d05eff149b03f6))
* llc new state layer ([3e94338](https://github.com/GetStream/stream-chat-react-native/commit/3e9433837c8ad81e001d3ab7c0a493683ac3fb44))
* message pruning ([f85cb3e](https://github.com/GetStream/stream-chat-react-native/commit/f85cb3e5e64b7cce08baacbbb6b11a4fa66ac49a))
* message pruning ([e92e5d5](https://github.com/GetStream/stream-chat-react-native/commit/e92e5d5e87fd8539cd4dd3eca886fea33e4ffcbc))
* migrate to instance configuration api ([#3784](https://github.com/GetStream/stream-chat-react-native/issues/3784)) ([33aa520](https://github.com/GetStream/stream-chat-react-native/commit/33aa5202142235f74a5e52804eb6e00260ebfaef))
* move to timestamps in response models ([1ccd442](https://github.com/GetStream/stream-chat-react-native/commit/1ccd442c3cdf7dab4b0d9d8b9a5632efe5e4415c))
* network observer ([#3808](https://github.com/GetStream/stream-chat-react-native/issues/3808)) ([d0da7b6](https://github.com/GetStream/stream-chat-react-native/commit/d0da7b63e5bfc25d2afdc6c0a08a95430e8849ab))
* openapi migration ([#3749](https://github.com/GetStream/stream-chat-react-native/issues/3749)) ([b7cee73](https://github.com/GetStream/stream-chat-react-native/commit/b7cee731292811dc162947a67d25a30d05e9aefd))
* paginator refactor compatibility ([#3888](https://github.com/GetStream/stream-chat-react-native/issues/3888)) ([b94f396](https://github.com/GetStream/stream-chat-react-native/commit/b94f39698701a5690b78b44d0ac45c203674aad3)), closes [stream-chat-js#1926](https://github.com/GetStream/stream-chat-js/issues/1926)
* port the client config instance changes to scrn ([#3855](https://github.com/GetStream/stream-chat-react-native/issues/3855)) ([7e79dc9](https://github.com/GetStream/stream-chat-react-native/commit/7e79dc95603204090e13d9af0d221e14f19b6583))
* remove deprecated channel storage for messages ([#3738](https://github.com/GetStream/stream-chat-react-native/issues/3738)) ([ea334af](https://github.com/GetStream/stream-chat-react-native/commit/ea334afc0a40019f2b272b3dc3bb4a40aeacf896))
* **sampleapp:** use token provider in sample app instead of static t… ([#3834](https://github.com/GetStream/stream-chat-react-native/issues/3834)) ([9485da2](https://github.com/GetStream/stream-chat-react-native/commit/9485da2237e8cb59051892a0bdf4619609fd2e22))
* stream-chat-react-native v10 ([30529ad](https://github.com/GetStream/stream-chat-react-native/commit/30529ad8f9ae1b51bd708d06248a0fed85021096))
* thread paginator ([#3832](https://github.com/GetStream/stream-chat-react-native/issues/3832)) ([98b153b](https://github.com/GetStream/stream-chat-react-native/commit/98b153b81390e14edb804c6ac5c02fe5bbf89d5e))
* UI sdk state cleanup in favor of llc ([#3848](https://github.com/GetStream/stream-chat-react-native/issues/3848)) ([d1a29fe](https://github.com/GetStream/stream-chat-react-native/commit/d1a29fef008756e5c69f7b8e199f96c901d424be))
* update stream-chat-js version ([f52c910](https://github.com/GetStream/stream-chat-react-native/commit/f52c91006a07f10abb6902880ab40bd8cf9700ce))
* v10 channel store migration ([#3847](https://github.com/GetStream/stream-chat-react-native/issues/3847)) ([ba3c336](https://github.com/GetStream/stream-chat-react-native/commit/ba3c336679e99b30a7efc4cf2d2c45c489de813b))

### Chores

* **deps:** bump stream-chat to 10.0.0 ([#3951](https://github.com/GetStream/stream-chat-react-native/issues/3951)) ([211725a](https://github.com/GetStream/stream-chat-react-native/commit/211725aeea2f928759625a370b857b761f963396))

### Refactors

* clean up channel hoc ([#3820](https://github.com/GetStream/stream-chat-react-native/issues/3820)) ([7b1dd48](https://github.com/GetStream/stream-chat-react-native/commit/7b1dd483fc6c793a4cc46e015684219cd8d31d79))
* delivery receipts v10 ([#3823](https://github.com/GetStream/stream-chat-react-native/issues/3823)) ([0f1c3c9](https://github.com/GetStream/stream-chat-react-native/commit/0f1c3c9e1373714c16ce8cb3c172c57769dfab8e)), closes [#1883](https://github.com/GetStream/stream-chat-react-native/issues/1883) [#1881](https://github.com/GetStream/stream-chat-react-native/issues/1881) [#1882](https://github.com/GetStream/stream-chat-react-native/issues/1882)
* **i18n:** adopt the shared i18n layer from stream-chat/i18n ([#3777](https://github.com/GetStream/stream-chat-react-native/issues/3777)) ([99b8a94](https://github.com/GetStream/stream-chat-react-native/commit/99b8a947e8cdbedbb33d8ade9679f356ee3628d0)), closes [#3776](https://github.com/GetStream/stream-chat-react-native/issues/3776)
* **i18n:** consume the shared runtime from @stream-io/i18n ([#3801](https://github.com/GetStream/stream-chat-react-native/issues/3801)) ([c5e848b](https://github.com/GetStream/stream-chat-react-native/commit/c5e848bdf9f87166619ae8cfff43fb4845108e5b))
* miscellaneous cleanup v10 ([#3852](https://github.com/GetStream/stream-chat-react-native/issues/3852)) ([ee238ad](https://github.com/GetStream/stream-chat-react-native/commit/ee238ad8e20ccbad3eba6d0b6b430004370fc352))
* separate thread from channel hoc ([#3867](https://github.com/GetStream/stream-chat-react-native/issues/3867)) ([c5b82ac](https://github.com/GetStream/stream-chat-react-native/commit/c5b82acb63664ada5a0989558eb564462d99502e))
* stop creating sdk paginator ([#3869](https://github.com/GetStream/stream-chat-react-native/issues/3869)) ([2b3c00c](https://github.com/GetStream/stream-chat-react-native/commit/2b3c00ce8df73b90a765c6533f3f7ae5f95c1d88))
* thread instance propagation ([#3861](https://github.com/GetStream/stream-chat-react-native/issues/3861)) ([43758fc](https://github.com/GetStream/stream-chat-react-native/commit/43758fcb98ad92c30b5cf6d57675ac843a5c3078))

## [4.16.5](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.16.4...sampleapp@v4.16.5) (2026-11-06)

### Bug Fixes

* bump stream-chat-js before v10 ([#3945](https://github.com/GetStream/stream-chat-react-native/issues/3945)) ([23327da](https://github.com/GetStream/stream-chat-react-native/commit/23327da97420a47e6c6b12023b7445ab19eb7276))
* bump stream-chat-js before v10 ([#3945](https://github.com/GetStream/stream-chat-react-native/issues/3945)) ([9e1bf45](https://github.com/GetStream/stream-chat-react-native/commit/9e1bf454b8df81ebff05fee62fd97f0a13a10817))

## [4.16.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.16.3...sampleapp@v4.16.4) (2026-10-29)

### Bug Fixes

* offline message limit pagination ([#3907](https://github.com/GetStream/stream-chat-react-native/issues/3907)) ([59528b7](https://github.com/GetStream/stream-chat-react-native/commit/59528b707ce332c99c7002767ef7ae01fa203beb))
* token provider rejection during reconnect ([#3913](https://github.com/GetStream/stream-chat-react-native/issues/3913)) ([07e1b0e](https://github.com/GetStream/stream-chat-react-native/commit/07e1b0edf04926b3fdc4df74328e70104cb1d2f7)), closes [GetStream/stream-chat-js#1962](https://github.com/GetStream/stream-chat-js/issues/1962)

## [4.16.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.16.2...sampleapp@v4.16.3) (2026-10-28)

### Bug Fixes

* bump stream-chat to 9.54.2 ([fc6b6e6](https://github.com/GetStream/stream-chat-react-native/commit/fc6b6e647fd85d9a052547ecec35ecd9d67b8bef))
* bump stream-chat to 9.54.2 ([a6bb08f](https://github.com/GetStream/stream-chat-react-native/commit/a6bb08f4d8b745e4b1bcccfb67ae340a3112a3e2))

## [4.16.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.16.1...sampleapp@v4.16.2) (2026-10-27)

### Bug Fixes

* bump to latest rngh ([#3878](https://github.com/GetStream/stream-chat-react-native/issues/3878)) ([ad4e646](https://github.com/GetStream/stream-chat-react-native/commit/ad4e6466b684ee88510a34c367d05398f05b3acc))
* onerror ws lifecycle handling ([#3893](https://github.com/GetStream/stream-chat-react-native/issues/3893)) ([61922d7](https://github.com/GetStream/stream-chat-react-native/commit/61922d7335df20c51350d9fbaac364ab985514d9))

## [4.16.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.16.0...sampleapp@v4.16.1) (2026-10-19)

### Refactors

* rn 0.88 and expo 58 upgrade ([#3864](https://github.com/GetStream/stream-chat-react-native/issues/3864)) ([42662cd](https://github.com/GetStream/stream-chat-react-native/commit/42662cdb1fce74776a534204e75ca36b5d9b7360))

## [4.16.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.15.3...sampleapp@v4.16.0) (2026-10-14)

### Features

* ai-components-js port ([#3856](https://github.com/GetStream/stream-chat-react-native/issues/3856)) ([0e8d49a](https://github.com/GetStream/stream-chat-react-native/commit/0e8d49af8993d2f2dc3ea3e5d2858217e0888317))

## [4.15.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.15.2...sampleapp@v4.15.3) (2026-10-08)

### Bug Fixes

* bump flashlist in sample apps ([#3839](https://github.com/GetStream/stream-chat-react-native/issues/3839)) ([0285023](https://github.com/GetStream/stream-chat-react-native/commit/02850238f01bd0b28bc4c45c174f8c13563c7b6e))
* bump java runner to 21 ([#3841](https://github.com/GetStream/stream-chat-react-native/issues/3841)) ([0ab5ecb](https://github.com/GetStream/stream-chat-react-native/commit/0ab5ecbae06681ca9b93d23621046e7b08b7ef6b))
* widen endPoll type ([#3833](https://github.com/GetStream/stream-chat-react-native/issues/3833)) ([d12f687](https://github.com/GetStream/stream-chat-react-native/commit/d12f6876fe7be12d452d844d16793a81869e6f87))

## [4.15.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.15.1...sampleapp@v4.15.2) (2026-09-25)

### Bug Fixes

* iPhone Duo / iOS 27 resizable-window readiness ([#3818](https://github.com/GetStream/stream-chat-react-native/issues/3818)) ([c51967a](https://github.com/GetStream/stream-chat-react-native/commit/c51967a5aa43d8fbd60cf1d4a826262b4df65685))

## [4.15.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.15.0...sampleapp@v4.15.1) (2026-08-27)

### Refactors

* rn 0.87 compatibility ([#3786](https://github.com/GetStream/stream-chat-react-native/issues/3786)) ([a72b6b3](https://github.com/GetStream/stream-chat-react-native/commit/a72b6b35a974019e4496b44d3b9339a37e12b6c8))

## [4.15.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.7...sampleapp@v4.15.0) (2026-08-20)

### Features

* offline db encryption ([#3780](https://github.com/GetStream/stream-chat-react-native/issues/3780)) ([111e21a](https://github.com/GetStream/stream-chat-react-native/commit/111e21a94de0cedfb9ef535105d2885b976095c4))

## [4.14.7](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.6...sampleapp@v4.14.7) (2026-08-14)

### Performance Improvements

* introduce offline sync event limit ([#3773](https://github.com/GetStream/stream-chat-react-native/issues/3773)) ([3e56a09](https://github.com/GetStream/stream-chat-react-native/commit/3e56a09bd7acef8b4acbd0c1b69dd4f001697da5))

### Reverts

* Revert "chore: bump stream-chat-js" ([251eb79](https://github.com/GetStream/stream-chat-react-native/commit/251eb79067968f10d9b2f7d46f1dbf0be7b06287))
* Revert "perf: sync event count" ([eb1022e](https://github.com/GetStream/stream-chat-react-native/commit/eb1022e2550f53dd30ab0185daf53504deaa896f))

## [4.14.6](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.5...sampleapp@v4.14.6) (2026-08-10)

### Bug Fixes

* recover db gracefully on errors ([#3764](https://github.com/GetStream/stream-chat-react-native/issues/3764)) ([e8c917c](https://github.com/GetStream/stream-chat-react-native/commit/e8c917c05a0567a9b0d3f60e5e7c5e9763d948b4))

## [4.14.5](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.4...sampleapp@v4.14.5) (2026-08-06)

### Bug Fixes

* bump nitro-sound to latest on SampleApp ([#3757](https://github.com/GetStream/stream-chat-react-native/issues/3757)) ([f9848f5](https://github.com/GetStream/stream-chat-react-native/commit/f9848f53300abbe3007a37e2bb3f336afed34811))
* expo clipboard and extend with cb api ([#3758](https://github.com/GetStream/stream-chat-react-native/issues/3758)) ([2534581](https://github.com/GetStream/stream-chat-react-native/commit/253458114aa1bd23b17ad3a920813ce6149e6388))

## [4.14.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.3...sampleapp@v4.14.4) (2026-07-31)

### Bug Fixes

* bump rn version to fix hermes memory regression ([#3744](https://github.com/GetStream/stream-chat-react-native/issues/3744)) ([eb23562](https://github.com/GetStream/stream-chat-react-native/commit/eb235621aca68a5608831b5511de9c6958f15f00))
* segmented reactions on press ([#3746](https://github.com/GetStream/stream-chat-react-native/issues/3746)) ([d8d8a1c](https://github.com/GetStream/stream-chat-react-native/commit/d8d8a1cf69891e951964790e72c54c3710c34388))

## [4.14.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.2...sampleapp@v4.14.3) (2026-07-23)

## [4.14.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.1...sampleapp@v4.14.2) (2026-07-17)

## [4.14.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.14.0...sampleapp@v4.14.1) (2026-07-09)

### Bug Fixes

* keyboard jump on samsung non edge-to-edge devices ([#3718](https://github.com/GetStream/stream-chat-react-native/issues/3718)) ([07e5554](https://github.com/GetStream/stream-chat-react-native/commit/07e555400a15fd2ac6ae057e00a417f94c03b47f))
* orientation awareness in bottom sheet ([#3711](https://github.com/GetStream/stream-chat-react-native/issues/3711)) ([372255a](https://github.com/GetStream/stream-chat-react-native/commit/372255a1fea86b2c68eba64d6402f030dc055faf))
* thread_manager reload before activation ([#3720](https://github.com/GetStream/stream-chat-react-native/issues/3720)) ([2ff90d5](https://github.com/GetStream/stream-chat-react-native/commit/2ff90d518a2d6cb2f961bbb8b2c4f0853da80f23))

## [4.1.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v4.0.0...sampleapp@v4.1.0) (2025-07-09)


### Features

* add reminders implementation ([#3141](https://github.com/GetStream/stream-chat-react-native/issues/3141)) ([11c3307](https://github.com/GetStream/stream-chat-react-native/commit/11c33075954be074a702ac84a96c83b6e299b9b5))


### Bug Fixes

* remove erroneous unread indicator from drafts tab ([59a32ee](https://github.com/GetStream/stream-chat-react-native/commit/59a32eed16b2751605bfa1be850f4e42046837a2))

## [4.0.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v3.1.3...sampleapp@v4.0.0) (2025-06-26)


### ⚠ BREAKING CHANGES

* V7 release candidate

* chore: add rc channel

* fix: typo in branch name
* Release V7

* chore: remove dryRun

* chore: bump stream-chat version to latest rc

* chore: bump stream-chat to latest

### Features

* v8 ([#3137](https://github.com/GetStream/stream-chat-react-native/issues/3137)) ([c8b8b71](https://github.com/GetStream/stream-chat-react-native/commit/c8b8b716634f34dfa883cc878596143626294520)), closes [#3085](https://github.com/GetStream/stream-chat-react-native/issues/3085) [#2993](https://github.com/GetStream/stream-chat-react-native/issues/2993) [#3000](https://github.com/GetStream/stream-chat-react-native/issues/3000) [#3005](https://github.com/GetStream/stream-chat-react-native/issues/3005) [#3010](https://github.com/GetStream/stream-chat-react-native/issues/3010) [#3050](https://github.com/GetStream/stream-chat-react-native/issues/3050) [#3061](https://github.com/GetStream/stream-chat-react-native/issues/3061) [#3073](https://github.com/GetStream/stream-chat-react-native/issues/3073) [#3072](https://github.com/GetStream/stream-chat-react-native/issues/3072)

### [3.1.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v3.1.2...sampleapp@v3.1.3) (2025-06-26)


### Bug Fixes

* android 35 keyboard issues ([#3134](https://github.com/GetStream/stream-chat-react-native/issues/3134)) ([241d1db](https://github.com/GetStream/stream-chat-react-native/commit/241d1db886fb85b5397f1ebde2e8d7a76c85abeb))

### [3.1.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v3.1.1...sampleapp@v3.1.2) (2025-06-23)


### Bug Fixes

* sample app crash on start ([#3128](https://github.com/GetStream/stream-chat-react-native/issues/3128)) ([971087d](https://github.com/GetStream/stream-chat-react-native/commit/971087d0f81a33c8503853ad1a34cff8c3822fec))

### [3.1.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v3.1.0...sampleapp@v3.1.1) (2025-05-30)


### Bug Fixes

* bump stream-chat version as a fix for type issues ([#3106](https://github.com/GetStream/stream-chat-react-native/issues/3106)) ([efd080a](https://github.com/GetStream/stream-chat-react-native/commit/efd080a6cd80d91fed6e05cc3c94d9db7f8bd7f7))

## [3.1.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v3.0.1...sampleapp@v3.1.0) (2025-05-27)


### Features

* offline support v2 ([#3096](https://github.com/GetStream/stream-chat-react-native/issues/3096)) ([055199d](https://github.com/GetStream/stream-chat-react-native/commit/055199d3f9c342b94620de6163b944fecbc7315d)), closes [#2993](https://github.com/GetStream/stream-chat-react-native/issues/2993) [#3000](https://github.com/GetStream/stream-chat-react-native/issues/3000) [#3010](https://github.com/GetStream/stream-chat-react-native/issues/3010) [#3050](https://github.com/GetStream/stream-chat-react-native/issues/3050) [#3061](https://github.com/GetStream/stream-chat-react-native/issues/3061) [#3073](https://github.com/GetStream/stream-chat-react-native/issues/3073) [#3072](https://github.com/GetStream/stream-chat-react-native/issues/3072)

### [3.0.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v3.0.0...sampleapp@v3.0.1) (2025-05-23)


### Bug Fixes

* issue with animating giphy on android with latest RN version ([#3092](https://github.com/GetStream/stream-chat-react-native/issues/3092)) ([184ce7a](https://github.com/GetStream/stream-chat-react-native/commit/184ce7a40e8911aac6f3db2035788ab5a94ecb48))

## [3.0.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.5.3...sampleapp@v3.0.0) (2025-05-06)


### ⚠ BREAKING CHANGES

* V7 release candidate

* chore: add rc channel

* fix: typo in branch name
* Release V7

* chore: remove dryRun

* chore: bump stream-chat version to latest rc

* chore: bump stream-chat to latest

### Features

* V7 ([#2999](https://github.com/GetStream/stream-chat-react-native/issues/2999)) ([e2a01e9](https://github.com/GetStream/stream-chat-react-native/commit/e2a01e9375267b97a7b552055edaf4548c9ef551)), closes [#2993](https://github.com/GetStream/stream-chat-react-native/issues/2993) [#3000](https://github.com/GetStream/stream-chat-react-native/issues/3000) [#3005](https://github.com/GetStream/stream-chat-react-native/issues/3005) [#3010](https://github.com/GetStream/stream-chat-react-native/issues/3010) [#3050](https://github.com/GetStream/stream-chat-react-native/issues/3050) [#3061](https://github.com/GetStream/stream-chat-react-native/issues/3061) [#3073](https://github.com/GetStream/stream-chat-react-native/issues/3073) [#3072](https://github.com/GetStream/stream-chat-react-native/issues/3072)

### [2.5.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.5.2...sampleapp@v2.5.3) (2025-04-30)


### Bug Fixes

* thread messages updates ([#3069](https://github.com/GetStream/stream-chat-react-native/issues/3069)) ([9705d90](https://github.com/GetStream/stream-chat-react-native/commit/9705d90fbfbf60f7c0f791795e240dd40cd85eab))

### [2.5.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.5.1...sampleapp@v2.5.2) (2025-04-22)


### Performance Improvements

* message list performance ([#3060](https://github.com/GetStream/stream-chat-react-native/issues/3060)) ([8b2d7e3](https://github.com/GetStream/stream-chat-react-native/commit/8b2d7e31e57acd497726876b56b4350065bb3c2d))

### [2.5.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.5.0...sampleapp@v2.5.1) (2025-03-13)


### Bug Fixes

* add theme for different group styles in message bubble container ([#3019](https://github.com/GetStream/stream-chat-react-native/issues/3019)) ([b911ef5](https://github.com/GetStream/stream-chat-react-native/commit/b911ef5f4ba5680e81d5c3ef7c1ddf6f108608d2))
* remove scrollToFirstUnreadThreshold ([#3012](https://github.com/GetStream/stream-chat-react-native/issues/3012)) ([c423453](https://github.com/GetStream/stream-chat-react-native/commit/c423453a385591397bf6afae97e7c9366a87f734))

## [2.5.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.4.1...sampleapp@v2.5.0) (2025-03-03)


### Features

* add the ability to override pn provider names ([#2981](https://github.com/GetStream/stream-chat-react-native/issues/2981)) ([922b693](https://github.com/GetStream/stream-chat-react-native/commit/922b6938d688b47037cacf5a55cec678087b38df))


### Bug Fixes

* bump dependencies, add new user agent functionality ([#2987](https://github.com/GetStream/stream-chat-react-native/issues/2987)) ([a6449a1](https://github.com/GetStream/stream-chat-react-native/commit/a6449a1b82788cfbe4e871980a4e68736b58561c))
* bump stream-chat for user agent hotfix ([#2988](https://github.com/GetStream/stream-chat-react-native/issues/2988)) ([7ef7eac](https://github.com/GetStream/stream-chat-react-native/commit/7ef7eacd08b648fe706e77a0d7bfe11419a7ff29))
* make android provide overrides for firebase ([#2982](https://github.com/GetStream/stream-chat-react-native/issues/2982)) ([e41f73a](https://github.com/GetStream/stream-chat-react-native/commit/e41f73a89edbd766c2bbe0ec49a5ff1c3ee713ce))
* pn integration changes for new pn update ([#2984](https://github.com/GetStream/stream-chat-react-native/issues/2984)) ([a058ab7](https://github.com/GetStream/stream-chat-react-native/commit/a058ab7a8e9a5882a6ae03f395893bf68fa91339))

### [2.4.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.4.0...sampleapp@v2.4.1) (2025-02-25)


### Bug Fixes

* duplicate android pns ([#2978](https://github.com/GetStream/stream-chat-react-native/issues/2978)) ([3a09f1d](https://github.com/GetStream/stream-chat-react-native/commit/3a09f1d78838d6d54e2c02ebcd94703cd5f93a77))

## [2.4.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.3.1...sampleapp@v2.4.0) (2025-02-13)


### Features

* reactive channel list poc ([#2924](https://github.com/GetStream/stream-chat-react-native/issues/2924)) ([34530c2](https://github.com/GetStream/stream-chat-react-native/commit/34530c2652ef56f4383cbfbfefc2f568783a3e4d))


### Bug Fixes

* android push notification permission issues ([#2947](https://github.com/GetStream/stream-chat-react-native/issues/2947)) ([2cd490e](https://github.com/GetStream/stream-chat-react-native/commit/2cd490ebe205e64b28a3c6c1406523d6e15db64e))

### [2.3.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.3.0...sampleapp@v2.3.1) (2025-01-30)


### Bug Fixes

* bump stream-chat-js version for poll state invalidation bug ([#2918](https://github.com/GetStream/stream-chat-react-native/issues/2918)) ([555fb68](https://github.com/GetStream/stream-chat-react-native/commit/555fb68db55a787c605103bdf07a9e7eadc18394))

## [2.3.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.2.0...sampleapp@v2.3.0) (2025-01-29)


### Features

* channel pinning and archiving ([#2866](https://github.com/GetStream/stream-chat-react-native/issues/2866)) ([9cf8832](https://github.com/GetStream/stream-chat-react-native/commit/9cf88327eb7274af1f0e5a11f3f06f02c9efb33c))


### Bug Fixes

* archive icon name and export, swipeable usage in sample app ([#2913](https://github.com/GetStream/stream-chat-react-native/issues/2913)) ([6657138](https://github.com/GetStream/stream-chat-react-native/commit/66571384668fb9921b51ac1b8948b1f0cad1910e))

## [2.2.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.1.0...sampleapp@v2.2.0) (2025-01-27)


### Features

* enable swipe to reply for message bubble ([#2892](https://github.com/GetStream/stream-chat-react-native/issues/2892)) ([9c37c25](https://github.com/GetStream/stream-chat-react-native/commit/9c37c253f602892fb6b58c90ce2d92764620e174))


### Bug Fixes

* add latest version >11.2.6 compatibility for op-sqlite ([#2899](https://github.com/GetStream/stream-chat-react-native/issues/2899)) ([d69b2f6](https://github.com/GetStream/stream-chat-react-native/commit/d69b2f674ccc05302e275794bd2599289938f1ca))

## [2.1.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.0.1...sampleapp@v2.1.0) (2024-12-24)


### Features

* mark as unread and mark as read improvements ([#2833](https://github.com/GetStream/stream-chat-react-native/issues/2833)) ([672e060](https://github.com/GetStream/stream-chat-react-native/commit/672e0609d3e21ae6616fe388ce127630087927b9)), closes [#2538](https://github.com/GetStream/stream-chat-react-native/issues/2538) [#2537](https://github.com/GetStream/stream-chat-react-native/issues/2537) [#2539](https://github.com/GetStream/stream-chat-react-native/issues/2539) [#2537](https://github.com/GetStream/stream-chat-react-native/issues/2537) [#2527](https://github.com/GetStream/stream-chat-react-native/issues/2527) [#2534](https://github.com/GetStream/stream-chat-react-native/issues/2534) [#2563](https://github.com/GetStream/stream-chat-react-native/issues/2563) [#2561](https://github.com/GetStream/stream-chat-react-native/issues/2561) [#2541](https://github.com/GetStream/stream-chat-react-native/issues/2541) [#2578](https://github.com/GetStream/stream-chat-react-native/issues/2578) [#2621](https://github.com/GetStream/stream-chat-react-native/issues/2621) [#2627](https://github.com/GetStream/stream-chat-react-native/issues/2627) [#2633](https://github.com/GetStream/stream-chat-react-native/issues/2633) [#2682](https://github.com/GetStream/stream-chat-react-native/issues/2682) [#2646](https://github.com/GetStream/stream-chat-react-native/issues/2646) [#2648](https://github.com/GetStream/stream-chat-react-native/issues/2648) [#2651](https://github.com/GetStream/stream-chat-react-native/issues/2651) [#2649](https://github.com/GetStream/stream-chat-react-native/issues/2649) [#2654](https://github.com/GetStream/stream-chat-react-native/issues/2654) [#2656](https://github.com/GetStream/stream-chat-react-native/issues/2656) [#2657](https://github.com/GetStream/stream-chat-react-native/issues/2657) [#2653](https://github.com/GetStream/stream-chat-react-native/issues/2653) [#2659](https://github.com/GetStream/stream-chat-react-native/issues/2659)
* mark as unread and mark as read improvements ([#2833](https://github.com/GetStream/stream-chat-react-native/issues/2833)) ([bba1505](https://github.com/GetStream/stream-chat-react-native/commit/bba1505c4d64d22209fa78e161e91b44685c15f4)), closes [#2538](https://github.com/GetStream/stream-chat-react-native/issues/2538) [#2537](https://github.com/GetStream/stream-chat-react-native/issues/2537) [#2539](https://github.com/GetStream/stream-chat-react-native/issues/2539) [#2537](https://github.com/GetStream/stream-chat-react-native/issues/2537) [#2527](https://github.com/GetStream/stream-chat-react-native/issues/2527) [#2534](https://github.com/GetStream/stream-chat-react-native/issues/2534) [#2563](https://github.com/GetStream/stream-chat-react-native/issues/2563) [#2561](https://github.com/GetStream/stream-chat-react-native/issues/2561) [#2541](https://github.com/GetStream/stream-chat-react-native/issues/2541) [#2578](https://github.com/GetStream/stream-chat-react-native/issues/2578) [#2621](https://github.com/GetStream/stream-chat-react-native/issues/2621) [#2627](https://github.com/GetStream/stream-chat-react-native/issues/2627) [#2633](https://github.com/GetStream/stream-chat-react-native/issues/2633) [#2682](https://github.com/GetStream/stream-chat-react-native/issues/2682) [#2646](https://github.com/GetStream/stream-chat-react-native/issues/2646) [#2648](https://github.com/GetStream/stream-chat-react-native/issues/2648) [#2651](https://github.com/GetStream/stream-chat-react-native/issues/2651) [#2649](https://github.com/GetStream/stream-chat-react-native/issues/2649) [#2654](https://github.com/GetStream/stream-chat-react-native/issues/2654) [#2656](https://github.com/GetStream/stream-chat-react-native/issues/2656) [#2657](https://github.com/GetStream/stream-chat-react-native/issues/2657) [#2653](https://github.com/GetStream/stream-chat-react-native/issues/2653) [#2659](https://github.com/GetStream/stream-chat-react-native/issues/2659)

### [2.0.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v2.0.0...sampleapp@v2.0.1) (2024-12-19)


### Bug Fixes

* image gallery safe area ([#2855](https://github.com/GetStream/stream-chat-react-native/issues/2855)) ([5825685](https://github.com/GetStream/stream-chat-react-native/commit/5825685179f7803007da5eac530e06caf513ec1f))
* ios push notifications on sample app ([#2856](https://github.com/GetStream/stream-chat-react-native/issues/2856)) ([d607132](https://github.com/GetStream/stream-chat-react-native/commit/d6071326903ec524914fb2a2319dda56ee9a9460))
* sample app ui bugs ([#2854](https://github.com/GetStream/stream-chat-react-native/issues/2854)) ([851237c](https://github.com/GetStream/stream-chat-react-native/commit/851237c5ba17789722a3898265ae8ef5566025b4))

## [2.0.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.33.2...sampleapp@v2.0.0) (2024-12-12)


### ⚠ BREAKING CHANGES

* v6 release

### Features

* V6.0.0 ([#2844](https://github.com/GetStream/stream-chat-react-native/issues/2844)) ([8701379](https://github.com/GetStream/stream-chat-react-native/commit/87013795f795ae0428dabae9a2ce18562e674fdc)), closes [#2538](https://github.com/GetStream/stream-chat-react-native/issues/2538) [#2537](https://github.com/GetStream/stream-chat-react-native/issues/2537) [#2539](https://github.com/GetStream/stream-chat-react-native/issues/2539) [#2537](https://github.com/GetStream/stream-chat-react-native/issues/2537) [#2527](https://github.com/GetStream/stream-chat-react-native/issues/2527) [#2534](https://github.com/GetStream/stream-chat-react-native/issues/2534) [#2563](https://github.com/GetStream/stream-chat-react-native/issues/2563) [#2561](https://github.com/GetStream/stream-chat-react-native/issues/2561) [#2541](https://github.com/GetStream/stream-chat-react-native/issues/2541) [#2578](https://github.com/GetStream/stream-chat-react-native/issues/2578) [#2621](https://github.com/GetStream/stream-chat-react-native/issues/2621) [#2627](https://github.com/GetStream/stream-chat-react-native/issues/2627) [#2633](https://github.com/GetStream/stream-chat-react-native/issues/2633) [#2682](https://github.com/GetStream/stream-chat-react-native/issues/2682) [#2646](https://github.com/GetStream/stream-chat-react-native/issues/2646) [#2648](https://github.com/GetStream/stream-chat-react-native/issues/2648) [#2651](https://github.com/GetStream/stream-chat-react-native/issues/2651) [#2649](https://github.com/GetStream/stream-chat-react-native/issues/2649) [#2654](https://github.com/GetStream/stream-chat-react-native/issues/2654) [#2656](https://github.com/GetStream/stream-chat-react-native/issues/2656) [#2657](https://github.com/GetStream/stream-chat-react-native/issues/2657) [#2653](https://github.com/GetStream/stream-chat-react-native/issues/2653) [#2659](https://github.com/GetStream/stream-chat-react-native/issues/2659)

### [1.33.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.33.1...sampleapp@v1.33.2) (2024-12-10)


### Workspaces

* Following linked packages updated: [stream-chat-react-native]

### [1.33.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.33.0...sampleapp@v1.33.1) (2024-12-05)


### Bug Fixes

* add factory fn to determine whether a msg is ai generated ([#2829](https://github.com/GetStream/stream-chat-react-native/issues/2829)) ([79542d8](https://github.com/GetStream/stream-chat-react-native/commit/79542d82e363b7fb5d8596d90e47da2ed391ff8e))


### Workspaces

* Following linked packages updated: [stream-chat-react-native]

## [1.33.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.32.2...sampleapp@v1.33.0) (2024-12-04)


### Features

* ai chat bot poc ([#2822](https://github.com/GetStream/stream-chat-react-native/issues/2822)) ([4fbc2f4](https://github.com/GetStream/stream-chat-react-native/commit/4fbc2f468a309c9e2fdf5b7145b04a2c03b961b5)), closes [#2819](https://github.com/GetStream/stream-chat-react-native/issues/2819)


### Bug Fixes

* show loading indicator instead of returning null from the Chat component when DB not initialized ([#2820](https://github.com/GetStream/stream-chat-react-native/issues/2820)) ([6d5a51b](https://github.com/GetStream/stream-chat-react-native/commit/6d5a51b01bbf2fee71a1ba28ebb00c568dfc67c6))


### Workspaces

* Following linked packages updated: [stream-chat-react-native]

### [1.32.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.32.1...sampleapp@v1.32.2) (2024-11-28)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.32.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.32.0...sampleapp@v1.32.1) (2024-11-22)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.32.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.8...sampleapp@v1.32.0) (2024-11-20)

### Features

- add support for membership customization ([#2802](https://github.com/GetStream/stream-chat-react-native/issues/2802)) ([376ac7d](https://github.com/GetStream/stream-chat-react-native/commit/376ac7d5bd5a5c34080b2272601300633b3412f1))
- moderation v2 support ([#2801](https://github.com/GetStream/stream-chat-react-native/issues/2801)) ([9c55bd5](https://github.com/GetStream/stream-chat-react-native/commit/9c55bd543215a6c615b3e088238154bba34a958f))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.8](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.7...sampleapp@v1.31.8) (2024-11-19)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.7](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.6...sampleapp@v1.31.7) (2024-11-15)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.6](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.5...sampleapp@v1.31.6) (2024-11-14)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.5](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.4...sampleapp@v1.31.5) (2024-11-08)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.3...sampleapp@v1.31.4) (2024-11-07)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.2...sampleapp@v1.31.3) (2024-11-04)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.1...sampleapp@v1.31.2) (2024-11-01)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.31.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.31.0...sampleapp@v1.31.1) (2024-10-31)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.31.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.30.6...sampleapp@v1.31.0) (2024-10-31)

### Features

- polls implementation ([#2719](https://github.com/GetStream/stream-chat-react-native/issues/2719)) ([c770854](https://github.com/GetStream/stream-chat-react-native/commit/c7708544d49e27dab4a2fee08c235fb39afd2178))

### Bug Fixes

- bump sample apps and store issues ([#2735](https://github.com/GetStream/stream-chat-react-native/issues/2735)) ([424aefb](https://github.com/GetStream/stream-chat-react-native/commit/424aefba4b90b2de8c5bff59e52c0e9aaa580d09))
- remove macos deployment destination ([#2736](https://github.com/GetStream/stream-chat-react-native/issues/2736)) ([e81c6bc](https://github.com/GetStream/stream-chat-react-native/commit/e81c6bc9a0e5734e7af02d59f8d644e7dbde36cb))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.30.6](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.30.5...sampleapp@v1.30.6) (2024-10-28)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.30.5](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.30.4...sampleapp@v1.30.5) (2024-10-24)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.30.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.30.3...sampleapp@v1.30.4) (2024-10-21)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.30.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.30.2...sampleapp@v1.30.3) (2024-10-15)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.30.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.30.1...sampleapp@v1.30.2) (2024-10-14)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.30.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.30.0...sampleapp@v1.30.1) (2024-10-02)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.30.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.29.2...sampleapp@v1.30.0) (2024-09-25)

### Features

- threads v2 ([#2668](https://github.com/GetStream/stream-chat-react-native/issues/2668)) ([39a2fb3](https://github.com/GetStream/stream-chat-react-native/commit/39a2fb3650305d99316c0cb53e18386db0f5c841))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.29.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.29.1...sampleapp@v1.29.2) (2024-09-25)

### Bug Fixes

- update yarn.lock for the project ([#2681](https://github.com/GetStream/stream-chat-react-native/issues/2681)) ([84d678c](https://github.com/GetStream/stream-chat-react-native/commit/84d678cddefafb9cc90318fab3cf4103b3a78167))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.29.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.29.0...sampleapp@v1.29.1) (2024-09-18)

### Bug Fixes

- bump fastlane plugin version ([#2665](https://github.com/GetStream/stream-chat-react-native/issues/2665)) ([aea64f1](https://github.com/GetStream/stream-chat-react-native/commit/aea64f11b6b4875d49407e9e9f63ba3f0af85e02))
- pagination typescript errors and db synchronization bugs ([#2669](https://github.com/GetStream/stream-chat-react-native/issues/2669)) ([493cdff](https://github.com/GetStream/stream-chat-react-native/commit/493cdffcb5b2ee915b2f420e359ad685966a0dbe))
- remove nin and ne operator usage in the SDK and the sample app ([#2672](https://github.com/GetStream/stream-chat-react-native/issues/2672)) ([3497bcb](https://github.com/GetStream/stream-chat-react-native/commit/3497bcb1be88b550372db5f77a48a287161036eb))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.29.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.28.2...sampleapp@v1.29.0) (2024-09-10)

### Features

- add live location sharing cookbook ([#2659](https://github.com/GetStream/stream-chat-react-native/issues/2659)) ([8ee1375](https://github.com/GetStream/stream-chat-react-native/commit/8ee1375771018ab0d7607f6c8f6f8e0599aeeb02))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.28.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.28.1...sampleapp@v1.28.2) (2024-09-09)

### Bug Fixes

- sdk size pr ([#2657](https://github.com/GetStream/stream-chat-react-native/issues/2657)) ([233faa1](https://github.com/GetStream/stream-chat-react-native/commit/233faa128842fda9a272dc1f3455112f93a701c5))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.28.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.28.0...sampleapp@v1.28.1) (2024-09-04)

### Bug Fixes

- change Block user action to Ban user action and UI cookbook for blocking users ([#2649](https://github.com/GetStream/stream-chat-react-native/issues/2649)) ([327aeac](https://github.com/GetStream/stream-chat-react-native/commit/327aeacfd024f88f41630fafce57a991771f2426))
- overlay provider crash issue due to bug in bottom sheet ([#2644](https://github.com/GetStream/stream-chat-react-native/issues/2644)) ([9330cf5](https://github.com/GetStream/stream-chat-react-native/commit/9330cf58e1ec639bd9bc0333133226c844cf473a))
- SampleApp crash on start ([#2642](https://github.com/GetStream/stream-chat-react-native/issues/2642)) ([54fe1b7](https://github.com/GetStream/stream-chat-react-native/commit/54fe1b7fb5eb4a8cc5ebddc8fdfa9aa211624050))
- upgrade firebase versions to fix crash ([#2646](https://github.com/GetStream/stream-chat-react-native/issues/2646)) ([f5822dd](https://github.com/GetStream/stream-chat-react-native/commit/f5822dddbae97ce7433f77c96ddbc5129a35e009))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.28.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.8...sampleapp@v1.28.0) (2024-08-29)

### Features

- Implement SDK Size analysis on CI ([#2612](https://github.com/GetStream/stream-chat-react-native/issues/2612)) ([8812be4](https://github.com/GetStream/stream-chat-react-native/commit/8812be4dc32f3fb1c2da1d7fa07ae1df576ab85d))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.8](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.7...sampleapp@v1.27.8) (2024-08-19)

### Bug Fixes

- make react-native-image-crop-picker optional ([#2603](https://github.com/GetStream/stream-chat-react-native/issues/2603)) ([3acc942](https://github.com/GetStream/stream-chat-react-native/commit/3acc9421e11dc3c26fa0225951214e43603d05e5))
- message read state according to actual read count ([#2609](https://github.com/GetStream/stream-chat-react-native/issues/2609)) ([cfb9d81](https://github.com/GetStream/stream-chat-react-native/commit/cfb9d815dd75c120d446706cf5c7dd76912fdb05))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.7](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.6...sampleapp@v1.27.7) (2024-07-29)

### Bug Fixes

- card play icon theme and dark mode appearance ([#2593](https://github.com/GetStream/stream-chat-react-native/issues/2593)) ([1eb12c4](https://github.com/GetStream/stream-chat-react-native/commit/1eb12c48d5ac9e08f2baedfd933a0c62ccce7877))
- upgrade react-native-video to a stable version 6.4.2 from the previously beta version ([#2601](https://github.com/GetStream/stream-chat-react-native/issues/2601)) ([9f03aa4](https://github.com/GetStream/stream-chat-react-native/commit/9f03aa4843b1a6535026088178eb590a5ef64400))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.6](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.5...sampleapp@v1.27.6) (2024-07-08)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.5](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.4...sampleapp@v1.27.5) (2024-06-27)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.3...sampleapp@v1.27.4) (2024-06-18)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.2...sampleapp@v1.27.3) (2024-06-17)

### Bug Fixes

- add expo-clipboard to peer deps of expo-package ([#2537](https://github.com/GetStream/stream-chat-react-native/issues/2537)) ([ae279a1](https://github.com/GetStream/stream-chat-react-native/commit/ae279a1f8096d90a10c749441eb9d9acadd1c01d))
- example app TS issue and icons props issue ([#2544](https://github.com/GetStream/stream-chat-react-native/issues/2544)) ([4422664](https://github.com/GetStream/stream-chat-react-native/commit/4422664d68e2249b1eb9902ac24cd36802561662))
- permissions issue on expo sample app on iOS and add docs for the same ([#2546](https://github.com/GetStream/stream-chat-react-native/issues/2546)) ([6dbc9bf](https://github.com/GetStream/stream-chat-react-native/commit/6dbc9bfa9ae8d095fe63e2eca9bbb971af9763ce))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.1...sampleapp@v1.27.2) (2024-05-28)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.27.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.27.0...sampleapp@v1.27.1) (2024-05-23)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.27.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.26.0...sampleapp@v1.27.0) (2024-05-16)

### Features

- show edited message label in message UI ([#2514](https://github.com/GetStream/stream-chat-react-native/issues/2514)) ([e19be3c](https://github.com/GetStream/stream-chat-react-native/commit/e19be3ca85ea21c29deb3e26bc43c5e8d1f7c6d5))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.26.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.9...sampleapp@v1.26.0) (2024-05-02)

### Features

- add async audio feature to sample app ([#2504](https://github.com/GetStream/stream-chat-react-native/issues/2504)) ([fa6817d](https://github.com/GetStream/stream-chat-react-native/commit/fa6817d722b3f1370f1fd16810c40c3a55ec15a9))
- async audio ([#2501](https://github.com/GetStream/stream-chat-react-native/issues/2501)) ([871cdd2](https://github.com/GetStream/stream-chat-react-native/commit/871cdd2be5b7b7790d8dcebbbcd46ef2082def13))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.9](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.8...sampleapp@v1.25.9) (2024-04-26)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.8](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.7...sampleapp@v1.25.8) (2024-04-23)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.7](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.6...sampleapp@v1.25.7) (2024-04-15)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.6](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.5...sampleapp@v1.25.6) (2024-04-03)

### Bug Fixes

- offline support saving cyclic structure ([#2469](https://github.com/GetStream/stream-chat-react-native/issues/2469)) ([792b4c9](https://github.com/GetStream/stream-chat-react-native/commit/792b4c9e09138cafdcb564649274b24d21d5a7f3))
- scroll to bottom issue when the message list is empty ([#2471](https://github.com/GetStream/stream-chat-react-native/issues/2471)) ([a05573f](https://github.com/GetStream/stream-chat-react-native/commit/a05573fcdb024c270c06c1223125d90f53859817))
- **sample-app:** set loading status to false when the list of attachments or pinned messages was empty ([d99471a](https://github.com/GetStream/stream-chat-react-native/commit/d99471aa098641efa29e8fa45d7e1301d38932a9))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.5](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.4...sampleapp@v1.25.5) (2024-03-08)

### Bug Fixes

- metro config for example apps ([#2448](https://github.com/GetStream/stream-chat-react-native/issues/2448)) ([de7b387](https://github.com/GetStream/stream-chat-react-native/commit/de7b3879b7d0ee7449898d5cda673ff0ac1836fc))
- **sample-app:** broken hot reload from sdk changes ([83b564a](https://github.com/GetStream/stream-chat-react-native/commit/83b564aca3fada176bd32e95e754b12e4ef51fa4))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.3...sampleapp@v1.25.4) (2024-02-29)

### Bug Fixes

- calendar undefined issue in MessageSearchList in SampleApp ([#2445](https://github.com/GetStream/stream-chat-react-native/issues/2445)) ([afd9479](https://github.com/GetStream/stream-chat-react-native/commit/afd947963c89e572d5f1070729d7677747791d12)), closes [#2440](https://github.com/GetStream/stream-chat-react-native/issues/2440)
- channel disabled/frozen UI re-render issue ([#2436](https://github.com/GetStream/stream-chat-react-native/issues/2436)) ([f18e4a5](https://github.com/GetStream/stream-chat-react-native/commit/f18e4a5bfbcb7b2c1cce6d3e2933061109da7ae9))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.2...sampleapp@v1.25.3) (2024-02-08)

### Bug Fixes

- issues with navigation in SampleApp ([4b6ace0](https://github.com/GetStream/stream-chat-react-native/commit/4b6ace014471cd1c6e8aa60bb4b6af4aa028a9f1))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.1...sampleapp@v1.25.2) (2024-01-23)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.25.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.25.0...sampleapp@v1.25.1) (2024-01-22)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.25.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.24.1...sampleapp@v1.25.0) (2024-01-18)

### Features

- optimise message list scrolling performance ([#2388](https://github.com/GetStream/stream-chat-react-native/issues/2388)) ([09737b8](https://github.com/GetStream/stream-chat-react-native/commit/09737b85fa973c4445bb98ae33061307ce2db3d0)), closes [#2352](https://github.com/GetStream/stream-chat-react-native/issues/2352) [#2348](https://github.com/GetStream/stream-chat-react-native/issues/2348) [#2350](https://github.com/GetStream/stream-chat-react-native/issues/2350) [#2359](https://github.com/GetStream/stream-chat-react-native/issues/2359) [#2355](https://github.com/GetStream/stream-chat-react-native/issues/2355)

### Bug Fixes

- **sample-app:** increase the kotlin version ([a2be522](https://github.com/GetStream/stream-chat-react-native/commit/a2be52217412d337418f754aa0d0af3a2945aa91))
- do not clear the scroll failure timeouts before the failure scroll completes execution ([#2347](https://github.com/GetStream/stream-chat-react-native/issues/2347)) ([054dcf0](https://github.com/GetStream/stream-chat-react-native/commit/054dcf0ec3a1a73c53dfb39e060a7ead529bc7bb))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.24.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.24.0...sampleapp@v1.24.1) (2023-11-29)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.24.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.23.2...sampleapp@v1.24.0) (2023-11-28)

### Features

- update stream-chat package to 8.14.3 ([89b5efa](https://github.com/GetStream/stream-chat-react-native/commit/89b5efa4e9afca8880cf1ecd2a3c7f775aad7355))

### Bug Fixes

- sample-app crash because of viewport changes ([#2313](https://github.com/GetStream/stream-chat-react-native/issues/2313)) ([be241e1](https://github.com/GetStream/stream-chat-react-native/commit/be241e16690d85fc6d7a123ce304a355ff19e01c))
- sample-app crash because of viewport changes ([#2323](https://github.com/GetStream/stream-chat-react-native/issues/2323)) ([c9d7d4e](https://github.com/GetStream/stream-chat-react-native/commit/c9d7d4ec5b446dbe9347f2914ea9f6be1832fb98))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.23.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.23.1...sampleapp@v1.23.2) (2023-11-09)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.23.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.23.0...sampleapp@v1.23.1) (2023-11-06)

### Bug Fixes

- multiple mentions render in message text ([#2286](https://github.com/GetStream/stream-chat-react-native/issues/2286)) ([97e9c46](https://github.com/GetStream/stream-chat-react-native/commit/97e9c46260d141d0d98ec5681eb30be992a41374))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.23.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.11...sampleapp@v1.23.0) (2023-10-26)

### Features

- upgrade version of React Native in Sample App to 0.72.6 ([#2259](https://github.com/GetStream/stream-chat-react-native/issues/2259)) ([2bb0094](https://github.com/GetStream/stream-chat-react-native/commit/2bb0094cbea88b1635e01c9aa0d51396d2e78613))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.11](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.10...sampleapp@v1.22.11) (2023-10-20)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.10](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.9...sampleapp@v1.22.10) (2023-10-19)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.9](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.8...sampleapp@v1.22.9) (2023-10-11)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.8](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.7...sampleapp@v1.22.8) (2023-10-04)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.7](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.6...sampleapp@v1.22.7) (2023-09-26)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.6](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.5...sampleapp@v1.22.6) (2023-09-01)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.5](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.4...sampleapp@v1.22.5) (2023-08-30)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.3...sampleapp@v1.22.4) (2023-08-07)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.2...sampleapp@v1.22.3) (2023-07-18)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.1...sampleapp@v1.22.2) (2023-07-03)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.22.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.22.0...sampleapp@v1.22.1) (2023-06-12)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.22.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.21.1...sampleapp@v1.22.0) (2023-05-25)

### Features

- upgrading flatlist mvcp dep. ([#2112](https://github.com/GetStream/stream-chat-react-native/issues/2112)) ([3039600](https://github.com/GetStream/stream-chat-react-native/commit/30396003bc7c8736b54138488dbbd0cd2b5287b3))

### Bug Fixes

- network down spinner was invisible in sample app ([b7fd437](https://github.com/GetStream/stream-chat-react-native/commit/b7fd4376252a50c3f13c3326d50e0d3dd628b92d))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.21.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.21.0...sampleapp@v1.21.1) (2023-05-15)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.21.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.20.0...sampleapp@v1.21.0) (2023-05-02)

### Features

- enabling offline support with RNQS v8 and removing support for v4 ([#2067](https://github.com/GetStream/stream-chat-react-native/issues/2067)) ([22a541c](https://github.com/GetStream/stream-chat-react-native/commit/22a541c13d35188157ccf0d0442ef18142b35086))

### Bug Fixes

- upgrade stream-chat version to 8.6.0 to solve offline support update channel preview issue ([4ebf23c](https://github.com/GetStream/stream-chat-react-native/commit/4ebf23cb53005522d58f06d8156ee8897a352da1))

### Reverts

- Revert "chore: upgrade stream-chat version to 8.6.0 (#2077)" (#2078) ([bffe460](https://github.com/GetStream/stream-chat-react-native/commit/bffe460670efa173710930a06e18ffcd0b7d8a05)), closes [#2077](https://github.com/GetStream/stream-chat-react-native/issues/2077) [#2078](https://github.com/GetStream/stream-chat-react-native/issues/2078)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.20.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.19.3...sampleapp@v1.20.0) (2023-04-13)

### Features

- allow to use different i18n library ([#2038](https://github.com/GetStream/stream-chat-react-native/issues/2038)) ([42e9c67](https://github.com/GetStream/stream-chat-react-native/commit/42e9c6749fc278b43cb6ee4a116c50d921840795))

### Bug Fixes

- getPhotos doesn't work if you use android targetSdkVersion 33 ([#2036](https://github.com/GetStream/stream-chat-react-native/issues/2036)) ([a17957d](https://github.com/GetStream/stream-chat-react-native/commit/a17957da62111ececf5eb943ed01caec4ac50f3a))
- pinning xcode version to 14 ([#2045](https://github.com/GetStream/stream-chat-react-native/issues/2045)) ([f864bf3](https://github.com/GetStream/stream-chat-react-native/commit/f864bf3bbcc069a3a325204c6ac1e4252befe718))
- pushing up to date Podfile.lock ([75acd87](https://github.com/GetStream/stream-chat-react-native/commit/75acd87cd48c8ed7c0308894b93aa74957076d1d))
- Xcode 14.3 (14E222b) Build Failed with React Native 0.70.7 ([#2042](https://github.com/GetStream/stream-chat-react-native/issues/2042)) ([378620d](https://github.com/GetStream/stream-chat-react-native/commit/378620d3d3476dd39f4fb60a22b914e16820eeb3))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.19.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.19.2...sampleapp@v1.19.3) (2023-03-31)

### Bug Fixes

- removing a reaction outside of the latest reactions causes to add it ([#2028](https://github.com/GetStream/stream-chat-react-native/issues/2028)) ([87cf045](https://github.com/GetStream/stream-chat-react-native/commit/87cf045adde463b7b0a044ab3bd50dbc676f0122))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.19.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.19.1...sampleapp@v1.19.2) (2023-03-21)

### Bug Fixes

- listen to ios more photos selection in gallery ([#1994](https://github.com/GetStream/stream-chat-react-native/issues/1994)) ([2b47ee3](https://github.com/GetStream/stream-chat-react-native/commit/2b47ee3f1357843b4ada8eb98732bef3eddfb5c2))
- misplaced date header, header/footer component in messageList on android 33 ([#1977](https://github.com/GetStream/stream-chat-react-native/issues/1977)) ([e0386be](https://github.com/GetStream/stream-chat-react-native/commit/e0386be1aaca0a9d773b84dfa5f8e0a7aa6410bd))
- rendering the URL Preview for appropriate attachments in message list ([2469075](https://github.com/GetStream/stream-chat-react-native/commit/2469075f65aadd982411ea5cf6fe157355e78367))
- update podlock file of SampleApp ([2faa9d4](https://github.com/GetStream/stream-chat-react-native/commit/2faa9d4a599e78529e68fb679b144f22a6a79365))
- update yarn.lock file of the root, packages and the example apps ([#1986](https://github.com/GetStream/stream-chat-react-native/issues/1986)) ([e7089ac](https://github.com/GetStream/stream-chat-react-native/commit/e7089ac065edf85782c2b7ca1b0b2d86ec4df787))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.19.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.19.0...sampleapp@v1.19.1) (2023-02-17)

### Bug Fixes

- misplaced date header, header/footer component in messageList on android 33 ([#1977](https://github.com/GetStream/stream-chat-react-native/issues/1977)) ([#1978](https://github.com/GetStream/stream-chat-react-native/issues/1978)) ([17908b1](https://github.com/GetStream/stream-chat-react-native/commit/17908b15fa7be070935e34e003d23015b7b8395f))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.19.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.18.0...sampleapp@v1.19.0) (2023-02-14)

### Features

- **build:** add shared github action to install and build SDK ([#1962](https://github.com/GetStream/stream-chat-react-native/issues/1962)) ([3bd0fcc](https://github.com/GetStream/stream-chat-react-native/commit/3bd0fccf4e4e91979795cd5c66ef224d53cd0d4c))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.18.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.17.2...sampleapp@v1.18.0) (2023-02-09)

### Features

- add prop for helping multiple channel list implementation ([#1951](https://github.com/GetStream/stream-chat-react-native/issues/1951)) ([e6f700c](https://github.com/GetStream/stream-chat-react-native/commit/e6f700cd91e4a8ad308e18560b37536e282f6e61))

### Bug Fixes

- do not report invalid tlds as valid urls ([#1950](https://github.com/GetStream/stream-chat-react-native/issues/1950)) ([6917dcd](https://github.com/GetStream/stream-chat-react-native/commit/6917dcd9a547ecdbf0574aa50865bfc01c590122))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.17.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.17.1...sampleapp@v1.17.2) (2023-02-02)

### Bug Fixes

- fixes clipboard detection on android when not installed ([#1936](https://github.com/GetStream/stream-chat-react-native/issues/1936)) ([a9ce8b3](https://github.com/GetStream/stream-chat-react-native/commit/a9ce8b303f93ae58d392c3cfed937571955639b1))
- typing issues in sample app ([#1942](https://github.com/GetStream/stream-chat-react-native/issues/1942)) ([e2d34be](https://github.com/GetStream/stream-chat-react-native/commit/e2d34be61be16ec278b2d46ad0e314d57801b3b7))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.17.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.17.0...sampleapp@v1.17.1) (2023-01-26)

### Bug Fixes

- improve ChannelList performance by improving threshold calls and rerenders of Header ([#1919](https://github.com/GetStream/stream-chat-react-native/issues/1919)) ([6ebabb6](https://github.com/GetStream/stream-chat-react-native/commit/6ebabb609f1cea748762ce01f472a84109b0efdf))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.17.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.16.0...sampleapp@v1.17.0) (2023-01-19)

### Features

- add max file upload size limit of 100MB ([#1888](https://github.com/GetStream/stream-chat-react-native/issues/1888)) ([7ff1698](https://github.com/GetStream/stream-chat-react-native/commit/7ff169818e66cf9bbdf4b4de28fa804f48ea076b))
- update expo example app to expo 47 ([#1892](https://github.com/GetStream/stream-chat-react-native/issues/1892)) ([e396ec0](https://github.com/GetStream/stream-chat-react-native/commit/e396ec09e281f659f63efa55a3f2499d6ce0d310))
- upgrading stream-chat to v8.2.1 ([25e94e9](https://github.com/GetStream/stream-chat-react-native/commit/25e94e9b902e267ffd55bb6788d6b5d0cc2d5610))
- upgrading stream-chat tov8.2.1 ([679bcc1](https://github.com/GetStream/stream-chat-react-native/commit/679bcc1df6cda9fa73564fb5aebcfdae4223fb26))

### Bug Fixes

- react-native-gesture-handler:assertNoMultipleInstances ([#1915](https://github.com/GetStream/stream-chat-react-native/issues/1915)) ([788902d](https://github.com/GetStream/stream-chat-react-native/commit/788902dee560da5ee517599027cd5fd59564cb47))
- **sampleApp:** crash on load due to import of devsettings module ([e0184b6](https://github.com/GetStream/stream-chat-react-native/commit/e0184b6cb52632578f69e8598623cb4d4e3f5205))
- **sampleApp:** crash on load due to import of devsettings module in production ([18702bc](https://github.com/GetStream/stream-chat-react-native/commit/18702bc0ed946669bfb8a1852d47a3a0b01d264c))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.16.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.15.1...sampleapp@v1.16.0) (2022-12-23)

### Features

- **SampleApp:** Add dev menu item to clear the local DB ([#1874](https://github.com/GetStream/stream-chat-react-native/issues/1874)) ([2d727ac](https://github.com/GetStream/stream-chat-react-native/commit/2d727ac556e49eef00c8da08b8d1450e50684ffb))
- initial unread count example ([#1868](https://github.com/GetStream/stream-chat-react-native/issues/1868)) ([d283267](https://github.com/GetStream/stream-chat-react-native/commit/d283267db8bd3d577a9c46d02d0e2894b8341915))

### Bug Fixes

- always watch channel before passing to channel component ([#1869](https://github.com/GetStream/stream-chat-react-native/issues/1869)) ([4ae9dce](https://github.com/GetStream/stream-chat-react-native/commit/4ae9dceb418c75176277ce285e861549cafcd6b6))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.15.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.15.0...sampleapp@v1.15.1) (2022-12-03)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.15.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.14.4...sampleapp@v1.15.0) (2022-12-01)

### Features

- optimistic DB and UI updates for reactions and messages ([#1758](https://github.com/GetStream/stream-chat-react-native/issues/1758)) ([abe2b70](https://github.com/GetStream/stream-chat-react-native/commit/abe2b70d91bcfb689daa2b7bbf6be205c038fe57))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.14.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.14.3...sampleapp@v1.14.4) (2022-11-18)

### Bug Fixes

- **sample-app:** xcode 14 build issues ([7900ee7](https://github.com/GetStream/stream-chat-react-native/commit/7900ee720dd65684575a776cba6702d48b1bb3eb))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.14.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.14.2...sampleapp@v1.14.3) (2022-11-15)

### Bug Fixes

- **SampleApp:** update references to renamed functions from image gallery context ([#1780](https://github.com/GetStream/stream-chat-react-native/issues/1780)) ([11bbe74](https://github.com/GetStream/stream-chat-react-native/commit/11bbe74741b2a6129f9abbc1e42803e683df1175))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.14.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.14.1...sampleapp@v1.14.2) (2022-10-21)

### Bug Fixes

- **build:** broken sample app testflight distribution ([0671100](https://github.com/GetStream/stream-chat-react-native/commit/0671100dcae35984ae077cdfee021d3a1631e273))
- check-pr and next-release GH actions are broken after bottomsheet upgrade ([#1764](https://github.com/GetStream/stream-chat-react-native/issues/1764)) ([affd3c7](https://github.com/GetStream/stream-chat-react-native/commit/affd3c75f4bf63ca2d69d3db3536ea1367354e63))
- **android:** various attachment picker issues ([#1760](https://github.com/GetStream/stream-chat-react-native/issues/1760)) ([ad25f20](https://github.com/GetStream/stream-chat-react-native/commit/ad25f205797a53c5ee78c8c6fae38d4b949dac75))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.14.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.14.0...sampleapp@v1.14.1) (2022-10-12)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.14.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.13.1...sampleapp@v1.14.0) (2022-10-10)

### Features

- added support for prop 'getMessagesGroupStyles' on Channel ([#1749](https://github.com/GetStream/stream-chat-react-native/issues/1749)) ([206c898](https://github.com/GetStream/stream-chat-react-native/commit/206c89832d5fdfb67c9d82f05764315699f60b8e))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.13.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.13.0...sampleapp@v1.13.1) (2022-09-22)

### Bug Fixes

- wrong unread count issue in the SampleApp ([#1728](https://github.com/GetStream/stream-chat-react-native/issues/1728)) ([2d44d17](https://github.com/GetStream/stream-chat-react-native/commit/2d44d172163f2a185d33c2b8faa8ff3311142dc6))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.13.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.12.0...sampleapp@v1.13.0) (2022-09-13)

### Features

- capability to cache images locally ([#1692](https://github.com/GetStream/stream-chat-react-native/issues/1692)) ([c89a3e7](https://github.com/GetStream/stream-chat-react-native/commit/c89a3e7574bd49789a4ec6bc37c9ea848734364b))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.12.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.11.3...sampleapp@v1.12.0) (2022-09-06)

### Features

- debug mode for SDK using Flipper plugin ([c5fc2a3](https://github.com/GetStream/stream-chat-react-native/commit/c5fc2a36894f2ab8c67673cb15b44460afee4e6b))
- send client data to the desktop plugin ([268c99c](https://github.com/GetStream/stream-chat-react-native/commit/268c99cd88b5740e6e1f5eeb6a4d7e731d21289b))

### Bug Fixes

- multiple video controls in ImageGallery ([29aab59](https://github.com/GetStream/stream-chat-react-native/commit/29aab59cbe51907e79f4a6523af74862e70ca789))
- repeat memoization and support of new version of rn-video on android ([d0cd043](https://github.com/GetStream/stream-chat-react-native/commit/d0cd043c4f5e18199f7b2d9ebe664e55f0567346))
- video controls for multiple videos in image gallery ([c5981df](https://github.com/GetStream/stream-chat-react-native/commit/c5981df9d139f4bab8d17835e8d3068753177f2d))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.11.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.11.2...sampleapp@v1.11.3) (2022-08-31)

### ⚠ BREAKING CHANGES

- offline support (#1670)

### Features

- offline support ([#1670](https://github.com/GetStream/stream-chat-react-native/issues/1670)) ([038ae45](https://github.com/GetStream/stream-chat-react-native/commit/038ae459b41697f1436d113ed22cbf95f9217fdd)), closes [#1596](https://github.com/GetStream/stream-chat-react-native/issues/1596) [#1605](https://github.com/GetStream/stream-chat-react-native/issues/1605) [#1527](https://github.com/GetStream/stream-chat-react-native/issues/1527) [#1585](https://github.com/GetStream/stream-chat-react-native/issues/1585) [#1639](https://github.com/GetStream/stream-chat-react-native/issues/1639)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.11.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.11.1...sampleapp@v1.11.2) (2022-08-17)

### Bug Fixes

- SampleApp app icons in right format ([0e51dcf](https://github.com/GetStream/stream-chat-react-native/commit/0e51dcffff798e75801a219f57c5b1e36f7a208a))
- SampleApp app icons in right format ([824f4dc](https://github.com/GetStream/stream-chat-react-native/commit/824f4dc42f3369c0bb24a81f65abe85aff2ce774))
- SampleApp app icons in right format (renaming files) ([8679dbb](https://github.com/GetStream/stream-chat-react-native/commit/8679dbb43fa2a568dfad73c4aa97c3aacfbed9d8))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.11.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.11.0...sampleapp@v1.11.1) (2022-08-10)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.11.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.10.2...sampleapp@v1.11.0) (2022-08-05)

### Features

- update markdown package ([0c23acd](https://github.com/GetStream/stream-chat-react-native/commit/0c23acd99ee45d3e2543350a43fbb18465b19934))

### Bug Fixes

- update markdown package to fix prop types import error ([1438321](https://github.com/GetStream/stream-chat-react-native/commit/1438321c396750aeee8b51680452783846d850d3))

### Reverts

- Revert "Revert "fix: update markdown package to fix prop types import error " (#1622)" (#1623) ([12ab5d5](https://github.com/GetStream/stream-chat-react-native/commit/12ab5d5d20daed6534e423f570b4b99d531e8015)), closes [#1622](https://github.com/GetStream/stream-chat-react-native/issues/1622) [#1623](https://github.com/GetStream/stream-chat-react-native/issues/1623)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.10.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.10.1...sampleapp@v1.10.2) (2022-08-03)

### Bug Fixes

- **docs:** ios foreground push notifications ([#1587](https://github.com/GetStream/stream-chat-react-native/issues/1587)) ([12207c5](https://github.com/GetStream/stream-chat-react-native/commit/12207c53dbe12c3ab47543ddc8a3ad32c6186614))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.10.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.10.0...sampleapp@v1.10.1) (2022-08-01)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.10.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.9.0...sampleapp@v1.10.0) (2022-07-29)

### Features

- support playing audio attachments from message input ([#1489](https://github.com/GetStream/stream-chat-react-native/issues/1489)) ([d7dd0f7](https://github.com/GetStream/stream-chat-react-native/commit/d7dd0f7926e99199c8eee421f27e4727dcd32fe5))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.9.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.8.1...sampleapp@v1.9.0) (2022-07-20)

### Features

- upgrade react-native-reanimated to 2.7.0 ([#1560](https://github.com/GetStream/stream-chat-react-native/issues/1560)) ([602f728](https://github.com/GetStream/stream-chat-react-native/commit/602f7282eed3ee18b58432329c79defc5f889344))

### Bug Fixes

- update flat list mvcp lib in core ([#1557](https://github.com/GetStream/stream-chat-react-native/issues/1557)) ([72641c4](https://github.com/GetStream/stream-chat-react-native/commit/72641c4a56f3cba16fe3d672c5493740cc07e460))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.8.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.8.0...sampleapp@v1.8.1) (2022-07-13)

### Bug Fixes

- update bottom sheet lib to avoid race condition ([#1553](https://github.com/GetStream/stream-chat-react-native/issues/1553)) ([8e4b2a4](https://github.com/GetStream/stream-chat-react-native/commit/8e4b2a46e8e304d54b0d28c116ce399259dfef5f))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.8.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.7.4...sampleapp@v1.8.0) (2022-07-11)

### Features

- replace static video thumbnails with actual thumbnails ([12caa9d](https://github.com/GetStream/stream-chat-react-native/commit/12caa9da9d260e68f75c8c2f7b0fbd023a20620a))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.7.4](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.7.3...sampleapp@v1.7.4) (2022-06-29)

### Bug Fixes

- query all packages should not be needed ([27f964d](https://github.com/GetStream/stream-chat-react-native/commit/27f964d49898c874e0209463e3cd4c21ed494583))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.7.3](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.7.2...sampleapp@v1.7.3) (2022-06-22)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.7.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.7.1...sampleapp@v1.7.2) (2022-06-17)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.7.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.7.0...sampleapp@v1.7.1) (2022-06-15)

### Bug Fixes

- Error handling of the context consumer hooks [CRNS - 430] ([066d08a](https://github.com/GetStream/stream-chat-react-native/commit/066d08a8d2c0b1d9c8584d4e35776597d373d149))
- wrap the SampleApp with ThemeProvider ([a321a43](https://github.com/GetStream/stream-chat-react-native/commit/a321a433ce37127e250eaa0d4040ede9e540e7b3))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.7.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.6.1...sampleapp@v1.7.0) (2022-06-07)

### Features

- allow video upload from image picker and file picker ([6009d36](https://github.com/GetStream/stream-chat-react-native/commit/6009d3626bed416c1bd043fbf1c6ebb156186677))
- inline video renderer/player support for SDK ([862c4bb](https://github.com/GetStream/stream-chat-react-native/commit/862c4bb990f98f26c6c81e2335692569a44018b9))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.6.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.6.0...sampleapp@v1.6.1) (2022-05-25)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.6.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.5.0...sampleapp@v1.6.0) (2022-05-25)

### Features

- allow video upload from image picker ([6989c1d](https://github.com/GetStream/stream-chat-react-native/commit/6989c1d72133518687a5c94f2e44ee38f46efacd))

### Bug Fixes

- solves multiple crashes in the Sample app, that were related to setBlurType ([4b45d80](https://github.com/GetStream/stream-chat-react-native/commit/4b45d804f901d1d2e48ec2af7fd9180a4f44cfd3))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.5.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.4.0...sampleapp@v1.5.0) (2022-05-17)

### Features

- ability to add onPress handler for mentioned user names - [Documentation link](https://getstream.io/chat/docs/sdk/reactnative/core-components/channel/#onpressmessage) ([7894bf9](https://github.com/GetStream/stream-chat-react-native/commit/7894bf92eeb5a02cc0e5028f25f19486214f6306))

### Bug Fixes

- manually update iOS version to 93 ([7e8b57d](https://github.com/GetStream/stream-chat-react-native/commit/7e8b57d95f74a84e67cf951b0be66c865dc86e45))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.4.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.3.1...sampleapp@v1.4.0) (2022-04-27)

### Features

- clarify push v2 background handling on docs and add push v2 to sample app ([df9907c](https://github.com/GetStream/stream-chat-react-native/commit/df9907c4f484f992e5d13706a871c745f0174665))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.3.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.3.0...sampleapp@v1.3.1) (2022-04-12)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.3.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.2.0...sampleapp@v1.3.0) (2022-04-04)

### Features

- editing state header, reply state header and giphy input customization [CRNS - 535] ([4c1d67d](https://github.com/GetStream/stream-chat-react-native/commit/4c1d67d9a4e45050a45a402a53c2cf9b6fbc39b8))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.2.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.1.0...sampleapp@v1.2.0) (2022-03-17)

### Features

- upgrade react native gesture handler version to 2.3.1 ([f9eba70](https://github.com/GetStream/stream-chat-react-native/commit/f9eba70d5f961f2aed7f52eeb458b4ea6f18678e))

### Bug Fixes

- add TS single generic in UserInfoOverlay.tsx of SampleApp ([396edf2](https://github.com/GetStream/stream-chat-react-native/commit/396edf2f9a6b1512b49f52c2a5ff98247d5e8f7c))
- manually update iOS version to 73 ([82c180f](https://github.com/GetStream/stream-chat-react-native/commit/82c180fee94ec520a9d55c2746f5806c551a95ce))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [1.1.0](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.0.2...sampleapp@v1.1.0) (2022-03-13)

### Features

- update example apps to react native 0.67 [CRNS-538] ([e99a8c1](https://github.com/GetStream/stream-chat-react-native/commit/e99a8c1d28ad12270cc1f3e7f5c8bcb3cfc30ca2))

### Bug Fixes

- overrideOwnCapabilities typescript issue ([a8010ef](https://github.com/GetStream/stream-chat-react-native/commit/a8010efe6d841d447c32bf7f1fe0e3ecab2761c3))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.0.2](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.0.1...sampleapp@v1.0.2) (2022-03-10)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [1.0.1](https://github.com/GetStream/stream-chat-react-native/compare/sampleapp@v1.0.0...sampleapp@v1.0.1) (2022-03-07)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## 1.0.0 (2022-03-03)

### ⚠ BREAKING CHANGES

- **channels:** Parent channels rendering threads should add a threadList prop if thread is active

### Features

- added support for props `MessageActionList` and `MessageActionListItem` prop [CRNS-438] ([94c20f8](https://github.com/GetStream/stream-chat-react-native/commit/94c20f8e822c54c9ac97db65a42d10e8db958f9d))
- auto complete suggestions list customization ([59d1284](https://github.com/GetStream/stream-chat-react-native/commit/59d1284d4916e3887dc872e1d8d414d2344817c4))
- Offline support ([6282c48](https://github.com/GetStream/stream-chat-react-native/commit/6282c48d625e22e01ecf0164a3d473a3f7e1c477))
- Pin a message to channel from message actions ([80b94fe](https://github.com/GetStream/stream-chat-react-native/commit/80b94fe7a7e6d422d6bfffda9bbcde944ae32cac))
- Replace BlurView with custom OverlayBackdrop using opacity ([3828f4e](https://github.com/GetStream/stream-chat-react-native/commit/3828f4ec801c748b36b5b95754d83be03779276f))
- revamped giphy interaction from prev/next to shuffle [CRNS - 285] ([c7d5553](https://github.com/GetStream/stream-chat-react-native/commit/c7d5553b015f044893661c514f1bb3a9ee3468f0))
- scroll to top of the list, when bottom tab is pressed ([cfc3983](https://github.com/GetStream/stream-chat-react-native/commit/cfc398338d19cc5a685ee9a76ef57f6d3d659506))
- use channel capabilities to show/hide features [CRNS-425] ([0b00720](https://github.com/GetStream/stream-chat-react-native/commit/0b007209d30677a21e95c5322930627fa64266dd))
- use new generics format ([da1863d](https://github.com/GetStream/stream-chat-react-native/commit/da1863d76982add3076d67808e63490d169a769f))
- v4.0.0 beta [BREAKING CHANGES] ([7b4349e](https://github.com/GetStream/stream-chat-react-native/commit/7b4349e71b2e12451a93e043edf404723cf5a6e1))

### Bug Fixes

- added appropriate error alert for `flag message` action failure [CRNS - 461] ([f8290d2](https://github.com/GetStream/stream-chat-react-native/commit/f8290d2c0f1d93dc8ad7b794c0912e3b25155f7c))
- android debug app build issue ([5fd8ae4](https://github.com/GetStream/stream-chat-react-native/commit/5fd8ae4eaf2729608857ab51ec113a419257669f))
- Channel concurrency fixes ([edbc63f](https://github.com/GetStream/stream-chat-react-native/commit/edbc63f1f6a0b86283daa6294ff30f6e1443113b))
- delegate content type detection to backend for image/file uploads ([8de7d8d](https://github.com/GetStream/stream-chat-react-native/commit/8de7d8d22a3e6152185db3f86ce705af904e75c6))
- Fix messages disappearing on reconnect ([dc0fc3d](https://github.com/GetStream/stream-chat-react-native/commit/dc0fc3d21cbb38d3442f8f94d30bd1f795fb2ba8))
- fixing channel creation flow in sample app ([8c7db64](https://github.com/GetStream/stream-chat-react-native/commit/8c7db649b6333a8ea6ff32ab16da125ee9bd0262))
- Hotfix for peer deps collision ([83cf002](https://github.com/GetStream/stream-chat-react-native/commit/83cf002a86c3ccd683b2ad7440388f8e781baa11))
- lint warnings in the SDK and example apps ([e32cdbc](https://github.com/GetStream/stream-chat-react-native/commit/e32cdbcaefc3850582451d76f92956f5f22a0178))
- Recover by clearing cache if cache is corrupt [CRNS-457] ([234e01e](https://github.com/GetStream/stream-chat-react-native/commit/234e01e0a19833074f5777693414f11ddacb9e49))
- remove default empty state indicator ([f28658a](https://github.com/GetStream/stream-chat-react-native/commit/f28658a4a188394999350cff80d84cbfd0e8e12c))
- tests for capabilities feature and general test suite fixes [CRNS-425] ([c1d3392](https://github.com/GetStream/stream-chat-react-native/commit/c1d3392b2dd0f332fb8e4708e2b8ab806b98b510))
- v4.0.0 beta.7 ([e400b29](https://github.com/GetStream/stream-chat-react-native/commit/e400b297a37ac55c5f5dd40eb231529561dccedc))
- **android:** Fix add member bottom sheet touchables ([4d2e9ad](https://github.com/GetStream/stream-chat-react-native/commit/4d2e9ad04056b382ed7c6183fc780f9907d80965))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### refactor

- **channels:** move channel states to parent level & filter out active channels on list refresh ([ba9cbcc](https://github.com/GetStream/stream-chat-react-native/commit/ba9cbccbe55bd7203b35c69eb24e3e316fa669e1))

### [0.1.1](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.1.0...SampleApp@v0.1.1) (2021-09-16)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [0.1.0](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.35...SampleApp@v0.1.0) (2021-09-16)

### Features

- scroll to top of the list, when bottom tab is pressed ([cfc3983](https://github.com/GetStream/stream-chat-react-native/commit/cfc398338d19cc5a685ee9a76ef57f6d3d659506))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.35](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.34...SampleApp@v0.0.35) (2021-09-14)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.34](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.33...SampleApp@v0.0.34) (2021-09-13)

### Bug Fixes

- delegate content type detection to backend for image/file uploads ([8de7d8d](https://github.com/GetStream/stream-chat-react-native/commit/8de7d8d22a3e6152185db3f86ce705af904e75c6))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.33](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.32...SampleApp@v0.0.33) (2021-08-30)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.33](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.32...SampleApp@v0.0.33) (2021-08-22)

### Bug Fixes

- Channel concurrency fixes ([eab95f0](https://github.com/GetStream/stream-chat-react-native/commit/eab95f0be97226793f9bc8bc2bc2ad4cfe2c93aa))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.32](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.31...SampleApp@v0.0.32) (2021-08-20)

### Bug Fixes

- Hotfix for peer deps collision ([83cf002](https://github.com/GetStream/stream-chat-react-native/commit/83cf002a86c3ccd683b2ad7440388f8e781baa11))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.31](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.30...SampleApp@v0.0.31) (2021-08-04)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.30](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.29...SampleApp@v0.0.30) (2021-07-30)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.29](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.28...SampleApp@v0.0.29) (2021-07-29)

### Bug Fixes

- Fix messages disappearing on reconnect ([dc0fc3d](https://github.com/GetStream/stream-chat-react-native/commit/dc0fc3d21cbb38d3442f8f94d30bd1f795fb2ba8))
- fixing channel creation flow in sample app ([8c7db64](https://github.com/GetStream/stream-chat-react-native/commit/8c7db649b6333a8ea6ff32ab16da125ee9bd0262))

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

### [0.0.26](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@v0.0.25...SampleApp@v0.0.26) (2021-07-15)

### Workspaces

- Following linked packages updated: [stream-chat-react-native]

## [0.0.25](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@0.0.24...SampleApp@0.0.25) (2021-07-13)

**Note:** Version bump only for package SampleApp

## [0.0.24](https://github.com/GetStream/stream-chat-react-native/compare/SampleApp@0.0.23...SampleApp@0.0.24) (2021-07-13)

**Note:** Version bump only for package SampleApp

## 0.0.23 (2021-07-13)

### Bug Fixes

- **android:** Fix add member bottom sheet touchables ([4d2e9ad](https://github.com/GetStream/stream-chat-react-native/commit/4d2e9ad04056b382ed7c6183fc780f9907d80965)), closes [#727](https://github.com/GetStream/stream-chat-react-native/issues/727)

## 3.6.1 (2021-07-07)

# 3.6.0 (2021-06-22)

# 3.6.0-rc.0 (2021-06-02)

## 3.3.3 (2021-04-13)

## 0.0.23-rc.0 (2021-07-13)

### Bug Fixes

- **android:** Fix add member bottom sheet touchables ([4d2e9ad](https://github.com/GetStream/stream-chat-react-native/commit/4d2e9ad04056b382ed7c6183fc780f9907d80965)), closes [#727](https://github.com/GetStream/stream-chat-react-native/issues/727)
