# Plan: `WithComponents` Context Provider

## Context

The SDK prop-drills 120+ component overrides through `<Channel>` → `useCreate*Context` hooks → context values. Each component name is listed **4 times** (destructured from props → passed to hook → destructured in hook → listed in useMemo). Consumers then read components back out via `useMessagesContext()`, `useMessageInputContext()`, etc.

**Goal**: Replace this entire pipeline with a single `ComponentsContext`. Component overrides are **removed** from all existing contexts. Consumers read components via `useComponentsContext()` instead.

```tsx
// User API
<WithComponents value={{ Message: MyMessage, SendButton: MySendButton }}>
  <Channel channel={channel}>
    <MessageList />
    <MessageInput />
  </Channel>
</WithComponents>
```

## Design Principle

**All components are read from `useComponentsContext()`. All other contexts only provide data + APIs — never components.**

No context besides `ComponentsContext` should carry component references. This is the single rule that drives every change in this plan.

## Architecture

### Before

```
Channel props (90+ component overrides with defaults)
  → useCreateMessagesContext (receives 60+ component params, maps into useMemo)
  → MessagesContext carries components + runtime data
  → Consumer: const { Message } = useMessagesContext()
```

### After

```
DEFAULT_COMPONENTS (static map)
  → ComponentsContext (defaults; user overrides via WithComponents)
  → Consumer: const { Message } = useComponentsContext()

Channel props (runtime/config only)
  → useCreateMessagesContext (runtime data only, no components)
  → MessagesContext carries ONLY data + APIs
  → Consumer: const { deleteMessage } = useMessagesContext()
```

## Scope

### What changes

1. **Existing context types** (`MessagesContextValue`, `InputMessageInputContextValue`, `ChannelContextValue`, `ChannelsContextValue`, `AttachmentPickerContextValue`) — remove all component-type keys
2. **`useCreate*Context` hooks** — remove all component params, stop mapping them
3. **Channel.tsx** — remove ~90 component imports, ~90 destructuring defaults, ~90 forwarding lines
4. **ChannelList.tsx** — remove ~19 component props and forwarding
5. **~117 consumer callsites across ~97 files** — switch from `useXContext()` to `useComponentsContext()` for component reads

### What doesn't change

- Runtime data flow (callbacks like `deleteMessage`, `sendReaction`, state like `targetedMessage`) stays in existing contexts
- Consumer reads of runtime data (`const { deleteMessage } = useMessagesContext()`) are untouched
- `WithComponents` nesting semantics (inner wins, like standard React context)

## New Files

| File                                                           | Purpose                                                                             |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `package/src/contexts/componentsContext/ComponentsContext.tsx` | `ComponentOverrides` type, `WithComponents` provider, `useComponentsContext()` hook |
| `package/src/contexts/componentsContext/defaultComponents.ts`  | All default component imports → `DEFAULT_COMPONENTS` map                            |

Both already drafted in the repo.

## Implementation Steps

### Step 1: Finalize `ComponentsContext.tsx` and `defaultComponents.ts`

Already drafted. Key design:

- `ComponentOverrides`: flat map, all keys optional, explicitly typed per component
- Context default = `DEFAULT_COMPONENTS` → `useComponentsContext()` always returns resolved values
- `WithComponents`: merges `{ ...parent, ...value }` (inner wins)
- `ResolvedComponents` = `Required<ComponentOverrides>` for the return type

Special cases:

- `FlatList` — from `NativeHandlers.FlatList` at runtime. Keep as a runtime prop in MessagesContext, not in ComponentsContext.
- `StopMessageStreamingButton` — can be `null` (explicitly hide). The type in ComponentOverrides allows `| null`.

### Step 2: Strip component keys from existing context value types

**`MessagesContextValue`** (`package/src/contexts/messagesContext/MessagesContext.tsx`):
Remove ~60 component keys (Attachment, AudioAttachment, DateHeader, Message, MessageContent, Reply, etc.). Keep runtime keys only (deleteMessage, deleteReaction, dismissKeyboardOnMessageTouch, giphyVersion, messageContentOrder, etc.).

**`InputMessageInputContextValue`** (`package/src/contexts/messageInputContext/MessageInputContext.tsx`):
Remove ~35 component keys (AttachButton, AudioRecorder, SendButton, Input, InputView, etc.). Keep runtime keys only (asyncMessagesLockDistance, audioRecordingEnabled, editMessage, sendMessage, etc.).

**`ChannelContextValue`** (`package/src/contexts/channelContext/ChannelContext.tsx`):
Remove 4 component keys (EmptyStateIndicator, LoadingIndicator, NetworkDownIndicator, StickyHeader).

**`ChannelsContextValue`** (`package/src/contexts/channelsContext/ChannelsContext.tsx`):
Remove ~19 component keys (Preview, PreviewAvatar, PreviewMessage, Skeleton, FooterLoadingIndicator, etc.).

**`AttachmentPickerContextValue`** (`package/src/contexts/attachmentPickerContext/AttachmentPickerContext.tsx`):
Remove 3 component keys (ImageOverlaySelectedComponent, AttachmentPickerSelectionBar, AttachmentPickerContent).

### Step 3: Simplify `useCreate*Context` hooks

Each hook drops all component params and stops mapping them into useMemo:

- **`useCreateMessagesContext`** (`package/src/components/Channel/hooks/useCreateMessagesContext.ts`): ~60 component params removed, keep ~30 runtime params
- **`useCreateInputMessageInputContext`** (`package/src/components/Channel/hooks/useCreateInputMessageInputContext.ts`): ~35 component params removed, keep ~15 runtime params
- **`useCreateChannelContext`** (`package/src/components/Channel/hooks/useCreateChannelContext.ts`): 4 component params removed
- **`useCreateChannelsContext`** (`package/src/components/ChannelList/hooks/useCreateChannelsContext.ts`): ~19 component params removed, keep ~20 runtime params

### Step 4: Simplify Channel.tsx

- Remove ~90 default component imports (lines 114-223)
- Remove component keys from `ChannelPropsWithContext` type
- Remove component destructuring defaults from `ChannelWithContext`
- Remove component values from `useCreateMessagesContext()`, `useCreateInputMessageInputContext()`, `useCreateChannelContext()` calls
- Remove component values from `attachmentPickerContext` useMemo
- `LoadingErrorIndicator` and `KeyboardCompatibleView` are used directly in Channel's JSX — read from `useComponentsContext()` or keep as Channel-specific props

### Step 5: Simplify ChannelList.tsx

- Remove component keys from `ChannelListProps` type
- Remove default component imports
- Remove component values from `useCreateChannelsContext()` call

### Step 6: Update ~117 consumer callsites

Switch component destructuring from old context hooks to `useComponentsContext()`:

```tsx
// Before
const { Message, MessageStatus, MessageTimestamp } = useMessagesContext();
const { deleteMessage } = useMessagesContext();

// After
const { Message, MessageStatus, MessageTimestamp } = useComponentsContext();
const { deleteMessage } = useMessagesContext();
```

**Key files by volume** (largest consumers):

- `components/Message/MessageItemView/MessageItemView.tsx` — 15+ component keys
- `components/Message/MessageItemView/MessageContent.tsx` — 15+ component keys
- `components/MessageList/MessageList.tsx` — 10+ component keys
- `components/MessageList/MessageFlashList.tsx` — 10+ component keys
- `components/MessageInput/MessageComposer.tsx` — 25+ component keys
- `components/Attachment/Attachment.tsx` — 10+ component keys
- `components/ChannelList/ChannelListView.tsx` — multiple component keys
- `components/ChannelPreview/ChannelPreviewView.tsx` — multiple component keys

Many other files destructure just 1-2 component keys from context — straightforward replacements.

### Step 7: Update exports

- `package/src/contexts/index.ts` — add `export * from './componentsContext/ComponentsContext'`
- `package/src/index.ts` — verify `WithComponents`, `ComponentOverrides`, `useComponentsContext` are exported

### Step 8: Update tests

Tests that pass component overrides as Channel/ChannelList props will need to wrap in `<WithComponents>` instead. Mock builders that set up context values with component overrides may also need updating.

## Edge Cases

- **Shared names**: `EmptyStateIndicator`, `LoadingIndicator` exist in both Channel and ChannelList. One key in flat map — users use nesting for different overrides per area.
- **Mixed destructuring**: Some consumers destructure both components and runtime data from the same `useMessagesContext()` call. These need to be split into two calls.
- **`FlatList`**: Runtime-resolved from NativeHandlers. Stays in MessagesContext as a runtime value, not in ComponentsContext.
- **`StopMessageStreamingButton`**: Supports `null` to hide. ComponentOverrides type allows `| null`.

## Verification

1. `cd package && yarn build` — type-checks and builds
2. `cd package && yarn test:unit` — tests pass (after updating test fixtures)
3. `cd package && yarn lint` — no lint errors
4. Manual: `<WithComponents value={{ Message: Custom }}>` → verify override appears
5. Verify nesting: inner `WithComponents` wins over outer
