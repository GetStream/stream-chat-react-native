# stream-chat-react-native v9 → v10 — Agent Migration Guide

> Machine-oriented migration reference for AI coding agents, mirroring the style
> of `ai-migration.md` (v8 → v9). v10 adopts the `stream-chat` v10 **reactive
> state layer**: state that used to be copied into React context is now read
> reactively from `stream-chat` instance stores (`channel.state`,
> `channel.messagePaginator`, `thread.messagePaginator`) via
> `useStateStore(store, selector)`. This guide documents every integrator-facing
> breaking change verified against the v10 source.

## 0. For the agent (read first)

1. **Your training data predates v10.** Do not rely on memory for v10 symbols or
   export paths. Verify against the installed SDK source under
   `node_modules/stream-chat-react-native-core/src/`.
2. **The unifying idea:** state that used to be copied into React context is now
   read reactively from `stream-chat` instance stores via the SDK hook
   `useStateStore(store, selector)`. The channel exposes a **single unified
   reactive store** on `channel.state` and a message paginator on
   `channel.messagePaginator`. (Earlier v10 pre-releases exposed per-concern
   handles `channel.state.readStore` / `typingStore` / `membersStore` /
   `watcherStore` / `ownCapabilitiesStore`; these were **removed** in favor of the
   one `channel.state` store — see §K.)
3. **Resolution hooks** (new in v10, additive — use these as the entry points):
   - `useChannelContext().channel` — the active `Channel` instance.
   - `useChannel()` — `threadInstance?.channel ?? channel` (thread-aware).
   - `useMessagePaginator()` — `threadInstance?.messagePaginator ?? channel.messagePaginator`.
   - `useStateStore(store, selector)` — subscribe to a `StateStore` with a
     memo-stable selector (return a stable object; do not allocate fresh arrays
     inside the selector).
4. **Message ops and mark-read moved to new hooks.** The message operations
   formerly on `useMessagesContext()` (§9) and `markRead` formerly on
   `useChannelContext()` (§5) now live on the exported hooks
   `useMessageOperations()` and `useMarkRead()` — both **new in v10**. Use those
   as the drop-in replacements; the underlying `channel.*` instance methods are
   available too for non-React call sites.
5. **Capability is preserved — only the means changed.** Every removed symbol
   has a documented v10 replacement (a store, an instance method, or a component
   override). If you know the v9 symbol you used, Ctrl-F it in the mapping table
   below.
6. **Detect before editing.** Run §1; skip any section with zero hits.

## 1. Detection (run first)

Run each ripgrep against the customer's app source root. Zero hits = skip the
matching section.

```bash
# §2 — TypingContext + typing prop/util changes
rg '\b(useTypingContext|TypingProvider|TypingContext|TypingContextValue|useCreateTypingContext|filterTypingUsers)\b' src/
rg '\bTypingIndicatorContainer\b' src/

# §3 — PaginatedMessageListContext removed
rg '\b(usePaginatedMessageListContext|PaginatedMessageListProvider|PaginatedMessageListContextValue|useCreatePaginatedMessageListContext)\b' src/

# §4 — ChannelContext scalar fields removed
rg 'useChannelContext\(\)' -A6 src/ | rg '\b(members|read|watchers|watcherCount)\b'

# §5 — markRead removed from ChannelContext
rg 'useChannelContext\(\)' -A8 src/ | rg '\bmarkRead\b'

# §6 — message targeting / highlight removed
rg '\b(useTargetedMessage|targetedMessage|setTargetedMessage)\b' src/

# §7 — unread-state store / props removed
rg '\b(channelUnreadStateStore|setChannelUnreadState|ScrollToBottomButton|UnreadMessagesNotification)\b' src/
rg '\bunreadCount\b' src/
rg '\bchannel[.?]*\.disconnected\b' src/

# §8 — ChannelContext loader signatures
rg '\b(loadChannelAroundMessage|loadChannelAtFirstUnreadMessage)\b' src/

# §9 — message operations off MessagesContext
rg 'useMessagesContext\(\)' -A10 src/ | rg '\b(sendReaction|deleteReaction|deleteMessage|removeMessage|retrySendMessage|updateMessage)\b'
rg '\buseMessageActions\b' src/

# §10 — thread API (instance + prop-driven)
rg '\b(useThreadContext|openThread|closeThread|reloadThread|loadMoreThread|threadMessages|closeThreadOnDismount|ThreadFooterComponent)\b' src/

# §11 — editMessage return type
rg '\beditMessage\b' src/

# §12 — MessageList / MessageFlashList props
rg '\b(FooterComponent|HeaderComponent|MessageList|MessageFlashList)\b' src/

# §13 — ChannelProps removed props
rg '<Channel\b' -A20 src/ | rg '\b(messages|loadingMore|loadingMoreRecent|threadMessages|setThreadMessages)\b'

# §13.1 — props replaced by client.config (request handlers, throttles, upload override)
rg '\b(doMarkReadRequest|doUpdateMessageRequest|doFileUploadRequest|stateUpdateThrottleInterval|newMessageStateUpdateThrottleInterval)\b' src/

# §13.1 — raw server flags that should now read resolved config
rg '\b(getConfig\(\)|client\.configs)\b' src/
rg 'serverConfig\?\.(typing_events|read_events|replies|user_message_reminders|delivery_events|commands|uploads|polls|url_enrichment|shared_locations|max_message_length)' src/

# §14–§15 — hooks
rg '\b(useMutedUsers|useCreateChannelContext|useCreateMessagesContext|useCreateThreadContext|useCreateMessageInputContext)\b' src/

# §16 — behavioral (no symbol; review if you rely on send/mark-read/page-size behavior)
rg '\b(sendMessage|SendMessageDisallowedIndicator)\b' src/

# §18 — ChannelList event-override props + channelManager (orchestrator)
rg '\b(onAddedToChannel|onRemovedFromChannel|onChannelDeleted|onChannelHidden|onChannelVisible|onChannelUpdated|onChannelTruncated|onChannelMemberUpdated|onNewMessage|onNewMessageNotification|ChannelListEventHandler|useChannelUpdated|queryChannelsOverride)\b' src/
rg 'useChatContext\(\)' -A6 src/ | rg '\bchannelManager\b'
rg '<Chat\b' -A10 src/ | rg '\bchannelManager\b'

# §L — connection recovery moved into the client
rg '\b(recoverState|recoverStateOnReconnect|preventThreadCleanup)\b' src/
rg 'connection\.(changed|recovered)' src/

# §K — unified channel.state (removed *Store handles, in-place data mutation)
rg '\bchannel\.state\.(read|typing|members|watcher|ownCapabilities)Store\b' src/
rg '\bchannel\.state\.mutedUsersStore\b' src/
rg '\bchannel\.data\.(member_count|own_capabilities)\s*=' src/

# §19 — i18n: keys, the Streami18n API, and the a11y namespace
rg '\bStreami18n\b|registerTranslation|translationsForLanguage|setLanguage|getTranslators' src/
rg "t\(\s*'a11y/|'[A-Z][a-z]+ [a-z]" src/          # v9 keys WERE the English copy
rg '\b(enTranslations|deTranslations|frTranslations|esTranslations|itTranslations|nlTranslations|ptBrTranslations|ruTranslations|trTranslations|jaTranslations|koTranslations|hiTranslations|heTranslations|arTranslations)\b' src/
rg 'getDateString|getDateStringForA11y' -A4 src/ | rg '\bdate:'
```

---

## Quick reference — v9 → v10 map

Ctrl-F the v9 symbol you used. Every entry preserves the capability — only the
means changed. Details in the linked section.

| v9 — you used to… | v10 — now do… | § |
|---|---|---|
| `useTypingContext().typing` | `useStateStore(channel.state, s => ({ typing: s.typing }))` | §2 |
| `filterTypingUsers({ client, thread, typing })` | `filterTypingUsers({ client, threadId: thread?.id, typing })` | §2.1 |
| `usePaginatedMessageListContext().messages` | `useStateStore(channel.messagePaginator.state, s => s.items)` | §3 |
| …`.hasMore` / `.hasMoreNewer` | `channel.messagePaginator.state.hasMoreTail` / `.hasMoreHead` | §3 |
| …`.loadMore()` / `.loadMoreRecent()` | `channel.messagePaginator.toTail()` / `.toHead()` | §3 |
| …`.loadLatestMessages()` | `channel.messagePaginator.jumpToTheLatestMessage()` | §3 |
| `useChannelContext().members` / `read` / `watchers` / `watcherCount` | `useStateStore(channel.state, selector)` (one store; selector picks the slice) | §4 |
| `useChannelContext().markRead()` | `useMarkRead(channel)()` — or `channel.markRead()` | §5 |
| `<Channel doMarkReadRequest>` | `client.config.set({ channel: { requestHandlers: { markReadRequest } } })` | §13.1 |
| `<Channel doUpdateMessageRequest>` | `…{ requestHandlers: { updateMessageRequest } }` | §13.1 |
| `<Channel doFileUploadRequest>` | `client.config.set({ messageComposer: { attachments: { doUploadRequest } } })` | §13.1 |
| `<Channel stateUpdateThrottleInterval>` | `…{ channel: { messagePaginator: { stateThrottleMs } } }` | §13.1 |
| `channel.getConfig()` | `channel.serverConfig` (getter) — or `channel.config` for resolved gates | §13.1 |
| `client.configs[cid]` | `client.channelServerConfigs[cid]` | §13.1 |
| `channel.serverConfig?.typing_events` (and the other gated flags) | `channel.config.typingEvents.enabled` — resolved, server ANDed with yours | §13.1 |
| `client.setMessageComposerSetupFunction(fn)` | `client.config.setSetupFunction('messageComposer', fn)` | §13.1 |
| re-setting `channel.messagePaginator.pageSize` after mount | `client.config.set({ channel: { messagePaginator: { pageSize } } })` | §13.1, §16.1 |
| `useTargetedMessage()` / `setTargetedMessage(id)` | `useChannelContext().loadChannelAroundMessage({ messageId })`; read `highlightedMessageId` | §6 |
| `useChannelContext().channelUnreadStateStore` / `setChannelUnreadState` | `channel.messagePaginator.unreadStateSnapshot` | §7 |
| `<ScrollToBottomButton unreadCount={n} />` | self-derived from `channel.state` `read` (override the component to control) | §7 |
| app-wide unread from `event.total_unread_count` | sum `channel.countUnread()` over `client.activeChannels` | §7.1 |
| `useMessagesContext()` → `sendReaction` / `deleteReaction` / `deleteMessage` / `removeMessage` / `retrySendMessage` / `updateMessage` | `useMessageOperations()` (same names) | §9 |
| `useMessagesContext().targetedMessage` | `useChannelContext().highlightedMessageId` | §6 |
| `useThreadContext().thread` (parent message) | `useStateStore(threadInstance.state, s => ({ parentMessage: s.parentMessage }))` | §10 |
| `useThreadContext().threadMessages` | `threadInstance.messagePaginator.state.items` | §10 |
| `useThreadContext().loadMoreThread()` / `loadMoreRecentThread()` | `threadInstance.messagePaginator.toTail()` / `.toHead()` | §10 |
| `useThreadContext().threadHasMore` / `threadLoadingMore` | `threadInstance.messagePaginator.state.hasMoreTail` / `.isLoading` | §10 |
| `useThreadContext().reloadThread()` | `threadInstance.reload()` | §10 |
| `openThread(msg)` / `closeThread()` | lift `onThreadSelect` → `<Channel thread={msg \| null} />` | §10.1 |
| `useMessageComposerContext().thread` | `threadInstance` | §10.2 |
| `editMessage()` → `UpdateMessageAPIResponse` | `editMessage()` → `Promise<void>`; for the response, `client.updateMessage()` | §11 |
| `<MessageList thread / targetedMessage / loadMoreThread …>` props | removed — list reads `threadInstance` + paginator internally | §12 |
| custom `FooterComponent` / `HeaderComponent` reading `loadingMore` from context | receive `{ loadingMore?: boolean }` as a prop | §12.1 |
| `<Channel messages / loadingMore / threadMessages / setThreadMessages …>` props | removed — state lives in the paginator | §13 |
| `useMutedUsers(channel)` | `useMutedUsers()` | §14 |
| `useCreateTypingContext` / `useCreatePaginatedMessageListContext` | removed (their contexts are gone) | §15 |
| initial message-list page size ~100 | 25 — override via `channel.messagePaginator.pageSize` | §16.1 |
| `sendMessage` errors swallowed | `sendMessage` throws — handle the rejection | §16.2 |
| `stream-chat` v9 | `stream-chat` `^10.x` required | §17 |
| `<ChannelList onNewMessage / onAddedToChannel / …>` event callbacks | `client.channelManager.addEventHandler(...)` / `client.on(...)`; membership+order via `filters`/`sort` | §18 |
| `queryChannelsOverride` returning `Channel[]` | now the paginator `doRequest` → `return { items }` | §18.1 |
| `useChannelUpdated()` | removed — `channel.updated` is handled by the orchestrator | §18.2 |
| `loadNextPage(filters, sort, options)` | `loadNextPage()` (no args) | §18.3 |
| `<Chat channelManager={…}>` / `useChatContext().channelManager` | `client.channelManager` | §18.4 |
| `client.recoverState()` | `client.connectionRecovery.recover()` | §L.6 |
| `<Channel>` refreshing the channel / open thread on reconnect | `client.connectionRecovery`; `<Channel>` only marks them active | §L.4 |
| a custom channel/thread view built on the contexts | call `channel.activate()` / `thread.activate()`, balanced with `deactivate()`, or recovery cannot see them (`<Channel>` and `<Thread>` do it for you) | §L.4 |
| `<Chat>` setting `client.recoverStateOnReconnect = false` for you | it no longer does; the option is now the kill switch for `client.connectionRecovery` | §L.1 |
| a `connection.changed` listener re-querying a list / re-watching a channel | delete it — `client.connectionRecovery` owns reconnect | §L |
| `connection.recovered` as "the `_reconnect()` path fired" | now dispatched on **every** reconnect path, after the recovery reload | §L.2 |
| `useStateStore(channel.state.readStore / typingStore / membersStore / watcherStore / ownCapabilitiesStore, sel)` | `useStateStore(channel.state, sel)` — drop the `.<X>Store`, keep the selector | §K.1 |
| `channel.state.mutedUsersStore` | `client.mutedUsersStore` (via `useMutedUsers()`) | §K.2 |
| in-place `channel.data.member_count = n` / `.own_capabilities = […]` | reassign `channel.data = { …channel.data, member_count: n }` | §K.5 |
| `channel.disconnected` | `channel.pendingDisposal` (hard rename — no alias) | §K.8 |
| `WatcherState` type | `ChannelWatchState` (now also carries `watchStatus`) | §K.3 |
| `t('Send Message')` — the key *was* the English copy | `t('messageInput.sendMessage.accessibilityLabel', 'Send Message')` — stable dotted key, copy inline | §19 |
| `t('a11y/Send message')` | the `.accessibilityLabel` leaf of the owning component's key | §19 |
| `import { deTranslations } from 'stream-chat-react-native'` | removed — English is the only bundled language; supply your own dictionary | §19 |
| `new Streami18n('nl')` | `new Streami18n({ language: 'nl' })` — options object; the class name is unchanged | §19 |
| `new Streami18n(opts, i18nextConfig)` | `new Streami18n({ ...opts, i18nextConfigOverrides: i18nextConfig })` | §19 |
| `const t = await i18n.setLanguage('de')` | `await i18n.setLanguage('de')` → `void`; read `i18n.t` or subscribe to `i18n.state` | §19 |
| `i18n.addOnLanguageChangeListener(fn)` | `i18n.state.subscribeWithSelector(({ t }) => ({ t }), fn)` | §19 |
| `i18n.getTranslators()` | `i18n.init()` — removed, not aliased; same return value | §19 |
| `{{ timestamp \| relativeCompactDateFormatter }}` | `{{ timestamp \| timestampFormatter(relativeCompact: true) }}` | §19 |
| `getDateString({ date, … })` | `getDateString({ messageCreatedAt, … })`; returns `null`, not `undefined`, when unrenderable | §19 |
| `getDateStringForA11y({ date, … })` | `getCalendarDateStringForA11y({ messageCreatedAt, … })` — same behaviour under a new name | §19 |
| poll `state.errors.x` as an English string | a `PollComposerValidationError` — key your copy on `error.code`, fall back to `error.message` | §19 |

---

# Part A — Removed contexts

## 2. `TypingContext` removed → `useStateStore(channel.state, …)`

Removed symbols: `TypingContext`, `TypingProvider`, `useTypingContext`,
`TypingContextValue`, `useCreateTypingContext`.

**Before (v9):**

```tsx
import { useTypingContext } from 'stream-chat-react-native';

const { typing } = useTypingContext();
```

**After (v10):**

```tsx
import { useChannelContext, useStateStore } from 'stream-chat-react-native';
import type { TypingUsersState } from 'stream-chat';

const typingSelector = (state: TypingUsersState) => ({ typing: state.typing });

const { channel } = useChannelContext();
const { typing } = useStateStore(channel.state, typingSelector) ?? { typing: {} };
```

`typing` has the same shape as before (`Record<string, Event>`). The selector is
unchanged from any earlier pre-release that used `channel.state.typingStore` —
`channel.state` is flat and carries the same `typing` key, so `(s: TypingUsersState)
=> …` stays assignable (see §K).

### 2.1 Typing prop/util changes (if you override the typing indicator)

- **`TypingIndicatorContainerProps`**: the `thread` prop is removed; pass
  `threadId?: string` instead. `typing` is retyped
  `TypingContextValue['typing']` → `TypingUsersState['typing']` (same runtime
  shape).
- **`filterTypingUsers` util**: signature changed
  `({ client, thread, typing })` → `({ client, threadId, typing })` where
  `typing: TypingUsersState['typing']`. Pass `threadId: thread?.id`.

```tsx
// Before
filterTypingUsers({ client, thread, typing });
// After
filterTypingUsers({ client, threadId: thread?.id, typing });
```

## 3. `PaginatedMessageListContext` removed → `useMessagePaginator()` / `channel.messagePaginator`

Removed symbols: `PaginatedMessageListContext`, `PaginatedMessageListProvider`,
`usePaginatedMessageListContext`, `PaginatedMessageListContextValue`,
`useCreatePaginatedMessageListContext`.

The message-list state (messages / hasMore / loading) now lives on the paginator.
**Direction mapping** (non-obvious): the paginator is bi-directional — `tail` =
older messages, `head` = newer.

| Removed context field | Replacement |
|---|---|
| `messages` | `channel.messagePaginator.state.items` |
| `hasMore` (older) | `channel.messagePaginator.state.hasMoreTail` |
| `hasMoreNewer` | `channel.messagePaginator.state.hasMoreHead` |
| `loading` | `channel.messagePaginator.state.isLoading` |
| `loadMore()` (older) | `channel.messagePaginator.toTail()` |
| `loadMoreRecent()` (newer) | `channel.messagePaginator.toHead()` |
| `loadLatestMessages()` | `channel.messagePaginator.jumpToTheLatestMessage()` |

> `next()` / `prev()` exist on the paginator but are **deprecated** aliases of
> `toTail()` / `toHead()` — use the `to*` forms.

**Before (v9):**

```tsx
const { messages, hasMore, loadMore } = usePaginatedMessageListContext();
```

**After (v10):**

```tsx
import { useChannelContext, useStateStore } from 'stream-chat-react-native';
import type { LocalMessage } from 'stream-chat';

const selector = (s: { items?: LocalMessage[]; hasMoreTail: boolean }) => ({
  messages: s.items,
  hasMore: s.hasMoreTail,
});

const { channel } = useChannelContext();
const { messages, hasMore } = useStateStore(channel.messagePaginator.state, selector) ?? {};
const loadMore = () => channel.messagePaginator.toTail();
```

Use `channel.messagePaginator` for the channel message list. For thread replies,
use `useMessagePaginator()` (thread-aware) — but note the **main** channel list
must read `channel.messagePaginator` directly so it keeps showing channel
messages while a thread is open.

---

# Part B — `ChannelContext` value changes

## 4. `ChannelContext` scalar state fields removed → `useStateStore(channel.state, …)`

`useChannelContext()` no longer returns `members`, `read`, `watchers`, or
`watcherCount`. Read them from the one unified `channel.state` store (§K) with a
selector that picks the slice.

| Removed context field | Replacement store | Store state key |
|---|---|---|
| `members` | `channel.state` | `members` |
| `read` | `channel.state` | `read` |
| `watchers` | `channel.state` | `watchers` |
| `watcherCount` | `channel.state` | `watcherCount` |

**Before (v9):**

```tsx
const { members, watcherCount } = useChannelContext();
```

**After (v10):**

```tsx
import { useChannelContext, useStateStore } from 'stream-chat-react-native';
import type { MembersState, WatcherState } from 'stream-chat';

const membersSelector = (s: MembersState) => ({ members: s.members });
const watcherSelector = (s: WatcherState) => ({
  watcherCount: s.watcherCount,
  watchers: s.watchers,
});

const { channel } = useChannelContext();
const { members } = useStateStore(channel.state, membersSelector) ?? { members: {} };
const { watcherCount } = useStateStore(channel.state, watcherSelector) ?? {};
```

Note: `members` remains available on the per-message `MessageContext`
(`useMessageContext().members`, retyped to `MembersState['members']` — same
shape) for message-level consumers such as a custom message footer. Only the
**channel-level** `ChannelContext.members` was removed.

## 5. `ChannelContext.markRead` removed → `useMarkRead(channel)` / `channel.markRead()`

`markRead` is removed from `ChannelContextValue`. Mark-read now fires
automatically inside the SDK (the `useMarkRead` hook is wired into `MessageList` /
`MessageFlashList` / `Channel`), and the read-reporting cadence is owned by the
`stream-chat` client's `messageDeliveryReporter` — the SDK's own 500ms
throttle/debounce is gone.

> **Replacement hook: `useMarkRead(channel)`** (exported; new in v10). It returns
> a stable `markRead(options?)` callback — the drop-in replacement for the old
> context `markRead`. Most apps can just **drop manual calls** (mark-read is
> automatic now). `channel.markRead()` also works for a one-off imperative call.

**Before (v9):**

```tsx
const { markRead } = useChannelContext();
markRead();
```

**After (v10):**

```tsx
import { useChannelContext, useMarkRead } from 'stream-chat-react-native';

const { channel } = useChannelContext();
const markRead = useMarkRead(channel); // 1:1 replacement for the old context markRead
markRead();
// or, imperatively (no hook): await channel.markRead();
```

A custom mark-read handler is still honored, but it is no longer a `Channel` prop —
register it as `client.config.set({ channel: { requestHandlers: { markReadRequest } } })`.
See §13.1.

## 6. Message targeting / highlight removed → `messagePaginator.messageFocusSignal`

Removed symbols: `ChannelContext.targetedMessage`,
`ChannelContext.setTargetedMessage`, `MessagesContext.targetedMessage`, and the
`useTargetedMessage` hook (deleted, no replacement hook). List props
`targetedMessage` / `setTargetedMessage` are removed too (see §12).

Highlighting is now driven by the paginator's `messageFocusSignal`, which
auto-clears after `DEFAULT_HIGHLIGHT_DURATION` (3000ms). The current highlight
is still readable on `ChannelContext.highlightedMessageId`.

**Before (v9):**

```tsx
const { setTargetedMessage } = useTargetedMessage(); // or from useChannelContext()
setTargetedMessage(messageId);
```

**After (v10):**

```tsx
const { loadChannelAroundMessage, highlightedMessageId } = useChannelContext();
// Jump to + highlight a message (loads it if not in the current window):
await loadChannelAroundMessage({ messageId });
// `highlightedMessageId` reflects the currently-highlighted message and
// auto-clears after ~3s.
```

## 7. Unread state moved to the paginator

Removed symbols: `ChannelContext.channelUnreadStateStore`,
`ChannelContext.setChannelUnreadState`, and the related list /
notification / button props (`channelUnreadStateStore`, `setChannelUnreadState`
on `MessageListProps`; `channelUnreadStateStore` on
`UnreadMessagesNotificationProps`; `unreadCount` on `ScrollToBottomButtonProps`).

The unread snapshot now lives on `channel.messagePaginator.unreadStateSnapshot`
(a `StateStore`). An internal `getChannelUnreadState(channel)` helper maps it to
the public `ChannelUnreadState` shape for imperative readers.

| Removed | Replacement |
|---|---|
| `channelUnreadStateStore` | `channel.messagePaginator.unreadStateSnapshot` |
| `setChannelUnreadState` | (managed internally by the paginator) |
| `ScrollToBottomButtonProps.unreadCount` | self-derived from `channel.state` `read[userId].unread_messages` (undefined in thread lists) |
| `UnreadMessagesNotificationProps.channelUnreadStateStore` | count from `channel.messagePaginator.unreadStateSnapshot` |

`UnreadMessagesNotificationProps` also **adds** an optional
`markRead?: (options?: MarkReadFunctionOptions) => void` (the shared mark-read
used by the dismiss button). Custom overrides of these components no longer
receive/need the removed props — the built-ins self-derive their counts.

### 7.1 App-wide unread badge (advisory — app code, no SDK symbol change)

Compute an app-wide unread total from `channel.countUnread()`, **not** from
`event.total_unread_count`. Under the localized-unread "viewing live" gate, the
active channel reports `0` locally while the server total may still briefly count
it, so the server total can transiently over-count.

```tsx
const total = Object.values(client.activeChannels).reduce(
  (n, c) => n + c.countUnread(),
  0,
);
```

## 8. `ChannelContext` loader signatures narrowed

The jump/load helpers dropped their old callback arguments; passing them is now
a TypeScript error.

| v9 signature | v10 signature |
|---|---|
| `loadChannelAroundMessage({ messageId, setTargetedMessage })` | `loadChannelAroundMessage({ limit?, messageId? })` |
| `loadChannelAtFirstUnreadMessage({ channelUnreadState, setChannelUnreadState, setTargetedMessage })` | `loadChannelAtFirstUnreadMessage(options?: { limit?: number })` |

Highlighting/targeting is handled internally by the `messageFocusSignal` (§6),
so the `set*` callbacks are no longer needed.

---

# Part C — Message operations

## 9. Message operations removed from `MessagesContext`

Removed from `MessagesContextValue`: `deleteMessage`, `deleteReaction`,
`sendReaction`, `removeMessage`, `retrySendMessage`, `updateMessage` (which also
lost its `extraState` / `throttled` params), plus `targetedMessage` (§6). They
moved to the exported `useMessageOperations()` hook (returning a
`MessageOperations` object).

> **Replacement hook: `useMessageOperations()`** (exported; new in v10). It
> returns the same six ops with the optimistic + thread-aware behavior the old
> context methods had — the drop-in replacement for the removed
> `useMessagesContext()` ops. **Custom `Message` overrides also still receive all
> six as props** (the built-in `Message` spreads them in), so override users need
> no change. Prefer the hook over the raw `channel.*` methods below: for
> **reactions** especially, the hook applies the optimistic paginator ingest that
> raw `channel.sendReaction` skips (raw `channel.sendReaction` only renders once
> the WS echo lands).

The hook's op signatures:

```ts
sendReaction(type: string, messageId: string): Promise<void>;
deleteReaction(type: string, messageId: string): Promise<void>;
deleteMessage(message: LocalMessage, options?): Promise<void>;
retrySendMessage(message: LocalMessage): Promise<void>;
removeMessage(message: { id: string; parent_id?: string }): Promise<void>;
updateMessage(updatedMessage: MessageResponse | LocalMessage): void; // single-arg now
```

`updateMessage` is retyped to a single argument (was
`(msg, extraState?, throttled?) => void`). This also affects
`MessageProps.updateMessage` overrides and `useMessageActions` (which dropped its
`openThread` prop).

> **Note:** optimistic reactions are applied only when `enableOfflineSupport` is
> on — this is **unchanged from v9** (`develop` gated the same optimistic block
> on `enableOfflineSupport`), so it is not a v10 regression. With it off,
> reactions render on the WS echo either way.

**Before (v9):**

```tsx
const { sendReaction, deleteMessage, updateMessage } = useMessagesContext();
```

**After (v10) — via the exported hook (preferred):**

```tsx
import { useMessageOperations } from 'stream-chat-react-native';

const { sendReaction, deleteReaction, deleteMessage, updateMessage } = useMessageOperations();
await sendReaction(type, messageId); // optimistic + thread-aware
await deleteReaction(type, messageId);
await deleteMessage(message);
```

**After (v10) — from a custom `Message` override (still props):**

```tsx
const MyMessage = ({ sendReaction, deleteMessage, updateMessage }) => { /* … */ };
```

**Lower level (non-React call sites):** `channel.deleteMessageWithLocalUpdate`,
`channel.retrySendMessageWithLocalUpdate`, `channel.sendReaction` /
`deleteReaction` remain available — but `channel.sendReaction` does **not** apply
the optimistic update, so use the hook in UI code.

### 9.1 Optimistic lifecycle is LLC-owned (behavioral)

Do **not** hand-roll optimistic message/reaction state. The
`*WithLocalUpdate` engine + `messagePaginator.ingestItem/removeItem` + the
offline DB own the pending → received/failed lifecycle. Custom optimistic layers
will double-apply or conflict.

---

# Part D — Threads

## 10. Thread API: instance-based + prop-driven

This is the largest behavioral shift. `ThreadContextValue` is reduced to **four
fields** — everything else is derived from the `threadInstance` (a `stream-chat`
`Thread`), and opening/closing a thread is now **prop-driven** (no imperative
`openThread` / `closeThread`).

**`ThreadContextValue` now = `{ threadInstance?, allowThreadMessagesInChannel,
parentMessagePreventPress?, onAlsoSentToChannelHeaderPress? }`.**

Removed fields (all derivable from `threadInstance`):

| Removed `ThreadContext` field | Replacement (off `threadInstance`) |
|---|---|
| `thread` (parent message) | `threadInstance.state.getLatestValue().parentMessage` (reactive via `useStateStore`) |
| `threadMessages` | `threadInstance.messagePaginator.state.items` |
| `loadMoreThread` | `threadInstance.messagePaginator.toTail()` |
| `loadMoreRecentThread` | `threadInstance.messagePaginator.toHead()` |
| `threadHasMore` | `threadInstance.messagePaginator.state.hasMoreTail` |
| `threadLoadingMore` / `threadLoadingMoreRecent` | `threadInstance.messagePaginator.state.isLoading` |
| `reloadThread` | `threadInstance.reload()` |
| `openThread` / `closeThread` / `setThreadLoadingMore` | removed — see prop-driven flow below |

```tsx
import { useThreadContext, useStateStore } from 'stream-chat-react-native';

const { threadInstance } = useThreadContext();
const { parentMessage } = useStateStore(threadInstance.state, (s) => ({
  parentMessage: s.parentMessage,
}));
const { replies } = useStateStore(threadInstance.messagePaginator.state, (s) => ({
  replies: s.items,
}));
```

### 10.1 Prop-driven open/close

There is no imperative `openThread` / `closeThread`. Lift the selected thread
into your own state from a list's `onThreadSelect`, then render
`<Channel thread={...}>`; set it back to `null` to close.

```tsx
const [thread, setThread] = useState<LocalMessage | null>(null);

<MessageList onThreadSelect={setThread} />
<Channel thread={thread} /* thread reply UI renders when set */ />
```

`<Channel>`'s `thread` prop accepts `LocalMessage | ThreadType | null` (where
`ThreadType = { thread: LocalMessage; threadInstance: Thread }`).

> **`onThreadSelect` has different signatures per surface** — wire the right one:
> - `MessageList` / `MessageFlashList`: `(message: LocalMessage | null) => void`
> - message-level (`MessageProps`): `(message: LocalMessage) => void`
> - `ThreadList` (`ThreadsContext`): `(thread: ThreadType, channel: Channel) => void`

### 10.2 Removed thread-related props / context fields

- **`ThreadProps`**: removed `thread`, `closeThread`, `loadMoreThread`,
  `reloadThread`. Supply `threadInstance` instead.
  - ⚠️ `closeThreadOnDismount?: boolean` **still exists on the type but is
    inert** (never read — the thread no longer auto-closes on unmount, it only
    `deactivate()`s). No TS error; silent behavior change.
- **`MessageComposerContextValue`**: `thread` removed (only `threadInstance`
  remains).
- **`ThreadFooterComponentProps`**: `thread` removed (type is now
  `Partial<Pick<ThreadContextValue, 'parentMessagePreventPress'>>`). Read
  `threadInstance` via `useThreadContext()` inside a custom footer and get the
  parent/`replyCount` off `threadInstance.state`.
- **`MessageProps`**: removed `openThread` (§9).

## 11. `InputMessageInputContextValue.editMessage` return retyped

`editMessage` now returns `Promise<void>` (was
`ReturnType<StreamChat['updateMessage']>`, i.e. a resolved
`UpdateMessageAPIResponse`). Callers that read the resolved API response break —
read the updated state from the paginator/composer after the promise resolves
instead.

```tsx
// Before: const { message } = await editMessage(...);
// After:
await editMessage({ localMessage, options });
// message state is already reflected in channel.messagePaginator
```

---

# Part E — Component props

## 12. `MessageList` / `MessageFlashList` props

Removed props (from both list components): `channelUnreadStateStore`,
`setChannelUnreadState`, `setTargetedMessage`, `targetedMessage`, `thread`
(old `ThreadType` prop), `threadHasMore`, `loadMoreThread`,
`loadMoreRecentThread`. The list now reads thread state from `threadInstance`,
unread from the paginator snapshot (§7), and targeting from the focus signal
(§6) — all internally.

`loadMore` / `loadMoreRecent` / `markRead` are still passed but are now inline
prop types; `loadingMore?` / `loadingMoreRecent?` are **added**.

### 12.1 Custom `FooterComponent` / `HeaderComponent` receive `loadingMore` as a prop

The inline loading indicators no longer read `loadingMore` /
`loadingMoreRecent` from `PaginatedMessageListContext`; the list owns those flags
and passes them as props.

- **`MessageList`** (inverted): custom `FooterComponent` now receives
  `{ loadingMore?: boolean }` as a prop.
- **`MessageFlashList`**: custom `HeaderComponent` now receives
  `{ loadingMore?: boolean }` as a prop.

**Before (v9):**

```tsx
const MyFooter = () => {
  const { loadingMore } = usePaginatedMessageListContext();
  return loadingMore ? <Spinner /> : null;
};
```

**After (v10):**

```tsx
const MyFooter = ({ loadingMore }: { loadingMore?: boolean }) =>
  loadingMore ? <Spinner /> : null;
```

No-prop override components remain assignable (the prop is optional), so
overrides that don't read the flag need no change.

## 13. `ChannelProps`

Removed props: `messages`, `loadingMore`, `loadingMoreRecent`, `threadMessages`,
`setThreadMessages` — message/thread-reply state now lives in the LLC paginator,
so these are no longer inputs. Drop them.

Also removed, and covered in §13.1:

| Removed prop | v10 replacement |
|---|---|
| `doMarkReadRequest` | `client.config.set({ channel: { requestHandlers: { markReadRequest } } })` |
| `doUpdateMessageRequest` | `client.config.set({ channel: { requestHandlers: { updateMessageRequest } } })` |
| `doFileUploadRequest` | `client.config.set({ messageComposer: { attachments: { doUploadRequest } } })` |
| `stateUpdateThrottleInterval` | `client.config.set({ channel: { messagePaginator: { stateThrottleMs } } })` |
| `newMessageStateUpdateThrottleInterval` | same as above |

The two throttle props were declared but never read in v10 — they are now deleted
outright rather than left inert. `stateThrottleMs` is the real, reactive control.

`doSendMessageRequest` is the one `do*Request` prop that **remains**. The SDK itself
occupies that handler slot to run the attachment-upload step inside the send pipeline,
so it wraps your handler rather than being replaced by it. Its `message` argument is
now typed `MessageRequest` (rename only; no shape change).

## 13.1 Instance configuration → `client.config`

v10's `stream-chat` ships a declarative configuration API for the objects the SDK builds
on your behalf — channels, threads, message composers, paginators, the client's own
managers. Several `<Channel>` props are gone because this replaced them, and a number of
values that were previously unreachable are now settable.

### Where to register it

At the client, **not** from a component effect:

```tsx
const client = StreamChat.getInstance(apiKey);

client.config.set({
  channel: {
    messagePaginator: { pageSize: 50, stateThrottleMs: 250 },
    readEvents: { enabled: false },
  },
  messageComposer: {
    drafts: { enabled: true },
    attachments: { doUploadRequest: myUpload, customCdn: true },
  },
});
```

Some configuration is read once when an instance is constructed, and channels are
constructed by `client.channel()` / `client.queryChannels()` — which an app typically
calls before or during the same commit that mounts `<Chat>`. Registering from a
`useEffect` runs after that, so those values arrive too late for instances that already
exist. There is deliberately no `<Chat>` prop for this: binding registration to a
component lifecycle would recreate that ordering problem.

### Request handlers

The `doMarkReadRequest`, `doUpdateMessageRequest` and `doFileUploadRequest` props are
removed (§13). Register the handlers instead:

```tsx
// v9
<Channel channel={channel} doUpdateMessageRequest={myUpdate}>…</Channel>

// v10
client.config.set({
  channel: {
    requestHandlers: {
      updateMessageRequest: async ({ localMessage, options }) => ({
        message: await myUpdate(localMessage, options),
      }),
    },
  },
});
<Channel channel={channel}>…</Channel>
```

Three things change with it:

- **The signature is the LLC's, not the prop's.** Handlers take a single params object
  (`{ localMessage, options }`, plus `message` for send) and must return `{ message }`.
  The props took positional arguments; an adapter inside the SDK filled in the rest.
- **Registration is per client**, not per mounted subtree. If you were passing different
  handlers to different `<Channel>` instances, branch inside one handler on the
  `localMessage.cid` you receive.
- **Thread-scoped handlers** go under the `thread` key with the same shape.

`doSendMessageRequest` stays a prop — see §13.

### Behaviour, not values → setup functions

Values go in `set()`. Reach for a setup function when what you are changing is behaviour
that no value can express — middleware, comparators:

```tsx
client.config.setSetupFunction('messageComposer', ({ composer }) => {
  setupCommandUIMiddlewares(composer);
  composer.textComposer.middlewareExecutor.insert({ /* … */ });
});
```

This replaces `client.setMessageComposerSetupFunction(fn)`, which is deprecated in the
LLC. A setup function is also what makes a per-instance change survive
`client.config.reset()` — reset re-runs setup functions but discards imperative
`updateConfig()` calls made outside one.

### Read the resolved value, never the raw server flag

Several channel-type flags now resolve **into** the instance's own configuration, ANDed
with whatever you registered — either side can switch a feature off, neither can widen:

| Read this | …instead of |
|---|---|
| `channel.config.typingEvents.enabled` | `channel.serverConfig?.typing_events` |
| `channel.config.readEvents.enabled` | `…?.read_events` |
| `channel.config.replies.enabled` | `…?.replies` |
| `channel.config.userMessageReminders.enabled` | `…?.user_message_reminders` |
| `channel.config.deliveryEvents.enabled` | `…?.delivery_events` |
| `channel.config.availableCommands` | `…?.commands` |
| `composer.config.attachments.enabled` | `…?.uploads` |
| `composer.config.polls.enabled` | `…?.polls` |
| `composer.config.linkPreviews.enabled` | `…?.url_enrichment` |
| `composer.config.location.enabled` | `…?.shared_locations` |
| `composer.config.text.maxLengthOnSend` | `…?.max_message_length` |

Gating UI on the raw flag offers features the client has already disabled. Both
`channel.configState` and `composer.configState` are reactive stores, so
`useStateStore(channel.configState, selector)` re-renders when a value moves — define
the selector at module scope.

`channel.getConfig()` is **removed**; `channel.serverConfig` is a getter returning the
same value. Note it is a getter, so `jest.spyOn(channel, 'getConfig')` has no direct
equivalent — write to `client.channelServerConfigsStore` in tests instead.

`client.configs` is also gone → `client.channelServerConfigs`, still keyed by cid.

### Two silent behaviour changes

Neither produces a compile error.

- **`linkPreviews.enabled` now defaults to `true`.** It was `false`, and the manager used
  to AND the channel type's `url_enrichment` itself; that gate moved into resolved
  configuration. Net effect: link previews turn **on** wherever enrichment is enabled
  server-side. Opt out with
  `client.config.set({ messageComposer: { linkPreviews: { enabled: false } } })`.
- **A custom `doUploadRequest` no longer waives the `upload-file` capability.** That
  conflated *how* files are sent with *where* they land. If your uploads go to storage
  Stream does not host, set `attachments: { customCdn: true }` — otherwise uploads are
  refused for users without the capability and the attachment control disappears.

### What this unlocks that no prop could

These had no v9 equivalent — the SDK constructs the objects, so there was nothing to pass
a prop to:

```tsx
client.config.set({
  messagePaginator: { stateThrottleMs: 250, retryCount: 2, lockItemOrder: true },
  channel: { messagePaginator: { pageSize: 50 }, pinnedMessagesPaginator: { pageSize: 25 } },
  thread: { messagePaginator: { pageSize: 25 } },
  client: {
    notifications: { durations: { error: 10_000 } },
    reminders: { scheduledOffsetsMs: [5 * 60_000, 60 * 60_000] },
    messageDelivery: { markAsReadThrottleTimeoutMs: 2000 },
  },
  messageOperations: { failedSendCacheTtlMs: 5 * 60_000 },
});
```

The top-level `messagePaginator` key applies to **every** `MessagePaginator` — the channel
list and thread replies both — because one class backs both. The per-parent slices
(`channel.messagePaginator`, `thread.messagePaginator`) override it field by field, which
is how `pageSize` can differ while `stateThrottleMs` does not.

`client.config.getTree()` dumps everything you have registered, without needing to know
the key names.

### Caveats worth knowing

- **`pageSize` is not `channelQueryOptions.messages.limit`.** The prop sizes the *initial*
  channel query; `pageSize` sizes every *subsequent* page. They are different numbers and
  you usually want both.
- **Imperative `updateConfig()` does not survive a re-derivation**, except on
  `MessageComposer`. `channel.messagePaginator.updateConfig({ pageSize: 200 })` is dropped
  the next time anything re-resolves that paginator's configuration — including a
  `client.config.set()` on an unrelated key, because `Channel` watches `messagePaginator`
  and `messageOperations`. Register the value, or use a setup function.
- **`X.config` is `Readonly`.** Assigning to a field is a compile error; nested writes
  throw at runtime because the defaults are deep-frozen. Use `updateConfig()`.
- **`<ChannelList>`'s `lockChannelOrder` and `queryChannelsOverride` stay props.** There is
  no configuration key that reaches a channel-list paginator, so these are unchanged.

---

# Part F — Hooks

## 14. `useMutedUsers` signature narrowed

The deprecated `(channel)` overload is removed; the hook takes **no argument**
and reads `client.mutedUsersStore`.

```tsx
// Before
const muted = useMutedUsers(channel);
// After
const muted = useMutedUsers(); // Mute[]
```

## 15. `useCreate*Context` signatures narrowed

If you build custom context values with the `useCreate*Context` hooks, their
parameter shapes dropped the removed fields:

- `useCreateChannelContext` — no longer accepts the removed `ChannelContext`
  fields (§4/§5/§6/§7).
- `useCreateMessagesContext` — no longer accepts the removed `MessagesContext`
  ops (§9) or `openThread`.
- `useCreateThreadContext` — accepts only `Pick<ThreadContextValue,
  'allowThreadMessagesInChannel' | 'onAlsoSentToChannelHeaderPress' |
  'threadInstance'>` (§10).
- `useCreateMessageInputContext` — its thread param changed
  `Pick<Thread…, 'thread'>` → `'threadInstance'` (derives `threadId` internally).
- `useCreateTypingContext` and `useCreatePaginatedMessageListContext` are
  **removed entirely** (§2/§3).

---

# Part G — Behavioral defaults

## 16. Behavioral changes (no symbol removed)

- **16.1 Initial message-list page size 100 → 25.** The `stream-chat` default is 100;
  v10 resolves 25. Apps that assumed ~100 messages loaded on open now get 25 and
  paginate the rest in. To change it, **register** the value —
  `client.config.set({ channel: { messagePaginator: { pageSize: 50 } } })` (§13.1).
  Do **not** re-set `channel.messagePaginator.pageSize` after mount: that is an
  imperative patch and is dropped the next time the paginator's configuration
  re-resolves. Note this is separate from `channelQueryOptions.messages.limit`, which
  sizes only the initial query.
- **16.2 `sendMessage` throws on failure** (previously swallowed). The built-in
  `MessageInput` catches the rejection and shows a notification. Any custom code
  that calls the context `sendMessage` (or `channel.sendMessageWithLocalUpdate`)
  directly must handle the rejected promise itself.
- **16.3 `SendMessageDisallowedIndicator` is gated on `channel.initialized`** —
  it no longer flashes during the pre-init window (before capabilities resolve).
  No action needed unless you relied on the pre-init render.

---

# Part H — Dependency (release-time)

## 17. `stream-chat` must be v10

v10 SDK code hard-depends on `stream-chat` v10 APIs (`channel.messagePaginator`,
the unified reactive `channel.state`, `*WithLocalUpdate`, `messageDeliveryReporter`,
`channel.messageFocusSignal`). Ensure your app resolves `stream-chat` to `^10.x`.

> Repo note (for SDK maintainers, not integrators): the published `stream-chat`
> range in `package/package.json` must be bumped to `^10.x`, and the local
> development wiring removed — the root `resolutions` `portal:` entry and the
> `streamChatLocalPath` in `examples/SampleApp/metro.config.js`.

---

# Part I — stream-chat v10 type-surface (OpenAPI overhaul)

The v10 bump brings the OpenAPI type overhaul. Most of it is internal to the SDK (already
migrated); the items below are the ones that reach **integrator** code — custom components,
`<Channel>` override props, and any direct `stream-chat` client/channel usage.

## 17.1 Custom fields moved under `.custom`

v10 drops the custom-overlay pattern: custom fields live under a `.custom` bag, not at the object
root. Relevant only if you authored a custom component/override that reads them at the root — the
SDK's own reads are already migrated.

- `channel.data.name` / `channel.data.image` → `channel.data.custom?.name` / `.custom?.image`
- Attachment metadata: `attachment.mime_type` / `file_size` / `duration` / `originalFile` →
  `attachment.custom?.<same>` (`duration` is now `voiceRecording`-only)

The RN SDK augments `CustomChannelData` (`name`, `image`) and `CustomAttachmentData`
(`originalFile`, `localId`). Add your own custom keys the same way (`declare module 'stream-chat'`).

## 17.2 `deleteMessage` options are snake_case

`useMessageOperations().deleteMessage(message, options)` (and the `MessageContext` value) now takes
the LLC's `DeleteMessageOptions` (`{ hard?, delete_for_me?, deleted_by? }`) instead of the v9 RN
shape (`{ hardDelete?, deleteForMe? }`). The `boolean` shorthand (`deleteMessage(msg, true)` = hard
delete) still works.

- `deleteMessage(msg, { hardDelete: true })` → `deleteMessage(msg, { hard: true })`
- `deleteMessage(msg, { deleteForMe: true })` → `deleteMessage(msg, { delete_for_me: true })`

## 17.3 Update-message override moved off `<Channel>`

`doUpdateMessageRequest` is **removed as a prop** (§13). Register an `updateMessageRequest`
handler on `client.config` instead (§13.1). The signature is the LLC's, so it takes a single
params object rather than the prop's positional arguments:

- v9 prop: `doUpdateMessageRequest(channelId, localMessage, options)`
- v10 handler: `updateMessageRequest({ localMessage, options })` → `{ message }`

If you need the old `{ id, message }` request shape inside your handler, derive it with
`localMessageToNewMessagePayload(localMessage)` — that is what the SDK's adapter used to do.

`doSendMessageRequest` remains a prop; its `message` argument is now typed `MessageRequest`
(rename only; no shape change).

## 17.4 `message.moderation_details` → `message.moderation`

v10 uses V2 moderation: `message.moderation` (`ChatModerationV2Response`, `action: 'remove' |
'bounce'`). `message.moderation_details` (V1) is gone. The SDK's `isBlockedMessage` /
`isBouncedMessage` read only V2 — **if your backend still emits V1 payloads, blocked/bounced
detection won't fire.**

## 17.5 Underlying `stream-chat` type changes (renames / Date / method sigs)

If you call the `stream-chat` client/channel directly or annotate with its types, see the LLC's own
guides in `stream-chat-js`: `v9-to-v10-migration-guide-{type-renames,other,sort,methods,logging,client-construction}.md`.
Highlights that hit integrator code:

- **Dates are `Date` objects** (not ISO strings) on response types (`created_at`, `updated_at`, …).
- **Type renames** — `EventTypes`→`EventType`, `Mute`→`UserMuteResponse`,
  `PollOption`→`PollOptionResponseData`, `ReadResponse`→`ReadStateResponse`,
  `AppSettingsAPIResponse`→`GetApplicationResponse`, `FormatMessageResponse`→`LocalMessage`,
  `Role`→`RoleName`, `Logger`→`Sink`, `*SortBase`→`*Sort`, `TranslationLanguages`→`TranslationLanguage`.
- **`Event` is a discriminated union** — narrow with `EventPayload<'the.type'>`, or drop the `: Event`
  annotation so `client.on('x', cb)` narrows automatically.
- **Method signatures collapsed to single objects** — `channel.sendReaction({ id, reaction, ... })`,
  `deleteReaction({ id, type })`, `sendMessage({ message, ... })`, `queryChannels(request)`;
  `client.uploadImage({ file: { uri, name, type } })` for RN image upload — the `file` field takes
  a browser `File`/`Blob` or an RN `{ uri, name, type }` descriptor, so the MIME type still has to
  be explicit, it just lives on the descriptor now; the same shape applies to `client.uploadFile`
  and `channel.uploadFile` / `channel.uploadImage` (which replace `channel.sendFile` /
  `sendImage`); the `client` constructor is 1–2 args; `client.listeners` is a `Map`;
  `createAbortControllerForNextRequest` moved to `client.api`.
- **Sort is `SortParamRequest[]`** — `{ last_message_at: -1 }` → `[{ field: 'last_message_at', direction: -1 }]`.

---

# Part J — `ChannelList` & `ChannelManager` (orchestrator)

`<ChannelList>` now runs on `stream-chat` v10's client-owned orchestrator: `client.channelManager`
(one instance per client) plus one `ChannelPaginator` per list. The list is a **deterministic
projection of its `filters` + `sort`** — every query (initial load, pagination, pull-to-refresh,
reconnect) re-asserts them, so the list can no longer silently drift from, or be forced to
contradict, its own query. Most of the removed API below existed to make the list disagree with its
query; that is intentionally gone (a footgun removed). What you actually need is served by `filters`,
`sort`, and — for transient surfacing — the paginator's `boost` primitive.

## 18. `<ChannelList>` per-event override props removed

Removed props (and the exported `ChannelListEventHandler` type):
`onAddedToChannel`, `onRemovedFromChannel`, `onChannelDeleted`, `onChannelHidden`,
`onChannelVisible`, `onChannelUpdated`, `onChannelTruncated`, `onChannelMemberUpdated`,
`onNewMessage`, `onNewMessageNotification`.

In v9 these callbacks let you imperatively rewrite the list on each WS event. In v10 that is
redundant: the list is a projection of `filters` + `sort` that re-asserts on every query, so a
membership/order change you made by hand was either wiped by the next refresh/reconnect or is already
expressible declaratively. Map what each override did to its v10 equivalent:

| The override did… | v10 |
|---|---|
| decide membership (keep/drop a channel) | `filters` — the query is the source of truth |
| decide order | `sort` (+ `lockChannelOrder` to freeze order across events) |
| filter what renders without changing the query | `channelRenderFilterFn` (unchanged prop) |
| briefly float a channel to the top | `paginator.boost(cid, { ttlMs })` (survives queries) |
| genuinely global event handling (new event type, SDK-bug hotfix, side effect) | `client.channelManager.addEventHandler(...)` or `client.on(...)` |

Global handler (replaces the old per-list callbacks):

```tsx
const unsubscribe = client.channelManager.addEventHandler({
  eventType: 'message.new',
  id: 'my-app:on-new-message',
  handle: ({ event, ctx: { channelManager } }) => {
    // side effects, or drive the list via channelManager / its paginators
  },
});
// call unsubscribe() on cleanup
```

> Why they're gone as per-list props: the manager is a single client-owned instance shared by every
> list, so per-list handlers pooled into it (last-writer-wins) and unmounting one `<ChannelList>`
> restored the default — clobbering a still-mounted sibling. Global handlers belong on
> `client.channelManager`; per-list shaping stays in each list's `filters` / `sort`.

## 18.1 `queryChannelsOverride` retyped

Still a prop, but it is now the paginator's `doRequest` rather than a `Channel[]`-returning function.
It receives the query params the paginator would have sent and must return `{ items }` — call
`client.queryChannels(...)` inside so client state stays in sync:

```tsx
// v9: queryChannelsOverride = (filters, sort, options) => Promise<Channel[]>
// v10:
queryChannelsOverride={async (queryParams) => {
  const items = await client.queryChannels(queryParams);
  return { items };
}}
```

## 18.2 `useChannelUpdated` removed

The public `useChannelUpdated` hook is gone (it patched a `useState`-backed channel array that no
longer exists). `channel.updated` is handled by the orchestrator; there is nothing to wire — delete
the usage.

## 18.3 `ChannelsContextValue.loadNextPage` retyped

`loadNextPage` is now `() => Promise<void>` (it dropped its optional query-type arguments):

```tsx
// Before: loadNextPage(filters, sort, options)
// After:
loadNextPage();
```

## 18.4 `<Chat channelManager>` prop + `ChatContext.channelManager` removed

`ChannelManager` is a singleton per client, so `<Chat>` no longer accepts a `channelManager` prop and
`useChatContext()` no longer returns one. Read `client.channelManager` directly:

```tsx
// Before
const { channelManager } = useChatContext();
// After
const { client } = useChatContext();
const channelManager = client.channelManager;
```

Configure the shared manager through its own API (`client.channelManager.setEventHandlers(...)`,
`setOwnershipResolver(...)`) instead of the removed prop.

## 18.5 Behavioral: channel-list ordering & watch defaults

- **No default "float to top" on events.** The manager no longer boosts a channel on any event —
  order is driven purely by `sort`. A new/edited message, an added-to-channel, or an unhidden channel
  now relocates by its sort key (e.g. `last_message_at`) instead of jumping to the very top. This also
  means a new message no longer overrides a pinned-first `sort` (pinned channels stay pinned). To keep
  the old jump-to-top, boost it yourself: `paginator.boost(channel.cid)`.
- **Watch-on-notification narrowed — but a watch that was *lost* comes back.** On `notification.*`
  events (e.g. added to a channel) v9 re-watched the routed channel unconditionally. v10 does two
  narrower things: it watches a channel it does not already know, and it restores a watch this client
  previously held and lost to a dropped socket (`watchStatus === 'wasWatching'` — see **§L.3**). A
  channel that was never watched, or that you explicitly `stopWatching()`d, stays unwatched, so the
  client's watch count can never exceed what it already had, and blanket auto-watch never risks the
  watch limit. To watch a specific channel yourself, call `channel.watch()`.

---

# Part K — Unified channel state (`channel.state`)

> **Who this affects.** Only integrators who read the per-concern `channel.state.*Store`
> handles directly, subscribe to `channel.state.mutedUsersStore`, or mutate
> `channel.data.member_count` / `own_capabilities` in place. Everything the SDK's own
> components read is already migrated — this is additive for most apps. The sections above
> (§2, §4, §7) already point here.

`channel.state` is now a **single `StateStore<ChannelStateData>`** — subscribe to it directly
with `useStateStore(channel.state, selector)`, exactly like `thread.state`. Earlier v10
pre-releases split it into per-concern handles (`channel.state.readStore`, `typingStore`,
`membersStore`, `watcherStore`, `ownCapabilitiesStore`); those are **removed**. The state is
**flat**: `read`, `typing`, `members`, `memberCount`, `watchers`, `watcherCount`,
`ownCapabilities` are all top-level keys of the one store.

## K.1 `channel.state.*Store` handles removed (breaking)

**The recipe** — mechanical, one edit per call site:

> `useStateStore(channel.state.<X>Store, selector)` → `useStateStore(channel.state, selector)`
> — delete the `.<X>Store` segment and **keep the selector verbatim**.

The selector does not change: `ChannelStateData` carries the same top-level keys the old
per-handle shapes did, so a `(s: ReadState) => O` (or `MembersState`, `WatcherState`,
`TypingUsersState`, `OwnCapabilitiesState`) stays contravariantly assignable to
`(s: ChannelStateData) => O`.

| Removed handle | Replacement | Slice key(s) it exposed |
|---|---|---|
| `channel.state.readStore` | `channel.state` | `read` |
| `channel.state.typingStore` | `channel.state` | `typing` |
| `channel.state.membersStore` | `channel.state` | `members`, `memberCount` |
| `channel.state.watcherStore` | `channel.state` | `watchers`, `watcherCount` |
| `channel.state.ownCapabilitiesStore` | `channel.state` | `ownCapabilities` |

```tsx
// Before (early v10 pre-release)
const { read } = useStateStore(channel.state.readStore, s => ({ read: s.read }));
// After (v10)
const { read } = useStateStore(channel.state, s => ({ read: s.read }));
```

The convenience getters `channel.state.members` / `.read` / `.typing` / `.watchers` /
`.member_count` / `.watcher_count` are **unchanged** (they proxy the one store).

## K.2 `channel.state.mutedUsersStore` removed → `client.mutedUsersStore`

The `MutedUsersState` type and the `channel.state.mutedUsersStore` handle are removed — muted
**users** are client-global, not per-channel. Read them from `client.mutedUsersStore` (via
`useMutedUsers()`, §14). Muted **channel** status is a new per-channel field — see K.3.

## K.3 New reactive slices on `channel.state` (additive)

`channel.state` now also carries these — subscribe with `useStateStore(channel.state, selector)`:

| Slice | Shape | Notes |
|---|---|---|
| `data` | `Channel['data']` | The server channel data (name/image/frozen/hidden/blocked/config/…). Republished on `channel.updated` / `channel.hidden` / `channel.visible` and on query/watch. |
| `membership` | `ChannelMemberResponse` | The current user's own membership (role, `pinned_at`, `archived_at`). |
| `muteStatus` | `{ muted: boolean; createdAt: Date \| null; expiresAt: Date \| null }` | Is **this channel** muted for the current user — mirrors `client.mutedChannels`. `channel.muteStatus()` (imperative) is unchanged. |
| `initialized` / `offlineMode` / `pendingDisposal` | `boolean` | Lifecycle flags, now store-backed. `channel.initialized` etc. are transparent getters over these. `pendingDisposal` replaces `disconnected` — see §K.8. |
| `watchStatus` | `ChannelWatchStatus` — `'watching'` \| `'wasWatching'` \| `'notWatching'` | Whether this client holds a server-side watch (i.e. whether channel events are flowing) and, when it doesn't, whether the watch should be restored. `Watching` once a `watch: true` query succeeds; `WasWatching` when the WS connection drops (the server keys watches by connection ID, so a reconnect issues a new id and every watch is gone — this records that a re-query is wanted); `NotWatching` when never watched, when the consumer called `stopWatching()`, or on teardown — a deliberate stop is never resurrected by a reconnect. Also makes `channel.watch()`'s silent downgrade — it drops to a non-watching query when there is no connection ID — observable. Read via `channel.watchStatus` or `useStateStore(channel.state, (s) => ({ watchStatus: s.watchStatus }))`; the `ChannelWatchStatus` const is exported from `stream-chat`. |

```tsx
// e.g. react to a channel rename
const name = useStateStore(channel.state, s => ({ name: s.data?.custom?.name }))?.name;
```

## K.4 `channel.activate()` / `deactivate()` / `channel.active` (additive)

New refcounted lifecycle API mirroring `thread.activate()`. `<Channel>` calls
`activate()` on mount and `deactivate()` on unmount for you; `channel.active` is a reactive
boolean. While active, the channel auto-marks messages read on focus and the channel-list
hydration does not destructively re-seed the open channel's message list on reconnect. Custom
navigation that mounts a channel outside `<Channel>` can call these directly (they refcount, so a
shared instance stays active until the last holder deactivates).

## K.5 In-place mutation of `channel.data.member_count` / `own_capabilities` no longer syncs (behavioral)

These fields used to be backed by an `Object.defineProperty` accessor that pushed in-place writes
into the store. That accessor is gone. Reassign `channel.data` instead of mutating a field:

```tsx
// Before — used to sync to channel.state
channel.data.member_count = 12;
// After — reassign so the store (and channel.state.memberCount) updates
channel.data = { ...channel.data, member_count: 12 };
```

`member_count` / `own_capabilities` are still read normally off `channel.data`; the values stay
sticky across data updates that omit them, and `own_capabilities` stays `undefined` until first
known. (Same applies to `channel.state.membership` — reassign it rather than mutating a nested field
if you need subscribers to update.)

## K.8 `channel.disconnected` → `channel.pendingDisposal` (breaking)

The flag is one-way and terminal: `Channel._disconnect()` disposes the paginators, unregisters the
subscriptions, and the client drops the channel from `activeChannels` right after — the instance is
never reconnected. `disconnected` read like something that could come back, so the state key and the
getter/setter are now `pendingDisposal`.

```tsx
// Before
if (channel.disconnected) return;
// After
if (channel.pendingDisposal) return;
```

`channel.disconnected` is **removed outright** — no alias. v10 is a major, so the rename lands in one
step rather than carrying a deprecation through it. Rename every read and write; if you subscribe to
the slice, the **key** changed too:
`useStateStore(channel.state, (s) => ({ pendingDisposal: s.pendingDisposal }))`.

## K.6 Built-in hooks now source from `channel.state` (behavioral)

These SDK hooks were rewired off ad-hoc `channel.on(...)` event subscriptions onto
`useStateStore(channel.state, …)` — same return shapes, finer-grained updates. No app change
needed unless you mock `channel.state` in tests (it must be a real `StateStore` now):
`useChannelName`, `useChannelImage`, `useChannelMemberCount`, `useChannelMembershipState`,
`useIsChannelMuted`, `useChannelMuteActive`. `useMutedChannels` intentionally stays event-based
(it returns the client-global muted-channel **list**, not this channel's `muteStatus`).

## K.7 AI-indicator state → `channel.state.aiState` (additive slice; soft-breaking enum)

The per-channel AI-indicator state (thinking / generating / …) is now a reactive slice on
`channel.state`, owned by the LLC and driven from the `ai_indicator.update` / `.clear` / `.stop`
events in `Channel._handleChannelEvent`. Previously the UI SDK kept it in `useAIState` via local
`useState` + `channel.on('ai_indicator.*')` listeners.

- **Subscribe:** `useStateStore(channel.state, s => ({ aiState: s.aiState }))`, seeded
  `AIStates.Idle`. If you ran your own `ai_indicator.*` listeners, drop them and read the slice.
- **`useAIState(channel)` is unchanged** — same `{ aiState }` return, now a thin `useStateStore`
  reader internally. It additionally honors `ai_indicator.stop` (→ `AIStates.Stop`), which the RN
  hook previously ignored.
- **`AIState` reconciled + `AIStates` const now exported from `stream-chat`** (soft-breaking):
  `AI_STATE_CHECKING_SOURCES` → `AI_STATE_EXTERNAL_SOURCES`, plus `AI_STATE_IDLE` and
  `AI_STATE_STOP` added. `(string & {})` keeps any string assignable, so this is a literal-set / DX
  change, not a hard compile break. Import `AIStates` from `stream-chat` (also re-exported from the
  SDK) instead of hand-writing the literals.
- **Connection-loss reset is automatic (LLC-owned).** `aiState` resets to `Idle` whenever the WS
  goes away — a transient / internet drop (via the channel cleaning sweep, gated on connection
  health) or a deliberate close such as mobile backgrounding (via `client.closeConnection()`) — so a
  stuck "Generating" can't outlive a lost socket. No app code needed; the terminal
  `ai_indicator.clear` / `.stop` that would otherwise be missed offline is not replayed on reconnect.

```tsx
// read the AI indicator anywhere (or just use useAIState)
const { aiState } = useStateStore(channel.state, (s) => ({ aiState: s.aiState }));
```

---

# Part L — Connection recovery (`client.connectionRecovery`)

> **Who this affects.** Every app inherits the new behaviour, but almost none needs a code change.
> Reconnect recovery moved out of the UI SDK into `stream-chat`, so `<Chat>` / `<ChannelList>` /
> `<Channel>` get it for free. You have work to do only if you set `recoverStateOnReconnect: false`
> and hand-rolled recovery, called `client.recoverState()` yourself, or listen for
> `connection.recovered`.

In v9 the RN SDK reimplemented reconnect recovery in three uncoordinated places, because the
client's own recovery was unusable and `<Chat>` switched it off (`client.recoverStateOnReconnect =
false`). v10 gives the client a `ConnectionRecoveryManager` — reachable as
`client.connectionRecovery` — that owns the whole flow, and the SDK's own listeners were deleted in
favour of it.

**What recovery does once the socket is back:**

1. **Every loaded channel list re-runs its own first-page query** — `client.channelManager.recover()`,
   i.e. `paginator.toTail({ keepPreviousItems: true, reset: 'yes' })` for each initialized paginator.
   Each list re-asserts its *own* `filters` / `sort` / `pageSize`, and since `queryChannels` watches
   by default, that page's watches come back as a side effect. Non-destructive — the list never
   blanks, unlike `channelManager.reload()`.
2. **Every `active` channel reloads itself** — `channel.reload()`. A list page carries far fewer
   messages per channel than an open channel's loaded window, so the open channel cannot be served by
   the list query. `<Channel>` marks its channel `active` on mount (§K.4).
3. **Every active thread reloads its replies** — `thread.reload()`, for threads in
   `client.threads.threadsById` whose `state.active` is set. Nothing else covers them: a channel
   reload refreshes the main message list, and `ThreadManager`'s own recovery refreshes the thread
   *list*, reusing thread instances without rehydrating them unless something separately marked them
   stale — which only `user.watching.stop` does, never a reconnect. Note the current limitation: a
   thread opened from a message list only enters `threadsById` once `<Thread>` adopts it (after its
   replies load), so a reconnect before that — or after `ThreadManager.reload()` evicts it — skips it.
4. **Every other previously-watched channel self-heals on demand** — §L.3.

It is deliberately **not** a sweep over `client.activeChannels`: watches are a bounded server
resource, and after any scrolling that cache holds far more channels than a query page.

With offline support enabled, active-channel recovery is triggered off the offline DB's sync-status
edge, so the ordering `executePendingTasks()` → `sync()` → reload holds on every reconnect path —
including mobile backgrounding (`closeConnection()` → `openConnection()`), which v9's client-side
recovery never covered at all.

**No app code is required for any of this.** Do not add a `connection.changed` listener that
re-queries a list or re-watches a channel — that now duplicates the client.

## L.1 `recoverStateOnReconnect` — same name, new meaning (behavioral)

The option and its `true` default are unchanged, but what it gates is not.

| | v9 | v10 |
|---|---|---|
| Gates | one `queryChannels({ cid: { $in: Object.keys(activeChannels) } }, [{ last_message_at: -1 }], { limit: 30 })` | the whole `client.connectionRecovery` flow above |
| Query shape | invented, unrelated to any list's `filters` / `sort` | each list's own first-page query |
| Coverage | the 30 most recently active channels, silently truncated | every loaded list page + every `active` channel |
| Fires on | `StableWSConnection._reconnect()` only | every reconnect path, backgrounding included |

If you set `recoverStateOnReconnect: false` and recover state yourself, nothing changes — it is still
the kill switch. **The RN SDK no longer sets it to `false`**, so if you were relying on `<Chat>`
disabling client recovery for you, it no longer does.

```ts
// still the escape hatch, still opt-out
const client = new StreamChat(apiKey, { recoverStateOnReconnect: false });
```

## L.2 `connection.recovered` now fires on every reconnect path (behavioral)

Same event, same (empty) payload, still exactly one dispatcher — but the dispatcher moved from
`client.recoverState()` to `ConnectionRecoveryManager`, and it is dispatched *after* the recovery
reload. In v9 `recoverState()` was called only by `StableWSConnection._reconnect()`, so a
`closeConnection()` → `openConnection()` cycle — mobile backgrounding, the dominant path on React
Native — produced no `connection.recovered` at all.

Consequences:

- A listener that was effectively dead on backgrounding now runs there. If it is expensive or not
  idempotent, check it.
- It is now a valid "recovery finished" hook: the channel reloads have settled by the time it fires.
  That is how the SDK sequences its own mark-read-on-catch-up (§L.4).

## L.3 A lost watch is restored on demand (behavioral — amends §18.5)

The server keys watches by connection ID, so a dropped socket ends every watch it held. Recovery
re-watches the first page of each list plus the active channel; everything else — pages 2+ of a
scrolled list, channels visited and navigated away from, channels matching no mounted list — is left
marked `ChannelWatchStatus.WasWatching` (§K.3).

`ChannelManager`'s default event pipeline now re-watches such a channel the moment an event routes it
into a list. Without this, a channel that lost its watch still receives member-level events (e.g.
`notification.message_new`) — enough to relocate its row, but carrying no message body — so its
preview would sit frozen until the channel was opened.

This is **narrower than v9, not a revert of §18.5's second bullet**: v9 re-watched any routed channel
unconditionally, whereas v10 only restores a watch this client previously *held and lost*. Skipped
for `channel.hidden` events, for a channel pending disposal, and for `NotWatching` — a channel never
watched, or one you explicitly `stopWatching()`d, stays unwatched. The client's watch count can
therefore never exceed what it already had. The re-watch runs after routing and is not awaited, so
the row still relocates immediately off the event; it is idempotent, and concurrent watches for the
same cid are deduped.

> Applies to `stream-chat-react` as well — this is a default `ChannelManager` handler, not RN code.

## L.4 `<Channel>` no longer runs any reconnect resync (behavioral)

`<Channel>` used to reload the channel on reconnect, and — when a thread was open — reload that
thread's replies. **Both are gone**; the component's only remaining part is declaring what is on
screen:

```tsx
// what <Channel> does now — the rest is client.connectionRecovery's job
useEffect(() => { channel?.activate?.(); return () => channel?.deactivate?.(); }, [channel]);
```

The open thread is declared the same way, but by **`<Thread>`**, which already did this before v10 —
`threadInstance.activate()` on mount, `deactivate()` on unmount. `<Channel>` does not need to (and
does not) activate it as well.

Neither reconnect handler was ever exported, so there is no symbol to migrate — this is here because
the behaviour relocated, and because the *capability* is unchanged: an integrator who relied on
`<Channel>` refreshing the channel (or the open thread) on reconnect still gets both, one layer down
and on more reconnect paths than before.

**If you render `<Channel>` and `<Thread>` you get this for free.** If you built your own views on the
contexts, call `channel.activate()` / `thread.activate()` (each balanced with `deactivate()`) or those
surfaces will not be recovered — being active is the one thing recovery cannot infer.

One thing stays deliberately UI-side: **mark-read after the reload**, on `connection.recovered`. It
has to be post-reload so the "is the window at the newest?" check reflects the refreshed window. Read
policy is a UI decision (`useMarkRead`, §5); refreshing state is not.

**The error surface is not UI-side either.** `<Channel>` holds no error state of its own — it reads
`channel.state.lastLoadError` and `thread.state.lastLoadError` straight into `useChannelContext().error`
(§L.5). Both failures a UI cares about are recorded by the client: `channel.watch()` records the
mount-time failure of a channel opened with no connection and — since `reload()` goes through
`watch()` — the reconnect refresh too.

**Nothing clears these on a connection event.** A load error is invalidated by the next load, not by
coming back online: `watch()` and `Thread.reload()` each clear before they await anything, which is the
same clear-before-attempt v9's `resyncChannel` did on its first line. Because the clear sits above the
first await, a reconnect reload reaches it inside the synchronous `connection.changed` dispatch — the
same dispatch a UI flips its own online flag in, so the two land in one render and an error masked
behind `!isOnline` is never flashed over content that is about to refresh. Clearing on the way in
cannot hide a real failure: the attempt records its own on the way out. If you render your own error UI
from `useChannelContext().error` you get all of this for free; if you latch an error of your own,
delete it.

`<ChannelList>`'s own reconnect listener is gone for the same reason — the list re-query is item 1.

## L.5 Additive surface

- **`client.connectionRecovery`** — the `ConnectionRecoveryManager` instance. Public method:
  `recover()`, which runs a full recovery immediately without waiting for a connection event.
- **`client.channelManager.recover()`** — re-runs every initialized list's first-page query,
  non-destructively. Sibling of the destructive `reload()`, which is unchanged.
- **`thread.activate()` / `deactivate()` are now refcounted**, matching `channel.activate()`, so a
  thread held by more than one mount stays active until the last holder releases it. `active` is what
  recovery filters on, so an unbalanced `deactivate()` now costs a missed reload as well as a missed
  auto-read.
- **`thread.state.lastLoadError`** — the thread twin of the channel field below, same contract,
  written by `Thread.reload()`.
- **`channel.state.lastLoadError`** (+ the `channel.lastLoadError` getter) — mirrors
  `BasePaginator.lastQueryError` one level up. Owned by **`watch()`**: cleared before its first await,
  set in its catch, and **rethrown**. Owning it there rather than in `reload()` is what makes it cover
  both failures a UI cares about — the reconnect refresh (the manager runs reloads inside
  `Promise.allSettled`, which would otherwise swallow them) *and* the mount-time `watch()` of a channel
  opened offline, which throws long before anything could later prove it stale. The SDK ORs both fields
  into `useChannelContext().error`, which is what keeps the "Error loading messages for this channel…"
  indicator working.

```tsx
// surface a failed load in your own UI
const { lastLoadError } = useStateStore(channel.state, (s) => ({
  lastLoadError: s.lastLoadError,
}));
```

## L.6 `client.recoverState()` removed (breaking — `stream-chat`)

Removed outright rather than left as a no-op, so a caller fails loudly instead of silently getting no
recovery. To force a recovery by hand:

```ts
// Before (v9)
await client.recoverState();
// After (v10)
await client.connectionRecovery.recover();
```

The two are not equivalent in shape — `recoverState()` ran the 30-channel bulk query described in
§L.1 — but `recover()` is the v10 way to say "bring everything I am reading back in line with the
server now". Most apps never called it: it was invoked automatically on reconnect, and it still is.

## L.7 Unsent messages now survive a reconnect rebuild (bug fix)

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
offline-DB path keyed on `ThreadManager.threadsById`. Neither covers a thread constructed directly and
never registered, which is the common path. `thread.reload()` now reads the failed replies out of the
reply paginator instead, so it holds for managed and unmanaged threads alike.

## L.8 The reconnect refresh now finds messages you never had (bug fix)

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

## L.9 A brand-new thread no longer reports an error (bug fix)

A parent with no replies has no server-side thread, so `getThread` answers "not found". That was
being treated as a failed refresh: `thread.state.lastLoadError` was set, which the React Native SDK
ORs into `useChannelContext().error`, so simply opening a new thread raised the channel's error state.
It is now recognised as the expected answer — `reload()` resolves quietly instead of rejecting, and
publishes nothing.

A genuine failure still publishes as before, including a thread that *did* have replies and comes back
not-found (its parent was deleted, possibly while you were offline). The two are told apart by
`replyCount`, which — unlike `deletedAt` — survives having missed the deletion event.

Related: the SDK no longer issues a mark-read for a reply-less thread. There is nothing that could be
unread, and the call only ever 404'd.

---

## 19. Verify

- Typecheck the customer app; removed symbols surface as "Property does not
  exist" / "Cannot find name" errors — fix each per the section it maps to.
- Run the app and exercise: typing indicator; member/watcher counts;
  message-list scroll pagination (both directions); mark-read on scroll-to-bottom
  and banner dismiss; message send/edit/delete/react (online + offline);
  thread open/reply/close (prop-driven); jump-to-message highlight (quoted-reply
  tap) and jump-to-first-unread; the unread separator, scroll-to-bottom button,
  and unread notification; and any custom overrides of `Message`, the list
  loading indicators, the thread footer, or the typing indicator.
- Exercise the **channel list**: initial load + skeleton; scroll pagination;
  new-message reorder; add/remove-from-channel, hide/unhide, delete, truncate,
  `channel.updated`; pull-to-refresh and reconnect (the list re-queries, no
  blank); and confirm a pinned-first `sort` keeps pinned channels on top when
  other channels receive messages.
- **Unified `channel.state`** (§K): a `channel.updated` rename/avatar reflects live
  (header + preview); muting/unmuting a channel updates its muted indicator;
  pin/archive updates membership-driven UI; and — with `<Channel>` mounted —
  focusing a channel with unreads marks it read and reconnect does not blank/re-seed
  the open message list.
- **Connection recovery** (§L), on a real device, with offline support both on and
  off: toggle airplane mode with the list open (it re-queries, never blanks) and
  with a channel open (the window comes back byte-identical, scrolled into old
  history included); background and foreground the app (same, and this is the path
  v9 never recovered); open a channel while offline, then reconnect (its messages
  load); send while offline, then reconnect (the queued message goes out); leave a
  channel that was open, push it off page 1 of the list, reconnect, then message it
  from another user (its preview updates — that is §L.3); open a thread and
  reconnect (its replies refresh — §L.4); and cold-boot with a populated offline DB
  (exactly one recovery, no double load). Also scroll up into old history, send a
  message that fails, then reconnect — the unsent message must still be in the list
  (§L.7).

---

# Part I — i18n

## 19. English-only bundle, dotted keys, shared runtime

**The full guide is `ai-docs/i18n-v10-migration.md`.** Read it for the migration; this section exists so an
agent grepping this file finds i18n at all, and knows the three shapes of change:

1. **Keys are stable dotted identifiers**, not the English copy, with the English inline as i18next's
   `defaultValue`. The reviewed old→new table is `ai-docs/i18n-v10-key-map.json` (389 rows). Renaming is not
   optional and **it fails silently** — an old key simply never matches, so the override stops applying and
   English renders with no error. Type your dictionary as `TranslationDictionary` to turn that into a compile
   error.
2. **English is the only bundled language.** The 12 non-English dictionaries and the `*Translations` exports
   are gone. An integrator supplies their own, additively; a key they omit still renders English.
3. **The runtime moved to `stream-chat/i18n`**, shared with the React SDK. Imports are unchanged — everything
   is still exported from `stream-chat-react-native` / `stream-chat-expo`, and `Streami18n` keeps its name
   — but reactivity is a `StateStore` rather than listeners, `setLanguage` returns `void`,
   `getTranslators()` is now `init()`, and a few date-helper parameters were renamed to the one name both
   SDKs use. Nothing is kept as a deprecated alias. See the quick-reference rows above.

Two dependency rules that produce silent breakage rather than errors:

- **`dayjs` must resolve to a single copy.** Declare it compatibly with `stream-chat`'s range (`^1.11.13`) or
  not at all. A disagreeing exact pin installs a second copy, and an app's `import 'dayjs/locale/de'` then
  extends an instance the SDK never formats with — dates stay English, nothing throws.
- **Do not declare `i18next`.** It arrives through `stream-chat`. Two copies mean dictionaries registered on
  one instance and read from the other.
