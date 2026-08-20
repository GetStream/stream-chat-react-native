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
rg '<Channel\b' -A20 src/ | rg '\b(messages|loadingMore|loadingMoreRecent|threadMessages|setThreadMessages|doMarkReadRequest)\b'

# §14–§15 — hooks
rg '\b(useMutedUsers|useCreateChannelContext|useCreateMessagesContext|useCreateThreadContext|useCreateMessageInputContext)\b' src/

# §16 — behavioral (no symbol; review if you rely on send/mark-read/page-size behavior)
rg '\b(sendMessage|SendMessageDisallowedIndicator)\b' src/

# §18 — ChannelList event-override props + channelManager (orchestrator)
rg '\b(onAddedToChannel|onRemovedFromChannel|onChannelDeleted|onChannelHidden|onChannelVisible|onChannelUpdated|onChannelTruncated|onChannelMemberUpdated|onNewMessage|onNewMessageNotification|ChannelListEventHandler|useChannelUpdated|queryChannelsOverride)\b' src/
rg 'useChatContext\(\)' -A6 src/ | rg '\bchannelManager\b'
rg '<Chat\b' -A10 src/ | rg '\bchannelManager\b'

# §K — unified channel.state (removed *Store handles, in-place data mutation)
rg '\bchannel\.state\.(read|typing|members|watcher|ownCapabilities)Store\b' src/
rg '\bchannel\.state\.mutedUsersStore\b' src/
rg '\bchannel\.data\.(member_count|own_capabilities)\s*=' src/

# §L — i18n (custom translations silently stop applying under old keys)
rg '\b(registerTranslation|translationsForLanguage|Streami18n)\b' src/
rg '\b(enTranslations|esTranslations|frTranslations|heTranslations|hiTranslations|itTranslations|jaTranslations|koTranslations|nlTranslations|ptBrTranslations|ruTranslations|trTranslations)\b' src/
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
| `useStateStore(channel.state.readStore / typingStore / membersStore / watcherStore / ownCapabilitiesStore, sel)` | `useStateStore(channel.state, sel)` — drop the `.<X>Store`, keep the selector | §K.1 |
| `channel.state.mutedUsersStore` | `client.mutedUsersStore` (via `useMutedUsers()`) | §K.2 |
| in-place `channel.data.member_count = n` / `.own_capabilities = […]` | reassign `channel.data = { …channel.data, member_count: n }` | §K.5 |
| `channel.disconnected` | `channel.pendingDisposal` (hard rename — no alias) | §K.8 |
| `WatcherState` type | `ChannelWatchState` (now also carries `watching`) | §K.3 |
| custom translations keyed on v9 English text (`t('Send a message')`, `'Edited'`, …) | rename to dotted keys (`autoCompleteInput.placeholder`, `message.edited.text`, …); type as `TranslationDictionary` — old keys **silently** fall back to English | §L.1 |

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

A custom `doMarkReadRequest` handler (passed as a `Channel` prop) is still
honored — see §13 for its retyped signature.

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

`doMarkReadRequest` is retyped — its setter callback param is now
`(data: ChannelUnreadState | undefined) => void` (`ChannelUnreadState` is a
public `stream-chat` type, same shape):

```tsx
doMarkReadRequest?: (
  channel: Channel,
  setChannelUnreadUiState?: (data: ChannelUnreadState | undefined) => void,
) => void;
```

> Note: `stateUpdateThrottleInterval` and `newMessageStateUpdateThrottleInterval`
> are **not removed** — they remain declared on `ChannelProps` (the latter is
> `@deprecated`) but are **inert** (never read in v10; state updates are driven
> by the reactive stores). Passing them compiles but has no effect; remove them
> during cleanup.

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

- **16.1 Initial message-list page size 100 → 25.** `Channel` sets
  `channel.messagePaginator.pageSize = 25` on init (the `stream-chat` default is
  100). There is no public prop to override it; to change it, re-set
  `channel.messagePaginator.pageSize` yourself after mount. Apps that assumed
  ~100 messages loaded on open now get 25 and paginate the rest in.
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

## 17.3 `<Channel doUpdateMessageRequest>` override signature

The override now receives a request object, not a `LocalMessage`:

- v9: `doUpdateMessageRequest(channelId, localMessage, options)`
- v10: `doUpdateMessageRequest(channelId, { id, message }, options)` — `message` is a
  `MessageRequest` (derived via `localMessageToNewMessagePayload`), matching the LLC's default
  update path.

`doSendMessageRequest`'s `message` argument is now typed `MessageRequest` (rename only; no shape change).

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
  `client.uploadImage_(uri, name, type)` for RN image upload (the object-form `uploadImage` is
  web/server-shaped); the `client` constructor is 1–2 args; `client.listeners` is a `Map`;
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
- **Watch-on-notification narrowed.** On `notification.*` events (e.g. added to a channel) v10 watches
  only channels it does not already know; v9 re-watched unconditionally. Deliberate change — the SDK's
  own reconnect/query flow re-establishes watches, and blanket auto-watch risks the watch limit. To
  watch a specific channel, call `channel.watch()`.

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
| `watching` | `boolean` | Whether this client currently holds a server-side watch, i.e. whether channel events are flowing. Set when a `watch: true` query succeeds, cleared by `stopWatching()`, teardown, and **any WS connection loss** (the server keys watches by connection ID, so a reconnect needs a re-query). Also makes `channel.watch()`'s silent downgrade — it drops to a non-watching query when there is no connection ID — observable. Read via `channel.watching` or `useStateStore(channel.state, (s) => ({ watching: s.watching }))`. |

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

# Part L — i18n / translations

## L.1 Translation keys are now stable identifiers (breaking)

Two breaking changes, both v10 (full detail + copy-pasteable recipes in
[`i18n-v10-migration.md`](./i18n-v10-migration.md); the complete 391-row old→new table is
[`i18n-v10-key-map.json`](./i18n-v10-key-map.json)):

1. **English is the only bundled language.** The `ar`, `es`, `fr`, `he`, `hi`, `it`, `ja`, `ko`,
   `nl`, `pt-br`, `ru`, `tr` dictionaries (and the `enTranslations` … `trTranslations` exports and
   their per-locale `dayjs` calendar formats) are gone. Recover one from git history
   (`git show v9.7.6:package/src/i18n/nl.json`) — but its keys are the *old* keys, so it needs the
   same rename as below.
2. **Keys are stable dotted identifiers, not the English text.** `t('Send a message')` →
   `t('autoCompleteInput.placeholder')`; prose keys carry their English copy inline as the i18next
   `defaultValue`, e.g. `t('message.edited.text', 'Edited')`.

**⚠ The trap: renaming fails *silently*.** An override registered under a **v9 key simply never
matches** — your string stops applying and the SDK renders the English default instead, with **no
error, no warning**. So an app that customized copy in v9 keeps compiling and running after the
bump, but every one of its overrides quietly reverts to English. This bites even English-only apps
that only changed a word or two.

Representative renames (flat v9 key → v10 key), including the strings v10 UI now emits:

| v9 key (what you overrode) | v10 key |
|---|---|
| `Cancel` | `common.cancel.label` |
| `Send a message` | `autoCompleteInput.placeholder` |
| `Edited` | `message.edited.text` |
| `Thinking...` / `Generating...` | `aiTypingIndicator.thinking.label` / `aiTypingIndicator.generating.label` |
| `Unread Messages` | `messageList.unreadMessages.label` |
| `a11y/Send message` | `messageInput.sendMessage.accessibilityLabel` |

**Turn the silent failure into a compile error:** type your dictionary as `TranslationDictionary`
(SDK keys only) — a leftover v9 key is then a build error, not an override that never applies. Use
`LooseTranslationDictionary` only to carry your *own* app keys alongside SDK ones.

```ts
import { Streami18n, type TranslationDictionary } from 'stream-chat-react-native'; // or 'stream-chat-expo'

const i18n = new Streami18n({
  translationsForLanguage: {
    'autoCompleteInput.placeholder': 'Write something…',
    'Send a message': 'Write something…', // ← v9 key → compile error (exactly what you want)
  } satisfies TranslationDictionary,
});
```

Non-English dates need two steps (`dayjsLocaleConfigForLanguage` **and** the two `timestamp.*` keys
with their own `calendarFormats`) — see the dedicated guide; the second step is the one that gets
missed.

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
