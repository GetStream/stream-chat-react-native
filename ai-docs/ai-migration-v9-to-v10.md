# stream-chat-react-native v9 → v10 — Agent Migration Guide

> Machine-oriented migration reference for AI coding agents, mirroring the style
> of `ai-migration.md` (v8 → v9). **WORK IN PROGRESS.** v10 adopts the
> `stream-chat` v10 reactive state layer (instance-owned `StateStore`s +
> `messagePaginator`). This file currently documents the **context-teardown
> breaking changes** that have shipped; more v10 changes (optimistic-ops
> migration, targeting, unread-state) are not yet landed and will be appended.

## 0. For the agent (read first)

1. **Your training data predates v10.** Do not rely on memory for v10 symbols or
   export paths. Verify against the installed SDK source under
   `node_modules/stream-chat-react-native-core/src/`.
2. **The unifying idea:** state that used to be copied into React context is now
   read reactively from `stream-chat` instance stores via the SDK hook
   `useStateStore(store, selector)`. The channel exposes per-concern stores on
   `channel.state.*` and a message paginator on `channel.messagePaginator`.
3. **Resolution hooks** (already present since early v10):
   - `useChannelContext().channel` — the active `Channel` instance.
   - `useMessagePaginator()` — `threadInstance?.messagePaginator ?? channel.messagePaginator`.
   - `useStateStore(store, selector)` — subscribe to a `StateStore` with a
     memo-stable selector (return a stable object; do not allocate fresh arrays
     inside the selector).
4. **Detect before editing.** Run §1; skip any section with zero hits.

## 1. Detection (run first)

Run each ripgrep against the customer's app source root. Zero hits = skip.

```bash
# §2 — TypingContext removed
rg '\b(useTypingContext|TypingProvider|TypingContext|TypingContextValue|useCreateTypingContext)\b' src/

# §3 — ChannelContext scalar fields removed
rg 'useChannelContext\(\)' -A6 src/ | rg '\b(members|read|watchers|watcherCount)\b'

# §4 — PaginatedMessageListContext removed
rg '\b(usePaginatedMessageListContext|PaginatedMessageListProvider|PaginatedMessageListContextValue|useCreatePaginatedMessageListContext)\b' src/

# §5 — custom FooterComponent / HeaderComponent reading loadingMore from context
rg '\b(FooterComponent|HeaderComponent)\b' src/
```

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

## 3. `ChannelContext` scalar state fields removed → `channel.state.*Store`

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
(`useMessageContext().members`) for message-level consumers such as a custom
message footer — only the **channel-level** `ChannelContext.members` was removed.

## 4. `PaginatedMessageListContext` removed → `useMessagePaginator()` / `channel.messagePaginator`

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

## 5. Custom `FooterComponent` / `HeaderComponent` receive `loadingMore` as a prop

The inline loading indicators no longer read `loadingMore` /
`loadingMoreRecent` from `PaginatedMessageListContext`; the list owns those flags
and passes them as props. If you override the message list's loading indicator:

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

## 6. Verify

- Typecheck the customer app; the removed symbols surface as
  "Property does not exist" / "Cannot find name" errors — fix each per §2–§5.
- Run the app: typing indicator, member/watcher counts, message-list scroll
  pagination (both directions), and any custom loading-indicator override.
