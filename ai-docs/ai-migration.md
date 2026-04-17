# stream-chat-react-native v8 → v9 — Agent Migration Guide

> Machine-oriented migration reference for AI coding agents. The prose-heavy
> human version lives at
> https://getstream.io/chat/docs/sdk/react-native/basics/upgrading-from-v8/
> — do not load it for agent-driven migrations; this file supersedes it.

## 0. For the agent (read first)

1. **Your training data predates v9.** Do not rely on memory for v9 symbols, prop
   shapes, or export paths. Always verify against the installed SDK source.
2. **Package name in `node_modules/` is `stream-chat-react-native-core`.** The
   published packages are:

   - `stream-chat-react-native-core` — the actual SDK; ships `src/` + `lib/`.
   - `stream-chat-react-native` — bare-RN wrapper; peer-deps on core.
   - `stream-chat-expo` — Expo wrapper; peer-deps on core.

   Every source path below is rooted at
   `node_modules/stream-chat-react-native-core/src/`. Do **not** look under
   `node_modules/stream-chat-react-native/src/` for SDK source — that's the
   wrapper, not the SDK.

3. **Order of work.** Do §2 (prereqs) → §3 (big-3 structural moves) → §4/§5
   (leaf renames + replacements) → §6 (behavior changes) → §9 (verify).
   Many leaf renames disappear automatically once §3.1 (`WithComponents`)
   lands, so doing §3 first saves churn.
4. **Detect before editing.** Run §1 first. Skip any section whose patterns
   don't match the customer codebase.
5. **When uncertain, read source.** §8 lists the files to consult. If a symbol
   is not in this guide, read the public barrel
   (`node_modules/stream-chat-react-native-core/src/index.ts`) — do not guess.

## 1. Detection (run first)

Run each ripgrep against the customer's app source directory (replace `src/`
with their source root). Zero hits = skip the corresponding section.

```bash
# §3.1 — WithComponents migration needed?
rg '<(Channel|ChannelList|Chat|Thread)\s[^>]*\b([A-Z]\w+)=\{' src/

# §3.2 — five breaking component renames
rg '\b(MessageSimple|MessageAvatar|ChannelListMessenger|ChannelPreviewMessenger)\b' src/
# MessageInput is special: the component was renamed, but MessageInputContext,
# useMessageInputContext, and the MessageInput*View helpers were NOT. Filter
# the noise so only real component usages remain:
rg '\bMessageInput\b' src/ | rg -v 'MessageInputContext|MessageInputHeaderView|MessageInputFooterView|MessageInputLeadingView|MessageInputTrailingView|useMessageInputContext|MessageInputContextValue'

# §3.3 — inverted audio semantics
rg '\basyncMessagesMultiSendEnabled\b' src/

# §4.2 — hook renames
rg '\buseAudioController\b' src/
# useMutedUsers is scope-split: only rename Chat-level uses (ones that take a
# StreamChat client arg). Review each match against §4.2 before editing.
rg '\buseMutedUsers\b' src/

# §5 — removed components with replacements
rg '\b(AttachmentActions|AttachmentUploadProgressIndicator|Card|CardCover|CardFooter|CardHeader|ImageReloadIndicator|MessagePreview|imageGalleryCustomComponents)\b' src/
rg '\b(CameraSelectorIcon|FileSelectorIcon|ImageSelectorIcon|VideoRecorderSelectorIcon)\b' src/

# §6 — behavior / contract changes
rg '\b(latestMessagePreview|deletedMessagesVisibilityType|messageContentWidth|setMessageContentWidth|legacyImageViewerSwipeBehaviour)\b' src/
# Custom MessageMenu override is silently dead in v9 — flag any.
rg '\boverrides=\{[^}]*\bMessageMenu\b' src/
rg '\bMessageMenu=\{' src/

# Theme — v8 namespace names that moved
rg "\b(messageInput|messageSimple|channelListMessenger)\s*:" src/

# Semantic token renames
rg '\b(backgroundCoreSurface|badgeTextInverse|textInverse|backgroundCoreElevation4)\b' src/

# Icon removals / renames
rg '\b(CircleStop|Refresh|Close|User|MessageIcon|ArrowRight|ArrowLeft|Attach|ChatIcon|CheckSend|Folder|MenuPointVertical|Notification|PinHeader|LOLReaction|LoveReaction|ThumbsUpReaction|ThumbsDownReaction|WutReaction)\b' src/
```

## 2. Prerequisites (hard blockers — fail fast)

- **React Native New Architecture is required.** RN 0.76+ or an Expo SDK that
  defaults to the new arch. If the app is on the old architecture, stop and
  tell the user to migrate the arch first.
- **New required peer dependency.** Run `yarn add react-native-teleport` (or
  the npm equivalent). Minimum version `0.5.4`.
- **Keyboard handling cleanup.** Remove every one of these v8 workarounds
  before running the app:
  - Negative `keyboardVerticalOffset` values (e.g. `-300`) on any screen that
    renders `MessageComposer`. Set it to the navigation header height instead
    (same value on iOS and Android).
  - `SafeAreaView` wrappers placed around `MessageComposer` purely to fix
    bottom spacing. `MessageComposer` handles its own safe-area in v9.
  - Manual Android IME padding hacks that pushed the composer above the
    keyboard.

## 3. The big 3 structural migrations (do these first, in order)

### 3.1 Component override props → `<WithComponents overrides={{...}}>`

Every `ComponentType` prop on `Channel`, `ChannelList`, `Chat`, and `Thread`
was removed. They are now provided via a single `<WithComponents>` wrapper and
read with `useComponentsContext()`.

**Before (v8):**

```tsx
<Chat client={client} LoadingIndicator={CustomChatLoading}>
  <ChannelList Preview={CustomPreview} />
  <Channel channel={channel} Message={CustomMessage} SendButton={CustomSendButton} DateHeader={CustomDateHeader}>
    <MessageList />
    <MessageComposer />
    <Thread MessageComposer={CustomThreadComposer} />
  </Channel>
</Chat>
```

**After (v9):**

```tsx
<WithComponents
  overrides={{
    ChatLoadingIndicator: CustomChatLoading, // renamed: see below
    Preview: CustomPreview,
    Message: CustomMessage,
    SendButton: CustomSendButton,
    DateHeader: CustomDateHeader,
    ThreadMessageComposer: CustomThreadComposer, // renamed: see below
  }}
>
  <Chat client={client}>
    <ChannelList />
    <Channel channel={channel}>
      <MessageList />
      <MessageComposer />
      <Thread />
    </Channel>
  </Chat>
</WithComponents>
```

Key rules:

- `WithComponents` nests. Inner overrides merge over outer ones (closest wins).
- Two prop keys were renamed when moving into `overrides`:
  - `Chat` prop `LoadingIndicator` -> overrides key `ChatLoadingIndicator`
  - `Thread` prop `MessageComposer` -> overrides key `ThreadMessageComposer`
- If a custom component used to read other components from a specific context,
  switch to `useComponentsContext()`:

  ```tsx
  // v8
  const { MessageItemView } = useMessagesContext();
  const { SendButton } = useMessageInputContext();
  const { Preview } = useChannelsContext();

  // v9
  const { MessageItemView, SendButton, Preview } = useComponentsContext();
  ```

- For the full list of overridable keys, read
  `node_modules/stream-chat-react-native-core/src/contexts/componentsContext/defaultComponents.ts`.
  The `DEFAULT_COMPONENTS` map is the source of truth; `ComponentOverrides` is
  derived from it. **Do not use a hardcoded list from your training data.**

### 3.2 Five breaking component renames

Pure symbol renames. Apply with find-and-replace (whole-word, case-sensitive).
Each rename also carries a prop-type rename and, in some cases, a theme
namespace rename.

Components + props:

- `MessageSimple` -> `MessageItemView`
  - `MessageSimpleProps` -> `MessageItemViewProps`
  - `MessageSimplePropsWithContext` -> `MessageItemViewPropsWithContext`
  - Theme namespace: `messageSimple` -> `messageItemView`
  - Test ID: `message-simple-wrapper` -> `message-item-view-wrapper`
- `MessageAvatar` -> `MessageAuthor`
  - `MessageAvatarProps` -> `MessageAuthorProps`
  - `MessageAvatarPropsWithContext` -> `MessageAuthorPropsWithContext`
  - Theme sub-key: `messageItemView.avatarWrapper` -> `messageItemView.authorWrapper`
  - Test ID: `message-avatar` -> `message-author`
- `MessageInput` -> `MessageComposer`
  - `MessageInputProps` -> `MessageComposerProps`
  - Theme namespace: `messageInput` -> `messageComposer`
  - `additionalMessageInputProps` -> `additionalMessageComposerProps`
  - `Thread` prop `MessageInput` -> overrides key `ThreadMessageComposer` (see §3.1)
- `ChannelListMessenger` -> `ChannelListView`
  - `ChannelListMessengerProps` -> `ChannelListViewProps`
  - Theme namespace: `channelListMessenger` -> `channelListView`
  - Test ID: `channel-list-messenger` -> `channel-list-view`
- `ChannelPreviewMessenger` -> `ChannelPreviewView`
  - `ChannelPreviewMessengerProps` -> `ChannelPreviewViewProps`
  - Theme namespace for `channelPreview` is **unchanged** (stays `channelPreview`).
  - Test ID `channel-preview-button` is **unchanged**.
  - `<ChannelList Preview={ChannelPreviewMessenger}/>` becomes the `ChannelPreview`
    overrides key on `<WithComponents>`.

**Do NOT rename these (common over-migration traps):**

- `MessageInputContext`, `useMessageInputContext`, `MessageInputContextValue` —
  the **component** was renamed, the context was not.
- The `MessageInput/` source folder name. Stays as `MessageInput/`.
- `MessageInputHeaderView`, `MessageInputFooterView`, `MessageInputLeadingView`,
  `MessageInputTrailingView` — these helpers keep their names.
- `channelPreview` theme namespace and `channel-preview-button` test ID.
- `MessagePinnedHeader` — still exists; just now rendered inside the
  consolidated `MessageHeader` flow.

### 3.3 Audio recording: semantics inverted

`asyncMessagesMultiSendEnabled` was removed and replaced with
`audioRecordingSendOnComplete`. This is **not a rename** — the boolean meaning
is inverted **and** the default changed.

Rewrite rule:

- v8 `asyncMessagesMultiSendEnabled={true}` ≡ v9 `audioRecordingSendOnComplete={false}`
- v8 `asyncMessagesMultiSendEnabled={false}` ≡ v9 `audioRecordingSendOnComplete={true}`
- **Default behavior flipped.** Both defaults are the literal boolean `true`,
  but the semantics are inverted — so the runtime behavior changed:
  - v8 default `asyncMessagesMultiSendEnabled=true` → recordings **stayed** in
    the composer.
  - v9 default `audioRecordingSendOnComplete=true` → recordings **send
    immediately**.
  - If v8 code omitted the prop (relying on the default), pass
    `audioRecordingSendOnComplete={false}` in v9 to preserve the old UX.

Semantics in plain terms:

- v9 `audioRecordingSendOnComplete={true}` — upload completes → send immediately.
- v9 `audioRecordingSendOnComplete={false}` — upload completes → stays in composer
  so the user can add text or more attachments before sending.

Apply on `Channel`, `MessageComposer`, and any direct
`useMessageInputContext()` consumer. Also update direct
`uploadVoiceRecording(sendOnComplete)` callsites: the boolean now carries
`sendOnComplete` semantics, not the old `multiSendEnabled` semantics.

## 4. Rename lists (bullets, not tables)

### 4.1 Components (rename or removed-with-1:1-replacement)

- `MessageSimple` -> `MessageItemView`
- `MessageAvatar` -> `MessageAuthor`
- `MessageInput` -> `MessageComposer`
- `ChannelListMessenger` -> `ChannelListView`
- `ChannelPreviewMessenger` -> `ChannelPreviewView`
- `AudioAttachment` — **not renamed.** Source folder moved from
  `Attachment/AudioAttachment/` to `Attachment/Audio/`, but the public export
  name and the `ComponentOverrides` key are both still `AudioAttachment`.
  Do not rename import sites or override keys.
- `Card` -> `UrlPreview` (new props type `URLPreviewProps`; see §5)
- `Avatar` (numeric `size`) -> `Avatar` (string enum `'xs'..'2xl'`); prop `image` -> `imageUrl`; `name` -> `placeholder`; `online`/`presenceIndicator` -> separate `OnlineIndicator` component
- `GroupAvatar` -> `AvatarGroup` / `AvatarStack`
- `CameraSelectorIcon` -> `AttachmentTypePickerButton`
- `FileSelectorIcon` -> `AttachmentTypePickerButton`
- `ImageSelectorIcon` -> `AttachmentTypePickerButton`
- `VideoRecorderSelectorIcon` -> `AttachmentTypePickerButton`
- `CreatePollIcon` -> (no replacement; poll creation is internal now)
- `MessageMenu` -> split into `MessageReactionPicker` + `MessageActionList` +
  `MessageActionListItem` + `MessageUserReactions` (see §6)
- `MessageMenuProps` -> no direct replacement (customize the four components
  above individually)
- `ChannelAvatar` (legacy) -> `ChannelAvatar` from `ui/Avatar/` (different API; `size='xl'` default)
- `PreviewAvatar` -> `ChannelAvatar` with `size='xl'`

### 4.2 Hooks

- `useAudioController` -> `useAudioRecorder`
- `useMutedUsers` (Chat-level, called with a `StreamChat` client) ->
  `useClientMutedUsers`. **Scope-split rename.** A separate `useMutedUsers`
  from `ChannelList/hooks/` still exists in v9 and was **not** renamed — if
  the call site uses it inside a channel-list context (no `client` arg),
  leave it alone. To decide: read the import path or the argument. If it
  takes a `StreamChat` client, rename. Otherwise keep.
- `useAudioPlayerControl` -> `useAudioPlayer` (also rename type
  `UseAudioPlayerControlProps` -> `UseAudioPlayerProps`). The v9 barrel
  exports `useAudioPlayer`; `useAudioPlayerControl` is removed.
- New hooks that replace removed components/values:
  - `useMessageDeliveryStatus`, `useGroupedAttachments`, `useMessagePreviewIcon`,
    `useMessagePreviewText` (replace the removed `MessagePreview` component)
  - `useMessageComposer` (direct access to composer state — replaces reading
    from `useMessageInputContext()` for most composer needs)
  - `useAttachmentPickerState` (replaces context-based `selectedPicker` /
    `toggleAttachmentPicker`)
  - `useImageGalleryVideoPlayer`, `useHasOwnReaction`,
    `useChannelPreviewDraftMessage`, `useChannelPreviewPollLabel`,
    `useChannelTypingState`

### 4.3 Props (breaking only)

On `Channel` / `MessageComposer` / `MessageInputContext`:

- `asyncMessagesMultiSendEnabled` -> `audioRecordingSendOnComplete` (SEMANTICS INVERTED — see §3.3)
- `toggleAttachmentPicker` -> `openAttachmentPicker` / `closeAttachmentPicker`
- `selectedPicker` -> `useAttachmentPickerState()` hook
- `cooldownEndsAt` -> (removed; cooldown managed internally by `OutputButtons`)
- `getMessagesGroupStyles` -> (removed; grouping handled internally)
- `legacyImageViewerSwipeBehaviour` -> (removed; legacy viewer gone)
- `deletedMessagesVisibilityType` -> (removed; deleted messages always shown — see §6)
- `isAttachmentEqual` -> (removed)
- `additionalMessageInputProps` -> `additionalMessageComposerProps`

On `ChannelPreviewContext` (and `ChannelList`):

- `latestMessagePreview` (pre-formatted) -> `lastMessage` (raw). Text access
  goes from `latestMessagePreview.messageObject.text` to `lastMessage.text`.
- `<ChannelList Preview={...}/>` -> `<WithComponents overrides={{ ChannelPreview: ... }}>`
  (the prop is on `ChannelList`, but migrates to the `ChannelPreview` key.)

On `MessageList`:

- `isListActive` -> (removed)
- `setMessages` -> (removed; use centralized state store)
- `channelUnreadState` -> `channelUnreadStateStore`
- `additionalFlatListProps` type: `FlatListProps<LocalMessage>` -> `FlatListProps<MessageListItemWithNeighbours>`
- `setFlatListRef` type: `FlatListType<LocalMessage>` -> `FlatListType<MessageListItemWithNeighbours>`

On `OverlayProvider`:

- `imageGalleryCustomComponents` (nested) -> flat keys on `<WithComponents>` (see §5)
- `MessageOverlayBackground`, `ImageGalleryHeader`, `ImageGalleryFooter`, `ImageGalleryGrid`, `ImageGalleryVideoControls` -> moved from `OverlayProvider` props to `<WithComponents>` overrides
- `imageGalleryGridHandleHeight` -> (removed)
- `imageGalleryGridSnapPoints` -> (removed)

On `AudioAttachment`:

- `onLoad` / `onPlayPause` / `onProgress` -> `useAudioPlayer` hook
- `titleMaxLength` -> `showTitle` boolean

### 4.4 Theme namespaces

- `messageInput` -> `messageComposer`
- `messageSimple` -> `messageItemView`
- `messageItemView.avatarWrapper` -> `messageItemView.authorWrapper`
- `channelListMessenger` -> `channelListView`
- `messageItemView.card` — still exists but restructured. Inner keys
  `authorName`, `authorNameContainer`, `authorNameFooter`, `noURI`,
  `playButtonStyle`, `playIcon` were removed; `linkPreview` + `linkPreviewText`
  were added. A sibling key `messageItemView.compactUrlPreview` was added for
  the new compact URL preview. Diff the full shape against `theme.ts`.
- `channelPreview` namespace: **unchanged** (internal structure changed heavily; if
  the app had custom `channelPreview` overrides, diff against
  `node_modules/stream-chat-react-native-core/src/contexts/themeContext/utils/theme.ts`)

For every other theme change: read the current `Theme` type at
`node_modules/stream-chat-react-native-core/src/contexts/themeContext/utils/theme.ts`
and let TypeScript report the mismatches. Do not try to remember the full
sub-key restructuring.

### 4.5 Icons (breaking only)

Renamed (public):

- `CircleStop` -> `Stop`
- `Refresh` -> `Reload`

Removed with no SDK replacement (supply your own):

- Navigation / UI: `ArrowRight`, `ArrowLeft`, `Close`, `User`, `MessageIcon`,
  `Attach`, `Back`, `AtMentions`, `ChatIcon`, `CheckSend`, `CircleClose`,
  `CirclePlus`, `CircleRight`, `DownloadArrow`, `DownloadCloud`, `DragHandle`,
  `Error`, `Eye`, `Folder`, `GenericFile`, `GiphyLightning`, `Grid`, `Group`,
  `Logo`, `MailOpen`, `MenuPointVertical`, `MessageBubble`, `Notification`,
  `PinHeader`, `SendCheck`, `SendPoll`, `SendUp`, `ShareRightArrow`,
  `UserAdmin`, `UserMinus`
- Reactions: `LOLReaction`, `LoveReaction`, `ThumbsDownReaction`,
  `ThumbsUpReaction`, `WutReaction`
- File-type icons: `CSV`, `DOCX`, `HTML`, `MD`, `ODT`, `PPT`, `PPTX`, `RAR`,
  `RTF`, `SEVEN_Z`, `TAR`, `TXT`, `XLS`, `XLSX`

Visually updated but keep the same import name (no code change needed; flag if
the app has pixel-precise snapshots): `Archive`, `ArrowUp`, `Audio`, `Camera`,
`Check`, `CheckAll`, `Copy`, `Delete`, `Down`, `Edit`, `Flag`, `GiphyIcon`,
`Imgur`, `Lightning`, `Link`, `Loading`, `Lock`, `MenuPointHorizontal`, `Mic`,
`Mute`, `PDF`, `Pause`, `Picture`, `Pin`, `Play`, `Recorder`, `Reload`,
`Resend`, `Search`, `SendRight`, `Share`, `Smile`, `Sound`, `ThreadReply`,
`Time`, `Unpin`, `UserAdd`, `UserDelete`, `Video`, `Warning`, `ZIP`.

## 5. Removed-with-structural-replacement

Not simple renames — require a code shape change.

### 5.1 `AttachmentUploadProgressIndicator` → six granular indicators

One component split into six. Pick the right one per upload type × state:

- `FileUploadInProgressIndicator`
- `FileUploadRetryIndicator`
- `FileUploadNotSupportedIndicator`
- `ImageUploadInProgressIndicator`
- `ImageUploadRetryIndicator`
- `ImageUploadNotSupportedIndicator`

Provide any custom ones as `<WithComponents>` overrides using the matching key.

### 5.2 `Card` / `CardCover` / `CardFooter` / `CardHeader` → `UrlPreview` + `URLPreviewCompact`

- Old type `CardProps` -> new type `URLPreviewProps`.
- Choose rendering style via the new `urlPreviewType` prop on `Channel`:
  `'full'` (default) or `'compact'`.
- Customize via `<WithComponents overrides={{ UrlPreview, URLPreviewCompact }}>`.

### 5.3 `AttachmentActions` → inline

Removed with no standalone replacement — actions now render inline on
attachments. Delete any custom `AttachmentActions` override.

### 5.4 `MessagePreview` → four hooks

Component removed. Replace with composable hooks:

- `useMessageDeliveryStatus`
- `useGroupedAttachments`
- `useMessagePreviewIcon`
- `useMessagePreviewText`

### 5.5 `imageGalleryCustomComponents` → flat `WithComponents` keys

- v8: nested object on `OverlayProvider`
  (`imageGalleryCustomComponents={{ header: { Component: ... }, footer: {...}, grid: {...}, gridHandle: {...} }}`).
- v9: flat `<WithComponents overrides={{ ImageGalleryHeader, ImageGalleryFooter, ImageGalleryVideoControls, ImageGalleryGrid }}>`.
  Note the v8 `gridHandle` has no replacement (use `ImageGalleryGrid` instead).

### 5.6 Individual attachment-picker selector icons → `AttachmentTypePickerButton`

`CameraSelectorIcon`, `FileSelectorIcon`, `ImageSelectorIcon`, and
`VideoRecorderSelectorIcon` are all replaced by the unified
`AttachmentTypePickerButton`. `AttachmentPickerBottomSheetHandle`,
`AttachmentPickerError`, and `AttachmentPickerErrorImage` are removed with no
replacement.

## 6. Behavior changes (runtime semantics, not grep renames)

- **`messageContentOrder` default swapped `'text'`/`'attachments'`.** If the v8
  app depended on text rendering before attachments, pass the old order
  explicitly:
  `messageContentOrder={['quoted_reply','gallery','files','poll','ai_text','text','attachments','location']}`.
- **`deletedMessagesVisibilityType` removed.** Deleted messages are always
  shown now. The `'sender' | 'receiver' | 'never'` modes are gone; delete the
  prop.
- **Swipe-to-reply boundary moved.** Was `MessageBubble`, now the full
  `MessageItemView`. Gesture behavior (`messageSwipeToReplyHitSlop`, thresholds,
  haptics, `MessageSwipeContent`, spring-back) is unchanged.
- **`messageContentWidth` / `setMessageContentWidth` removed.** Strip any
  custom `MessageContent`, `MessageBubble`, or `ReactionListTop` that read or
  called them (and the matching test mocks).
- **`MessagesContext` no longer carries any UI component keys.** The v9
  design is that all component overrides live in `ComponentsContext` (provided
  via `<WithComponents>`; see §3.1). If an app wraps its own `MessagesContext`
  provider directly, stop passing `Message`, `MessageItemView`, `MessageHeader`,
  `Attachment`, etc. into the value — those fields are gone. Move them to
  `<WithComponents overrides={{ ... }}>`.
  - **Known intentional exception:** `FlatList` (typed as
    `typeof NativeHandlers.FlatList | undefined`) is still a key on
    `MessagesContextValue`. It's not a user-overridable `ComponentType`;
    it's injected by `registerNativeHandlers()` at module load from the
    native-package or expo-package. Don't flag it as a leak; don't try to
    route it through `<WithComponents>`.
- **Audio recording defaults changed.** See §3.3.
- **Semantic token renames:**
  - `backgroundCoreSurface` -> `backgroundCoreSurfaceDefault`
  - `badgeTextInverse` -> `badgeTextOnInverse`
  - `textInverse` -> `textOnInverse`
  - `backgroundCoreElevation4` -> **removed, no replacement.** Remove any
    dependency on it.
- **Reaction-list default changed.** `reactionListType` default is now
  `'clustered'`. If the app relied on the v8 segmented style, set
  `reactionListType='default'` explicitly on `Channel`.
- **`MessageMenu` component removed.** The v9 overlay path does not render
  `MessageMenu`; the component and its `MessageMenuProps` type are removed
  from the public barrel. Any v8 custom `MessageMenu` override becomes a
  type error on v9 — migrate that logic to the four components that actually
  render in v9: `MessageReactionPicker`, `MessageActionList`,
  `MessageActionListItem`, and `MessageUserReactions`. Provide them via
  `<WithComponents overrides={{ MessageReactionPicker, MessageActionList,
  MessageActionListItem, MessageUserReactions }}>`.
- **`MessageActionType` shape changed.** Two breaking changes for apps with
  custom message actions:
  1. New required field `type: 'standard' | 'destructive'` on every
     `MessageActionType` object. Destructive entries render in a visually
     separated group in the action list. Add `type` to every entry in any
     custom `messageActions` array.
  2. The `ActionType` union gained `'blockUser'`. If the app has an
     exhaustive switch over `ActionType`, add a case for `'blockUser'` or
     the TypeScript compiler will flag the switch as non-exhaustive.
- **Hook exports flattened.** Subpath imports like
  `'stream-chat-react-native/ChannelPreview/hooks/useChannelPreviewDisplayName'`
  no longer resolve. Import from the package root:
  `import { useChannelPreviewDisplayName } from 'stream-chat-react-native'`.
- **Attachment-picker defaults.** `attachmentPickerBottomSheetHeight` is now
  fixed pixels (`disableAttachmentPicker ? 72 : 333`), not viewport-relative.
  `attachmentSelectionBarHeight` default is `72` (was `52`).
  `numberOfAttachmentImagesToLoadPerCall` default is `25` (was `60`).

## 7. Machine-readable rename block

Parseable JSON for deterministic find-and-replace. Keys are v8 symbols;
values are v9 replacements. `null` = removed with no in-SDK replacement.

```json
{
  "components": {
    "MessageSimple": "MessageItemView",
    "MessageAvatar": "MessageAuthor",
    "MessageInput": "MessageComposer",
    "ChannelListMessenger": "ChannelListView",
    "ChannelPreviewMessenger": "ChannelPreviewView",
    "Card": "UrlPreview",
    "CardCover": "UrlPreview",
    "CardFooter": "UrlPreview",
    "CardHeader": "UrlPreview",
    "GroupAvatar": "AvatarGroup",
    "CameraSelectorIcon": "AttachmentTypePickerButton",
    "FileSelectorIcon": "AttachmentTypePickerButton",
    "ImageSelectorIcon": "AttachmentTypePickerButton",
    "VideoRecorderSelectorIcon": "AttachmentTypePickerButton",
    "PreviewAvatar": "ChannelAvatar",
    "AttachmentActions": null,
    "ImageReloadIndicator": null,
    "AttachmentPickerBottomSheetHandle": null,
    "AttachmentPickerError": null,
    "AttachmentPickerErrorImage": null,
    "MessagePreview": null,
    "MessageEditedTimestamp": null,
    "MessageMenu": "MessageReactionPicker + MessageActionList + MessageActionListItem + MessageUserReactions",
    "CreatePollIcon": null,
    "CommandsButton": null,
    "MoreOptionsButton": null,
    "InputEditingStateHeader": "MessageInputHeaderView",
    "InputReplyStateHeader": "MessageInputHeaderView",
    "CommandInput": null
  },
  "componentProps": {
    "MessageSimpleProps": "MessageItemViewProps",
    "MessageAvatarProps": "MessageAuthorProps",
    "MessageInputProps": "MessageComposerProps",
    "ChannelListMessengerProps": "ChannelListViewProps",
    "ChannelPreviewMessengerProps": "ChannelPreviewViewProps",
    "CardProps": "URLPreviewProps",
    "MessageMenuProps": null
  },
  "hooks": {
    "useAudioController": "useAudioRecorder",
    "useAudioPlayerControl": "useAudioPlayer",
    "useMutedUsers (Chat-level)": "useClientMutedUsers"
  },
  "props": {
    "asyncMessagesMultiSendEnabled": "audioRecordingSendOnComplete",
    "toggleAttachmentPicker": "openAttachmentPicker|closeAttachmentPicker",
    "additionalMessageInputProps": "additionalMessageComposerProps",
    "latestMessagePreview": "lastMessage",
    "imageGalleryCustomComponents": "WithComponents overrides",
    "deletedMessagesVisibilityType": null,
    "legacyImageViewerSwipeBehaviour": null,
    "isAttachmentEqual": null,
    "cooldownEndsAt": null,
    "getMessagesGroupStyles": null,
    "messageContentWidth": null,
    "setMessageContentWidth": null,
    "imageGalleryGridSnapPoints": null,
    "imageGalleryGridHandleHeight": null,
    "titleMaxLength": "showTitle",
    "onLoad": "useAudioPlayer",
    "onPlayPause": "useAudioPlayer",
    "onProgress": "useAudioPlayer"
  },
  "overridesKeyRenames": {
    "LoadingIndicator (on Chat)": "ChatLoadingIndicator",
    "MessageComposer (on Thread)": "ThreadMessageComposer"
  },
  "themeNamespaces": {
    "messageInput": "messageComposer",
    "messageSimple": "messageItemView",
    "channelListMessenger": "channelListView"
  },
  "themeSubKeys": {
    "messageItemView.avatarWrapper": "messageItemView.authorWrapper"
  },
  "semanticTokens": {
    "backgroundCoreSurface": "backgroundCoreSurfaceDefault",
    "badgeTextInverse": "badgeTextOnInverse",
    "textInverse": "textOnInverse",
    "backgroundCoreElevation4": null
  },
  "icons": {
    "CircleStop": "Stop",
    "Refresh": "Reload",
    "ArrowRight": null,
    "ArrowLeft": null,
    "Close": null,
    "User": null,
    "MessageIcon": null,
    "Attach": null,
    "Back": null,
    "ChatIcon": null,
    "LOLReaction": null,
    "LoveReaction": null,
    "ThumbsUpReaction": null,
    "ThumbsDownReaction": null,
    "WutReaction": null,
    "CSV": null,
    "DOCX": null,
    "HTML": null,
    "MD": null,
    "ODT": null,
    "PPT": null,
    "PPTX": null,
    "RAR": null,
    "RTF": null,
    "SEVEN_Z": null,
    "TAR": null,
    "TXT": null,
    "XLS": null,
    "XLSX": null
  }
}
```

## 8. When to read source (not training data)

All paths are under `node_modules/stream-chat-react-native-core/src/`. Read the
file directly — do not attempt to reconstruct its contents from memory.

- Public exports barrel: `index.ts`
- Components barrel: `components/index.ts`
- Hooks barrel: `hooks/index.ts`
- Contexts barrel: `contexts/index.ts`
- `WithComponents` + `useComponentsContext` + `ComponentOverrides` type:
  `contexts/componentsContext/ComponentsContext.tsx`
- Full overridable component list (source of truth):
  `contexts/componentsContext/defaultComponents.ts` — the `DEFAULT_COMPONENTS`
  map.
- Theme type (source of truth for every theme key):
  `contexts/themeContext/utils/theme.ts`
- `useAudioRecorder`: `components/MessageInput/hooks/useAudioRecorder.tsx`
- `useAudioPlayer`: `hooks/useAudioPlayer.ts`
- `useMessageComposer`: `contexts/messageInputContext/hooks/useMessageComposer.ts`
- `useAttachmentPickerState`: `hooks/useAttachmentPickerState.ts`
- Message item stack: `components/Message/MessageItemView/`
  (`MessageItemView.tsx`, `MessageAuthor.tsx`, `MessageHeader.tsx`, etc.)
- Composer: `components/MessageInput/MessageComposer.tsx` (folder stays named
  `MessageInput/`)
- Channel preview: `components/ChannelPreview/ChannelPreviewView.tsx`
- Channel list view: `components/ChannelList/ChannelListView.tsx`
- Attachment-picker redesign: `components/AttachmentPicker/components/AttachmentPickerContent.tsx`

Rule of thumb for anything not in this guide: open `index.ts`, grep for the
symbol you think you need, and follow the re-export path to the definition.
If it's not in `index.ts`, it's not a public API — do not rely on it.

## 9. Verification workflow

An agent MUST run all of these before declaring the migration complete. Every
bullet is a hard gate; none are optional.

```bash
# 1. No v8 symbols remain in source.
rg '\b(MessageSimple|MessageAvatar|ChannelPreviewMessenger|ChannelListMessenger)\b' src/
rg '\buseAudioController\b' src/
# useMutedUsers is scope-split (§4.2). Any remaining matches must be verified by
# hand — Chat-level usage is a bug, ChannelList-level usage is fine.
rg '\buseMutedUsers\b' src/
rg '\basyncMessagesMultiSendEnabled\b' src/
rg '\b(latestMessagePreview|deletedMessagesVisibilityType|messageContentWidth|setMessageContentWidth|legacyImageViewerSwipeBehaviour)\b' src/
rg '\b(AttachmentActions|AttachmentUploadProgressIndicator|Card|CardCover|CardFooter|CardHeader|ImageReloadIndicator|MessagePreview)\b' src/
rg '\b(CameraSelectorIcon|FileSelectorIcon|ImageSelectorIcon|VideoRecorderSelectorIcon)\b' src/
rg '\b(backgroundCoreSurface|badgeTextInverse|textInverse|backgroundCoreElevation4)\b' src/

# 2. Component override props no longer appear on Channel/ChannelList/Chat/Thread.
#    This regex matches JSX like `<Channel Message={...}` — expect 0 hits when §3.1 is done.
rg '<(Channel|ChannelList|Chat|Thread)\s[^>]*\b([A-Z]\w+)=\{' src/

# 3. `MessageInput` as a component reference is gone (component renamed to MessageComposer).
#    The context name, hook name, and helper-view names are allowed — filter them out:
rg '\bMessageInput\b' src/ | rg -v 'MessageInputContext|MessageInputHeaderView|MessageInputFooterView|MessageInputLeadingView|MessageInputTrailingView|useMessageInputContext|MessageInputContextValue'

# 4. New required peer dep present in package.json.
rg '"react-native-teleport"' package.json

# 5. TypeScript passes.
yarn tsc --noEmit   # or: npx tsc --noEmit

# 6. Lint + tests if the project has them.
yarn lint
yarn test
```

If any `rg` above returns hits (except #4 which should return a hit), either
finish migrating the matches or verify each match against §3–§6 and explain in
the agent's final report why the match is legitimate (e.g. a test string or a
comment referencing the v8 name).

Smoke-test the running app at minimum:

- Render `<Chat>` → `<Channel>` → `<MessageList>` + `<MessageComposer>`.
- Send a text message; long-press it → confirm reactions and action list
  appear via the new overlay.
- Swipe a message right → confirm reply preview appears (whole
  `MessageItemView` row is the hit area now, not just the bubble).
- Attach an image; confirm upload indicators render.
- Start an audio recording; confirm send behavior matches §3.3 intent.
- Open the image gallery from a message with media.

If anything renders but looks wrong, the theme likely has stale keys — diff
against `contexts/themeContext/utils/theme.ts` (§8) and let TypeScript
highlight every mismatch.
