# Accessibility (a11y) Implementation Plan — `stream-chat-react-native`

> **Note on plan location:** Per project convention, plans live at the repo's `.claude/plans/`. This file was created at the harness-mandated path during plan mode; once approved, copy it into `stream-chat-react-native/.claude/plans/` so it's checked in alongside the code.

> **Aligned with [`stream-chat-react#3146`](https://github.com/GetStream/stream-chat-react/pull/3146)** ("feat(a11y): improve accessibility across dialogs, forms, menus, media, and focus flows" — merged, 194 files, +7057 / −681). This RN plan mirrors React's folder structure, primitive APIs, and i18n approach where the platforms agree, and explicitly flags the places where mobile (iOS/Android) requires different mechanisms (gestures, modal focus, no keyboard navigation, imperative announcer instead of DOM live regions).

---

## Context

The RN SDK has minimal a11y today:

- `accessibilityLabel` is the only a11y prop in meaningful use (~73 occurrences, hardcoded English).
- Zero usage of `accessibilityRole`, `accessibilityState`, `accessibilityHint`, `accessibilityValue`, `accessibilityActions`, `accessibilityLiveRegion`, `accessibilityViewIsModal`, `onAccessibilityAction`.
- ~252 interactive surfaces and ~109 Avatar usages largely without semantic data.
- All overlays/sheets (`BottomSheetModal`, `MessageOverlayWrapper`, `AttachmentPicker`, `MessageReactionPicker`) lack modal focus-trap props.
- Critical gesture-only flows have no screen-reader/keyboard alternative: `MessageMenu` long-press, audio recorder (`Gesture.LongPress` + swipe-to-lock), `ImageGallery` (multi-gesture pan/pinch/double-tap), inline gallery long-press menu.
- Loading/empty/error indicators (`LoadingDots`, `LoadingIndicator`, `EmptyStateIndicator`, `LoadingErrorIndicator`) animate/render without `accessibilityLiveRegion`, so SR users get no signal that state is loading or failed.
- `ProgressControl/{ProgressBar,ProgressThumb,WaveProgressBar}` (used by audio attachment, audio recording preview, image-gallery video, polls) lacks `accessibilityRole="progressbar"` + `accessibilityValue`.
- `AITypingIndicatorView` ("Thinking…" / "Generating…") animates without a polite live region — AI state transitions go unannounced.
- Channel/Thread preview delivery icons (`ChannelMessagePreviewDeliveryStatus`, `ThreadMessagePreviewDeliveryStatus`) ship without labels even though `Message/MessageItemView/MessageStatus` already labels its variant.
- `Reply` / `ReplyMessageView` quoted-message previews are tappable but unlabeled and have no role.

Goal: bring RN to parity with the React SDK's a11y baseline using the same primitive shapes, AND fill in the mobile-only gaps (gesture alternatives, modal a11y props, imperative announcer infra) so the SDK is usable with **VoiceOver (iOS)** and **TalkBack (Android)** out of the box.

---

## Confirmed decisions

1. **Translate `a11y/*` keys into all 12 RN locales** — `de`, `en`, `es`, `fr`, `he`, `hi`, `it`, `ja`, `ko`, `nl`, `pt-br`, `ru`, `tr`. (`he.json` exists in RN but not React — translate that too.) Mirrors the React PR's policy. `validate-translations` enforces no empty values.
2. **Drop the `customAccessibilityLabels` override map.** Integrators override `a11y/*` keys through the existing Streami18n mechanism — no new API surface.
3. **Keep the minimal `<Chat accessibility={...}>` config** — RN-specific because mobile has gesture-only flows (audio hold-to-record, gallery pinch/pan) that web doesn't. Flat config with positive `'auto' | 'always' | 'never'` enums for the gesture-alternative toggles (no nested `componentOverrides`, no negative `disable*` booleans — see "Architecture" below). Documented as an intentional deviation from React.
4. **A11y is OFF by default — integrators opt in via `<Chat accessibility={{ enabled: true }}>`.** Keeps zero-config behavior identical to today's SDK so existing integrators see no change. Once enabled, sensible defaults take over (auto-adapt to SR, announce new messages, etc.). The Phase 5 Reassure benchmark will measure the cost of `enabled: true` so we can confidently flip the default to `true` in a future release.

---

## Mapping React (web) → React Native

| React (web) | React Native |
|---|---|
| `aria-label` | `accessibilityLabel` |
| `aria-labelledby` / `aria-describedby` | (no equivalent — fold into a single composed `accessibilityLabel`) |
| `role="dialog"` + `aria-modal="true"` | `accessibilityViewIsModal={true}` (iOS) + `importantForAccessibility="no-hide-descendants"` on background siblings (Android) |
| `aria-live="polite"` + DOM region | `AccessibilityInfo.announceForAccessibility` (iOS+Android) AND `accessibilityLiveRegion="polite"` on hidden View (Android backup) |
| `tabIndex` + Enter/Space handler | `accessibilityRole="button"` + `onAccessibilityAction` (rotor on iOS, local context menu on Android) |
| `prefers-reduced-motion` (CSS+JS) | `AccessibilityInfo.isReduceMotionEnabled()` + event listener |
| `aria-hidden="true"` | `accessibilityElementsHidden={true}` (iOS) + `importantForAccessibility="no-hide-descendants"` (Android) |
| `aria-selected` / `aria-checked` | `accessibilityState={{ selected, checked, disabled, busy, expanded }}` |
| `focus()` / focus restore | `AccessibilityInfo.setAccessibilityFocus(reactTag)` via `findNodeHandle` |
| `jest-axe` | `@testing-library/react-native` semantic queries (`getByRole`, `getByLabelText`); no axe equivalent for RN |
| `<VisuallyHidden>` | Not needed — RN announcer is imperative, no hidden DOM node required |
| `<SkipNavigation>` | Not applicable — mobile has no Tab key |
| Roving focus (`a11yUtils.ts`) | Not applicable — accessibility tree order is implicit; rely on view hierarchy |

---

## Architecture (mirrors React folder shape)

### `package/src/a11y/` — utilities + low-level hooks

Mirrors `stream-chat-react/src/a11y/`. Smaller in RN because keyboard helpers don't apply.

- `a11yUtils.ts` — `composeAccessibilityLabel(...parts)`, `formatAccessibilityValue({min, max, now})`, `mergeAccessibilityActions(...)`. (No roving-focus helper — N/A on RN.)
- `hooks/useResolvedModalAccessibilityProps.ts` — returns the `{ accessibilityViewIsModal, importantForAccessibility, accessibilityRole }` triple correctly for the active platform; equivalent of React's `useResolvedModalAriaProps`.
- `hooks/useScreenReaderEnabled.ts` — subscribes to `AccessibilityInfo.screenReaderChanged`. RN-specific (web doesn't expose this).
- `hooks/useReducedMotionPreference.ts` — same name as React's hook; subscribes to `AccessibilityInfo.reduceMotionChanged`.
- `__tests__/a11yUtils.test.ts` — parity unit tests.

### `package/src/components/Accessibility/` — runtime announcement infra

Mirrors `stream-chat-react/src/components/Accessibility/`. Same component graph, mobile implementations swap DOM live regions for `AccessibilityInfo.announceForAccessibility`.

- `AccessibilityAnnouncer.tsx` — Provider equivalent of React's `AriaLiveRegion`. Exposes a queue with two priorities (`polite` / `assertive`); flushes through `AccessibilityInfo.announceForAccessibility` on iOS, and through a hidden Android `<View accessibilityLiveRegion="polite|assertive">` (rendered absolutely off-screen) for TalkBack reliability. Uses the same sequence/timeout pattern from `AriaLiveRegion.tsx` so repeat messages still re-announce.
- `useAccessibilityAnnouncer.ts` — `useAccessibilityAnnouncer()` returns `(message, priority?) => void`. Same shape as React's `useAriaLiveAnnouncer`.
- `NotificationAnnouncer.tsx` — same component name and same `buildNotificationAnnouncement` / `notificationFilter` props as React. Source of notifications differs: in RN we wire to `useChannelContext().error` and `useChatContext().connectionState` events (no shared notifications queue exists today; building one is out of scope for this plan, so we adapt the source).
- `hooks/useIncomingMessageAnnouncements.ts` — direct port of React's hook: throttles to 1 announcement / sec, batches: 1 message → "New message from {{user}}", N>1 → "{{count}} new messages". Same params (`channel`, `ownUserId`, `activeThreadId`, `threadList`).
- `hooks/__tests__/useIncomingMessageAnnouncements.test.tsx` — parity tests.
- `__tests__/AccessibilityAnnouncer.test.tsx` — sequence + priority + Android-fallback tests.
- `index.ts` — barrel.

### `<Chat>` integration

Mount `<AccessibilityAnnouncer>` inside the existing provider stack (between `ThemeProvider` and `ChannelsStateProvider`). Mount `<NotificationAnnouncer />` once inside `Channel` so it can subscribe to the active channel's errors. Equivalent to where the React PR mounts `AriaLiveRegion` + `NotificationAnnouncer` in the Chat root.

### Native handler — RN-specific

Web has direct DOM access; RN needs platform abstraction. Extend [package/src/native.ts](package/src/native.ts) the same way `Audio`, `Sound`, etc. are registered:

```ts
type AccessibilityInfoHandlers = {
  isScreenReaderEnabled: () => Promise<boolean>;
  isReduceMotionEnabled: () => Promise<boolean>;
  announceForAccessibility: (message: string) => void;
  setAccessibilityFocus: (reactTag: number) => void;
  addEventListener: (
    eventName: 'screenReaderChanged' | 'reduceMotionChanged',
    handler: (enabled: boolean) => void,
  ) => { remove: () => void };
};
```

Both `native-package/` and `expo-package/` register implementations against React Native's built-in `AccessibilityInfo` (identical on both — no platform divergence inside the handler). Falls back to no-op stubs if not registered, so the SDK degrades gracefully (matching the existing `fail()` pattern in [native.ts](package/src/native.ts)).

### `<Chat accessibility={...}>` — minimal RN-only config (deviation from React)

React did not add a Chat-level config. RN needs one because:
- Some gestures (audio recorder hold-to-record, gallery pinch/pan) have no inherent a11y; integrators may want to opt out of the SDK's automatic alternatives if they ship their own.
- Integrators may need to disable announcement behavior to avoid duplicate announcers when embedding the SDK in a host app that already announces.

Type (flat, positive enums — no nesting, no `disable*` flags):

```ts
/** Tri-state for gesture-alternative toggles. */
export type A11yMode = 'auto' | 'always' | 'never';

export type AccessibilityConfig = {
  /** Master toggle. Default FALSE — integrators must opt in. When false, the SDK behaves exactly as it does today; no a11y attributes are added, no announcer mounts, no listeners attached. */
  enabled?: boolean;

  /** For testing — force "screen reader on" UI even when no SR is active. Default false. */
  forceScreenReaderMode?: boolean;

  /** Announce new messages via the announcer. Default true (when `enabled`). */
  announceNewMessages?: boolean;
  /** Announce typing indicator. Default false (noisy on mobile). */
  announceTypingIndicator?: boolean;
  /** Announce connection state (offline/online). Default true. */
  announceConnectionState?: boolean;

  // RN-specific gesture-alternative toggles. 'auto' = swap UI when SR is on;
  // 'always' = show accessible variant for everyone; 'never' = SDK never swaps
  // (integrator handles it). All default to 'auto'.
  audioRecorderTapMode?: A11yMode;
  imageGalleryScreenReaderMode?: A11yMode;
  messageActionsTrigger?: 'long-press' | 'auto' | 'always-button';
};
```

Naming note: the previous draft had a nested `componentOverrides` field. Dropped — it collided with the existing `WithComponents` override pattern (commit `15dd5e10d`) and the negative `disable*` flags were hard to reason about. If an integrator replaces a component entirely via `WithComponents`, the SDK's a11y code for that component never runs anyway. The flat enums above only matter when the integrator keeps the SDK's component but wants different gesture behavior.

Lives in a small `AccessibilityContext` under `package/src/contexts/accessibilityContext/AccessibilityContext.tsx` following the [`ChatConfigContext` template](package/src/contexts/chatConfigContext/ChatConfigContext.tsx). Default value is `{ enabled: false }` — every other field is ignored unless `enabled` is true. Opt-in is a single flag flip: `<Chat accessibility={{ enabled: true }}>`.

When `enabled: false`, the implementation must short-circuit cleanly:
- No `<AccessibilityAnnouncer>` mount; `useAccessibilityAnnouncer()` returns a noop.
- No `<NotificationAnnouncer />` mount.
- No `useIncomingMessageAnnouncements` subscription on `channel.on('message.new')`.
- No `AccessibilityInfo` event listeners.
- Component-level a11y props (`accessibilityRole`, `accessibilityState`, etc.) still render — these are passed to native views and consulted only by VO/TalkBack when active, so they cost essentially nothing for sighted users. **Exception: `accessibilityLabel` strings composed via `t('a11y/...')`.** Skip the `t()` call when `enabled: false` to avoid 1000 i18next lookups in a busy `MessageList`. A small helper hook `useA11yLabel(key, params)` returns `undefined` when disabled and the translated string when enabled — components pass its return value straight to `accessibilityLabel`.

### i18n — `a11y/*` namespace (matches React)

React used `t('a11y/...')` keys for parity across SDKs. RN adopts the same prefix even though "ARIA" is web-specific — the value is cross-SDK consistency for translators and integrator docs. Add keys to all 12 RN locales: `de.json`, `en.json`, `es.json`, `fr.json`, `hi.json`, `it.json`, `ja.json`, `ko.json`, `nl.json`, `pt-br.json`, `ru.json`, `tr.json`. (`he.json` exists in RN but not React — translate too.) Run `yarn build-translations` to keep the i18next-cli sync intact, then `yarn lint` to pass `validate-translations` (no empty values).

Example shared keys (from React PR — adopt verbatim where the string is platform-neutral):
```
a11y/Avatar of {{name}}
a11y/{{count}} new messages
a11y/New message from {{user}}
a11y/Open message actions
a11y/Send message
a11y/Voice message recording. Hold to record.
a11y/Reaction {{emoji}} by {{count}} users
a11y/Reply to {{user}}
Anonymous   ← shared with React
```

---

## Phased Implementation

### Phase 1 — Foundation _(1 commit)_

Mirrors React PR's "Screen reader foundations" section.

1. Create `package/src/a11y/` (utils + hooks listed above).
2. Create `package/src/components/Accessibility/` with `AccessibilityAnnouncer`, `useAccessibilityAnnouncer`, `NotificationAnnouncer`, `useIncomingMessageAnnouncements`, `index.ts`.
3. Create `package/src/contexts/accessibilityContext/AccessibilityContext.tsx` (provider + `useAccessibilityContext()`), following the [`ChatConfigContext`](package/src/contexts/chatConfigContext/ChatConfigContext.tsx) template.
4. Add `accessibility?: AccessibilityConfig` prop to `ChatProps` in [package/src/components/Chat/Chat.tsx](package/src/components/Chat/Chat.tsx). Mount `<AccessibilityProvider>` and `<AccessibilityAnnouncer>` inside the existing provider stack.
5. Mount `<NotificationAnnouncer />` once inside `Channel` so it can subscribe to per-channel errors.
6. Extend [package/src/native.ts](package/src/native.ts) with `AccessibilityInfo` handlers + `isAccessibilityInfoAvailable()` check (mirror `isAudioRecorderAvailable()` style).
7. Register handlers in `package/native-package/src/handlers/AccessibilityInfoHandler.ts` and `package/expo-package/src/handlers/AccessibilityInfoHandler.ts` — both wrap RN's `AccessibilityInfo`.
8. Add `a11y/*` keys to all 12 locales; run `yarn build-translations`.
9. Update [package/src/contexts/index.ts](package/src/contexts/index.ts) and `package/src/index.ts` to export `AccessibilityContext`, `AccessibilityConfig`, `useAccessibilityAnnouncer`, hooks. (Same exports React added in `src/components/Accessibility/index.ts` and `src/components/index.ts`.)
10. Add unit tests with parity to React's: `AriaLiveRegion.test.tsx` → `AccessibilityAnnouncer.test.tsx`, `useIncomingMessageAnnouncements.test.tsx` → port verbatim.

**Done when:** integrators can consume `useAccessibilityAnnouncer()` and `useScreenReaderEnabled()`, and incoming-message announcements fire on real devices.

### Phase 2 — Base UI primitives _(1 commit)_

Mirrors React PR's `Avatar`, `BaseImage`, `Button/PlayButton`, `Form/{TextInput,SwitchField,Dropdown,NumericInput}`, `Icons/BaseIcon`, `Dialog/{Alert,Prompt,Viewer,Callout,ContextMenu,DialogPortal,DialogAnchor}`.

> **Note on folder split:** primitives live in BOTH `package/src/components/ui/` (low-level: Avatar, Badge, Button, Input, GiphyChip, SpeedSettingsButton, VideoPlayIndicator) AND `package/src/components/UIComponents/` (composite: BottomSheetModal, ImageBackground, PortalWhileClosingView, SwipableWrapper, Spinner, SafeAreaViewWrapper). Touch both during this phase.

1. **Avatar** — `package/src/components/Avatar/Avatar.tsx`, `UserAvatar.tsx`, `ChannelAvatar.tsx`, `AvatarStack.tsx`, plus the lower-level `package/src/components/ui/Avatar/`. Add `accessibilityRole="image"`, `accessibilityLabel={t('a11y/Avatar of {{name}}', {name})}`. Allow integrators to override the label via prop. (React's `Avatar.tsx` made the same change; mirror.)
2. **Button / IconButton** (`package/src/components/ui/Button.tsx`, plus icon-button equivalents): `accessibilityRole="button"`, propagate `accessibilityLabel`/`accessibilityHint`/`accessibilityState={{disabled, busy}}` to `Pressable`. Hit-slop expanded to 44×44 (Apple HIG) when smaller. Mirror React's `BaseIcon.tsx` change to mark decorative SVGs with `accessibilityElementsHidden`.
3. **Input** (`package/src/components/ui/Input.tsx`): wire `accessibilityLabel`, `accessibilityHint`, `accessibilityState={{ disabled, selected }}`. Validation/error state uses the announcer (RN's substitute for `aria-describedby`). Same shape as React's `TextInput.tsx` and `NumericInput.tsx`.
4. **Switch** (already a native control on RN — verify it surfaces label/state): mirror React's `SwitchField.tsx` semantics (`accessibilityRole="switch"`, `accessibilityState={{ checked }}`).
5. **Dropdown / autocomplete picker** equivalents — `package/src/components/AutoCompleteInput/`: `accessibilityRole="list"` on container, items get role + `accessibilityState={{ selected }}`. Same intent as React's `Dropdown.tsx` + roving focus, minus the keyboard nav.
6. **Modal / overlay primitives** — `package/src/components/UIComponents/BottomSheetModal.tsx`, `BottomSheetCompatibility/{BottomSheet,BottomSheetFlatList,BottomSheetTouchableOpacity}.tsx`, `StreamBottomSheetModalFlatList.tsx`. Use `useResolvedModalAccessibilityProps` to apply `accessibilityViewIsModal` + `importantForAccessibility`. Set initial focus to the modal title via `setAccessibilityFocus`. Restore focus to invoking trigger on close. Account for the dynamic snap-points behavior added in `7a7f927ae` — re-issue `setAccessibilityFocus` after resize so VO/TalkBack keeps focus inside the sheet. Equivalent of React's `Alert`/`Prompt`/`Viewer`/`DialogPortal` work.
7. **Indicators** — `package/src/components/Indicators/{LoadingDots,LoadingDot,LoadingIndicator,LoadingErrorIndicator,EmptyStateIndicator}.tsx`. `LoadingDots`/`LoadingIndicator`: wrap in a hidden View with `accessibilityLiveRegion="polite"` (Android) and announce `t('a11y/Loading…')` once via `useAccessibilityAnnouncer` on mount; suppress repeats. `EmptyStateIndicator`/`LoadingErrorIndicator`: static `accessibilityLabel` + `accessibilityRole="text"` (or `"alert"` for error variant). Hide the visual dots/spinner from AT (`accessibilityElementsHidden={true}`) so the announcement isn't duplicated.
8. **ProgressControl** — `package/src/components/ProgressControl/{ProgressBar,ProgressControl,ProgressThumb,WaveProgressBar,StableDurationLabel}.tsx`. Add `accessibilityRole="progressbar"` + `accessibilityValue={{ min, max, now, text }}`. When the consumer is interactive (audio scrub, gallery video, poll-result reveal), expose `accessibilityActions: [{name:'increment'}, {name:'decrement'}]` so rotor users can seek. `ProgressThumb` becomes `accessibilityRole="adjustable"` when draggable. Single shared component covers AudioAttachment, AudioRecordingPreview, ImageGalleryVideoControl, and PollOption — fix once, propagate everywhere.

**Done when:** every Avatar, Button, Input, IconButton, modal, dropdown, indicator, and progress control in the SDK has correct semantics and modal focus-trapping works on both platforms.

### Phase 3 — Critical-path components _(2 commits)_

#### 3a. Message + MessageMenu + Reactions

Mirrors React PR's `Message/MessageUI.tsx`, `Message/MessageText.tsx`, `MessageActions/*`, `Reactions/{MessageReactions,ReactionSelector,MessageReactionsDetail}`.

- **`package/src/components/Message/Message.tsx`** — container `accessibilityRole="article"`. Composed `accessibilityLabel` mirroring React's pattern (sender + timestamp + text + reactions summary, capped at top-3 reactions). Long-press → `accessibilityActions` exposed to the rotor (iOS) and Android local context menu: `[{ name:'activate', label:t('a11y/Open message actions') }, { name:'react' }, { name:'reply' }, { name:'copy' }]`. Visibility of the alternative "More actions" button is driven by `accessibility.messageActionsTrigger`: `'long-press'` → hidden; `'auto'` (default) → shown when SR is on; `'always-button'` → shown for everyone.
- **`package/src/components/MessageMenu/MessageActionList.tsx`** — wrapper `accessibilityRole="menu"`, items `accessibilityRole="menuitem"`. Same as React's `MessageActions.defaults.tsx`.
- **`package/src/components/MessageMenu/MessageReactionPicker.tsx`** — `accessibilityRole="grid"` on emoji list, each emoji `accessibilityLabel` + `accessibilityState={{ selected }}`. Same shape as React's `ReactionSelector.tsx`.
- **`package/src/components/Reaction/ReactionList*.tsx`** — pills get `accessibilityRole="button"`, `accessibilityLabel={t('a11y/Reaction {{emoji}} by {{count}} users', ...)}`, `accessibilityState={{ selected: isOwnReaction }}`. Same as React's `MessageReactions.tsx`.
- **`package/src/components/Message/MessageOverlayWrapper.tsx`** — `useResolvedModalAccessibilityProps`, focus management on open.
- **`package/src/components/Reply/{Reply,ReplyMessageView}.tsx`** — quoted-message preview. `accessibilityRole="button"` when tappable (jump-to-original), composed `accessibilityLabel` of form `t('a11y/Reply to {{user}}: {{preview}}')`. The preview's inner avatar/text re-uses the labels from Phase 2.
- **`package/src/components/Message/MessageItemView/MessageStatus.tsx`** — already has labels for `Read`/`Delivered`/`Sending`/`Sent`. Migrate the strings to `a11y/*` keys for parity.

#### 3b. MessageList + MessageInput + AudioRecorder

Mirrors React PR's `MessageList/{MessageList,VirtualizedMessageList,UnreadMessagesNotification,ScrollToLatestMessageButton}`, `MessageComposer/*`, `MediaRecorder/AudioRecorder/*`.

- **`package/src/components/MessageList/MessageList.tsx`** / `MessageFlashList.tsx` — wrap announcement of new messages through `useIncomingMessageAnnouncements({ channel, ownUserId })`. Direct port of React's hook usage. Gated on `accessibility.announceNewMessages`.
- **`package/src/components/MessageList/InlineUnreadIndicator.tsx`** / `ScrollToBottomButton.tsx` — labels via `t()`. Same as React's `UnreadMessagesNotification.tsx` / `ScrollToLatestMessageButton.tsx`.
- **`package/src/components/MessageList/TypingIndicator.tsx`** — when `announceTypingIndicator` is true, debounced announcement of "X is typing". (React enabled by default; RN defaults to false because TalkBack/VoiceOver chatter on mobile is more disruptive.)
- **`package/src/components/MessageInput/MessageComposer.tsx`** — TextInput labels + hint, send/attach/audio buttons labeled. Validation routes through announcer with priority `assertive`.
- **`package/src/components/MessageInput/AudioRecorder/AudioRecordingButton.tsx`** — RN-specific (no React analog because web doesn't have hold-to-record). Behavior driven by `accessibility.audioRecorderTapMode`: `'auto'` (default) → swap to tap-toggle when `useScreenReaderEnabled()` is true; `'always'` → tap-toggle for everyone; `'never'` → keep `Gesture.LongPress` always. In tap mode: tap → start, tap → stop, tap → send. Lock-by-swipe replaced with explicit "Lock recording" button. Each state announces through the announcer ("Recording, {duration}", "Recording locked", "Send recording", "Cancel recording").

### Phase 4 — Secondary components _(2 commits)_

#### 4a. Channels & threads

Mirrors React PR's `ChannelListItem/{ChannelListItemUI,ChannelListItemActionButtons*}`, `Threads/ThreadList/*`, `TypingIndicator/*`.

- **`package/src/components/ChannelList/ChannelList.tsx`** + `ChannelPreview/ChannelPreviewView.tsx` — items `accessibilityRole="button"`, composed label. Swipe actions get `accessibilityActions`.
- **`package/src/components/ChannelPreview/ChannelMessagePreviewDeliveryStatus.tsx`** + `package/src/components/ThreadList/ThreadMessagePreviewDeliveryStatus.tsx` — port the labeled-icon pattern from `MessageItemView/MessageStatus.tsx` so preview rows announce delivery state to SR users.
- **`package/src/components/Thread/Thread.tsx`** + `ThreadList/ThreadList.tsx` — reply count → `t('a11y/{{count}} reply', { count })`. Unread banner uses the announcer.
- **`package/src/components/Channel/Channel.tsx`** — connection state changes (offline → online) routed through `<NotificationAnnouncer>`. `useIncomingMessageAnnouncements` lifts here.
- **`package/src/components/AITypingIndicatorView/AITypingIndicatorView.tsx`** — wrap in `accessibilityLiveRegion="polite"`. On state transitions (`Thinking…` → `Generating…` → idle), call `useAccessibilityAnnouncer().announce(t('a11y/AI is {{state}}', {state}))` with debounce so transitions don't spam VO/TalkBack. Hide the animated dots from AT (`accessibilityElementsHidden`) so the announcement is the only signal.

#### 4b. Media, attachments, polls, autocomplete

Mirrors React PR's `Attachment/*`, `AudioPlayback/*`, `Gallery/*`, `Poll/*`, `Search/*`, `MessageComposer/AttachmentSelector/*`, `TextareaComposer/SuggestionList/*`.

- **`package/src/components/Attachment/ImageGallery/ImageGallery.tsx`** + `useImageGalleryGestures.tsx` — RN-specific (web has no equivalent). Behavior driven by `accessibility.imageGalleryScreenReaderMode`: `'auto'` (default) → swap when SR is on; `'always'` → swap for everyone; `'never'` → never swap. In swap mode: hide the gesture surface (`accessibilityElementsHidden={true}`) and render a tap-driven control set (Previous, Next, Zoom in, Zoom out, Close). Pinch/pan/double-tap kept for sighted users; `accessibilityActions` (Zoom, Reset) exposed for rotor users regardless of mode.
- **`package/src/components/Attachment/Gallery.tsx`** — inline thumbnails: button role + label. Long-press menu trigger gets a visible "More" button when SR is on.
- **`package/src/components/Attachment/AudioAttachment.tsx`** — match React's `ProgressBar.tsx` + `progressBarA11y.ts`: `accessibilityValue={{ min:0, max:duration, now:currentTime, text:"{currentTime} of {duration}" }}` on the seek bar, `accessibilityActions: [{ name:'increment' }, { name:'decrement' }]` for rotor seek. Play/pause `accessibilityState={{ selected: isPlaying }}`.
- **`package/src/components/AttachmentPicker/AttachmentPicker.tsx`** — `useResolvedModalAccessibilityProps`. Selectable photos rendered as a grid with `accessibilityRole="image"` items + `accessibilityState={{ selected }}`. Mirrors React's `AttachmentSelector.tsx`.
- **`package/src/components/Poll/Poll.tsx`** + `PollOption.tsx` + `PollResults.tsx` — single-select: `accessibilityRole="radio"`. Multi-select: `"checkbox"`. `accessibilityState={{ selected, checked }}`. Result animations announce winners via announcer when poll closes. Mirrors React's `PollOptionSelector.tsx` + `PollResults/*`.
- **`package/src/components/AutoCompleteInput`** — suggestion list `accessibilityRole="list"`; items `accessibilityRole="button"`. TextInput exposes `accessibilityHint` describing trigger characters (`@`, `/`). Mirrors React's `SuggestionList.tsx`.

### Phase 5 — Testing, lint, docs, AI maintenance skill _(1 commit)_

Mirrors React PR's testing additions, AI skill (`.cursor/skills/accessibility/SKILL.md`), reduced-motion CSS, and example-app skip nav (the last is N/A on mobile).

1. **Test patterns** — add helpers under `package/src/mock-builders/accessibility/` — `expectAccessibleButton(node, {label, role, state})`, `mockScreenReaderEnabled(boolean)`. Add a11y assertions to existing test suites for Message, MessageList, ChannelPreview, BottomSheetModal as exemplars (parity with React's targeted suites). Full coverage tracked as follow-up.
2. **Lint rules** — extend [package/eslint.config.mjs](package/eslint.config.mjs) with `eslint-plugin-react-native-a11y`: warn level for missing labels on `Pressable`/`TouchableOpacity`, error level for icon-only buttons. Set `--max-warnings 0` so it must pass before merge.
3. **Integration smoke test** — under `examples/SampleApp/`, boot Chat with `accessibility={{ enabled: true, forceScreenReaderMode: true }}` and verify AudioRecorder, ImageGallery, and Message render their accessible variants.
4. **Reassure perf benchmark** — add a Reassure (`reassure` npm package) test that renders a 1000-row `MessageList` twice: once with `accessibility={{ enabled: false }}` (today's behavior), once with `accessibility={{ enabled: true }}`. Assert: render time delta <5%, re-render delta <2%. Numbers feed the future "flip default to `true`" decision.
5. **AI maintenance skill** — `.claude/skills/accessibility/SKILL.md` (RN-equivalent of React's [`.cursor/skills/accessibility/SKILL.md`](https://github.com/GetStream/stream-chat-react/blob/master/.cursor/skills/accessibility/SKILL.md)). Same structure, RN tool names: native semantics first (`Pressable`, `TextInput`, `Switch`, `Image`); use `accessibilityRole` only when native semantics can't represent the widget; never hardcode English (use `t('a11y/...')`); decorative visuals get `accessibilityElementsHidden`; modals use `useResolvedModalAccessibilityProps`; live updates use `useAccessibilityAnnouncer`; tests use `@testing-library/react-native` semantic queries. Keep React's "Common mistakes to avoid" section, RN-adapted.
6. **Documentation** — add `package/ai-docs/accessibility.md` (rename block uses **bullets, not tables** per repo convention). Cover: `accessibility` prop schema (with the **opt-in** call-out front and center), all `a11y/*` i18n keys with default English, integrator override path via Streami18n, the `A11yMode` enum (`auto`/`always`/`never`) for gesture toggles, platform-specific notes (TalkBack vs VoiceOver behaviors, Android `accessibilityLiveRegion`, iOS `setAccessibilityFocus` timing), and the Reassure benchmark numbers so integrators can predict the cost of `enabled: true`.

---

## Critical Files

### New files (mirroring React structure)
- `package/src/a11y/a11yUtils.ts`
- `package/src/a11y/__tests__/a11yUtils.test.ts`
- `package/src/a11y/hooks/useResolvedModalAccessibilityProps.ts`
- `package/src/a11y/hooks/useScreenReaderEnabled.ts`
- `package/src/a11y/hooks/useReducedMotionPreference.ts`
- `package/src/components/Accessibility/AccessibilityAnnouncer.tsx`
- `package/src/components/Accessibility/useAccessibilityAnnouncer.ts`
- `package/src/components/Accessibility/NotificationAnnouncer.tsx`
- `package/src/components/Accessibility/hooks/useIncomingMessageAnnouncements.ts`
- `package/src/components/Accessibility/hooks/__tests__/useIncomingMessageAnnouncements.test.tsx`
- `package/src/components/Accessibility/__tests__/AccessibilityAnnouncer.test.tsx`
- `package/src/components/Accessibility/__tests__/NotificationAnnouncer.test.tsx`
- `package/src/components/Accessibility/index.ts`
- `package/src/contexts/accessibilityContext/AccessibilityContext.tsx`
- `package/src/contexts/accessibilityContext/index.ts`
- `package/src/a11y/hooks/useAnnounceOnStateChange.ts` — small helper used by `AITypingIndicatorView` and `Indicators` to debounce + de-duplicate live-region announcements
- `package/src/a11y/hooks/useA11yLabel.ts` — returns `t('a11y/...')` when the context is `enabled: true`, or `undefined` when disabled. Components pass its return value straight to `accessibilityLabel` so the i18n lookup is skipped on hot list paths in the disabled-default state.
- `package/src/__tests__/perf/AccessibilityCost.reassure.ts` — Reassure benchmark for `MessageList` with a11y on vs. off
- `package/native-package/src/handlers/AccessibilityInfoHandler.ts`
- `package/expo-package/src/handlers/AccessibilityInfoHandler.ts`
- `package/src/mock-builders/accessibility/index.ts`
- `package/ai-docs/accessibility.md`
- `.claude/skills/accessibility/SKILL.md`

### Modified files
- [package/src/components/Chat/Chat.tsx](package/src/components/Chat/Chat.tsx) — add `accessibility` prop, mount `<AccessibilityProvider>` + `<AccessibilityAnnouncer>`
- [package/src/components/Channel/Channel.tsx](package/src/components/Channel/Channel.tsx) — mount `<NotificationAnnouncer />`, lift `useIncomingMessageAnnouncements`
- [package/src/native.ts](package/src/native.ts) — register `AccessibilityInfo` handler type, add `isAccessibilityInfoAvailable()`
- [package/src/index.ts](package/src/index.ts) — public exports
- [package/src/contexts/index.ts](package/src/contexts/index.ts) — context export
- All 12 locale JSONs in [package/src/i18n/](package/src/i18n/) — `a11y/*` keys
- [package/eslint.config.mjs](package/eslint.config.mjs) — a11y lint rules
- ~50 component files listed in Phases 2–4 (AITypingIndicatorView, Indicators/*, ProgressControl/*, Reply/*, ChannelPreview/ChannelMessagePreviewDeliveryStatus, ThreadList/ThreadMessagePreviewDeliveryStatus, the `ui/` primitives, and the `BottomSheetCompatibility/*` wrappers added by the post-survey audit)

### Reused (template) files
- [package/src/contexts/chatConfigContext/ChatConfigContext.tsx](package/src/contexts/chatConfigContext/ChatConfigContext.tsx) — context boilerplate template
- [package/src/contexts/translationContext/TranslationContext.tsx](package/src/contexts/translationContext/TranslationContext.tsx) — `t()` access pattern
- `useTranslationContext()`, `useStreami18n` — for resolving and overriding `a11y/*` keys
- `registerNativeHandlers` in [package/src/native.ts](package/src/native.ts) — extension pattern for new handler

### Reference files in stream-chat-react (port verbatim)
- [`src/components/Accessibility/AriaLiveRegion.tsx`](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Accessibility/AriaLiveRegion.tsx) → `AccessibilityAnnouncer.tsx`
- [`src/components/Accessibility/useAriaLiveAnnouncer.ts`](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Accessibility/useAriaLiveAnnouncer.ts) → `useAccessibilityAnnouncer.ts`
- [`src/components/Accessibility/NotificationAnnouncer.tsx`](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Accessibility/NotificationAnnouncer.tsx) → `NotificationAnnouncer.tsx` (notification source adapted)
- [`src/components/Accessibility/hooks/useIncomingMessageAnnouncements.ts`](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Accessibility/hooks/useIncomingMessageAnnouncements.ts) → ported verbatim
- [`.cursor/skills/accessibility/SKILL.md`](https://github.com/GetStream/stream-chat-react/blob/master/.cursor/skills/accessibility/SKILL.md) → `.claude/skills/accessibility/SKILL.md` with RN substitutions

---

## Verification

The plan ships as a single PR composed of **7 conventional commits** (one per phase, with Phase 3 and Phase 4 split in two). Each commit is independently reviewable and individually verifiable; the whole PR is the unit of merge. Suggested commit messages:

- `feat(a11y): add opt-in accessibility announcer, context, and native handler` (Phase 1)
- `feat(a11y): add accessibility props to base UI primitives` (Phase 2)
- `feat(a11y): add accessible message actions and reactions` (Phase 3a)
- `feat(a11y): add accessible message list, composer, and audio recorder` (Phase 3b)
- `feat(a11y): add accessibility to channel list and threads` (Phase 4a)
- `feat(a11y): add accessibility to media, polls, and autocomplete` (Phase 4b)
- `chore(a11y): add lint rules, perf benchmark, docs, and maintenance skill` (Phase 5)

End-to-end checks (run before merge, plus per-commit smoke checks during development):

1. **Unit tests** — `cd package && yarn test:unit`. New hooks/components covered with parity to React's tests; `mockScreenReaderEnabled` helper validated.
2. **Lint** — `cd package && yarn lint` passes with `--max-warnings 0` plus new a11y rules.
3. **Type-check / build** — `cd package && yarn build`. Exported types (`AccessibilityConfig`, `AriaLivePriority`, etc.) compile cleanly.
4. **Translation validation** — `yarn lint` runs `validate-translations` — no empty `a11y/*` keys in any of 12 locales.
5. **Manual SampleApp on real devices** for **both platforms**:
   - **iOS** (Settings → Accessibility → VoiceOver):
     - Send/receive message — announced via `useIncomingMessageAnnouncements`.
     - Long-press alternative → Message actions menu opens, navigable, selectable.
     - Audio recorder → tap-to-record mode active, all states announced.
     - Image gallery → tap-driven controls, swipe-by-rotor works.
     - Modals (`BottomSheetModal`, `AttachmentPicker`) → focus trapped (`accessibilityViewIsModal`), dismissable via VO escape gesture.
   - **Android** (Settings → Accessibility → TalkBack):
     - Same flows; verify `accessibilityLiveRegion` triggers on new messages.
     - Verify `accessibilityActions` surface in TalkBack's local context menu.
6. **Reduced motion** — enable in OS settings; verify TypingIndicator dots, AudioRecorder waveform, ImageGallery transitions reduce or disable animation via `useReducedMotionPreference`.
7. **No-regression for sighted users** — confirm visual UI is unchanged when SR is off (no new buttons appear, no animation changes outside reduced-motion).
8. **Cross-SDK API parity check** — verify `useAccessibilityAnnouncer().announce('hi')` and the React `useAriaLiveAnnouncer()('hi')` have identical call shape; same for `useIncomingMessageAnnouncements` params.
9. **RTL smoke** — switch device language to Hebrew or Arabic (RN's `I18nManager.isRTL` becomes true; `RTLComponents/WritingDirectionAwareText` flips). Verify VO/TalkBack reads composed `a11y/*` strings with parameters (`{{name}}`, `{{count}}`, `{{user}}`) in the correct logical order — interpolation values must not appear visually-flipped inside a labeled control.
10. **KeyboardCompatibleView focus** — open the composer with VO/TalkBack on, send a message, verify focus does NOT escape to a stale element when `KeyboardCompatibleView`/`KeyboardControllerAvoidingView` re-lays out. If it does, defer `setAccessibilityFocus` calls behind `requestAnimationFrame` (Android) / `InteractionManager.runAfterInteractions` (iOS).
11. **Component overrides inherit a11y props** — confirm that the recently introduced `WithComponents` provider (`15dd5e10d`) threads a11y props correctly when integrators replace `Message`/`MessageList`/etc.; add a regression test that renders the SDK with a custom `Message` override and asserts the rendered tree still carries `accessibilityRole="article"` + `accessibilityLabel`.

---

## Out of scope (explicit non-goals)

- **Skip navigation links** — applicable only to web (no Tab key on mobile).
- **Roving focus utilities** — applicable only to web (`a11yUtils.ts` keyboard helpers).
- **`<VisuallyHidden>` component** — RN announcer is imperative; no hidden DOM node needed.
- **Keyboard navigation patterns** (arrow keys, Enter/Space) — not applicable on mobile devices; rotor and `accessibilityActions` cover the equivalent UX.
- **`jest-axe` parity** — no equivalent for RN; semantic queries via `@testing-library/react-native` are the closest substitute.
- **Building a unified Notifications queue in RN** — React has `useNotifications`; RN does not. `NotificationAnnouncer` adapts to existing `useChatContext` errors and `useChannelContext` errors. A full notification queue is a separate plan.
- **Web a11y semantics** — `stream-chat-react-native` runs on RN-Web but the scope is iOS + Android; web is best-effort.
- **Dynamic Type / font scaling beyond RN's defaults** — separate plan if integrators request.
- **Auditing every existing test for a11y queries** — only exemplar suites updated in Phase 5.
