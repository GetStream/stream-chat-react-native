# stream-chat-react-native v10 — breaking changes

The single list of every breaking change between v9 and v10 of `stream-chat-react-native-core`,
`stream-chat-react-native` and `stream-chat-expo`. It is the source of truth for the v10 migration guide and the docs
update. Each entry says what changed and how to migrate in one line, and links to the detailed write-up:

- **`§…`** → [`ai-migration-v9-to-v10.md`](./ai-migration-v9-to-v10.md), the agent migration guide (Before/After code,
  detection greps, the breaks that compile). Its [index](./ai-migration-v9-to-v10.md#index-of-breaking-changes) maps
  every section of this file to the guide sections that cover it.
- **i18n** → [`i18n-v10-migration.md`](./i18n-v10-migration.md) and [`i18n-v10-key-map.json`](./i18n-v10-key-map.json).
- **LLC** → `stream-chat` v10's own list: `stream-chat-js` `ai-docs/v10-breaking-changes.md` on `release-v10`.
- **#NNNN** → the `GetStream/stream-chat-react-native` pull request that made the change.

Docs impact (which getstream.io pages change) is in [`v10-docs-impact.md`](./v10-docs-impact.md).

## Scope and method

- **Baseline:** `develop` @ `42662cdb1` (v9.10.x, `stream-chat` 9.54.0). **Target:** `V10` @ `c994ffd00`
  (`stream-chat` 10.0.0-rc.22) plus the stacked PRs #3866–#3869 (`refactor/stop-creating-sdk-paginator` @
  `251a76dfe`: message actions built on demand, a standalone `<Thread>`, the `<Channel>` lifecycle refactor and an
  app-owned `<ChannelList paginator>`). The trees were compared tip to tip; `V10` squash-merges `develop`, so ancestry
  diffs are not reliable. The three `develop` commits not yet on `V10` (#3862, #3863, #3864) change no public API.
- **Re-verified** against `V10` @ `74884ff55` (`stream-chat` `^10.0.0-rc.30`), 2026-11-03: the changes after the
  last ledger update (#3910, #3916 and the `stream-chat` / `@stream-io/*` bumps) were reviewed against this list; the
  additions are `useJumpToLatestOnOpen` and the reopen-at-latest behaviour (sections 13 and 15), plus the no-action fixes in
  [section 17](#17-no-action-fixes-detail-moved-from-the-migration-guide). Names that existed only in v10 pre-releases
  (`channel.state.*Store` handles, `WatcherState`, `MutedUsersState`) were dropped from the guide.
- **Public API** = everything reachable from `package/src/index.ts`, the `ai-components` entry, the wrappers'
  `src/index.js`, `DEFAULT_COMPONENTS`, the theme, translations and `package.json` peer/dependency ranges.
- **How it was collected:**
  1. a TypeScript-compiler snapshot of both public surfaces (≈1,285 exports, every prop / context field / class
     member flattened, plus the 207 `stream-chat` types those signatures reference), diffed mechanically;
  2. the v9 `SampleApp` and `ExpoMessaging` sources type-checked against v10 (0 errors on v9, 144 on v10 — every error
     cluster maps to an entry below);
  3. a review of all 40 PRs merged into `V10` for behaviour that types cannot show;
  4. the `examples/` diff (the migration the team already did on its own apps), the deleted/rewritten tests, and a
     cross-check against the `stream-chat` and `stream-chat-react` v10 breaking-change lists.
- Not breaking (checked): theme shape (`Theme` is identical), the `icons` map, `DEFAULT_COMPONENTS` slot names except
  the removed `ThreadMessageComposer` and `MessageList`, native modules, podspecs, the Expo config plugin, `registerNativeHandlers` and
  the native handler interfaces.

---

## 1. Dependencies and platform

- **`stream-chat` ^9 → ^10** (`^10.0.0-rc.30` at `74884ff55`; a regular dependency of core, not a peer). Every `stream-chat` change in [§12](#12-stream-chat-v10-changes-an-rn-integrator-hits)
  applies. Apps that depend on `stream-chat` directly must move to the same major. — §17
- **`react-native` peer `>=0.76` → `>=0.79`** (core, native and expo packages). `@stream-io/i18n` and `stream-chat`
  resolve through package `exports`, which needs Metro ≥0.82. — §R.1 · #3777
- **`expo` peer `>=52` → `>=53`** (`stream-chat-expo`). — §R.1 · #3777
- **`stream-chat` requires Node `>=22.18.0`** at install time (`engines`). Yarn 1 refuses the install on older Node. —
  §R.1 · LLC
- **New dependency `@stream-io/i18n`**; `i18next` is no longer a direct dependency; `dayjs` `1.11.13` (pinned) →
  `^1.11.23` and must resolve to a single copy. — §19 · i18n · #3777 #3801
- **`StateStore` / `Unsubscribe` are no longer exported by `stream-chat`.** Apps that build their own stores import
  them from `@stream-io/state-store` (add it to the app; exactly one copy may resolve). — §R.1
- **Offline DB `SqliteClient.dbVersion` 16 → 18.** The first launch after the upgrade wipes and rebuilds the SQLite
  cache, including v9's queued pending tasks (unsent offline writes). — §N.2 · §R.9 · #3794 #3804

## 2. Removed exports

Everything below was exported from the package root in v9 and is gone in v10.

**Contexts**

- `TypingContext`, `TypingProvider`, `useTypingContext`, `TypingContextValue` →
  `useStateStore(channel.state, (s) => ({ typing: s.typing }))`. — §2 · #3736
- `PaginatedMessageListContext`, `PaginatedMessageListProvider`, `usePaginatedMessageListContext`,
  `PaginatedMessageListContextValue` → `useMessagePaginator()` / `channel.messagePaginator`. — §3 · #3736
- `DebugContext`, `DebugContextProvider`, `useDebugContext`, `DebugContextValue`, `DebugDataType` → nothing (fed the
  Flipper plugin). — P.1

**Hooks**

- `useCreateTypingContext`, `useCreatePaginatedMessageListContext` → nothing; their contexts are gone. — §15
- `useTargetedMessage` → `messagePaginator.jumpToMessage(id, { focusReason: 'jump-to-message', … })`; read with the
  new `useIsTargetedMessage(id)`. — §6
- `useChannelUpdated` → nothing; `client.channelManager` handles `channel.updated`. — §18.2 · #3770
- `useIsOnline` → `useConnectionLifecycle` (returns nothing); status from `useNetworkConnectionState()` /
  `useWSConnectionState()` / `useSettledWSConnectionHealth()`. — P.2 · §R.2 · #3808
- `useAppSettings` → `useChatContext().getAppSettings()`. — P.12
- `useClientMutedUsers` → `useMutedUsers()`. — P.12
- `useSelectedChannelState` → `useStateStore(channel.state, selector)`. — P.1

**Utilities**

- `getLastReceivedMessage` → `messages.find((m) => m.status !== 'failed')`. — P.1
- `reduceMessagesToString`, `findInMessagesById`, `findInMessagesByDate` → `channel.messagePaginator.getItem(id)` /
  `jumpToMessage(id)`. — P.1
- `patchMessageTextCommand` → nothing (the composer submits through `stream-chat`). — P.17
- `setupCommandUIMiddlewares` → nothing; `stream-chat` installs the four command middlewares by default, so delete
  the call. An app that never called it now gets them too: typing `/giphy cats` makes `giphy` the active command and
  leaves `cats` in the input. — §13.1
- `createAttachmentsCompositionMiddleware`, `createDraftAttachmentsCompositionMiddleware`,
  `localAttachmentToAttachment` → `stream-chat`'s own `createAttachmentsCompositionMiddleware` (installed by default).
  — §17.6 · #3821

**Types**

- `ThreadType` → a `Thread` instance (`client.threads.ensure({ channel, parentMessage })` builds one). — §10.1 · #3861
- `ChannelUnreadState` → `channel.messagePaginator.unreadStateSnapshot` (`UnreadSnapshotState`). — §7 · P.9
- `MessageActionsHookProps` → nothing; `useMessageActions()` reads the message's contexts. — §15.1 · #3866
- `DefaultCommandData` → nothing; `stream-chat` no longer has `CustomCommandData`, so delete the augmentation. —
  §17.1

**Translations**

- `enTranslations`, `esTranslations`, `frTranslations`, `heTranslations`, `hiTranslations`, `itTranslations`,
  `jaTranslations`, `koTranslations`, `nlTranslations`, `ptBRTranslations`, `ruTranslations`, `trTranslations` →
  English is the only bundled language; register your own dictionaries with dotted keys. — §19 · i18n · #3776

## 3. Component props

Each removal or retype below also applies to the component's exported `XProps` / `XPropsWithContext` types and to
its slot type in `ComponentOverrides`. Every component and hook that accepts `t` now types it as `StreamTFunction`
(see [§10](#10-i18n-and-translations)).

### `<Chat>`

- No props removed. Behaviour: `<Chat>` no longer sets `client.recoverStateOnReconnect = false` /
  `client.preventThreadCleanup = true` (recovery is `client.connectionRecovery`, on by default). — §L.1 · #3785
- `<Chat>` writes `persistUserOnConnectionFailure: enableOfflineSupport` into `client.config` on mount, overwriting a
  value you registered. — §17.7 · #3855
- `<Chat>` registers the NetInfo `statusReporter` when none is registered; a reporter the app registered (at
  construction or with `client.config.set`) wins. `useCreateChatClient` passes it at construction. — §R.2 · #3808

### `<Channel>`

Removed props:

- `messages`, `loadingMore`, `loadingMoreRecent`, `threadMessages`, `setThreadMessages` → state lives in the
  paginators. — §13 · #3736
- `messageId` → jump with `channel.messagePaginator.jumpToMessage(id, …)` (thread: `thread.messagePaginator`) and pass
  `initialScrollToFirstUnreadMessage={!messageId}`. — §8 · #3820
- `doMarkReadRequest`, `doSendMessageRequest`, `doUpdateMessageRequest`, `preSendMessageRequest` →
  `client.config.set({ channel: { requestHandlers: { markReadRequest, sendMessageRequest, retrySendMessageRequest,
  updateMessageRequest } } })`. — §13.1 · P.17 · #3784 #3821
- `doFileUploadRequest` → `client.config.set({ messageComposer: { attachments: { doUploadRequest, customCdn: true } } })`.
  — §13.1 · #3784
- `stateUpdateThrottleInterval`, `newMessageStateUpdateThrottleInterval` →
  `client.config.set({ channel: { messagePaginator: { stateThrottleMs } } })`. — §13.1 · #3784
- `maximumMessageLimit` → `client.config.set({ channel: { messagePaginator: { maxLoadedItems } } })`. — §O.1 · #3815
- `allowSendBeforeAttachmentsUpload`, `enableOfflineSupport` →
  `client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled } } })`; offline support is set on
  `<Chat>`. — §O.3 · #3821
- `isMessageAIGenerated` → `<Chat isMessageAIGenerated>` only. — Q.3 · #3852
- `isOnline` → nothing (was ignored). — P.5
- `thread`, `threadList` → render `<Thread thread={thread}>` next to `<Channel>`, not inside it. — §10.1 · #3867
- `allowThreadMessagesInChannel` → a `<Thread>` prop. — §10.2 · #3867
- `shouldSyncChannel` → nothing; `<Channel>` always runs its lifecycle (a thread no longer needs a non-syncing
  `<Channel>` around it). — §10.2 · #3867

Retyped props:

- `channel`, `customMessageSwipeAction`: the `Channel` type is `stream-chat` v10's. — §17.5
- `t`: i18next `TFunction` → `StreamTFunction`. — §R.10

### `<ChannelList>`

- New required `paginator` prop: the app creates a `ChannelPaginator`, registers it with
  `client.channelManager.insertPaginator({ paginator })` and removes and disposes it on logout. The list never
  disposes it and does not query again when it remounts. — §18.6 · #3869
- Removed `filters`, `sort`, `options`, `lockChannelOrder`, `queryChannelsOverride` (v9 typed it with `stream-chat`'s
  `QueryChannelsRequestType`) → set them on the `ChannelPaginator`: `filters` / `sort` /
  `requestOptions` in its constructor, `paginatorOptions.lockItemOrder`, `paginatorOptions.doRequest`. To change the
  query, update the paginator's filters / sort and `reload()`, or pass a new paginator. — §18.1 · §18.6 · #3869
- What moved onto the paginator also changed shape since v9: `sort` is `SortParamRequest[]`
  (`[{ field: 'last_message_at', direction: -1 }]`) and an empty `sort` means the backend default; filters use
  `'custom.<field>'` keys with one operator per key; `doRequest` returns `{ items }` — call
  `client.queryChannelsAndHydrate(request, stateOptions)` inside; `options.offset` is ignored and `options.limit` is
  the page size. — §17.5 · §N.4 · §R.6
- Removed `onAddedToChannel`, `onRemovedFromChannel`, `onChannelDeleted`, `onChannelHidden`, `onChannelVisible`,
  `onChannelUpdated`, `onChannelTruncated`, `onChannelMemberUpdated`, `onNewMessage`, `onNewMessageNotification` →
  membership and order follow `filters` / `sort`; global behaviour via `client.channelManager.addEventHandler(...)` /
  `client.on(...)`. — §18 · #3770

### `<ChannelListView>`, `<ChannelPreview>`

- `ChannelListView`: `forceUpdate` removed; `channels`, `channelListInitialized`, `hasNextPage`, `loadingChannels`,
  `loadingNextPage`, `refreshing` are now required; `loadNextPage` is `() => Promise<void>`; new `paginator` prop. —
  §R.4 · P.20
- `ChannelPreview`: `forceUpdate` removed (preview data is reactive). — §R.4 · #3740

### `<Message>` and message components

- `Message`: removed `members`, `readBy`, `deliveredToCount`, `isMessageAIGenerated`, `openThread`, `chatContext`. —
  §R.3 · §R.4 · Q.3 · P.13 · §10.1
- `Message`: `onThreadSelect` `(message, targetedMessageId?)` → `(thread: Thread)`; `updateMessage` takes one argument.
  — §10.1 · §9
- `Message`: removed `handleBan`, `handleBlockUser`, `handleCopy`, `handleDelete`, `handleDeleteForMe`, `handleEdit`,
  `handleFlag`, `handleMarkUnread`, `handleMute`, `handlePinMessage`, `handleQuotedReply`, `handleRetry`,
  `messageActions`, `supportedReactions` — set on a `<Message>` (e.g. from a custom `Message`), they no longer reached
  the action menu. Set them on `<Channel>`; customise per message through the `messageActions` function. — §15.1 ·
  #3866
- `threadList` removed from `Message`, `MessageContent`, `MessageReplies` and `MessageComposer`; `MessageItemView`,
  `SentToChannelHeader` and `ShowThreadMessageInChannelButton` take `thread` instead. Inside a thread,
  `useThreadContext().thread` is set. — §10.2 · #3867
- `MessageStatus`: `readBy` / `deliveredToCount` (counts) → `read` / `delivered` (booleans, self-derived by default). —
  §R.3 · #3823
- `MessageFooter`, `MessageItemView`: `members` removed. — §4 · §R.4 · #3779
- `MessageContent`: `isMessageAIGenerated` removed. — Q.3
- `Giphy`, `GiphyImage`, `URLPreview`, `URLPreviewCompact`: `attachment` is `stream-chat`'s `Attachment` (custom
  metadata under `attachment.custom`). — §17.1 · §R.4
- `MessageActionList`: `dismissOverlay` removed; it was never read (each `MessageActionListItem` closes the overlay
  itself). A custom list that needs it reads `useMessageContext().dismissOverlay`.

### `<MessageList>` / `<MessageFlashList>`

- Removed: `channelUnreadStateStore`, `setChannelUnreadState`, `targetedMessage`, `setTargetedMessage`,
  `highlightedMessageId` (FlashList), `loadMore`, `loadMoreRecent`, `hasMore` (`MessageList`), `threadHasMore`,
  `loadMoreThread`, `loadMoreRecentThread`, `loadChannelAroundMessage`, `loading`, `reloadChannel`, `threadInstance`,
  `maximumMessageLimit`, `allowSendBeforeAttachmentsUpload`, `scrollToFirstUnreadThreshold`,
  `shouldShowUnreadUnderlay`, `FlatList` (FlashList). The lists read their own paginator. — §12 · P.5 · P.7 · §O.1
- `thread`: kept, retyped `LocalMessage | null` → `Thread | undefined`. — §12
- `threadList` removed; a list inside `<Thread>` renders the thread's replies. — §10.2 · #3867
- `onThreadSelect`: `(message) => void` → `(thread: Thread) => void`. — §10.1
- Older-end loading component (`FooterComponent` on `MessageList`, `HeaderComponent` on `MessageFlashList`) now
  receives `{ loadingMore?: boolean }`. The newer-end one gets no props and has no SDK source for `loadingMoreRecent`.
  — §12.1
- `MessageFlashList`: `inverted` removed; it was never read (the FlashList is never inverted).
- New: `pendingUploadsEnabled`. — §O.3
- `ScrollToBottomButton`: `unreadCount` removed (self-derived from `channel.state`). — §7
- `TypingIndicatorContainer`: `thread` → `threadId`. — §2.1
- `InlineLoadingMoreIndicator` / `InlineLoadingMoreRecentIndicator`: now take `loadingMore` / `loadingMoreRecent`
  props and render nothing without them. — §R.4
- `UnreadMessagesNotification`: `channelUnreadStateStore` / `unreadCount` removed; dismiss calls the new `markRead`
  prop (a wrapper must forward it). — §7 · §R.5

### `<Thread>` and thread components

- `<Thread thread={thread}>` renders next to `<Channel>`, not inside it, and renders its children
  (`<Thread thread={thread}><MessageList /><MessageComposer /></Thread>`). — §10.1 · #3867
- `Thread`: `thread` is required and is the `Thread` instance (it was the parent message). Removed `client`,
  `closeThread`, `loadMoreThread`, `reloadThread`, `threadInstance`, `additionalMessageListProps`,
  `additionalMessageFlashListProps`, `additionalMessageComposerProps`, `shouldUseFlashList`, `autoFocus`, `disabled`,
  `closeThreadOnDismount` (use `onThreadDismount`) and `parentMessagePreventPress` (a `ThreadFooterComponent` prop).
  Configure the list and composer through their own props; `<Thread>` accepts the same config props as `<Channel>`. —
  §10.2 · #3736 #3861 #3867
- `ThreadFooterComponent`: `thread` prop removed (reads the thread from context); props are
  `{ parentMessagePreventPress?: boolean }`, default `true`. — §10.2
- `ThreadList`: `onThreadSelect(thread: ThreadType, channel)` → `onThreadSelect(thread: Thread)` (`thread.channel`). —
  §10.1

### Composer

- `MessageComposer`, `OutputButtons`: `isOnline` is `boolean` (settled socket health), not `boolean | null` from
  `ChatContext`. — §R.2
- `AutoCompleteInput`, `InputView`: `t` is `StreamTFunction`. — §R.10
- `CommandSuggestionItem`: `args`, `description`, `name`, `set` are required strings; `created_at` / `updated_at` are
  `TimestampNS`. — §R.4

### Indicators, polls, misc

- `LoadingErrorIndicator`: `error` `boolean | Error` → `Error`. — §R.4 · #3785
- `ProgressControl`: `width` removed; it was never read (the control measures its own width).
- Poll components: `PollOption` → `PollOptionResponseData`, `PollAnswer` / `PollVote` → `PollVoteResponseData`
  (`ShowAllVotesButton`, `PollResultsItem`, `PollOptionFullResults(Content)`, `PollAnswerListItem`,
  `PollAnswersList(Content)`); `CreatePollOption.error` is a `PollComposerValidationError`. — §17.5 · §19

## 4. Contexts

Each field change applies to the context's `XContextValue` type (and to `InputMessageInputContextValue` for the
message input).

### Removed contexts

`TypingContext`, `PaginatedMessageListContext`, `DebugContext` — see [§2](#2-removed-exports).

### `ChannelContext` (`useChannelContext()`)

- Removed `threadList` → `useThreadContext().thread`. — §10.2 · #3867
- Removed `members`, `read`, `watchers`, `watcherCount` → `useStateStore(channel.state, selector)`. — §4
- Removed `markRead` → `useMarkRead(channel)`. — §5
- Removed `targetedMessage`, `setTargetedMessage`, `highlightedMessageId` → `messagePaginator.messageFocusSignal`,
  `useIsTargetedMessage(id)`. — §6
- Removed `channelUnreadStateStore`, `setChannelUnreadState` → `channel.messagePaginator.unreadStateSnapshot`. — §7
- Removed `loadChannelAroundMessage`, `loadChannelAtFirstUnreadMessage`, `reloadChannel`, `loading` → paginator
  `jumpToMessage` / `jumpToTheFirstUnreadMessage` / `jumpToTheLatestMessage`, `state.isLoading`. — §8
- Removed `error` → `(thread ?? channel).messagePaginator.state.lastQueryError`. — §L.7
- Removed `isChannelActive`, `scrollToFirstUnreadThreshold`. — P.4
- Removed `maximumMessageLimit`, `uploadAbortControllerRef`. — §R.4

### `ChatContext` (`useChatContext()`)

- Now only `{ client, getAppSettings, isMessageAIGenerated }` (`isMessageAIGenerated` is required, defaults to
  `() => false`).
- Removed `isOnline`, `connectionRecovering` → `useNetworkConnectionState()`, `useWSConnectionState()`,
  `useSettledWSConnectionHealth()`. — §R.2 · #3808
- Removed `appSettings` (→ `getAppSettings()`), `mutedUsers` (→ `useMutedUsers()`), `enableOfflineSupport`,
  `channel`, `setActiveChannel` (own navigation state). — P.11

### `ChannelsContext` (`useChannelsContext()`)

- Removed `channels`, `channelListInitialized`, `hasNextPage`, `loadingChannels`, `loadingNextPage`, `refreshing`,
  `error`, `forceUpdate` → read the list's `paginator` (new field) with `useStateStore`. — P.20
- `loadNextPage`: `(queryType?, retryCount?)` → `()`; a no-op until the first page has loaded. — §18.3 · #3854

### `MessagesContext` (`useMessagesContext()`)

- Removed `sendReaction`, `deleteReaction`, `deleteMessage`, `removeMessage`, `retrySendMessage`, `updateMessage` →
  `useMessageOperations()` (same names; `deleteMessage` options are `{ hard, delete_for_me }`). — §9 · §17.2
- Removed `targetedMessage` → `useIsTargetedMessage(id)`. — §6
- Removed `initialScrollToFirstUnreadMessage`, `quotedMessage`. — P.4
- Removed `isMessageAIGenerated` → `useChatContext()`. — Q.3
- New `onAlsoSentToChannelHeaderPress` (moved from `ThreadContext`). — §10.2 · #3867

### `MessageContext` (`useMessageContext()`)

- Removed `members`, `readBy`, `deliveredToCount`, `isMessageAIGenerated`, `threadList`. — §4 · §R.3 · Q.3 · §10.2
- `onThreadSelect`: `(message, targetedMessageId?)` → `(thread: Thread)`. — §10.1
- New `messageActionHandlers` (`MessageActionHandlerCallbacks`, stable for the row's lifetime) and
  `isVeryLastMessage`. — §15.1 · #3866

### `ThreadContext` (`useThreadContext()`)

- Now `{ thread?: Thread, allowThreadMessagesInChannel }`. `thread` was the parent `LocalMessage`; it is now the
  `Thread` (parent via `thread.state`), and `null` is no longer part of the type — use `undefined` for "no thread". Only `<Thread>` provides it, and `useThreadContext()` no longer throws: outside
  a thread it returns `{ thread: undefined, allowThreadMessagesInChannel: false }`. — §10 · #3867
- `onAlsoSentToChannelHeaderPress` moved to `MessagesContext`. — §10.2 · #3867
- Removed `threadMessages`, `threadHasMore`, `threadLoadingMore`, `threadLoadingMoreRecent`, `loadMoreThread`,
  `loadMoreRecentThread`, `reloadThread`, `setThreadLoadingMore`, `openThread`, `closeThread`, `threadInstance`,
  `parentMessagePreventPress` → `thread.messagePaginator`, `thread.reload()`, render `<Thread>` to open. — §10 ·
  §10.1 · §R.4
- `onAlsoSentToChannelHeaderPress` payload: `{ parentMessage }` → `{ thread }`. — §10.1

### `ThreadsContext`

- `onThreadSelect(thread: ThreadType, channel)` → `onThreadSelect(thread: Thread)`. — §10.1

### `MessageInputContext` (`useMessageInputContext()`)

- Removed `editMessage` → `sendMessage()` saves an edit. — §11 · P.17
- Removed `allowSendBeforeAttachmentsUpload` → `usePendingUploadsEnabled()`. — §O.3
- Removed `doFileUploadRequest` → `client.config` `messageComposer.attachments.doUploadRequest`. — §R.4 · #3784

### `TranslationContext` (`useTranslationContext()`)

- `t` is `StreamTFunction`: only catalog keys type-check; app keys need `asDynamicKey(...)`. — i18n
- `userLanguage`: `TranslationLanguages` → `string`. — §R.10

## 5. Hooks — changed signatures

- `useMutedUsers(channel?)` → `useMutedUsers()`; returns `UserMuteResponse[]` (was `Mute[]`). — §14
- `useMutedChannels(channel)` → `useMutedChannels()`. — P.3
- `useChannelPreviewData(channel, client, forceUpdateOverride?)` → `(channel, client)`; `lastMessage` is
  `LocalMessage | undefined`. — §R.4
- `useIsChannelMuted(channel)` → returns `ChannelMuteStatus` (`createdAt` / `expiresAt` are `TimestampNS | null`). —
  §17.5
- `useChannelMembersState(channel)` → `(channel, pick?)` (additive). — #3854
- `useCreateChatClient({ options })`: `StreamChatOptions` → `DeepPartial<InstanceConfigTree>` (former options go under
  `client`); `userData` is typed `ClientUser`, what `connectUser` accepts. — §17.7 · #3855 #3871
- `useQueryReminders()`: data typed `ReminderResponseData[]` (was `ReminderResponse[]`), timestamps in ns. — §R.8
- `useMessageList(params)`: `{ threadList }` → `{ paginator }` (no longer reads context); also returns
  `maxLoadedItems`. — P.8
- `useMessageActions(params)` → `useMessageActions()` and `useMessageActionHandlers(params)` →
  `useMessageActionHandlers()` (returns `MessageActionHandlerCallbacks`): no arguments; both read the contexts of the
  message they are called in, so they must run inside a message (a custom `Message` or `MessageActionList`). The
  `messageActions` function's `MessageActionsParams` lost `openThread`; its `onThreadSelect` takes a `Thread` and
  `updateMessage` one argument. — §15.1 · §9 · §10.1 · #3866
- `useMessagePaginator()`: returns `MessagePaginator` (no longer `| undefined`). — #3867
- `useCreateMessagesContext`, `useCreateThreadContext`, `useCreateMessageInputContext`, `useCreateMessageContext`:
  inputs narrowed to the new context shapes. — §15 · §R.4
- `useChannelOwnCapabilities(channel)`: one overload `(channel?)`. — K.6
- `usePollState` / `usePollStateStore` / `usePollAnswersPagination` / `usePollOptionVotesPagination`: poll types renamed (see section 3);
  `addComment()` → `Promise<PollVoteResponse>`, `endVote()` → `Promise<PollResponse | undefined>`. — §17.5

## 6. Utilities and functions — changed

- `getIndicatorTypeForFileState(fileState, allowSendBeforeAttachmentsUpload)` → second parameter renamed
  `pendingUploadsEnabled` (positional, no call-site break).
- `isLocalUrl(url?)` checks the `http(s)://` scheme and returns `false` for `undefined`; `makeImageCompatibleUrl(url?)`
  returns `undefined` for `undefined`. — §17.6
- `removeReservedFields`, `checkMessageEquality`, `checkQuotedMessageEquality`: now generic / accept
  `MessageResponse | LocalMessage` (widening).
- `isDayOrMoment`: re-exported from `@stream-io/i18n`; type guard is `value is DateTimeLike`. — §R.10
- `defaultTranslatorFunction`: typed `StreamTFunction`; returns the English default instead of echoing the key. —
  i18n
- `isBlockedMessage`, `isBouncedMessage`: only V2 `message.moderation.action` is recognised. — §17.4
- `SCROLL_TO_BOTTOM_ACCESSIBILITY_LABEL_KEY`, `SCROLL_TO_BOTTOM_WITH_COUNT_ACCESSIBILITY_LABEL_KEY`: values are the
  dotted keys. — §R.10
- `DEFAULT_USER_LANGUAGE`: type `TranslationLanguages` → `'en'`. — §R.10

## 7. Types

- `AIStates`: `const` object with literal types; `[AIStates.Thinking, AIStates.Generating].includes(aiState)` no longer
  compiles (compare with `===`). — K.7 · §R.4
- `AudioAttachmentType`, `AudioUpload`, `LocalAudioAttachmentType`: `waveform_data`, `mime_type`, `file_size`,
  `duration` moved under `custom`. — §17.1
- `DefaultAttachmentData`: now empty (`localId`, `originalFile` removed); `AudioUpload` / `LocalAudioAttachmentType`
  also lose `localId`, `originalFile`, `latitude`, `longitude`. Unsent attachments carry `localMetadata` (`id`,
  `file`, `previewUri`, `uploadState`), with no local URL in `image_url` / `asset_url`. — §17.6
- `ChannelListEventListenerOptions`: `sort` is `SortParamRequest[]`. — §17.5
- `UseFetchReactionParams.sort`: `SortParamRequest[]`. — §17.5
- `LastMessageType` (`LocalMessage | MessageResponse`): unchanged alias, but both underlying `stream-chat` types
  changed (timestamps, `.custom`, required fields). — §17.5
- `TDateTimeParserInput` / `TDateTimeParserOutput`: re-typed from `@stream-io/i18n`. — §19
- `ImageGalleryStateStore` `assets[]`: `created_at: Date | undefined`, `channelId: string`, `user: UserResponse`. —
  §R.4
- Every `stream-chat` type used in props and callbacks follows `stream-chat` v10 (see [§12](#12-stream-chat-v10-changes-an-rn-integrator-hits)).

## 8. Classes and state stores

**`Streami18n`** — §19 · i18n · §R.10

- Constructor `(options, i18nextConfig)` → `(options)` with `i18nextConfigOverrides`.
- `setLanguage()` → `Promise<void>`; `getTranslators()` → `init()`; `addOnLanguageChangeListener` →
  `i18n.state.subscribeWithSelector(...)`.
- Removed: `geti18Instance()` (→ `i18nInstance`), `getAvailableLanguages()`, `getTranslations()`,
  `addOnTFunctionOverrideListener`, `isCustomDateTimeParser`, `Dayjs`.
- `registerTranslation(lang, dict, customDayjsLocale?)` merges a `TranslationDictionary` and takes a
  `DayjsLocaleConfig`; new `state` store and `registeredLanguages`.
- `{{ … | relativeCompactDateFormatter }}` → `timestampFormatter(relativeCompact: true)`.

**`OfflineDB`** — §R.9

- Removed `handleOfflineFailedUpdateMessagePendingTask`, `mergeFailedMessageUpdateIntoPendingSendMessage`.
- Added `handleUpdateMessagePendingTask`, `hardDeleteMessages`, `upsertMessageBehindChannelGuard`,
  `queriesBehindChannelGuard`.
- `getChannelsForQuery` takes `{ userId, options }` (filters/sort inside `options`) and returns
  `{ channels, predefinedFilter }`. — §N.1
- Event handlers and upserts retyped to `stream-chat` v10 types (`EventPayload<'…'>`, `ChannelStateResponseFields`,
  `PollResponseData`, `ReadStateResponse`, …).

**`OfflineStoreApis`** — P.6 · §N.1 · §R.9

- `currentUserId` → `userId`; `deleteReactionsForMessage` removed; `sort` is `SortParamRequest[]`;
  `deleteMessagesForChannel({ truncated_at })` takes `TimestampNS`; `getChannelsForFilterSort` returns
  `{ channels, predefinedFilter }`; `getAppSettings` returns `GetApplicationResponse`.

**`SqliteClient`** — `logger` is a `stream-chat` `Sink`; `dbVersion` 18. — §R.9

## 9. Component slots, icons and theme

- Two slots were removed: `ThreadMessageComposer` and `MessageList`, the ones `<Thread>` read in v9. Render the composer and the list you want as children of `<Thread>`. — §10.2 ·
  #3867
- No other `DEFAULT_COMPONENTS` slot or icon was added, removed or renamed, and the `Theme` type is identical. What
  changed is the **props and context** those slots receive (sections 3–4) — a custom slot written against v9 contexts
  must be re-checked.
- `MessageActionList` receives the same props as before, but its list is now built only while a message's menu is
  open. — §15.1 · #3866
- Behaviour of default slots: `NetworkDownIndicator` shows "Waiting for network..." (device offline, new key
  `common.waitingForNetwork.text`) or "Reconnecting..." (socket down after the settle delay) and no longer shows a
  load error. `ChannelListHeaderNetworkDownIndicator` and `NotificationAnnouncer` follow the same signals. — §L.7 ·
  §R.2

## 10. i18n and translations

- English-only bundle; no locale dictionaries are exported or bundled, nor are dayjs locales. — §19 · i18n · #3776
- Keys are stable dotted keys (`'a11y/Send message'` → `messageInput.sendMessage.accessibilityLabel`); every v9 key is mapped in
  `i18n-v10-key-map.json`. Old keys silently never match. — §19
- `a11y/…` keys became `.accessibilityLabel` leaves; count strings are `_one` / `_other` plural keys. — §19 · Q.1
- `t()` is typed to the catalog; app keys need `asDynamicKey('…')`; app dictionaries use `LooseTranslationDictionary`.
  — i18n
- App-callable formatter keys removed from the catalog: `duration/Location end at`, `duration/Remind Me`,
  `timestamp/ReminderNotification`, `timestamp/MessageEditedTimestamp` → register them yourself. — §R.10
- `getDateString({ date })` → `getDateString({ messageCreatedAt })` (returns `null` when unrenderable);
  `getDateStringForA11y` → `getCalendarDateStringForA11y`. These were deep imports in v9 and are root exports in v10.
  — §19
- Timestamps passed to `t('timestamp.X', { timestamp })` must be converted from nanoseconds. — §17.5
- Notification copy is keyed on `notification.type`; dictionaries keyed by the English prose no longer apply. — i18n

## 11. Offline storage

- `dbVersion` 16 → 18; full reinit on first launch, v9 pending tasks dropped. — §N.2
- Date columns holding server data TEXT (ISO) → INTEGER (unix ns); `pendingTasks.createdAt` and
  `userSyncStatus.lastSyncedAt` stay TEXT. — §N.2 · §17.5
- `AbstractOfflineDB.getChannelsForQuery` input/output reshaped; `syncManager.syncStatus` → `isSynced`. — §N.1 · §N.3 ·
  §R.9
- `insertReaction` / `updateReaction` skip reactions whose message is not cached. — §R.9
- `channelExists` now answers correctly (was always `true`). — §M.7

## 12. `stream-chat` v10 changes an RN integrator hits

The full list is `stream-chat`'s own (LLC link above). These are the ones RN apps meet through the SDK or the sample
apps' own code.

**State the SDK used to own** — §K · §R.7

- `channel.state` is a `StateStore` (`members`, `read`, `typing`, `watchers`, `ownCapabilities`, `data`, …); subscribe
  with `useStateStore`. In-place mutation does not notify.
- Message storage moved off `channel.state` (`messages`, `latestMessages`, `threads`, `pinnedMessages`,
  `isUpToDate`, `findMessage`, `addMessageSorted`, `loadMessageIntoState`, …) → `channel.messagePaginator`,
  `channel.pinnedMessagesPaginator`, `client.messageStore`, `client.threads.get(id)`.
- `channel.lastMessage()` → `channel.messagePaginator.latestMessage ?? undefined`.
- `channel.state` was a `ChannelState` class of mutable fields; its v9 field names are now non-reactive getters
  (`members`, `read`, `typing`, `watchers`, `member_count`, `watcher_count`). `channel.state.mutedUsers` →
  `client.mutedUsersStore`. — §K.1 · §K.2
- `channel.disconnected` → `channel.pendingDisposal`; `<Channel>` keeps rendering a deleted channel. — §K.8 · P.15
- `client.activeChannels` → `client.channelManager.get(cid)` / `.values()`; `releaseUnusedChannels()` frees them.
- `client.threads.state.threads` / `loadNextPage()` / `threadsById` → `client.threads.paginator`, `client.threads.get(id)`;
  `thread.state.replies` / `loadNextPage` / `loadPrevPage` → `thread.messagePaginator`.
- `channel.activate()` / `thread.activate()` return a release function (there is no `deactivate()`); custom
  channel/thread views must activate or recovery ignores them. — §K.4 · §L.4

**Connection** — §L · §R.2

- `recoverStateOnReconnect` / `client.recoverState()` → `client.connectionRecovery` (`client.config`). — §L.1 · §L.6
- `connection.changed` is never dispatched → `client.wsConnection.state`, `client.networkConnection.state`.
- `connection.recovered` fires on every reconnect path, also with recovery off (without a reload). — §L.2
- Requests with `watch` / `presence` wait for a connection id and throw when no socket is open. — §R.7

**Client construction and configuration** — §13.1 · §17.7

- `new StreamChat(key, secret?, options?)` → `new StreamChat(key, configTree)`; options move under `client`.
- `channel.getConfig()` → `channel.serverConfig` / resolved `channel.config`; `client.configs[cid]` →
  `client.channelServerConfigs[cid]`.
- `client.setMessageComposerSetupFunction` → `client.config.setSetupFunction('messageComposer', fn)`.
- Link previews are on by default (where `url_enrichment` is on); a custom `doUploadRequest` needs `customCdn: true`.

**Data shape** — §17.1 · §17.4 · §17.5

- Custom fields live under `.custom` on every entity, request and event (`channel.data.custom.name`,
  `message.custom.ai_generated`, attachment `custom.mime_type` …); `Custom*Data` augmentations type the `custom` bag.
- Server dates are `TimestampNS` (unix ns): `convertTimestampToDate`, `nsToDate`, `nowNs`, `asTimestampNS`.
- Sort is `SortParamRequest[]` everywhere; filters use `'custom.<field>'` keys.
- `message.moderation_details` → `message.moderation`.
- Hand-written types replaced by generated ones (renames such as `ReminderResponse` → `ReminderResponseData`,
  `SharedLocationResponse` → `SharedLocationResponseData`, `Mute` → `UserMuteResponse`, `MessageResponseBase` →
  `MessageResponse`, `ChannelSort` → `SortParamRequest[]`, `MessageRequest` → `SendMessageRequest`,
  `DeliveredMessageConfirmation` → `DeliveredMessagePayload`, `DraftFilters` / `DraftSort` / `Pager` →
  `QueryDraftsRequest`, search results are `SearchResultMessage` with an optional `message`, `connectUser` fixtures are
  `ClientUser`); some names kept with a different meaning (`User`, `Reaction`, `PollResponse`, `ChannelConfig`). — §R.8
- `Event` is a discriminated union: fields such as `e.me` or `e.total_unread_count` exist only on the event types that
  carry them; narrow with `EventPayload<'…'>`. — §17.5
- Client options such as `timeout` move under `client.axiosRequestConfig`. — §17.7

**Methods** — §17.2 · §17.3 · §R.8

- Path params first, then a request object: `channel.sendMessage({ message, ...options })`, `search({ payload })`,
  `queryUsers({ payload })`, `channel.queryMembers({ payload })`, `sendEvent({ event: { type, custom } })`.
- `client.queryChannels(request)` returns the raw response; `queryChannelsAndHydrate` returns `Channel[]`.
- `client.channel(type, id, { custom: { name }, members: [{ user_id }] })`; `channel.update({ name })` →
  `updatePartial({ set: { name } })` or `update({ data: { custom } })`.
- Push devices: `addDevice` → `createDevice({ id, push_provider, push_provider_name })`, `getDevices` →
  `listDevices()`, `removeDevice` → `deleteDevice({ id })`; `setLocalDevice` and the `device` option are removed.
- Moderation: `muteUser`, `flagMessage`, `flagUser`, `banUser`, `shadowBan` → `client.moderation.*`.
- Reminders: `upsertReminder({ message_id }, { remind_at: Date })`; live location:
  `stopLiveLocationSharing({ message_id })`, `LiveLocationManager.dispose()`.
- `channel.markRead()` is the direct request; the reporter/handler path is `channel.markReadViaReporter()` (or
  `useMarkRead`). `markRead` / `markUnread` throw when read events are disabled. — §5
- Optimistic send/edit/delete/reactions are `channel.messageOperations.*` (UI:
  `useMessageOperations()`). — §9
- `deleteMessage` options `{ hardDelete, deleteForMe }` → `{ hard, delete_for_me }`. — §17.2
- Uploads: `uploadFile` / `uploadImage({ file: { uri, name, type } })`. — §17.5

**Errors and logging** — §R.8

- `ErrorFromResponse` → `StreamAPIError`; 429 and `TOKEN_EXPIRED` are retried (up to ~100 s) and then throw
  `RetryError`.
- Logging moved to `chatLoggerSystem` and is on by default (console sink at `info`).

## 13. Behavioural changes (no symbol changed)

**Messages** — §9.1 · §16 · §M · §R.5

- Reactions are always optimistic and roll back on definitive failure (v9: only with offline support).
- Edits and deletes are optimistic; a failed delete is reverted; hard delete removes the row.
- Deleting a failed *edit* now deletes the message on the server (v9 removed every failed message locally).
- `sendMessage` errors reject instead of being swallowed. — §16.2
- Sending no longer clears `type: 'error'` messages from the list.
- Initial page size is 25 (v9 ≈100). — §16.1
- The `messageActions` function runs when a message's menu opens, not on every render of every row. — §15.1 · #3866

**`<Channel>`** — §L.4 · §R.5

- No event listener, reconnect resync or `channel.deleted` unmount; `client.connectionRecovery` reloads active channels.
- A failed mount `watch()` no longer shows the full-screen error; the error screen follows the paginator's
  `lastQueryError`.
- `initializeOnMount={false}` still runs a non-watching query when the paginator is empty.
- A provisional (members-only, id-less) channel is not queried on mount.
- `<Channel>` may render `channel.supersededBy` instead of the instance you passed.
- Reopening a channel whose paginator was left on an older page (after a jump to a quoted, pinned or searched
  message) shows the newest messages; skipped while a jump has landed or is loading, before a first-unread jump, and
  with `initializeOnMount={false}` (call `useJumpToLatestOnOpen()` yourself then). Same for `<Thread>`. — §8 · #3916
- `client.options.isLocalUnreadCountEnabled` is no longer read → `channel.config.readEvents.localUnreadCountEnabled`.
- Poll creation button shows before the server `polls` flag arrives.
- Composer `maxLength` follows `messageComposer.config.text.maxLengthOnSend`.

**`<Thread>`** — §10.3 · §L.10 · §R.5

- Renders on its own next to `<Channel>`; opening a thread, or pressing scroll-to-bottom in one, no longer marks the
  channel read. — #3867
- Shows `LoadingErrorIndicator` instead of the list and composer when the first reply page fails.
- Does not mark a thread with no replies as read.

**Channel list** — §18.5 · §N.4 · §R.6

- One shared `client.channelManager`; each list is a projection of its paginator's `filters` / `sort` (no
  promote-to-top, channels can leave a list when they stop matching).
- The app owns the list's `ChannelPaginator`: the list loads a first page only when the paginator has none (first
  mount, after `disconnectUser` empties it, or a new paginator), never re-queries on prop changes and never disposes
  it. `disconnectUser` empties registered paginators but keeps them registered. — §18.6 · #3869
- Recovery re-runs each list's first page; `<ChannelList>` has no reconnect listener.
- A list whose paginator was never queried loads its first page even when an event already put channels into it.
  — P.21 · #3916
- An empty `sort` means the backend default.
- Channel preview typing indicator ignores typing inside threads; `MessageFooter` shows the sender name when
  `memberCount !== 2`.

**Composer / uploads** — §O.3 · §13.1

- `pendingUploadsEnabled` written by `<Chat enableOfflineSupport>` once; it does not follow later toggles.
- The LLC waits for pending uploads before sending (no SDK send wrapper).

## 14. Deep imports

Only affects imports from `stream-chat-react-native-core/src/…` or `lib/…`. Deleted with no public replacement:
`ChannelsStateProvider` / `useChannelsStateContext` / `useChannelState`, `ActiveChannelsRefContext`,
`useChannelDataState`, `ChannelUnreadStateStore`, `MessagePreviousAndNextMessageStore`, `ChannelList/hooks/utils`
(pin/archive sort helpers), `useCreateMessageComposer`, and the
`utils/i18n/*` modules (their functions are root exports now). — §R.11

## 15. New public APIs (for the docs)

These replace removed APIs and need documentation:

- Components: `<Thread>` as a standalone, sibling-of-`<Channel>` component that renders its children.
- Hooks: `useJumpToLatestOnOpen` (#3916), `useMessagePaginator`, `useMessageOperations` (+ `MessageOperations` type), `useMarkRead`,
  `useIsTargetedMessage`, `useChannel`, `useIsMessageReadByOthers`, `useIsMessageDeliveredToOthers`,
  `usePendingUploadsEnabled`, `useConnectionLifecycle`, `useNetworkConnectionState(Selector)`,
  `useWSConnectionState(Selector)`, `useSettledWSConnectionHealth`.
- Values: `DEFAULT_HIGHLIGHT_DURATION`, `netInfoStatusReporter`, `pendingUploadsEnabledSelector`,
  `getPlayableVideoUrl`, `ChannelListState`, `ChannelMemberPick`.
- i18n: `asDynamicKey`, `runtimeDefaults`, `englishCalendarFormats`, `predefinedFormatters`, `defaultDateTimeParser`,
  `getDateString`, `getDateStringForA11y`, `getCalendarDateStringForA11y`, `isDate`, `isNumberOrString`, and the types
  `TranslationKey`, `TranslationCatalog`, `TranslationDictionary`, `LooseTranslationDictionary`, `StreamTFunction`,
  `DynamicTranslationKey`, `Streami18nOptions`, `CustomFormatters`, `FormatterFactory`, `PredefinedFormatters`,
  `DayjsLocaleConfig`, `DateTimeParserModule`, `DurationFormatterOptions`, `TimestampFormatterOptions`.
- Context fields / props: `<ChannelList paginator>` (required), `ChannelsContext.paginator`,
  `ChatContext.getAppSettings`, `ChannelListView.paginator`, `MessageContext.messageActionHandlers` (type
  `MessageActionHandlerCallbacks`), `MessageContext.isVeryLastMessage`, `MessagesContext.onAlsoSentToChannelHeaderPress`,
  `Thread.allowThreadMessagesInChannel` and the `<Channel>` config props on `<Thread>`, `MessageStatus.read` /
  `delivered`, `MessageList.pendingUploadsEnabled`, `TypingIndicatorContainer.threadId`.

## 16. Known issues found by the audit

Fix these before release, or document them as limitations:

- None open. (The guide's links into `stream-chat-js` now target anchors of its `ai-docs/v10-breaking-changes.md` on
  `release-v10` instead of the deleted root `v9-to-v10-migration-guide-*.md` files.)

## 17. No-action fixes: detail moved from the migration guide

The migration guide keeps a one-line "No action" note for each of these; the full write-up is here. The fixes made
on `V10` after the guide's last update are listed first.

### #3916 (V10 @ `74884ff55`)

- `<ChannelList>` treats a paginator that was never queried as unloaded, so a list that mounts after
  `ChannelManager.ingestChannel()` routed an event into its paginator (opened from a push notification, or a second
  list such as archived channels) runs its first query instead of showing only the routed channels. — P.21
- `useJumpToLatestOnOpen` (exported): `<Channel>` / `<Thread>` (through `ChannelShell`) call
  `paginator.jumpToTheLatestMessage()` in a layout effect when a channel or thread opens on an older page, because
  `watch()` returns early for a channel that is already watched and loaded. It does nothing when the paginator has no
  items, is at the head, is loading, or `<Channel>` has a pending initial target (a focus signal, or the first-unread
  jump); not run under `initializeOnMount={false}`. — §8
- The `useChannelPreviewData` selector returns the `pinned` flag instead of the membership object (#3910). No API
  change.

### Guide L.8 Unsent messages now survive a reconnect rebuild (bug fix)

`channel.reload()` and `thread.reload()` both preserve failed (locally unsent) messages across the
refresh. They already intended to, but the check for "did this one fall out?" read the paginator's
item *index* rather than its visible window — and on a disjoint rebuild (the loaded window shares no
id with the server's newest page, e.g. after scrolling up into old history) a message can sit in the
index while being absent from the rendered list. So the re-ingest was skipped on exactly the path
that needed it, and the user's unsent message disappeared from the list on reconnect.

No API change and nothing to do — noted because if you worked around it by re-adding failed messages
yourself after a reconnect, that workaround is now redundant.

For threads there was a second hole: the preservation relied on `Thread`'s `failedRepliesMap`, which
is only written by `upsertReplyLocally` — whose callers are the thread's own subscriptions and the
offline-DB path that looks threads up in `client.threads`. Neither covers a thread constructed directly
with `new Thread()` and never registered (`thread.activate()` and `client.threads.ensure()` register one
immediately; `client.threads.get(id)` resolves it). `thread.reload()` now reads the failed replies out of
the reply paginator instead, so it holds for managed and unmanaged threads alike.

### Guide L.9 The reconnect refresh now finds messages you never had (bug fix)

Two defects meant a reconnect could refresh a channel or thread and still miss content that arrived
while you were away. Both are fixed; no API change.

- **The request was sized to what was already loaded.** `channel.reload()` / `thread.reload()` asked
  for `loadedCount` items, so a window holding one message asked the server for one message — new
  content was undiscoverable, and the single item that came back was disjoint from the loaded window,
  so the fold rebuilt and dropped what was there. Now at least a page is requested.
- **A window nothing had ever anchored discarded the page entirely.** When the first query returns
  empty and the only content arrives live — a thread or channel created in the current session — the
  fetched page was thrown away rather than merged. It is now anchored instead.

Most visible as: create a thread, send a reply, go offline, someone else replies, come back — the new
replies never appeared, and re-entering the thread did not help.

### Guide L.10 A brand-new thread no longer reports an error (bug fix)

A parent with no replies has no server-side thread, so `getThread` answers "not found". That was being
treated as a failed refresh and reported as one, so simply opening a new thread raised an error state.
It is now recognised as the expected answer — `reload()` resolves quietly instead of rejecting.

A genuine failure still rejects as before, including a thread that *did* have replies and comes back
not-found (its parent was deleted, possibly while you were offline). The two are told apart by
`replyCount`, which — unlike `deletedAt` — survives having missed the deletion event.

Related: the SDK no longer issues a mark-read for a reply-less thread. There is nothing that could be
unread, and the call only ever 404'd.

### Guide M.1 Editing a message is optimistic again, and persisted (bug fix)

An edit shows immediately and is written to the offline DB before the request is made, so it survives
a cold start and the hydration `<Channel>` performs on mount. v9 did both (`Channel.tsx` wrote the
optimistic copy through `db.updateMessage`); v10 kept neither.

`message_text_updated_at` is stamped optimistically too, so the "edited" indicator appears at once —
except when the message being edited is itself `failed`, which never had a server-confirmed text
update to advertise.

**An edit is never rolled back.** Reverting would discard text the user typed. What changes is only
whether the failure is shown on the message:

- **Offline support enabled and the request was queued for replay** — the message does **not** enter a
  failed state. It is pending, not failed, and marking it failed lights up the retry affordance, which
  re-*sends* the message rather than re-editing it. The request still rejects, so the composer still
  reports the failed edit.
- **No offline DB, or a definitive rejection** (a server error that is not retryable, or a cancelled
  request) —
  the message keeps the edit and gains `status: 'failed'` plus `error`, as before.

The predicate is the same one reactions already use: an offline DB is present **and** the error is
`isEphemeral`.

### Guide M.3 Unsent messages survive closing the app (bug fix — data loss)

Every send now writes the message to the offline DB **before** the request, pessimistically marked
`failed`, and overwrites it with `received` on success. A process death anywhere between composing and
the server's ack therefore leaves a message that hydrates as failed and retryable, instead of one that
silently disappears. This is v9's write-ahead (`Channel.tsx`), which v10 dropped when `sendMessage`
moved into `stream-chat`'s message operations (`channel.messageOperations.send`).

No schema change and no `dbVersion` bump: `status` already round-trips through the storable's
`extraData` blob.

The retry payload does not need persisting alongside it. `MessageOperations.retry` reconstructs the
request from the message when its in-memory `failedSendCache` is cold, so a persisted failed message
stays retryable past that cache's 5-minute TTL and across restarts.

`channel.reload()` also consults the DB, not just the in-memory window, when deciding which failed
messages a reconnect has to put back — a message evicted from the paginator, or one on a cold boot that
the paginator never held, was previously unrecoverable. v9 got this from a second, lagging copy of the
message list (the SDK's own React state); with a single reactive source of truth the persisted row is
that buffer.

### Guide M.4 An empty request response no longer overwrites local state (bug fix)

`formatMessage(undefined)` does not throw — it returns `{ status: 'received', created_at: <now>,
updated_at: <now> }`. Because that `updated_at` is *now*, it beat the "is the server copy newer?" check
and was ingested as an id-less message. v9 guarded every apply with `if (response?.message)`; the guard
is back. Reachable from a custom `sendMessageRequest` / `updateMessageRequest` / `deleteMessageRequest`
that resolves without a `message`.

### Guide M.5 Editing or deleting a thread parent from inside a thread works (bug fix)

The reply paginator's local filter is `{ cid, parent_id }`, and a parent message has no `parent_id` —
so routing a parent edit or delete through the open thread's instance (which is what the SDKs do while
a thread is on screen) handed it to a collection that could not hold it, and the operation was silently
dropped. Optimistic writes now fall back to the client-global message store when the paginator does not
accept the message, reaching it wherever it is held and fanning out to every collection that holds it —
the same addressing `applyReactionLocally` uses. The SDK additionally routes by membership rather than
by "is a thread open", mirroring `sendReaction`.

### Guide M.7 The offline channel guard actually guards now (bug fix)

`channelExists` ran `SELECT EXISTS(SELECT 1 FROM channels WHERE cid = ?)` and returned
`rows.length > 0`. `SELECT EXISTS` always returns exactly one row — holding `0` or `1` — so the row
count carried no information and the helper reported `true` for every cid, present or not. It has done
so since offline support v2 shipped; the LLC's tests mock `channelExists`, so the logic was covered and
the SQL never was.

Its only consumer is `AbstractOfflineDB.queriesWithChannelGuard`, used by ten WS-event handlers
(`message.new`, `message.deleted`, `message.updated`, `message.read`, `member.*`, `reaction.*`, …). Its
gate is `forceUpdate || !(await channelExists({ cid }))`, which collapsed to `forceUpdate` — so the
branch that recreates a missing channel row from the event never ran, and those writes died on the
`messages.cid → channels.cid` foreign key and were swallowed by the detached query runner.

Reachable whenever an event arrives for a channel the DB has no row for: after `resetDB()` (which the
sync-failure path and a >30-day-stale sync both trigger) until the next channel-list query; in the
window between `queryChannels` resolving and its persistence completing (and `channel.query`'s
persistence is detached, widening it); and after being added to a channel mid-session. The message list
self-heals on the next query — reactions, read state, member changes and older messages in those
windows did not.

**Both channel guards are also lazy now.** `queriesWithChannelGuard` and
`upsertMessageWithChannelGuard` attempt the write first and only probe for the channel row when it
fails, repairing and retrying once; a failure with the channel row present is rethrown without a retry.
Every statement involved is an upsert, so the retry is idempotent. The eager probe is kept for
`execute: false` callers (collecting queries for someone else's batch, so there is no failure to catch)
and for `forceUpdate`.

That inversion matters because the probe is a native round-trip, not a cheap read. Measured through
op-sqlite on device: the probe costs ~0.5ms against ~8-12ms for the message upsert it protects, and
roughly two thirds of that is the JS↔native crossing rather than the query. Removing it from the happy
path takes it off every message received as well as every message written — so message writes are
cheaper than they were before this release, not more expensive.

### Guide P.10 Message list behaviour fixes

These change what the user sees:

- **Thread lists use the thread's paginator for everything.** They used to drive the channel's. So:
  - closing a thread no longer leaves the channel counting new messages as unread while the user is at
    its bottom (the "1 new messages" separator that stuck after returning from a thread);
  - the scroll-to-bottom button in a thread jumps the thread to its latest replies, where it used to
    move the hidden channel list;
  - in `MessageFlashList` threads, a channel that had jumped away no longer turns autoscroll off;
  - the sticky date header hides at the top of the thread;
  - a spinner shows while newer replies load, and the empty-state check follows the thread;
  - rows in a thread read the thread's unread separator and last-bubble state, and the
    scroll-to-bottom button in a thread no longer marks the channel read.
- **A failed page no longer stops pagination.** The lists remembered every list length they had
  requested at, so after a failed request that edge stayed dead until a new message arrived.
- **Removing a message no longer scrolls `MessageList` to the bottom.** Cancelling a giphy or a hard
  delete used to jump a user who had scrolled up back to the newest message. (`MessageFlashList` never
  scrolled; it only blocked paging for a moment.)
- The scroll-to-bottom accessibility action's unread count updates as reads arrive.

### Guide P.14 `<Chat>` follows the connected user

`<Chat>` used to read `client.userID` during render, so a `<Chat>` mounted before `connectUser()`
resolved only noticed the user, and only set up the offline database for them, if something
unrelated re-rendered it. It now re-reads the user whenever the client's connection state changes,
and the offline database's state from the instance it attached. No API change.

### Guide P.16 Channel behaviour fixes

- **The contexts follow the channel instance, not its id.** A disposed channel comes back as a new
  instance under the same cid. `ChannelContext` kept handing out the old one, whose paginators were
  already disposed. `useCreateChannelContext` now rebuilds when `channel` changes.
- **`useChannelContext().disabled` updates when the channel is frozen or unfrozen.** It used to update
  only because an unrelated write happened to re-render `<Channel>`.
- **`<Channel>` no longer re-renders on channel updates that leave its own capabilities unchanged.**
- **`overrideOwnCapabilities` applies when a different capability is overridden.** `{ sendMessage: false }`
  followed by `{ uploadFile: false }` used to keep the first override.
- **Going to the background sends `typing.stop` only if the user was typing.** It used to send one for
  every mounted `<Channel>` each time.

### Guide P.18 Editing a message

- Editing a message again after cancelling an edit starts from the message, not from the text the
  cancelled edit left behind.
- Saving or cancelling an edit leaves edit mode by itself; the composer clearing is the signal.
- `useMessageComposer()` returns the same composer as before, read from context. Calling it no longer
  subscribes the composer once per component.

### Guide P.19 Composer behaviour fixes

- `SendMessageDisallowedIndicator` shows as soon as the channel's capabilities are known, including a
  channel loaded from the offline database. It used to wait for the channel to be initialized, which
  could arrive after the composer had already rendered.
- The commands button, the attach button and the commands sheet follow capabilities and server config
  that arrive after the composer mounted.
- Attachment picker cells no longer re-render on every upload progress tick; a cell re-renders only
  when its own selection changes.

### Guide P.21 Channel list behaviour fixes

- **Changing `onSelect`, `getChannelActionItems`, `maxUnreadCount`, `additionalFlatListProps`,
  `loadMoreThreshold`, `numberOfSkeletons` or `setFlatListRef` on a mounted `ChannelList` takes effect.**
  They used to be kept until the list happened to change. `setFlatListRef` is no longer called with
  `null` and then the list again on every list update.
- **A mounted `ChannelList` loads again after `client.disconnectUser()` and the next `connectUser()`.**
  It used to stay on its loading skeleton.
- **A channel row shows a draft that has only attachments**, as thread rows already did.

### Guide P.22 Thread list behaviour fix

A thread list row takes its latest reply, which sets its avatar and time, from
`thread.messagePaginator.aggregateState`. It used to take the last reply of the thread's loaded page,
which is an older reply once the thread has been scrolled back.

### Guide Q.2 Behaviour fixes

- **Reactions sheet** (`MessageUserReactions` / `useFetchReactions`):
  - reactions added to other messages no longer appear in an open sheet;
  - the sheet no longer refetches, and briefly empties, on every reaction to its message;
  - offline, the sheet shows the reactions stored in the offline database again, through
    `client.queryReactionsAndHydrate` (as in v9);
  - the counts come from `reaction_groups`, so a reaction added offline or not yet confirmed is
    counted.
- **Reminder header:** setting or clearing the time of an existing reminder switches the message
  header between "Saved for later" and the reminder right away.
- **`useHandleLiveLocationEvents`:** another message's ended share no longer marks the watched
  location as stopped.
- **`usePollAnswersPagination` / `usePollOptionVotesPagination`:** votes and answers that arrive
  together are all kept. Only the last one used to survive.
- **Thread list:** a failed refresh from the "new threads" banner shows "Couldn't load new threads. Tap
  to retry", and tapping it retries. The tile could not appear before, and was not pressable.
- **Channel list swipe sheet:** a direct chat shows "Online" when the other member is online. It used to
  read the watcher count, which includes the current user, so the label was inverted.
- **Sticky date header:** it shows again after scrolling back down from the oldest message.
- **`MessageFlashList`:** a channel whose messages fit on screen no longer shows the date twice (the
  sticky header over the inline separator).

## Regenerating this list

The audit scripts are not checked in; the recipe is:

1. Check out `develop` and `V10` side by side, `yarn install` in both, `yarn build` in both.
2. Snapshot each public surface with the TypeScript compiler API: walk `checker.getExportsOfModule()` for
   `package/src/index.ts`, `package/src/ai-components/index.ts` and `contexts/componentsContext/defaultComponents.ts`;
   flatten props (first call-signature parameter), `Context.Provider` `value` members, interface/type members (`Theme`
   recursively) and class members; collect referenced `stream-chat` types. Diff the two snapshots (normalise union
   ordering).
3. Copy `develop`'s `examples/SampleApp` and `examples/ExpoMessaging` sources next to `V10`'s `node_modules` and run
   `tsc --noEmit`; every error must map to an entry here.
4. Review PRs merged into `V10` (`gh pr list --base V10 --state merged`) for behaviour changes.
