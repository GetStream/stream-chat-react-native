# stream-chat-react-native v9 → v10 — Agent Migration Guide

> Machine-oriented migration reference for AI coding agents, mirroring the style
> of `ai-migration.md` (v8 → v9). v10 adopts the `stream-chat` v10 **reactive
> state layer**: state that used to be copied into React context is now read
> reactively from `stream-chat` instance stores (`channel.state.*Store`,
> `channel.messagePaginator`, `thread.messagePaginator`) via
> `useStateStore(store, selector)`. This guide documents every integrator-facing
> breaking change verified against the v10 source.

## 0. For the agent (read first)

1. **Your training data predates v10.** Do not rely on memory for v10 symbols or
   export paths. Verify against the installed SDK source under
   `node_modules/stream-chat-react-native-core/src/`.
2. **The unifying idea:** state that used to be copied into React context is now
   read reactively from `stream-chat` instance stores via the SDK hook
   `useStateStore(store, selector)`. The channel exposes per-concern stores on
   `channel.state.*` and a message paginator on `channel.messagePaginator`.
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
| `useTypingContext().typing` | `useStateStore(channel.state.typingStore, s => ({ typing: s.typing }))` | §2 |
| `filterTypingUsers({ client, thread, typing })` | `filterTypingUsers({ client, threadId: thread?.id, typing })` | §2.1 |
| `usePaginatedMessageListContext().messages` | `useStateStore(channel.messagePaginator.state, s => s.items)` | §3 |
| …`.hasMore` / `.hasMoreNewer` | `channel.messagePaginator.state.hasMoreTail` / `.hasMoreHead` | §3 |
| …`.loadMore()` / `.loadMoreRecent()` | `channel.messagePaginator.toTail()` / `.toHead()` | §3 |
| …`.loadLatestMessages()` | `channel.messagePaginator.jumpToTheLatestMessage()` | §3 |
| `useChannelContext().members` / `read` / `watchers` / `watcherCount` | `channel.state.membersStore` / `readStore` / `watcherStore` (via `useStateStore`) | §4 |
| `useChannelContext().markRead()` | `useMarkRead(channel)()` — or `channel.markRead()` | §5 |
| `useTargetedMessage()` / `setTargetedMessage(id)` | `useChannelContext().loadChannelAroundMessage({ messageId })`; read `highlightedMessageId` | §6 |
| `useChannelContext().channelUnreadStateStore` / `setChannelUnreadState` | `channel.messagePaginator.unreadStateSnapshot` | §7 |
| `<ScrollToBottomButton unreadCount={n} />` | self-derived from `channel.state.readStore` (override the component to control) | §7 |
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

## 2. `TypingContext` removed → `channel.state.typingStore`

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
const { typing } = useStateStore(channel.state.typingStore, typingSelector) ?? { typing: {} };
```

`typing` has the same shape as before (`Record<string, Event>`).

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

## 4. `ChannelContext` scalar state fields removed → `channel.state.*Store`

`useChannelContext()` no longer returns `members`, `read`, `watchers`, or
`watcherCount`. Read them from the per-channel stores.

| Removed context field | Replacement store | Store state key |
|---|---|---|
| `members` | `channel.state.membersStore` | `members` |
| `read` | `channel.state.readStore` | `read` |
| `watchers` | `channel.state.watcherStore` | `watchers` |
| `watcherCount` | `channel.state.watcherStore` | `watcherCount` |

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
const { members } = useStateStore(channel.state.membersStore, membersSelector) ?? { members: {} };
const { watcherCount } = useStateStore(channel.state.watcherStore, watcherSelector) ?? {};
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
| `ScrollToBottomButtonProps.unreadCount` | self-derived from `channel.state.readStore` (undefined in thread lists) |
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
`channel.state.{typing,members,read,watcher}Store`, `*WithLocalUpdate`,
`messageDeliveryReporter`, `channel.messageFocusSignal`, reactive
`channel.state.unreadCount`). Ensure your app resolves `stream-chat` to `^10.x`.

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
