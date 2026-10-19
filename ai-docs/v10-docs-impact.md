# stream-chat-react-native v10 — docs impact assessment

Covers the `V10` branch plus the stacked PRs #3866 (message actions take no arguments), #3867 (standalone `<Thread>`), #3868 (internal `<Channel>` lifecycle refactor, no public API change) and #3869 (app-owned `ChannelPaginator` on `<ChannelList>`).

Scope: `getstream.io/content/docs/chat-sdk/react-native/v9-latest/` (302 pages), the source the v10 docs will be derived from. The breaking changes themselves are listed in [`v10-breaking-changes.md`](./v10-breaking-changes.md); section references like §4 or P.11 point to [`ai-migration-v9-to-v10.md`](./ai-migration-v9-to-v10.md). Inputs: the machine-generated v9.54 -> v10.0.0-rc.22 public-surface diff (1,295 entries), compile errors from building the v9 sample apps against v10 (SampleApp, ExpoMessaging), the agent migration ledger (`ai-docs/ai-migration-v9-to-v10.md`, `i18n-v10-migration.md`, `channel-state-ui-migration.md`) and the `stream-chat` v10 migration guides. The stacked PRs were added from their descriptions, the ledger sections written with them (§10, §10.1-10.3, §15.1, §18.1, §18.6) and the stacked code.

Method: a term scanner (`scan.js`) matched every removed export, removed/retyped prop (scoped to its component: JSX attribute, props-table row, or heading on the owning page), removed context field (scoped to `useXContext()` / `useContext(XContext)` destructuring and the context page table), changed hook/function signatures, i18n keys/APIs, `stream-chat` method/type changes, Date usage on server timestamps, custom fields read at the root, sort objects and deep imports. 119 pages had raw hits (~900); each was triaged by hand (false positives removed, missed items added as "manual" findings). The stacked PRs were covered by a second grep pass (`<Thread>` inside `<Channel>`, `<Channel thread>`, `threadList`, `ThreadMessageComposer`, the removed `<Thread>` props, `<ChannelList filters|sort|options|lockChannelOrder|queryChannelsOverride>` and every bare `<ChannelList />`, message-action handlers / `messageActions` / `supportedReactions` outside `<Channel>`, `useMessageActions(`/`useMessageActionHandlers(` with arguments, `onAlsoSentToChannelHeaderPress`, `allowThreadMessagesInChannel`), triaged the same way (false positives: `supportedReactions` props on the reaction-list components and `handleRetry` on upload previews are unchanged; `<Message {...props} />` in a custom wrapper still compiles). Line numbers refer to the v9-latest files.

## Summary

**109 pages need changes**, out of 302 (99 on `V10` alone; the stacked PRs add 10 pages and raise 4):

| Severity | Pages | Meaning |
| --- | --- | --- |
| Delete / replace page | 6 | Documents an API removed in v10; delete or replace with a page for the successor API |
| Major rewrite | 22 | Core concept or most snippets on the page no longer apply |
| Snippet / prop-table update | 56 | Specific snippets, props/values tables or types need edits |
| Mention only | 25 | Wording, a type name, a version number, a cross-reference, or a one-attribute snippet edit (`paginator={paginator}` on a bare `<ChannelList />`) |

Rough sizing (assumption: a writer familiar with v10; excludes review): DELETE ~0.5 h each incl. redirect (6); MAJOR ~0.5-1 day each (22); UPDATE ~1-2 h each (56); MENTION ~15 min each (25); plus 12 new pages/sections below (~0.5-1 day each, the v9->v10 migration guide ~3 days). Total roughly 6.5-8.5 writer-weeks (the stacked PRs add about half a week: two more major rewrites, and heavier thread and channel-list rewrites).

The remaining ~200 pages had no hits or only false positives (e.g. `ChannelEditDetails*` still takes `doFileUploadRequest`; `localId` props on upload indicators are unchanged; `client.blockUser`/`muteUser` calls are unchanged).

### Top 10 most impacted pages

1. `02-ui-components/10-thread/02-thread-context.md` — Major rewrite (27 distinct breaking items, 32 hits)
2. `02-ui-components/06-channel/02-channel-context.md` — Major rewrite (23 distinct breaking items, 33 hits)
3. `02-ui-components/06-channel/01-channel.md` — Major rewrite (24 distinct breaking items, 30 hits)
4. `02-ui-components/10-thread/01-thread.md` — Major rewrite (22 distinct breaking items, 30 hits)
5. `02-ui-components/05-channel-list/01-channel-list.md` — Major rewrite (19 distinct breaking items, 39 hits)
6. `03-ui-cookbook/03-customize-channel-list.md` — Major rewrite (16 distinct breaking items, 23 hits)
7. `05-advanced-guides/09-translations.md` — Major rewrite (5 distinct breaking items, 46 hits)
8. `02-ui-components/04-chat/02-chat-context.md` — Major rewrite (10 distinct breaking items, 12 hits)
9. `02-ui-components/05-channel-list/14-channels-context.md` — Major rewrite (9 distinct breaking items, 12 hits)
10. `05-advanced-guides/17-channel-read-state.md` — Major rewrite (9 distinct breaking items, 12 hits)

### Pages to delete / replace

- `02-ui-components/04-chat/03-hooks/02-use-app-settings.md` — `useAppSettings` removed (P.12). Redirect to ChatContext `getAppSettings()` (`await useChatContext().getAppSettings()`); `AppSettingsAPIResponse` type is now `GetApplicationResponse`.
- `02-ui-components/04-chat/03-hooks/04-use-is-online.md` — `useIsOnline` removed -> `useConnectionLifecycle(client, closeConnectionOnBackground)` (returns nothing). Replace with a new "Connection state" page documenting `useNetworkConnectionState(Selector)`, `useWSConnectionState(Selector)`, `useSettledWSConnectionHealth`, `useConnectionLifecycle`, `netInfoStatusReporter`.
- `02-ui-components/05-channel-list/15-hooks/01-channel-list/01-use-channel-updated.md` — `useChannelUpdated` removed (§18.2); `channel.updated` handled by `client.channelManager`.
- `02-ui-components/13-contexts/06-paginated-message-list-context.md` — Context removed (§3). Replace with a new "Message paginator" page (`useMessagePaginator`, `channel.messagePaginator`, `toTail/toHead`, `hasMoreTail/hasMoreHead`, `isLoading`).
- `02-ui-components/13-contexts/10-typing-context.md` — Context removed (§2) -> `useStateStore(channel.state, (s) => ({ typing: s.typing }))`; fold into the new channel-state page.
- `02-ui-components/18-channel-state-hooks/11-use-selected-channel-state.md` — `useSelectedChannelState` removed (P.1) -> `useStateStore(channel.state, selector)`; `EventTypes` (L32) also gone.

### Major rewrites

- `02-ui-components/01-overview.md` (new with the stacked PRs)
- `02-ui-components/04-chat/02-chat-context.md`
- `02-ui-components/04-chat/03-hooks/03-use-create-chat-context.md`
- `02-ui-components/05-channel-list/01-channel-list.md`
- `02-ui-components/05-channel-list/14-channels-context.md`
- `02-ui-components/06-channel/01-channel.md`
- `02-ui-components/06-channel/02-channel-context.md`
- `02-ui-components/10-thread/01-thread.md`
- `02-ui-components/10-thread/02-thread-context.md`
- `03-ui-cookbook/03-customize-channel-list.md`
- `03-ui-cookbook/06-message-input-customization.md`
- `03-ui-cookbook/10-file-compression.md`
- `03-ui-cookbook/27-date-separators.md`
- `04-state-and-offline-support/01-state-overview.md`
- `05-advanced-guides/02-date-time-formatting.md`
- `05-advanced-guides/05-typescript.md`
- `05-advanced-guides/07-stream_chat_with_navigation.md` (new with the stacked PRs)
- `05-advanced-guides/09-translations.md`
- `05-advanced-guides/13-push-notifications.md`
- `05-advanced-guides/14-accessibility.md`
- `05-advanced-guides/17-channel-read-state.md`
- `05-advanced-guides/19-message-reminders.md`

### Cross-cutting themes (drive most of the edits)

1. **State moved out of React context into `stream-chat` stores.** `TypingContext`, `PaginatedMessageListContext` and most of `ChannelContext`, `ThreadContext`, `ChannelsContext`, `ChatContext`, `MessagesContext` values are gone; replaced by `useStateStore(channel.state | channel.messagePaginator.state | thread.state | paginator.state, selector)` plus new hooks `useMessagePaginator`, `useMessageOperations`, `useMarkRead`, `useIsTargetedMessage`. Every context reference page and every snippet that destructures those values changes.
2. **Threads are `Thread` instances, rendered by a standalone `<Thread>` next to `<Channel>`.** `<Thread thread={thread}>` (required `Thread` instance) renders its children (`<MessageList />` / `<MessageFlashList />` + `<MessageComposer />`) and needs no `<Channel>` above it; the v9 pattern `<Channel channel thread threadList><Thread /></Channel>` is gone, and so are `<Channel thread>`, `threadList` everywhere (ChannelContext, MessageContext, the `Message`/`MessageList`/`MessageFlashList`/`MessageComposer`/`MessageContent`/`MessageReplies` props; use `useThreadContext().thread`), the `ThreadMessageComposer` slot and `<Thread>`'s list/composer props (`additionalMessage*Props`, `shouldUseFlashList`, `autoFocus`, `disabled`, `closeThreadOnDismount`, `client`, the loaders). `ThreadContext` is `{ thread?, allowThreadMessagesInChannel }`, provided only by `<Thread>` (no throw outside it). `onThreadSelect` on `MessageList`/`MessageFlashList`/`Message`/`ThreadList` yields a `Thread`; `ThreadType` and the `{ thread, threadInstance }, channel` callback shape are gone; imperative `openThread`/`closeThread`/`loadMoreThread`/`reloadThread` removed. Consequences for every guide: the channel screen no longer needs to know about the open thread (the "keep `thread` on `<Channel>` in sync" advice in navigation/troubleshooting is obsolete), opening a thread no longer marks the channel read, and **configuration props set on `<Channel>` (`messageActions`, `handleX`, `supportedReactions`, `keyboardVerticalOffset`, `topInset`, `onAlsoSentToChannelHeaderPress`, …) no longer reach the thread: pass the same set to `<Thread>`**. Touches thread pages, overview, navigation, troubleshooting, livestream, message customization, message actions/reactions/blocking recipes, custom thread list, composer/message prop tables.
3. **`<Channel>` behaviour props -> `client.config`.** `doMarkReadRequest`, `doSendMessageRequest`, `preSendMessageRequest`, `doUpdateMessageRequest`, `doFileUploadRequest`, throttle props, `maximumMessageLimit`, `allowSendBeforeAttachmentsUpload`, `messageId` are removed; replacements are `client.config.set({ channel: { requestHandlers, messagePaginator }, messageComposer: { attachments } })` and paginator jumps. Channel page, performance guide, file compression, message input customization, date separators.
4. **`<ChannelList>` renders an app-owned `ChannelPaginator`.** `paginator` is a required prop; `filters`, `sort`, `options`, `lockChannelOrder`, `queryChannelsOverride` (and the `ChannelListQueryChannelsOverride` type) are removed. The app creates `new ChannelPaginator({ client, id, filters, sort, requestOptions: options, paginatorOptions: { lockItemOrder, doRequest } })` (from `stream-chat`) with the user, registers it with `client.channelManager.insertPaginator({ paginator })` (unregistered = no live updates), and on logout calls `removePaginator(paginator)` + `paginator.dispose()`. Changing the query is a paginator change (`paginator.staticFilters` / `sort` + `reload()`, or a new paginator with a new `id`); a remounted list shows its channels without re-querying. Also: 10 per-event override props and `useChannelUpdated` removed (the list is a projection of the paginator's query; global handling via `client.channelManager.addEventHandler`, floating via `paginator.boost`); `sort` is `SortParamRequest[]`; `ChannelsContext` holds config + `paginator`. Every `<ChannelList />` snippet in the docs (16 pages) needs `paginator={paginator}`; 7 pages where that is the only change are graded Mention only.
5. **Message actions are built when the menu opens.** `useMessageActions()` / `useMessageActionHandlers()` take no arguments and must be called inside a message (custom `Message`, custom `MessageActionList`, overlay content); `MessageActionsHookProps` removed; the row's handlers are on `MessageContext.messageActionHandlers` (`MessageActionHandlerCallbacks`). `handleX`, `messageActions` and `supportedReactions` are no longer `<Message>` props (passing them to a `<Message>` does not reach the menu): set them on `<Channel>` (and `<Thread>`); per-message customisation goes through the `messageActions` function, which now runs when a message's menu opens rather than on every render. The v9 docs already configure all of this on `<Channel>`, so the docs impact is small (message actions recipe, MessagesContext/MessageContext tables).
6. **i18n v10.** English-only bundle (12 `*Translations` exports gone), stable dotted keys (v9 keys were the English copy; old keys fail silently), typed `t` (`asDynamicKey` for app keys), `a11y/*` and `timestamp/*` namespaces renamed, `Streami18n` API changes (`setLanguage` -> void, `getTranslators` -> `init`, listeners -> `state` store, single options object). Translations, date-time formatting, accessibility, reminders and every snippet calling `t("English copy")`.
7. **`stream-chat` v10 surface in snippets.** Server timestamps are unix-ns `TimestampNS` numbers (`created_at.toDateString()`, `.getTime()`, `new Date(ts)` break); custom fields live under `.custom` (`channel.data.custom.name`, `message.custom.ai_generated`, `attachment.custom.mime_type`); methods take request objects (`channel.sendMessage({ message })`, `queryChannelsAndHydrate({ filter_conditions, sort })`, `createDevice/deleteDevice`, `getMessage({ id })`); `client.activeChannels` -> `client.channelManager`; options are a config tree; `connection.changed` removed; server-side APIs removed (`api_secret`, `updateAppSettings`); `moderation_details` -> `moderation`.

### New pages / sections needed (concepts introduced in v10 with no docs)

| New page / section | Suggested location | Replaces / absorbs |
| --- | --- | --- |
| **Upgrading from v9** migration guide (human version of the ledger: contexts -> stores, threads (standalone `<Thread>` next to `<Channel>`), Channel props -> `client.config`, app-owned `ChannelPaginator`, message-action hooks without arguments, i18n, `stream-chat` v10 type surface, behavioural changes) | `06-migration-guides/01-upgrading-from-v9.md` | — (link from every DELETE page) |
| **Message paginator**: `useMessagePaginator`, `channel.messagePaginator` / `thread.messagePaginator`, `toTail`/`toHead`, `hasMoreTail`/`hasMoreHead`/`isLoading`/`lastQueryError`, `jumpToMessage` / `jumpToTheFirstUnreadMessage` / `jumpToTheLatestMessage`, `messageFocusSignal` + `useIsTargetedMessage` + `DEFAULT_HIGHLIGHT_DURATION`, `unreadStateSnapshot`, `maxLoadedItems`, page size 25 | `02-ui-components/07-message-list/` or `04-state-and-offline-support/` | `13-contexts/06-paginated-message-list-context.md`, `Channel.messageId`, `maximumMessageLimit` |
| **Instance configuration (`client.config`)**: `client.config.set(...)`, `setSetupFunction("messageComposer", fn)`, request handlers (`markReadRequest`, `sendMessageRequest`, `retrySendMessageRequest`, `updateMessageRequest`), `messageComposer.attachments.{doUploadRequest, customCdn, pendingUploadsEnabled}`, `channel.messagePaginator.{pageSize, stateThrottleMs, maxLoadedItems}`, resolved gates (`channel.config.typingEvents.enabled`, `channel.serverConfig`), client options as config tree | `05-advanced-guides/` (new) | Channel `do*Request` examples, throttle props, `allowSendBeforeAttachmentsUpload`, `setMessageComposerSetupFunction` |
| **Channel state & `useStateStore` patterns**: unified `channel.state` store (`members`, `read`, `watchers`, `watcherCount`, `typing`, `membership`, `aiState`, `pendingDisposal`, `active`), module-scope selectors, `channel.activate()` (returns its release function), `useChannel()`, thread `thread.state` | `04-state-and-offline-support/01-state-overview.md` (rewrite) + `18-channel-state-hooks/` index | `13-contexts/10-typing-context.md`, `useSelectedChannelState`, ChannelContext scalar fields |
| **Connection state & recovery**: `useNetworkConnectionState(Selector)`, `useWSConnectionState(Selector)`, `useSettledWSConnectionHealth`, `useConnectionLifecycle`, `netInfoStatusReporter`, `client.connectionRecovery` (enable/disable, `recover()`), `connection.recovered` semantics | `02-ui-components/04-chat/03-hooks/` (replace use-is-online) + advanced guide | `04-use-is-online.md`, `ChatContext.isOnline/connectionRecovering`, `recoverStateOnReconnect` |
| **Message operations**: `useMessageOperations()` (`sendReaction`, `deleteReaction`, `deleteMessage` with snake_case options, `retrySendMessage`, `removeMessage`, `updateMessage`), optimistic lifecycle owned by `stream-chat`; message-action hooks `useMessageActions()` / `useMessageActionHandlers()` (no arguments, call inside a message or a custom `MessageActionList`), `MessageContext.messageActionHandlers` | hooks section near MessagesContext | removed `MessagesContext` ops, `MessageActionsHookProps` |
| **Mark read**: `useMarkRead(channel)`, reporter-driven cadence, `channel.markReadLocally()` | merge into rewritten `17-channel-read-state.md` | `ChannelContext.markRead`, `doMarkReadRequest` |
| **Standalone `<Thread>` / Thread instance**: `<Thread thread={thread}>` rendered as a sibling of `<Channel>` (own screen or in place of the channel UI), composing `<MessageList />`/`<MessageFlashList />` + `<MessageComposer />` as children; app-owned selected-thread state (`onThreadSelect` -> state/navigation params, `onThreadDismount` to clear it); passing the same configuration props as `<Channel>`; `allowThreadMessagesInChannel` / `notificationHostId` / `onThreadDismount`; `parentMessagePreventPress` on `ThreadFooterComponent`; `useThreadContext().thread` to detect a thread subtree; `client.threads.ensure({ channel, parentMessage })` from a message/push/deep link, `thread.messagePaginator`, `thread.state.parentMessage`, thread read state (marks itself read while open; opening it does not mark the channel read), `client.threads.paginator` for the list | `02-ui-components/10-thread/` | `<Channel thread threadList>` pattern, `<Thread>` list/composer props, `ThreadMessageComposer`, ThreadContext loaders, `ThreadType` |
| **App-owned `ChannelPaginator`**: creating it with the user (`new ChannelPaginator({ client, id, filters, sort, requestOptions, paginatorOptions: { pageSize, lockItemOrder, doRequest } })`, with a `useCreateChatClient` variant: `useMemo` on `client` + an effect that inserts/removes it), registering it (`client.channelManager.insertPaginator({ paginator })`; unregistered lists get no events), disposing on logout (`removePaginator` + `dispose()` before `disconnectUser()`), changing the query (`staticFilters` / `sort` + `reload()`, or a new paginator with a new `id`), unique `id` per list for multiple lists, remount without re-query; plus the orchestrator around it: `client.channelManager` (`addEventHandler`, `get`, `values`), `paginator.boost`, `state.items/hasMoreTail/lastQueryError`, `doRequest` returning `{ items }` via `queryChannelsAndHydrate` | `02-ui-components/05-channel-list/` | `filters`/`sort`/`options`/`lockChannelOrder`/`queryChannelsOverride` props, event override props, `useChannelUpdated`, `ChannelsContext` state fields |
| **i18n v10**: dotted keys + key-map table, `TranslationDictionary` / `LooseTranslationDictionary`, `asDynamicKey`, registering a language (dictionary + dayjs locale + calendar formats), plurals, `Streami18n` state store / `init()` / `setLanguage` void, `@stream-io/i18n`, dayjs single copy, `getDateString({ messageCreatedAt })`, `getCalendarDateStringForA11y` | rewrite `05-advanced-guides/09-translations.md` (+ `02-date-time-formatting.md`) | bundled language list, v9 API sections |
| **Timestamps in v10**: `TimestampNS`, `nsToDate`/`convertTimestampToDate`/`msToNs`/`nowNs`, request fields stay `Date` | `05-advanced-guides/05-typescript.md` or a short guide | ad-hoc `Date` usage in cookbook snippets |
| **Custom data under `.custom`** (reading `channel.data.custom.*`, `message.custom.*`, `attachment.custom.*`, custom event payload under `event.custom`) | `05-advanced-guides/05-typescript.md` | — |
| **Deleted / disposed channels**: `<Channel>` keeps rendering; read `pendingDisposal` | troubleshooting + channel page | "Blank screen when channel gets deleted" |

### SDK follow-ups found while scanning (not docs work)

- `useCreateChatClient` types `userData` as `ClientUser` (what `connectUser` takes), so the documented `userData: { id, name, image }` literals keep type-checking; no docs page needs to change for it. (Earlier v10 pre-releases typed it `OwnUserResponse | UserResponse`, which in `stream-chat` v10 require server fields such as `created_at` and `role`.)
- `client.setMessageComposerSetupFunction` still works (deprecated); docs can migrate lazily to `client.config.setSetupFunction('messageComposer', fn)`.
- The ledger errors found during the scan (§18.1 `queryChannels`, §4 `MessageContext.members`, §7.1 `client.activeChannels`) were fixed in the ledger in the same change as this report.

---

## Per-page impact

Format: severity · what must change · scanner-detected breaking items with line numbers (`id (Lx)`) · manual findings.

### 01-basics/

#### `01-overview.md` — Mention only

- **Change:** Version banner: "V9 requires React Native 0.76+" -> v10 requires React Native >=0.79 (peer bumped) and `stream-chat` ^10.
- **Detected:** `rnVersion` (L60)

#### `02-installation.md` — Mention only

- **Change:** Add v10 install notes: `stream-chat` ^10 comes with the SDK (do not pin v9 alongside it); react-native peer >=0.79; `dayjs` must resolve to a single copy (^1.11.23) and apps should not declare `i18next` (runtime now in `@stream-io/i18n`).
- **Manual:** (no scanner hit) dependency notes

### 02-ui-components/

#### `01-overview.md` — Major rewrite

- **Change:** Fix channel-creation snippets (custom fields under `custom`, members as `{ user_id }` objects); drop "read it from `client.activeChannels`" (L240) -> `client.channelManager.get(cid)`. Change (stacked PRs): this walkthrough's flow changes at two steps. "Connecting a User" (L32-56) gains creating + registering a `ChannelPaginator` (and removing/disposing it next to `disconnectUser`, L51-54), and every `<ChannelList />` snippet (L226, L258, L292, L335, L387) passes `paginator={paginator}`; the "See the ChannelList docs for filtering and sorting" pointer (L211) now points at the paginator. The Thread section (L345-393) is rewritten: `<Thread thread={thread}>` with `<MessageList />` + `<MessageComposer />` as children renders next to `<Channel>` (e.g. `thread ? <Thread …> : <Channel …>`), not inside it; drop `thread` / `threadList` on `<Channel>` (L374-375); `useState<LocalMessage | null>` -> `useState<Thread>()`; `keyboardVerticalOffset` / `topInset` must be passed to `<Thread>` as well.
- **Detected:** `channelCreateMembers` (L111); `activeChannels` (L240); `Channel.thread` (L374); `MessageList.onThreadSelect` (L381); `ChannelList.paginator` required (L226, L258, L292, L335, L387); `Channel.threadList` (L375); `<Thread>` inside `<Channel>` (L378)
- **Manual:** L97-99, L110-113: `client.channel(type, id?, { name, members: [ids] })` -> `{ custom: { name }, members: [{ user_id }] }`
- **Manual:** L51-54: logout snippet should also `client.channelManager.removePaginator(paginator)` + `paginator.dispose()`

#### `02-theming.md` — Mention only

- **Change:** (stacked PRs) Bare `<ChannelList />` snippets need the now-required `paginator` prop.
- **Detected:** `ChannelList.paginator` required (L68, L110)

### 02-ui-components/03-overlay-provider/

#### `01-overlay-provider.md` — Mention only

- **Change:** (stacked PRs) Bare `<ChannelList />` snippet needs the now-required `paginator` prop.
- **Detected:** `ChannelList.paginator` required (L26)

### 02-ui-components/04-chat/

#### `01-chat.md` — Mention only

- **Change:** Note `isMessageAIGenerated` is now only a `Chat` prop (removed from `Channel`); `useCreateChatClient` options are the config tree. No prop removals on `Chat` itself (`channelManager` prop is gone but was never documented). Change (stacked PRs): the `<ChannelList />` snippet needs `paginator={paginator}`.
- **Detected:** `ChannelList.paginator` required (L56)

#### `02-chat-context.md` — Major rewrite

- **Change:** ChatContext now holds only `client`, `getAppSettings`, `isMessageAIGenerated` (P.11). Remove rows `appSettings`, `channel`, `connectionRecovering`, `enableOfflineSupport`, `isOnline`, `mutedUsers`, `setActiveChannel`; add `getAppSettings()`; fix both snippets (`const { client, isOnline }`) and point to `useNetworkConnectionState` / `useWSConnectionState`, `useMutedUsers()`, `client.offlineDb`.
- **Detected:** `ChatContext.isOnline` (L18, L26, L38); `typeRenames` (L34); `ChatContext.appSettings` (L34); `ChatContext.channel` (L35); `ChatContext.connectionRecovering` (L36); `ChatContext.enableOfflineSupport` (L37); `ChatContext.mutedUsers` (L39); `ChatContext.setActiveChannel` (L40)

#### `03-hooks/01-use-create-chat-client.md` — Snippet / prop-table update

- **Change:** `options` type `StreamChatOptions` -> `DeepPartial<InstanceConfigTree>` (former options now live under `client: {...}`, e.g. `{ client: { axiosRequestConfig: { timeout } } }`). `userData` is typed `ClientUser`, so the documented `{ id, name, image }` literal is fine (see SDK follow-ups). Change (stacked PRs): add a short "channel list paginator" note or link — with `useCreateChatClient` there is no `connectUser` call site, so the paginator is created in a `useMemo` on the returned `client` and inserted/removed+disposed in an effect (the ExpoMessaging sample's `AppProvider` pattern).
- **Detected:** `StreamChatOptions` (L60)

#### `03-hooks/02-use-app-settings.md` — Delete / replace page

- **Change:** `useAppSettings` removed (P.12). Redirect to ChatContext `getAppSettings()` (`await useChatContext().getAppSettings()`); `AppSettingsAPIResponse` type is now `GetApplicationResponse`.
- **Detected:** `useAppSettings` (L12, L13, L15); `typeRenames` (L46)

#### `03-hooks/03-use-create-chat-context.md` — Major rewrite

- **Change:** `useCreateChatContext` now takes `{ client, getAppSettings, isMessageAIGenerated }` only. Rewrite snippet and params table (drop appSettings, channel, connectionRecovering, enableOfflineSupport, isOnline, mutedUsers, setActiveChannel). Consider dropping the page (internal hook).
- **Detected:** `connectionRecovering` (L19, L43); `setActiveChannel` (L24, L48); `typeRenames` (L40)

#### `03-hooks/04-use-is-online.md` — Delete / replace page

- **Change:** `useIsOnline` removed -> `useConnectionLifecycle(client, closeConnectionOnBackground)` (returns nothing). Replace with a new "Connection state" page documenting `useNetworkConnectionState(Selector)`, `useWSConnectionState(Selector)`, `useSettledWSConnectionHealth`, `useConnectionLifecycle`, `netInfoStatusReporter`.
- **Detected:** `connectionRecovering` (L6, L16, L18, L29, L45); `useIsOnline` (L13, L14, L16)

#### `03-hooks/05-use-muted-users.md` — Snippet / prop-table update

- **Change:** Remove ChatContext `mutedUsers` reference; return type `UserMuteResponse[]` (`Mute` type renamed). Duplicate of 05-channel-list/15-hooks/01-channel-list/11-use-muted-users.md - consolidate.
- **Manual:** L20: "available through ChatContext via `mutedUsers`" (removed)
- **Manual:** L31: returns `Mute[]` -> `UserMuteResponse[]`

### 02-ui-components/05-channel-list/

#### `01-channel-list.md` — Major rewrite

- **Change:** Remove the 10 per-event override props (`onAddedToChannel`, `onChannelDeleted`, `onChannelHidden`, `onChannelMemberUpdated`, `onChannelTruncated`, `onChannelUpdated`, `onChannelVisible`, `onNewMessage`, `onNewMessageNotification`, `onRemovedFromChannel`) and the event-behaviour prose (L142) -> the list is a projection of its paginator's query; global handling via `client.channelManager.addEventHandler`, floating via `paginator.boost`. Change (stacked PRs): `<ChannelList>` no longer takes the query at all. It renders a required, app-owned `paginator` (`ChannelPaginator` from `stream-chat`); the `filters`, `sort`, `options`, `lockChannelOrder` and `queryChannelsOverride` props are removed (and the "Channel List Event Listener Options" `filters`/`sort` table, L258-261). Rewrite the intro (L3 "Pass `filters`, `sort`, and `options` via props"), Best Practices (L13 "Memoize `filters` and `sort`" -> create the paginator once with the user, not in the screen; change the query by setting `staticFilters` / `sort` and `reload()`), General Usage (L28-43) and the navigation example (L66-82) as: create `new ChannelPaginator({ client, id: "channel-list", filters, sort: [{ field: "last_message_at", direction: -1 }], requestOptions: options })` next to `connectUser`, `client.channelManager.insertPaginator({ paginator })`, `<ChannelList paginator={paginator} onSelect={…} />`, and `removePaginator` + `dispose()` on logout. Props table: remove rows L156-158, L163 (`lockChannelOrder` -> `paginatorOptions.lockItemOrder`), L181; add `paginator` (required). Replace the `queryChannelsOverride` example (L185-213) with a `paginatorOptions.doRequest` example returning `{ items: await client.queryChannelsAndHydrate(request, stateOptions) }` (`client.queryChannels(filters, sort, options)` is gone; `options.limit` -> `paginatorOptions.pageSize`). The `WithComponents` example (L228) passes `paginator`.
- **Detected:** `sortObject` (L31, L73); `onNewMessageNotification` (L142, L173); `onNewMessage` (L142, L174); `ChannelList.sort` (L38, L78, L157, L228, L261); `onAddedToChannel` (L166); `onChannelDeleted` (L167); `onChannelHidden` (L168); `onChannelMemberUpdated` (L169); `onChannelVisible` (L170); `onChannelTruncated` (L171); `onChannelUpdated` (L172); `onRemovedFromChannel` (L175); `typeRenames` (L181); `ChannelList.queryChannelsOverride` (L181, L185-213); `queryChannels` (L196); `ChannelList.filters` (L3, L13, L37, L77, L156, L206, L228, L260); `ChannelList.options` (L3, L39, L158, L206); `ChannelList.lockChannelOrder` (L163); `ChannelList.paginator` required (L36, L76, L206, L228)

#### `02-channel-avatar.md` — Mention only

- **Change:** (stacked PRs) Bare `<ChannelList />` in the override snippet needs the now-required `paginator` prop.
- **Detected:** `ChannelList.paginator` required (L37)

#### `03-channel-list-view.md` — Snippet / prop-table update

- **Change:** `ChannelListView` now receives the query state as required props (`channels`, `channelListInitialized`, `error`, `hasNextPage`, `loadingChannels`, `loadingNextPage`, `refreshing`) from `ChannelList`; `loadNextPage` is `() => Promise<void>` (L21); `forceUpdate` removed. Change (stacked PRs): `<ChannelList filters={filters} sort={sort} />` (L58) -> `<ChannelList paginator={paginator} />`; the other two snippets (L34, L42) also need `paginator`.
- **Detected:** `ChannelListView.loadNextPage` (L21); `ChannelList.filters` / `ChannelList.sort` (L58); `ChannelList.paginator` required (L34, L42, L58)

#### `07-channel-preview-status.md` — Mention only

- **Change:** (stacked PRs) Bare `<ChannelList />` needs the now-required `paginator` prop.
- **Detected:** `ChannelList.paginator` required (L35)

#### `10-channel-last-message-preview.md` — Mention only

- **Change:** (stacked PRs) Bare `<ChannelList />` needs the now-required `paginator` prop.
- **Detected:** `ChannelList.paginator` required (L30)

#### `11-channel-preview-typing-indicator.md` — Mention only

- **Change:** (stacked PRs) Bare `<ChannelList />` needs the now-required `paginator` prop.
- **Detected:** `ChannelList.paginator` required (L33)

#### `12-channel-preview-message-delivery-status.md` — Mention only

- **Change:** (stacked PRs) Bare `<ChannelList />` needs the now-required `paginator` prop.
- **Detected:** `ChannelList.paginator` required (L33)

#### `13-channel-details-bottom-sheet.md` — Snippet / prop-table update

- **Change:** Custom channel fields moved under `channel.data.custom` in v10. Change (stacked PRs): `<ChannelList swipeActionsEnabled />` (L31, L59) needs `paginator`.
- **Detected:** `ChannelList.paginator` required (L31, L59)
- **Manual:** L53: `channel.data?.name` -> `channel.data?.custom?.name` (or `useChannelName(channel)`)

#### `14-channels-context.md` — Major rewrite

- **Change:** ChannelsContext holds configuration + `paginator` + stable `loadNextPage`/`refreshList`/`reloadList` (P.20). Remove rows `channels`, `channelListInitialized`, `error`, `hasNextPage`, `loadingChannels`, `loadingNextPage`, `refreshing` (and `forceUpdate`); add `paginator`; `loadNextPage()` takes no args; rewrite snippets (`const { channels } = useChannelsContext()` -> `useStateStore(useChannelsContext().paginator.state, selector)`). Change (stacked PRs): `paginator` is the app's own instance (the one passed to `<ChannelList paginator>`), so components outside the list can subscribe to it directly; `hasNextPage` description "for the current filters" (L38) -> the paginator's query; `<ChannelList />` snippets (L61, L75) need `paginator`.
- **Detected:** `ChannelsContext.channels` (L19, L27, L35); `ChannelsContext.channelListInitialized` (L36); `ChannelsContext.error` (L37); `ChannelsContext.hasNextPage` (L38); `ChannelsContext.loadingChannels` (L39); `ChannelsContext.loadingNextPage` (L41); `ChannelsContext.loadNextPage` (L42); `ChannelsContext.refreshing` (L49); `ChannelList.paginator` required (L61, L75)

#### `15-hooks/01-channel-list/01-use-channel-updated.md` — Delete / replace page

- **Change:** `useChannelUpdated` removed (§18.2); `channel.updated` handled by `client.channelManager`.
- **Detected:** `onChannelUpdated` (L6, L18, L34); `useChannelUpdated` (L14, L16)

#### `15-hooks/01-channel-list/06-use-channel-members-state.md` — Mention only

- **Change:** Hook gained optional `pick?: ChannelMemberPick` 2nd param (additive); return type references `ChannelMemberResponse` (still valid).

#### `15-hooks/01-channel-list/10-use-muted-channels.md` — Snippet / prop-table update

- **Change:** `useMutedChannels()` takes no argument and always returns `ChannelMute[]` (P.3).
- **Manual:** L16: `useMutedChannels(channel) ?? []` -> `useMutedChannels()`

#### `15-hooks/01-channel-list/11-use-muted-users.md` — Snippet / prop-table update

- **Change:** `useMutedUsers()` takes no argument; returns `UserMuteResponse[]`.
- **Manual:** L23: deprecated `channel` param row - remove

#### `15-hooks/02-channel-preview/01-use-channel-preview-data.md` — Snippet / prop-table update

- **Change:** Signature `(channel, client)`; drop third param row and fix return type.
- **Manual:** L35: `forceUpdateOverride` param removed
- **Manual:** L41: `lastMessage` type is `LocalMessage | undefined`

#### `15-hooks/02-channel-preview/06-use-is-channel-muted.md` — Snippet / prop-table update

- **Change:** Return type is core `ChannelMuteStatus`; timestamps are unix-ns numbers.
- **Manual:** L34-35: `createdAt` / `expiresAt` are `TimestampNS | null` (were `Date | null`)

### 02-ui-components/06-channel/

#### `01-channel.md` — Major rewrite

- **Change:** Provided-contexts list: remove `PaginatedMessageListContext` (L7) and `TypingContext` (L11). Props table: remove `allowSendBeforeAttachmentsUpload`, `doFileUploadRequest`, `doMarkReadRequest`, `doSendMessageRequest`, `doUpdateMessageRequest`, `isMessageAIGenerated`, `loadingMore`, `loadingMoreRecent`, `maximumMessageLimit`, `messageId`, `newMessageStateUpdateThrottleInterval`, `preSendMessageRequest`, `stateUpdateThrottleInterval`. Change (stacked PRs): `<Channel>` no longer renders threads - remove `thread` (L220; it is not retyped, it is gone), `threadList` (L221) and `allowThreadMessagesInChannel` (L134, now a `<Thread>` prop); remove `ThreadContext` from the provided-contexts list (L10; only `<Thread>` provides it); add a note that `<Thread>` accepts the same configuration props (`handleX` rows L163-175, `messageActions` L196, `onAlsoSentToChannelHeaderPress` L206, `supportedReactions` L219, keyboard/inset props) and they must be passed to it as well, since a thread is no longer rendered inside the `<Channel>`. The `handleX` / `messageActions` / `supportedReactions` rows themselves stay valid (they are the only place these reach the action menu now; `messageActions` runs when a message's menu opens). Rewrite the whole Examples section (L225-282: file-upload override, send-before-upload, mark-read, send/update overrides) as `client.config.set({ channel: { requestHandlers: { markReadRequest, sendMessageRequest, updateMessageRequest } }, messageComposer: { attachments: { doUploadRequest, pendingUploadsEnabled } } })`; add "open at a message" via `channel.messagePaginator.jumpToMessage` in `useLayoutEffect` (replaces `messageId`); add `maxLoadedItems` pruning pointer; mention `<Channel>` keeps rendering a deleted channel (`pendingDisposal`).
- **Detected:** `PaginatedMessageListContext` (L7); `usePaginatedMessageListContext` (L7); `TypingContext` (L11); `useTypingContext` (L11); `allowSendBeforeAttachmentsUpload` (L133, L239, L244); `doFileUploadRequest` (L151, L229); `doMarkReadRequest` (L152, L255); `doSendMessageRequest` (L153, L265); `doUpdateMessageRequest` (L154, L276); `Channel.isMessageAIGenerated` (L187); `Channel.loadingMore` (L190); `loadingMoreRecent` (L191); `maximumMessageLimit` (L194); `Channel.messageId` (L198); `newMessageStateUpdateThrottleInterval` (L203); `preSendMessageRequest` (L212); `stateUpdateThrottleInterval` (L218); `ThreadType` (L220); `Channel.thread` (L220); `sendMessage` (L269); `msgOps` (L279); `ThreadContext` provided by Channel (L10); `Channel.allowThreadMessagesInChannel` (L134); `Channel.threadList` (L221)

#### `02-channel-context.md` — Major rewrite

- **Change:** Remove 19 value rows (`error`, `highlightedMessageId`, `isChannelActive`, `loadChannelAroundMessage`, `loadChannelAtFirstUnreadMessage`, `loading`, `markRead`, `members`, `read`, `reloadChannel`, `scrollToFirstUnreadThreshold`, `setTargetedMessage`, `targetedMessage`, `watchers`, `watcherCount`, plus `channelUnreadStateStore`, `setChannelUnreadState`, `uploadAbortControllerRef`, `maximumMessageLimit` if present). Rewrite usage snippets (L19, L27 destructure `reloadChannel`, `watcherCount`), Best Practices (L5-9: markRead/loading/error/read/members) and the `loadChannelAroundMessage` section (L86-100) -> `useStateStore(channel.state, sel)`, `useMarkRead(channel)`, `useMessagePaginator().jumpToMessage/jumpToTheFirstUnreadMessage/jumpToTheLatestMessage`, `useIsTargetedMessage`, paginator `lastQueryError`; `last_read: Date` (L100) -> `TimestampNS`.
- **Detected:** `ChannelContext.reloadChannel` (L19, L27, L56); `ChannelContext.watcherCount` (L19, L27, L61); `ChannelContext.error` (L44); `ChannelContext.highlightedMessageId` (L47); `ChannelContext.isChannelActive` (L48); `loadChannelAroundMessage` (L49, L59, L86, L89); `ChannelContext.loadChannelAroundMessage` (L49); `ChannelContext.loadChannelAtFirstUnreadMessage` (L50); `ChannelContext.loading` (L51); `ChannelContext.markRead` (L52); `ChannelContext.members` (L54); `ChannelContext.read` (L55); `ChannelContext.scrollToFirstUnreadThreshold` (L57); `targetedMessage` (L58, L59); `ChannelContext.setTargetedMessage` (L58); `ChannelContext.targetedMessage` (L59); `ChannelContext.watchers` (L60)

### 02-ui-components/07-message-list/

#### `01-message-list.md` — Snippet / prop-table update

- **Change:** `FooterComponent` now receives `{ loadingMore?: boolean }` (L39); `HeaderComponent` row (L40) (`MessageFlashList` passes it there); `isListActive` description references removed `isChannelActive` (L42); `onThreadSelect(thread: Thread)` (L45); `thread` prop is a `Thread`. Note the list pages its own paginator (no `loadMore`/`hasMore` props). Change (stacked PRs): remove the `threadList` row (L47) - the list renders a thread when it is a child of `<Thread>`, where `FooterComponent` (and `MessageFlashList`'s `HeaderComponent`) default to `ThreadFooterComponent` (the parent message).
- **Detected:** `MessageList.FooterComponent` (L39); `MessageList.HeaderComponent` (L40); `isChannelActive` (L42); `MessageList.onThreadSelect` (L45); `MessageList.threadList` (L47)

#### `02-scroll-to-bottom-button.md` — Snippet / prop-table update

- **Change:** Remove `unreadCount` prop row (L34) and best-practice L7; the count is self-derived from `channel.state` read state.
- **Detected:** `ScrollToBottomButton.unreadCount` (L34)

#### `04-messages-context.md` — Snippet / prop-table update

- **Change:** Remove rows `deleteMessage`, `deleteReaction`, `isMessageAIGenerated`, `initialScrollToFirstUnreadMessage`, `quotedMessage`, `removeMessage`, `retrySendMessage`, `sendReaction`, `targetedMessage`, `updateMessage`; add pointer to `useMessageOperations()` (§9) and `useChatContext().isMessageAIGenerated`; `giphyVersion` type `keyof Images`. Change (stacked PRs): add `onAlsoSentToChannelHeaderPress` (moved here from `ThreadContext`; receives `{ targetedMessageId, thread? }`); note the `handleX` (L24-37), `messageActions` (L42) and `supportedReactions` (L57) rows are the only route to the action menu (they are no longer `<Message>` props) and that `<Thread>` provides its own `MessagesContext` from its own props; `messageActions` (function form) runs when a message's menu opens, so the memoization advice in L7 matters less.
- **Detected:** `MessagesContext.deleteMessage` (L15); `MessagesContext.deleteReaction` (L16); `MessagesContext.isMessageAIGenerated` (L38); `MessagesContext.initialScrollToFirstUnreadMessage` (L39); `MessagesContext.quotedMessage` (L44); `MessagesContext.removeMessage` (L52); `MessagesContext.retrySendMessage` (L53); `MessagesContext.sendReaction` (L54); `MessagesContext.targetedMessage` (L58); `MessagesContext.updateMessage` (L59)

### 02-ui-components/08-message-composer/

#### `01-message-composer.md` — Snippet / prop-table update

- **Change:** `members` / `watchers` props still exist (now typed from `channel.state`); `isOnline` prop retyped to `boolean`. Verify descriptions only. Change (stacked PRs, raised from Mention only): remove the `threadList` row (L80); a composer is a thread composer when it is a child of `<Thread>` (the `ThreadMessageComposer` slot is gone too).
- **Detected:** `MessageComposer.threadList` (L80)

#### `components/01-attachment-preview/03-attachment-upload-progress-indicator.md` — Mention only

- **Change:** `localId` props unchanged; clarify that `localId` is `attachment.localMetadata.id` and that pending uploads are now controlled by `messageComposer.attachments.pendingUploadsEnabled` (was `allowSendBeforeAttachmentsUpload`).
- **Detected:** `attachmentMeta` (L3)

#### `components/07-show-thread-message-in-channel-button.md` — Snippet / prop-table update

- **Change:** (stacked PRs) The button takes `thread` (`Thread | undefined`, from `useThreadContext()`) instead of `threadList`: fix the prose (L3 "only renders when both `threadList` and `allowThreadMessagesInChannel` are truthy" -> `thread` and `allowThreadMessagesInChannel`) and replace the `threadList` row (L12). `allowThreadMessagesInChannel` (L11) now comes from the `<Thread>` prop (default `true`), not `<Channel>`.
- **Detected:** `ShowThreadMessageInChannelButton.threadList` (L3, L12); `allowThreadMessagesInChannel` (L3, L11)

#### `composer/10-message_composer.md` — Snippet / prop-table update

- **Change:** `client.setMessageComposerSetupFunction` is deprecated -> `client.config.setSetupFunction("messageComposer", fn)` (L50 heading, L79, L202-205). "Message Composer Configuration" section should move to `client.config.set({ messageComposer: {...} })` (new required `attachments.customCdn`, `polls`; `linkPreviews.enabled` defaults true).
- **Detected:** `setMessageComposerSetupFunction` (L50, L79, L202, L205)

#### `composer/12-message_composer_middleware.md` — Snippet / prop-table update

- **Change:** L368-391: `UserSort` / `MemberSort` types removed -> `SortParamRequest[]`; L399-400 `userSort = { name: -1 }` -> `[{ field: "name", direction: -1 }]`; L1035 setup function deprecated -> `client.config.setSetupFunction`. Middleware tables (L848, L863) describe `stream-chat` factories that still exist - no change.
- **Detected:** `typeRenames` (L372, L375, L383, L389); `sortObject` (L399, L400); `setMessageComposerSetupFunction` (L1035)

#### `contexts/01-message-input-context.md` — Snippet / prop-table update

- **Change:** Remove rows `allowSendBeforeAttachmentsUpload` (L35), `doFileUploadRequest` (L48), `editMessage` (L49); `sendMessage` (L63) now submits the composer (`messageComposer.update()` while editing, `send()` otherwise); `thread` (L70) is a `Thread` instance (drop `ThreadType`). Snippets using `sendMessage` remain valid.
- **Detected:** `MessageInputContext.allowSendBeforeAttachmentsUpload` (L35); `MessageInputContext.doFileUploadRequest` (L48); `MessageInputContext.editMessage` (L49); `MessageInputContext.sendMessage` (L63); `ThreadType` (L70)

### 02-ui-components/09-message/

#### `01-message-item-view.md` — Snippet / prop-table update

- **Change:** Remove `members` prop row (L26).
- **Detected:** `MessageItemView.members` (L26)

#### `03-audio-attachment.md` — Mention only

- **Change:** Item metadata (`mime_type`, `file_size`) now lives under `attachment.custom`; `duration` is voice-recording only (L15).
- **Detected:** `attachmentMeta` (L15)

#### `12-message-content.md` — Snippet / prop-table update

- **Change:** Remove `isMessageAIGenerated` prop row (L23) -> `<Chat isMessageAIGenerated>`. Change (stacked PRs): remove the `threadList` row (L38) -> `useThreadContext().thread`.
- **Detected:** `MessageContent.isMessageAIGenerated` (L23); `MessageContent.threadList` (L38)

#### `14-message-edited-timestamp.md` — Snippet / prop-table update

- **Change:** `t("Edited")` (L11, L70) -> `t("message.edited.text")`; Streami18n override example (L23-35) must use the dotted key.
- **Detected:** `tEnglishKey` (L11, L70); `newStreami18n` (L25)

#### `16-message-footer.md` — Snippet / prop-table update

- **Change:** Remove `members` prop row (L19).
- **Detected:** `MessageFooter.members` (L19)

#### `19-message-replies.md` — Snippet / prop-table update

- **Change:** (stacked PRs) Remove the `threadList` row (L23). `MessageReplies` no longer knows about threads: `MessageItemView` hides the replies row inside a `<Thread>`, so a custom layout that renders `MessageReplies` directly must check `useThreadContext().thread` itself (v9 hid it).
- **Detected:** `MessageReplies.threadList` (L23)

#### `20-message-status.md` — Snippet / prop-table update

- **Change:** Remove `readBy` / `deliveredToCount` rows (L15-16); mention `useIsMessageReadByOthers` / `useIsMessageDeliveredToOthers`.
- **Detected:** `MessageStatus.deliveredToCount` (L15); `MessageStatus.readBy` (L16)

#### `25-message-context.md` — Snippet / prop-table update

- **Change:** Remove rows `isMessageAIGenerated` (L50), `readBy` (L65), `deliveredToCount` (L66), `members` (L80); `onThreadSelect` (L75) receives a `Thread`. Change (stacked PRs): remove the `threadList` row (L77) -> `useThreadContext().thread`; add `messageActionHandlers` (`MessageActionHandlerCallbacks`, the row's shared handler set, same object `useMessageActionHandlers()` returns) and the optional `isVeryLastMessage`.
- **Detected:** `MessageContext.isMessageAIGenerated` (L50); `MessageContext.readBy` (L65); `MessageContext.deliveredToCount` (L66); `MessageContext.onThreadSelect` (L75); `MessageContext.threadList` (L77); `MessageContext.members` (L80)

### 02-ui-components/10-thread/

#### `01-thread.md` — Major rewrite

- **Change:** Whole page (stacked PRs). `<Thread thread={thread}>` renders next to `<Channel>`, not inside it, and renders its children: General Usage (L13-33) and the overrides snippet (L68) become `<Thread thread={thread}><MessageList /><MessageComposer /></Thread>` with no `<Channel>` around it; intro (L1 "Internally uses `MessageList` and `MessageComposer`") and Best Practices (L5 "Render `Thread` within `Channel` and pass `thread`/`threadList`", L6 `closeThreadOnDismount`, L8 `autoFocus`, L9 `reloadThread`/`loadMoreThread`) are rewritten. Props table: `thread` is required and is the `Thread` instance (L52, drop `ThreadType`/`LocalMessage`); remove `additionalMessageComposerProps`, `additionalMessageListProps`, `additionalMessageFlashListProps` (configure the children directly), `autoFocus`, `client`, `closeThreadOnDismount`, `disabled`, `closeThread`, `loadMoreThread`, `parentMessagePreventPress` (now a `ThreadFooterComponent` prop, default `true`), `shouldUseFlashList` (render `<MessageFlashList />` as the child), `reloadThread`, `threadInstance` (L38-53); keep `notificationHostId`, `onThreadDismount`; add `allowThreadMessagesInChannel` (moved from `<Channel>`, default `true`) and a pointer that `<Thread>` accepts the same configuration props as `<Channel>` (`messageActions`, `handleX`, `supportedReactions`, `keyboardVerticalOffset`, `topInset`, `onAlsoSentToChannelHeaderPress`, …). The "UI Component Overrides" section (L55-77) goes: the `ThreadMessageComposer` slot is removed and the list/composer are the app's own children. Add: opening from a message via `onThreadSelect` (yields a `Thread`) or `client.threads.ensure({ channel, parentMessage })`; `<Thread>` marks the thread read while open and does not mark the channel read; paging via `thread.messagePaginator` / `thread.reload()`.
- **Detected:** `loadMoreThread` (L9, L47); `reloadThread` (L9, L51); `Channel.thread` (L25, L68); `Thread.closeThread` (L46); `Thread.loadMoreThread` (L47); `Thread.reloadThread` (L51); `ThreadType` (L52); `Thread.thread` (L52); `Thread.threadInstance` (L53); `Channel.threadList` (L5, L25, L68); `Thread.additionalMessageComposerProps` (L38); `Thread.additionalMessageListProps` (L39); `Thread.additionalMessageFlashListProps` (L40); `Thread.autoFocus` (L8, L41); `Thread.client` (L42); `Thread.closeThreadOnDismount` (L6, L43); `Thread.disabled` (L44); `Thread.parentMessagePreventPress` (L48); `Thread.shouldUseFlashList` (L49); `ThreadMessageComposer` (L65, L77)

#### `02-thread-context.md` — Major rewrite

- **Change:** ThreadContext is now `{ thread?: Thread, allowThreadMessagesInChannel }` (stacked PRs: `parentMessagePreventPress` moved to `ThreadFooterComponent`, `onAlsoSentToChannelHeaderPress` moved to `MessagesContext`). It is provided only by `<Thread>`, not `<Channel>` (fix L1 and L13 "Consume `ThreadContext` in any child of `Channel`"), and `useThreadContext()` no longer throws outside it: elsewhere it returns `{ thread: undefined, allowThreadMessagesInChannel: false }`, and `thread === undefined` is how a component knows it is not in a thread (the replacement for every `threadList` check). Remove 13 rows (L35-48: closeThread, loadMoreThread, loadMoreRecentThread, onAlsoSentToChannelHeaderPress, openThread, parentMessagePreventPress, reloadThread, setThreadLoadingMore, threadHasMore, threadInstance, threadLoadingMore, threadLoadingMoreRecent, threadMessages); `thread` (L43) is the `Thread` instance (parent message fields move to `thread.state.parentMessage`); `allowThreadMessagesInChannel` (L34) is set on `<Thread>`. Rewrite Best Practices (L6-7: navigation is app state + `<Thread thread>`, pagination is `thread.messagePaginator`) and add the paginator/`thread.state` recipes.
- **Detected:** `ThreadContext` provided by Channel (L1, L13); `ThreadContext.onAlsoSentToChannelHeaderPress` (L38); `closeThread` (L6, L35); `openThread` (L6, L39); `threadHasMore` (L7, L44); `threadLoadingMore` (L7, L46); `ThreadContext.closeThread` (L35); `ThreadContext.loadMoreThread` (L36); `ThreadContext.loadMoreRecentThread` (L37); `ThreadContext.openThread` (L39); `ThreadContext.parentMessagePreventPress` (L40); `ThreadContext.reloadThread` (L41); `ThreadContext.setThreadLoadingMore` (L42); `ThreadType` (L43); `ThreadContext.thread` (L43); `ThreadContext.threadHasMore` (L44); `ThreadContext.threadInstance` (L45); `ThreadContext.threadLoadingMore` (L46); `ThreadContext.threadLoadingMoreRecent` (L47); `ThreadContext.threadMessages` (L48)

### 02-ui-components/11-thread-list/

#### `01-thread-list.md` — Snippet / prop-table update

- **Change:** `onThreadSelect(thread: Thread)` - single arg; the `{ thread, threadInstance }` + `channel` shape is gone (L32). Channel via `thread.channel`. Change (stacked PRs): the selected thread is rendered with `<Thread thread={thread}>` directly; no `<Channel>` is needed for it.
- **Detected:** `threadInstance` (L32); `ThreadList.onThreadSelect` (L32)

### 02-ui-components/13-contexts/

#### `01-contexts.md` — Snippet / prop-table update

- **Change:** Remove `PaginatedMessageListContext`, `TypingContext`, `DebugContext` from the list (L25, L28, L55) and table (L96, L105, L112); fix custom `MessageStatus` example (L131-145) reading `message.readBy` -> `useIsMessageReadByOthers({ message })`; add a short "state now comes from `channel.state` / paginators" note. Change (stacked PRs): `ThreadContext` (L27) moves from the `Channel` group to a new `Thread` group (`<Thread>` provides it plus the same channel-level contexts, from `thread.channel`).
- **Detected:** `ThreadContext` listed under Channel (L27); `PaginatedMessageListContext` (L25, L105); `TypingContext` (L28, L112); `DebugContext` (L55, L96); `useDebugContext` (L96); `usePaginatedMessageListContext` (L105); `useTypingContext` (L112); `readBy` (L133, L145)

#### `06-paginated-message-list-context.md` — Delete / replace page

- **Change:** Context removed (§3). Replace with a new "Message paginator" page (`useMessagePaginator`, `channel.messagePaginator`, `toTail/toHead`, `hasMoreTail/hasMoreHead`, `isLoading`).
- **Detected:** `PaginatedMessageListContext` (L1, L13, L17, L20); `usePaginatedMessageListContext` (L5, L24, L27, L30); `loadingMoreRecent` (L39, L45)

#### `09-translation-context.md` — Snippet / prop-table update

- **Change:** `t` is a typed `StreamTFunction` (catalog keys; runtime keys need `asDynamicKey`); `userLanguage` type `TranslationLanguages` -> `string` (L36).
- **Detected:** `typeRenames` (L36)

#### `10-typing-context.md` — Delete / replace page

- **Change:** Context removed (§2) -> `useStateStore(channel.state, (s) => ({ typing: s.typing }))`; fold into the new channel-state page.
- **Detected:** `TypingContext` (L1, L13, L17, L19); `useTypingContext` (L5, L22, L25, L27)

#### `11-threads-context.md` — Snippet / prop-table update

- **Change:** `onThreadSelect` is `(thread: Thread) => void`: rewrite the "onThreadSelect arguments" section (L55-80: `{ thread, threadInstance }` object + `channel`) and the custom `ThreadListItem` snippet (L100-110) -> `onThreadSelect?.(thread)`.
- **Detected:** `ThreadsContext.onThreadSelect` (L42, L100); `threadInstance` (L65, L71, L106)

### 02-ui-components/14-AI/

#### `02-ui-components.md` — Snippet / prop-table update

- **Change:** `message.ai_generated` -> `message.custom?.ai_generated` (L28, L37, L49).
- **Detected:** `aiGenerated` (L28, L37, L49)

#### `03-ai-hooks.md` — Snippet / prop-table update

- **Change:** `message.ai_generated` -> `message.custom?.ai_generated` (L24, L62); `AIStates` is now a readonly literal map that adds `Stop`; `useAIState` reads `channel.state.aiState`.
- **Detected:** `aiGenerated` (L24, L62)

### 02-ui-components/15-in-app-notifications/

#### `01-hooks/04-use-notification-target.md` — Snippet / prop-table update

- **Change:** L19 "a `threadInstance` on `ThreadContext`" -> "a `thread` on `ThreadContext`". Change (stacked PRs, raised from Mention only): the resolution table loses its first row (L18 "inside a `Channel` with `threadList` set on `ChannelContext`" - `threadList` is gone and `<Channel>` never renders a thread); "inside a `Thread`" (L19) is the only `'thread'` case.
- **Detected:** `threadInstance` (L19); `ChannelContext.threadList` (L18)

### 02-ui-components/16-base-ui-components/

#### `04-channel-avatar.md` — Mention only

- **Change:** Prose "`channel.data.image`" (L3, L21) -> `channel.data.custom.image`.

### 02-ui-components/17-channel-details/

#### `08-hooks/08-use-user-activity-status.md` — Mention only

- **Change:** Mentions `getDateString` pipeline (L1): parameter renamed `date` -> `messageCreatedAt`; `last_active` is `TimestampNS`; key `timestamp/UserActivityStatus` -> `timestamp.UserActivityStatus`.
- **Detected:** `dateHelpers` (L1)

#### `08-hooks/09-use-member-roles.md` — Snippet / prop-table update

- **Change:** `t("VIP")` (L32) is an app key -> `t(asDynamicKey("myApp.roles.vip"), "VIP")`.
- **Detected:** `tEnglishKey` (L32)

### 02-ui-components/18-channel-state-hooks/

#### `01-use-channel-name.md` — Mention only

- **Change:** Prose "Reads `channel.data?.name`" (L1, L8) -> `channel.data.custom.name` (hook itself unchanged).

#### `02-use-channel-image.md` — Mention only

- **Change:** Prose "Reads `channel.data?.image`" (L1, L8) -> `channel.data.custom.image`.

#### `05-use-channel-own-capabilities.md` — Mention only

- **Change:** Signature normalized to `(channel?: Channel)`; now sourced from `channel.state`.

#### `11-use-selected-channel-state.md` — Delete / replace page

- **Change:** `useSelectedChannelState` removed (P.1) -> `useStateStore(channel.state, selector)`; `EventTypes` (L32) also gone.
- **Detected:** `useSelectedChannelState` (L15, L17); `typeRenames` (L32)

### 02-ui-components/99-experimental/

#### `01-flash-list.md` — Snippet / prop-table update

- **Change:** `maximumMessageLimit` advice (L19, L31) -> paginator `maxLoadedItems` config; `FlatList` prop removed from `MessageFlashList`; custom `HeaderComponent` receives `{ loadingMore }`.
- **Detected:** `maximumMessageLimit` (L19, L31)

### 03-ui-cookbook/

#### `01-custom_components.md` — Snippet / prop-table update

- **Change:** Replace the `usePaginatedMessageListContext` example (L83-100) with `useStateStore(channel.messagePaginator.state, selector)` (or `useMessagePaginator()`); update the warning at L159. `sendMessage` from `useMessageInputContext` and `localId` usages are still valid.
- **Detected:** `PaginatedMessageListContext` (L83, L159); `usePaginatedMessageListContext` (L91, L95); `attachmentMeta` (L119)

#### `02-custom-attachment.md` — Snippet / prop-table update

- **Change:** `attachment.mime_type` / `attachment.file_size` (L143, L145) -> `attachment.custom?.mime_type` / `.custom?.file_size`.
- **Detected:** `attachmentMeta` (L143, L145)

#### `03-customize-channel-list.md` — Major rewrite

- **Change:** Event-handler override table + `onNewMessageNotification(setChannels, event)` example (L11-75) are gone: rewrite around the paginator's query (the list is a projection of it), `channelRenderFilterFn`, `paginator.boost(cid)`, and `client.channelManager.addEventHandler`. "Load More" button (L88-100) reads `loadingNextPage`/`hasNextPage` from ChannelsContext - now from `useStateStore(paginator.state)` / `ChannelListView` props. Multiple-lists section prose about `client.activeChannels` (L116) is obsolete. Change (stacked PRs): there is no `filters` prop to pass (L39, L70, L127); the frozen-channels example becomes `new ChannelPaginator({ client, id: "frozen", filters: { members: { $in: ["vishal"] }, frozen: true } })`, registered and passed as `<ChannelList paginator={…} />` (also L100). "Multiple Channel Lists" (L110-140) is rewritten as one paginator per list, each with a unique `id` and its own `filters`/`sort`, all inserted into `client.channelManager` (the manager keys lists by `id`; each list projects its own query, so verify whether the cross-list reordering this section works around still happens before keeping the `channelRenderFilterFn` workaround); `lockChannelOrder` (L26 link) -> `paginatorOptions.lockItemOrder`. Add a "change the query at runtime" recipe (`paginator.staticFilters = …; paginator.reload()`, or a new paginator).
- **Detected:** `onChannelDeleted` (L21); `onChannelHidden` (L22); `onChannelTruncated` (L23); `onChannelUpdated` (L24); `onChannelVisible` (L25); `onNewMessage` (L26); `onAddedToChannel` (L27); `onNewMessageNotification` (L28, L45, L71); `onRemovedFromChannel` (L29); `ChannelsContext.hasNextPage` (L93); `ChannelsContext.loadingNextPage` (L93); `ChannelsContext.loadNextPage` (L93); `activeChannels` (L116); `ChannelList.filters` (L39, L70, L127); `ChannelList.lockChannelOrder` (L26); `ChannelList.paginator` required (L39, L69, L100, L125)

#### `04-customize-message-actions.md` — Snippet / prop-table update

- **Change:** Custom label keys `t("Custom Mute User")` (L272) need `asDynamicKey` (or plain strings); `client.userID` (L258) is deprecated -> `client.userId`. `client.muteUser(id)` / `unmuteUser(id)` calls are still valid. Change (stacked PRs): the page already configures everything on `<Channel>`, which is now the only route (`handleX`, `messageActions` are no longer `<Message>` props). Add: (1) the `messageActions` function (L29-55, L207, L248) runs when a message's menu opens, not on every render, so it may do per-message work; (2) pass the same `messageActions` / `handleX` to `<Thread>`, or thread messages get the defaults; (3) a custom `MessageActionList` (L296-345) receives the built list as its `messageActions` prop (plus `dismissOverlay`), and code that wants the default actions or handlers calls `useMessageActions()` / `useMessageActionHandlers()` with no arguments inside the message (`MessageActionsHookProps` is gone). The intercept list (L430-440) names `handleReaction`, `handleReply`, `handleThreadReply`; `handleReply` does not exist (it is `handleQuotedReply`) and `handleMarkUnread`, `handlePinMessage`, `handleBlockUser` are missing.
- **Detected:** `userID` (L258); `msgOps` (L265, L267); `tEnglishKey` (L272)

#### `05-livestream-messagelist.md` — Snippet / prop-table update

- **Change:** `StreamChat.getInstance(key, { isLocalUnreadCountEnabled: true })` (L49-51) -> `{ channel: { readEvents: { localUnreadCountEnabled: true } } }`; thread state now a `Thread` (L171). Change (stacked PRs): drop `thread={thread}` from both `<Channel>` snippets (L104, L154; the prop is removed); the "Thread" screen navigated to at L173 renders `<Thread thread={thread}>` with its own list and composer.
- **Detected:** `localUnread` (L50); `Channel.thread` (L104, L154); `MessageList.onThreadSelect` (L171)

#### `06-message-input-customization.md` — Major rewrite

- **Change:** Custom CDN section (L230-250) uses `<Channel doFileUploadRequest>` -> `client.config.set({ messageComposer: { attachments: { doUploadRequest, customCdn: true } } })`. Replace the whole "Uploading attachments asynchronously" section (L540-660: hand-written `localAttachmentToAttachment` / attachment composition middlewares + `setMessageComposerSetupFunction`) with the built-in `messageComposer.attachments.pendingUploadsEnabled` switch. "Overriding send" example (L670-700) uses `channel.sendMessage(message, sendOptions)` -> `channel.sendMessage({ message, ...sendOptions })` or a `sendMessageRequest` handler. Change (stacked PRs): `<ChannelList onSelect={setActiveChannel} />` (L75) needs `paginator`.
- **Detected:** `ChannelList.paginator` required (L75); `doFileUploadRequest` (L235, L239); `localAttachmentToAttachment` (L557, L593, L628); `createAttachmentsCompositionMiddleware` (L580, L652); `createDraftAttachmentsCompositionMiddleware` (L615, L656); `setMessageComposerSetupFunction` (L646, L650); `sendMessage` (L685)

#### `09-message-customization.md` — Snippet / prop-table update

- **Change:** L63 `useChannelContext()` destructures removed `members`, `watchers`, `error`, `loading` -> `useStateStore(channel.state, ...)` / paginator; L439 `useMessageContext().members` removed -> `useStateStore(channel.state, s => ({ members: s.members }))`; L442 `client.userID`; L627 `client.deleteMessage(id)` -> `client.deleteMessage({ id })` or `useMessageOperations().deleteMessage(message)`. Change (stacked PRs): drop `thread={thread}` from the two `<Channel>` snippets (L414, L474; prop removed) and note `forceAlignMessages` (L405-418) must also be passed to `<Thread>` for thread screens. `<Message {...props} />` in the swipeable wrapper (L651) still compiles, but `MessageProps` no longer carries `handleX` / `messageActions` / `supportedReactions`.
- **Detected:** `ChannelContext.error` (L63); `ChannelContext.members` (L63); `ChannelContext.loading` (L63); `ChannelContext.watchers` (L63); `Channel.thread` (L414, L474); `MessageContext.members` (L439); `userID` (L442); `msgOps` (L627)

#### `10-file-compression.md` — Major rewrite

- **Change:** Whole recipe is built on `<Channel doFileUploadRequest>` (L5, L46, L64) and `channel.sendFile(uri, name, type)` (L61). Rewrite with `client.config.set({ messageComposer: { attachments: { doUploadRequest } } })` and `channel.uploadFile({ file: { uri, name, type } })`; `waveform_data` (L25) moved under `custom`.
- **Detected:** `doFileUploadRequest` (L5, L46, L64); `attachmentMeta` (L25); `sendFileImage` (L61)

#### `11-blocking-users.md` — Mention only

- **Change:** (stacked PRs) The custom `messageActions` set on `<Channel>` (L83-100) does not reach thread messages any more; say to pass the same function to `<Thread>`. The function runs when a message's menu opens.

#### `13-custom-thread-list.md` — Snippet / prop-table update

- **Change:** `onThreadSelect={(thread, channel) => ...}` (L75, L134, L197, L231) -> `(thread) => ...` with `thread.channel`; custom item calls `onThreadSelect({ thread, threadInstance }, channel)` (L107-116) -> `onThreadSelect?.(thread)`. Also uses `ThreadList ThreadListItem={...}` prop (v8 style) -> `WithComponents`. Change (stacked PRs): the prerequisite "screen that shows a `Thread`" (L13) is `<Thread thread={route.params.thread}><MessageList /><MessageComposer /></Thread>` with no `<Channel>`; link the thread page.
- **Detected:** `ThreadList.onThreadSelect` (L75, L134, L197, L231); `ThreadsContext.onThreadSelect` (L107); `threadInstance` (L115)

#### `15-customize-message-reactions.md` — Snippet / prop-table update

- **Change:** `ReactionSortBase` removed; `useFetchReactions` `sort` is `SortParamRequest[]`. Change (stacked PRs): `<Channel supportedReactions>` (L13, L31) no longer covers threads; pass the same list to `<Thread>`. Reading `supportedReactions` from `useMessagesContext()` (L194, L282) is still right (it is no longer a `<Message>` prop).
- **Manual:** L282-284: `const reactionSort: ReactionSortBase = { created_at: -1 }` -> `SortParamRequest[]` `[{ field: "created_at", direction: -1 }]`

#### `16-channel-pinning-and-archiving.md` — Snippet / prop-table update

- **Change:** Best practice L8 tells readers to keep `onChannelMemberUpdated` wired (prop removed; the orchestrator handles `member.updated`); sort L200 `[{ pinned_at: -1 }, ...]` -> `[{ field: "pinned_at", direction: -1 }, ...]`. `channel.pin()` / `archive()` unchanged. Change (stacked PRs): "Filtering Channels" / "Sorting Channels" (L171-205) say "using the `filters` / `sort` prop on `ChannelList`" - those props are gone; put `filters` / `sort` on the `ChannelPaginator` (`new ChannelPaginator({ client, id: "archived", filters: { archived: true } })`), and for an archived/pinned tab switch either keep one paginator per tab or set `paginator.staticFilters` and `reload()`. `<ChannelList getChannelActionItems>` (L119) needs `paginator`.
- **Detected:** `onChannelMemberUpdated` (L8); `sortObject` (L200); `ChannelList.filters` (L173, L181, L190); `ChannelList.sort` (L195, L202); `ChannelList.paginator` required (L119, L181, L190, L202)

#### `18-handle-commands.md` — Snippet / prop-table update

- **Change:** `chatClient.setMessageComposerSetupFunction` (L22) deprecated -> `client.config.setSetupFunction("messageComposer", fn)`.
- **Detected:** `setMessageComposerSetupFunction` (L22)

#### `19-emoji-suggestions.md` — Snippet / prop-table update

- **Change:** Same setup-function deprecation (L53).
- **Detected:** `setMessageComposerSetupFunction` (L53)

#### `22-hide-channel-history-before.md` — Snippet / prop-table update

- **Change:** Request date fields are `Date`; `addMembers([ids], undefined, options)` still valid.
- **Manual:** L19-22, L85, L253: `hide_history_before = date.toISOString()` -> request field is typed `Date` in v10; pass the `Date`

#### `23-snackbar.md` — Snippet / prop-table update

- **Change:** `t("a11y/Dismiss notification")` (L169) -> `t("notifications.dismiss.accessibilityLabel")`.
- **Detected:** `tEnglishKey` (L169); `a11yKey` (L169)

#### `27-date-separators.md` — Major rewrite

- **Change:** Example is built on `usePaginatedMessageListContext` (L28-33, L62) and `message.created_at.toDateString()` (L40, L46, L84 - `created_at` is now a `TimestampNS` number); `channel.state.messages` / `messagePagination.hasPrev` (L62) no longer exist. Rewrite with `useStateStore(channel.messagePaginator.state, s => ({ items: s.items, hasMoreTail: s.hasMoreTail }))` and `nsToDate`. `maximumMessageLimit` pointer (L95) -> `maxLoadedItems`.
- **Detected:** `usePaginatedMessageListContext` (L28, L33); `methodOnField` (L40, L46); `PaginatedMessageListContext` (L62); `maximumMessageLimit` (L95)

### 03-ui-cookbook/24-channel-details/

#### `02-custom-channel-actions.md` — Snippet / prop-table update

- **Change:** `t("Pin")` / `t("Unpin")` / `t("Delete")` (L36, L121, L129) are v9 English keys; use dotted catalog keys or `asDynamicKey` + default copy.
- **Detected:** `tEnglishKey` (L36, L121, L129)

#### `05-custom-member-roles.md` — Snippet / prop-table update

- **Change:** `t("Admin")` (L76) -> `t("channelDetails.memberRoles.admin.label")`.
- **Detected:** `tEnglishKey` (L76)

### 03-ui-cookbook/25-channel/

#### `01-channel-header.md` — Snippet / prop-table update

- **Change:** `useChatContext().isOnline` (L19 prose, L59) removed -> `useNetworkConnectionState` / `useWSConnectionState`; `client.on((e) => e.me ?? e ...)` (L41-48) no longer type-checks (`Event` is a discriminated union) - subscribe to specific event types.
- **Detected:** `eventMe` (L18, L44, L45, L46); `ChatContext.isOnline` (L59)

### 04-state-and-offline-support/

#### `01-state-overview.md` — Major rewrite

- **Change:** LLC snippets: `chatClient.queryChannels(filter, sort, opts)` (L238-244) -> `client.queryChannelsAndHydrate({ filter_conditions, sort: [{ field, direction }], watch, state })`; `channel.sendMessage({ text })` (L253) -> `channel.sendMessage({ message: { text } })` and the L137 note (channel.sendMessage is HTTP-only; optimistic path is `channel.messageOperations` / `useMessageOperations`). L403 `threadInstance`. This page is the natural home for the new v10 state model: unified `channel.state` store, `channel.messagePaginator`, `thread.messagePaginator`, `client.config`, `client.channelManager` (with the stacked PRs: the app-owned `ChannelPaginator`s registered on it).
- **Detected:** `sendMessage` (L137, L253); `channelCreateMembers` (L198); `sortObject` (L238); `queryChannels` (L240); `threadInstance` (L403)
- **Manual:** L184-200: `client.channel(type, id, { name })` / `{ members: [ids], name }` -> `{ custom: { name } }`, `members: [{ user_id }]`

#### `02-offline-support.md` — Mention only

- **Change:** Add v10 notes: one-time offline cache reset (DB version 17 -> 18), pending uploads default on with `enableOfflineSupport` (`pendingUploadsEnabled`), unsent messages persist across restarts. Change (stacked PRs): the sign-out snippet (L94-100) should also remove and dispose the app's channel-list paginator (`client.channelManager.removePaginator(paginator); paginator.dispose();`) - `disconnectUser()` empties registered lists but keeps them registered.

### 05-advanced-guides/

#### `02-date-time-formatting.md` — Major rewrite

- **Change:** All `timestamp/*` keys renamed to dotted keys (`timestamp/MessageSystem` -> `timestamp.MessageSystem`, etc.; L42-137); "defaults stored in the JSON translation files" no longer true (English runtime defaults; per-locale calendar formats removed - import the dayjs locale). Custom `timestampFormatter` (L155-160) receives unix-ns values: `new Date(val).getTime()` is wrong -> convert with `nsToDate`. `relativeCompactDateFormatter` -> `timestampFormatter(relativeCompact: true)`.
- **Detected:** `timestampKeys` (L42, L66, L72, L78, L127, L137); `newStreami18n` (L155); `getTime` (L158)

#### `04-new-architecture.md` — Mention only

- **Change:** React Native `>=0.76.0` (L3) -> `>=0.79.0`.
- **Detected:** `rnVersion` (L3)

#### `05-typescript.md` — Major rewrite

- **Change:** Augmentation interfaces still exist, but custom data now lives under a `.custom` bag at runtime: the "properly typed" example (L170-186: `channel.data.topic`, `user.nickname`, `message.isSecret`, `attachment.lat`) must read `.custom?.x`. `EventTypes` -> `EventType`; custom event data under `event.custom` (L52-56); `StreamMessage` alias gone. Add `TranslationDictionary` / `LooseTranslationDictionary` / `asDynamicKey` typing notes.
- **Detected:** `declareModule` (L30, L31, L35, L78, L97, L100, L102, L106, … +14); `typeRenames` (L52, L56)

#### `06-troubleshooting.md` — Snippet / prop-table update

- **Change:** Rewrite the deleted-channel section. Flipper mention (L7) can go. Change (stacked PRs): the thread snippets no longer work - `<Channel>` has no `thread` / `threadList` and `<Thread>` is not rendered inside it. Delete "Messages sending in thread instead of channel" (L8-35) and "Wrong images in gallery" (L53-73): both work around the v9 shared `thread` state on `<Channel>`, which v10 does not have (a channel screen renders `<Channel>`, a thread screen renders `<Thread thread>`). If an entry is kept, show the sibling layout.
- **Detected:** `Channel.thread` (L17, L26, L62, L69); `Channel.threadList` (L26, L69); `<Thread>` inside `<Channel>` (L27, L70); `MessageList.onThreadSelect` (L18, L63)
- **Manual:** L262-275 "Blank screen when channel gets deleted": `<Channel>` no longer returns null on delete (P.15); read `pendingDisposal` from `channel.state` instead

#### `07-stream_chat_with_navigation.md` — Major rewrite

- **Change:** `useState<LocalMessage>()` (L177) -> `Thread`; `onThreadSelect` yields a `Thread`; passing the instance in navigation params (L188) is non-serializable - recommend passing ids + `client.threads.ensure` / app context. Change (stacked PRs, raised from Snippet update): the channel/thread screen pattern this guide teaches is gone. The thread screen renders `<Thread thread={thread}><MessageList /><MessageComposer /></Thread>` with no `<Channel>` (L139-148), and the channel screen renders plain `<Channel channel={channel}>` without `thread` (L157, L184). The "Image Gallery" section (L126-199: `threadList` + `ThreadContext` gating, telling the channel which thread is open, the `useFocusEffect` reset) and "Resetting Selected Images" (L120-124) describe v9 coupling that no longer exists: rewrite as "keep the selected thread in app state or params, clear it in `onThreadDismount`". Best practice L10 ("Manage `thread` state explicitly … between channel and thread screens") changes accordingly. Keyboard / inset props (L67, L87, L110) must be set on `<Thread>` as well.
- **Detected:** `Channel.thread` (L144, L157, L184); `Channel.threadList` (L128, L144); `<Thread>` inside `<Channel>` (L145); `MessageList.onThreadSelect` (L159, L186)

#### `09-translations.md` — Major rewrite

- **Change:** Near-total rewrite. Built-in language list (L3-13) -> English only; supply dictionaries. Keys are dotted (`TranslationDictionary`); registerTranslation examples (L84-110, L145, L406) use v9 English keys. Constructor 2nd param `i18nextConfig` (L56, L307) -> `i18nextConfigOverrides` in the options object. Remove API sections `getAvailableLanguages`, `geti18Instance`, `getTranslations`, `getTranslators` (L367-396) -> `init()`, `i18n.state`, `i18n.t`; `setLanguage` returns `void` (L426); `enTranslations` link (L403). Add `asDynamicKey`, plurals (`_one`/`_other`), dayjs single-copy, moment/timezone section check.
- **Detected:** `translationJson` (L3, L4, L5, L6, L7, L8, L9, L10, … +5); `newStreami18n` (L31, L43, L61, L69, L83, L99, L112, L128, … +5); `registerTranslation` (L64, L75, L84, L101, L116, L140, L145, L399, … +3); `api` (L367, L372, L375, L380, L383, L388, L391, L396); `xTranslations` (L403)

#### `11-moderation.md` — Snippet / prop-table update

- **Change:** `message.moderation_details` (L9, L36, L40) -> `message.moderation` (V2: `action: "remove" | "bounce"`).
- **Detected:** `moderation_details` (L9, L36, L40)

#### `12-going-live-checklist.md` — Snippet / prop-table update

- **Change:** Re-render example (L40-80) uses `usePaginatedMessageListContext` -> `useStateStore(channel.messagePaginator.state, selector)` (selector already limits re-renders). Change (stacked PRs): the logout snippet (L22-31) should remove and dispose the channel-list paginator before `disconnectUser()`.
- **Detected:** `PaginatedMessageListContext` (L40); `usePaginatedMessageListContext` (L43, L47, L59, L74)

#### `13-push-notifications.md` — Major rewrite

- **Change:** `client.addDevice(token, provider, USER_ID, name)` / `removeDevice` (L95-145) -> `client.createDevice({ id, push_provider, push_provider_name })` / `deleteDevice({ id })`; server snippets `StreamChat.getInstance("api_key", "api_secret")` + `client.updateAppSettings(...)` (L392-510) - server-side API removed from `stream-chat` v10 -> `@stream-io/node-sdk`; `chatClient.getMessage(id)` (L548) -> `getMessage({ id })`.
- **Detected:** `devices` (L95, L131, L137, L145); `serverSide` (L392, L400, L460, L474, L500, L508)

#### `14-accessibility.md` — Major rewrite

- **Change:** The `a11y/*` key namespace is gone: best practices (L9-10), Localization section (L67-81: `registerTranslation("nl", { "a11y/Avatar of {{name}}": ... })`, `en.json` pointer) and `accessibilityLabelKey="a11y/Send message"` (L91) must use dotted `.accessibilityLabel` keys (e.g. `avatar.accessibilityLabel`, `messageInput.sendMessage.accessibilityLabel`, `a11y.newMessages.withCount.accessibilityLabel`). `client.userID` (L160). Change (stacked PRs): the `useIncomingMessageAnnouncements` comment (L161-162) "pass `threadList: true` and the active `parent_id` as `activeThreadId`" -> pass `activeThreadId` only (`threadList` is gone; inside a `<Thread>` read it from `useThreadContext().thread?.id`).
- **Detected:** `tEnglishKey` (L9); `a11yKey` (L9, L75, L76, L77, L91); `newStreami18n` (L72); `registerTranslation` (L74); `translationJson` (L81); `userID` (L160); `useIncomingMessageAnnouncements.threadList` (L161)

#### `15-performance-guide.md` — Snippet / prop-table update

- **Change:** "State update throttling" section (L19-42) documents removed `newMessageStateUpdateThrottleInterval` / `stateUpdateThrottleInterval` -> `client.config.set({ channel: { messagePaginator: { stateThrottleMs } } })`; add `maxLoadedItems` pruning and default page size (25).
- **Detected:** `newMessageStateUpdateThrottleInterval` (L26, L33); `stateUpdateThrottleInterval` (L27, L34, L40)

#### `17-channel-read-state.md` — Major rewrite

- **Change:** Whole model changed: `channelUnreadState` in ChannelContext -> `channel.messagePaginator.unreadStateSnapshot`; `read` from context -> `useStateStore(channel.state, s => ({ read: s.read }))`; `markRead` from context + `updateChannelUnreadState` option -> `useMarkRead(channel)` / `channel.markRead()` (reporter-driven cadence); `loadChannelAtFirstUnreadMessage(...)` (L264) -> `paginator.jumpToTheFirstUnreadMessage()`; `last_read: Date` (L23, L34) -> `TimestampNS`; `isLocalUnreadCountEnabled` (L146) -> config `channel.readEvents.localUnreadCountEnabled`; `getInstance(key, { timeout })` (L275) -> `{ client: { axiosRequestConfig: { timeout } } }`; `client.activeChannels` (L294) -> `client.channelManager.values()`; event union narrowing for `total_unread_count`. Change (stacked PRs): the thread note (L118-122: "none of the UI components related to read state are rendered in threads") and best practice L9 are outdated - a `<Thread>` marks the thread read while it is open, its list shows an unread separator from `thread.messagePaginator.unreadStateSnapshot`, its scroll-to-bottom button does not mark the channel read, and opening a thread no longer marks the channel read.
- **Detected:** thread read state (L9, L120); `ChannelContext.read` (L49); `ChannelContext.markRead` (L73); `localUnread` (L147); `setChannelUnreadState` (L264); `loadChannelAtFirstUnreadMessage` (L264); `setTargetedMessage` (L264); `eventMe` (L283, L291, L292); `activeChannels` (L294)

#### `18-draft-message.md` — Snippet / prop-table update

- **Change:** `client.setMessageComposerSetupFunction` (L23) deprecated -> `client.config.setSetupFunction`.
- **Detected:** `setMessageComposerSetupFunction` (L23)

#### `19-message-reminders.md` — Major rewrite

- **Change:** `ReminderState` dates (L32-37) are `TimestampNS`; `ReminderResponse` (L27, L73, L78, L82) -> `ReminderResponseData`; `paginator.sort = { remind_at: 1 }` (L94) -> `[{ field: "remind_at", direction: 1 }]`; `reminder.remindAt.getTime()` (L174) - `remindAt` is unix-ns; header example keys `t("Due since ...")`, `t("timestamp/ReminderNotification")`, `t("duration/Message reminder")`, `t("Saved For Later")` (L190-213) -> dotted keys (`duration.messageReminder`, `message.savedForLater.text`, ...).
- **Detected:** `typeRenames` (L27, L73, L78, L82); `sortObject` (L94); `getTime` (L174); `tEnglishKey` (L190, L195, L213); `timestampKeys` (L191, L196)

#### `21-ai-integrations/01-overview.md` — Snippet / prop-table update

- **Change:** `message.ai_generated` -> `message.custom?.ai_generated` (L369-405, sample `isMessageAIGenerated`); drop the "Channel also accepts `isMessageAIGenerated`" caveat (L426) - prop removed. Node snippets (L374 `channel.sendMessage({ ..., user_id, ai_generated })`, L539 `client.partialUpdateMessage(..., botId)`) are server-side: point to `@stream-io/node-sdk` (server APIs removed from `stream-chat` v10).
- **Detected:** `aiGenerated` (L369, L377, L389, L396, L405); `sendMessage` (L374); `declareModule` (L405, L410, L411); `msgOps` (L539)

#### `21-ai-integrations/02-chat-sdk-integration.md` — Snippet / prop-table update

- **Change:** `message.ai_generated` -> `message.custom?.ai_generated` (L15, L20).
- **Detected:** `aiGenerated` (L15, L20)

#### `21-ai-integrations/03-stream-chat-ai-sdk.md` — Mention only

- **Change:** Backend snippet `channel.sendEvent({ type, orderId })` (L170): if this runs on `stream-chat` v10 it becomes `sendEvent({ event: { type, custom: { orderId } } })`. Verify which SDK the agent snippet targets.

#### `21-ai-integrations/04-stream-chat-langchain-sdk.md` — Mention only

- **Change:** Same `sendEvent` shape note (L172).

#### `21-audio-playback.md` — Snippet / prop-table update

- **Change:** Attachment metadata moved under `.custom`.
- **Detected:** `attachmentMeta` (L72)
- **Manual:** L71-72: `item.duration` / `item.mime_type` -> `item.custom?.mime_type`; `duration` is voice-recording only

#### `22-in-app-notifications.md` — Mention only

- **Change:** L95 "Translation keys live in `package/src/i18n/<locale>.json`" -> runtime defaults + dotted keys; `notification.message` is no longer matched against English copy (i18n guide).

#### `23-search-sources.md` — Snippet / prop-table update

- **Change:** `sort: [{ name: 1 }]` (L99) -> `[{ field: "name", direction: 1 }]`; `client.userID` (L97) -> `client.userId`.
- **Detected:** `userID` (L97); `sortObject` (L99)

### 06-migration-guides/

#### `02-upgrading-from-v8.md` — Mention only

- **Change:** Historical v8->v9 guide. Keep, but add a banner pointing to the new v9->v10 guide: several v9 replacements it recommends are removed in v10 (`useClientMutedUsers` L908/L1175/L1892, `channelUnreadStateStore` L456; stacked PRs: `additionalMessageComposerProps` L614/L654 and the `ThreadMessageComposer` slot L653/L1590/L1667/L1819/L1966, which v10 replaces with `<Thread>` children); RN 0.76 requirement (L42) is now 0.79.
- **Detected:** `deepImport` (L21); `rnVersion` (L42); `channelUnreadStateStore` (L456); `useClientMutedUsers` (L908, L1175, L1892); `Thread.additionalMessageComposerProps` (L614, L654); `ThreadMessageComposer` (L653, L1590, L1667, L1819, L1966)

---

_Artifacts: `scan.js` (term scanner), `hits.json` (raw hits), `triage.js` (manual triage), `report.js` (this report), all in `SCRATCH/docs/`._
