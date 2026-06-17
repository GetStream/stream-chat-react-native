---
name: rtl
description: Audit and maintain RTL (right-to-left) layout compatibility in stream-chat-react-native. Use when changing styles, positioning, flex layouts, swipe gestures, animated transforms, icons, text alignment, or anything that has a horizontal/directional axis.
---

# RTL Compatibility Audit (stream-chat-react-native)

Use this skill whenever code changes can affect users in RTL locales (Hebrew `he` ships today; Arabic/Persian/Urdu integrators are common). React Native flips some layout properties automatically via `I18nManager.isRTL`, but absolute positioning, hardcoded margins/paddings, transforms, swipe gestures, and SVG icons must be handled by hand.

When the user asks for an "RTL audit" or "RTL review," walk the [Audit checklist](#audit-checklist) against the diff (or the named files), then return findings grouped by severity. When writing new code, apply the [Patterns to follow](#patterns-to-follow) rather than just the anti-patterns at the end.

## Non-negotiable rules

1. **Read direction at runtime.** Use `I18nManager.isRTL` from `react-native`. Never assume LTR. Never assume a value at module load time *only* — `I18nManager.isRTL` is a static snapshot per JS bundle (RN reloads the bundle on direction change), so module-scope reads are fine, but state that depends on it must not be cached across user-driven direction toggles within a single session unless the bundle is reloaded.
2. **Logical properties beat physical ones.** Prefer `start`/`end` variants (`paddingStart`, `marginEnd`, `borderStartWidth`, `insetStart`) over `left`/`right` for spacing and borders. RN auto-flips `start`/`end` based on `I18nManager.isRTL`. The exception is absolute positioning — RN does NOT auto-flip `left`/`right` on absolutely positioned elements; those need an explicit `I18nManager.isRTL` conditional.
3. **flexDirection: 'row' auto-flips.** Default `flexDirection: 'row'` reverses in RTL. Do NOT counter this by manually setting `'row-reverse'` for "alignment fixes" — that double-flips and breaks RTL. Only use `'row-reverse'` when the visual order must be opposite of reading order in both directions.
4. **Text alignment defaults to writing direction.** For `Text`, default `textAlign` is already direction-aware. Set `textAlign: 'left'`/`'right'` ONLY when you need a fixed visual side; otherwise omit it or use `textAlign: 'auto'`. When you need "align to start of reading direction" explicitly, write `textAlign: I18nManager.isRTL ? 'right' : 'left'`.
5. **`writingDirection` on Text that mixes scripts.** When user-generated text could contain RTL characters (messages, channel names, member names, poll options, inputs), set `writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr'` (iOS) so bidi resolution matches the app direction. Or wrap with `WritingDirectionAwareText` from `package/src/components/RTLComponents/`.
6. **Mirror directional icons; don't mirror neutral ones.** Arrows, chevrons, reply, send, thread, search-magnifier, message-bubble must flip in RTL. Symmetric icons (checkmark, bell, settings gear, like-heart, emoji face) must NOT flip. Use SVG `transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 W 0)' : undefined}` where `W` is the SVG width.
7. **Swipe gestures need a direction multiplier.** Any gesture that moves content along the X-axis (swipe-to-reply, swipe-to-delete, paging) must multiply `translationX` by `I18nManager.isRTL ? -1 : 1`. Otherwise swipe-from-right-to-left does the wrong thing in RTL.
8. **Backward-compatible.** RTL fixes should not change LTR behavior. When in doubt, the conditional form `I18nManager.isRTL ? rtl : ltr` is safer than swapping a default.

## Where to put what

- **Foundation primitives & helpers** → `package/src/utils/` (e.g., `rtlMirrorSwitchStyle.ts`) and `package/src/components/RTLComponents/` (e.g., `WritingDirectionAwareText.tsx`).
- **Component-level RTL handling** → in the component itself. Read `I18nManager.isRTL` at the top of the render or in `useStyles()`.
- **Icons** → `package/src/icons/`. Existing pattern: SVG `transform="matrix(-1 0 0 1 <width> 0)"` gated on `I18nManager.isRTL`.
- **Theme** → there are no RTL-specific theme tokens. Don't add new directional values to `theme.ts` (`paddingLeft`, `marginRight`); use `start`/`end` keys instead, or compute in the consumer.
- **Locale files** → `package/src/i18n/he.json` is the only shipped RTL locale. Test RTL by setting `I18nManager.forceRTL(true)` + reload, or by switching the device to Hebrew.
- **Platform divergence (iOS vs Android)** → some platforms (iOS) require a transform mirror for native components like `Switch`. Use `useRtlMirrorSwitchStyle()` rather than inlining.

## Patterns to follow

### 1) Reading direction

```tsx
import { I18nManager } from 'react-native';

const isRTL = I18nManager.isRTL;
```

Keep this at component top, or compute style objects with it inside `useStyles()`. Don't gate behavior on `Platform.OS` and assume direction — RTL works on both iOS and Android.

### 2) Spacing: prefer logical properties

```tsx
// GOOD — auto-flips
{ marginStart: 8, paddingEnd: 12, borderStartWidth: 1 }

// AVOID for spacing — does not flip
{ marginLeft: 8, paddingRight: 12, borderLeftWidth: 1 }
```

When migrating, the rename is direct: `Left` → `Start`, `Right` → `End`. Test once in LTR + once in RTL.

### 3) Absolute positioning: conditional

`left` / `right` on absolutely positioned elements do **not** auto-flip. Either use `insetStart`/`insetEnd` (RN 0.71+) or branch:

```tsx
const positionStyle = I18nManager.isRTL ? { left: 0 } : { right: 0 };
```

Common offenders: scroll-to-bottom button, online-presence dot on avatars, badge counts, overlay anchors, swipe-action content underneath a row.

### 4) Message-bubble alignment

Own messages render on the **end** side, others on the **start**. The `alignment` value (`'left' | 'right'`) refers to *physical* sides for layout decisions, but for *overlays/menus* anchored to the bubble, flip it through:

```tsx
const overlayItemAlignment = I18nManager.isRTL
  ? alignment === 'right' ? 'left' : 'right'
  : alignment;
```

(see `package/src/components/Message/Message.tsx:420-431`)

### 5) Swipe-to-reply / pan gestures

```tsx
const swipeDirectionMultiplier = I18nManager.isRTL ? -1 : 1;

.onChange(({ translationX }) => {
  const swipeDistance = translationX * swipeDirectionMultiplier;
  if (swipeDistance > 0) translateX.value = swipeDistance;
})
```

(see `package/src/components/Message/MessageItemView/MessageBubble.tsx:33-86` and `package/src/components/UIComponents/SwipableWrapper.tsx:67`)

For `SwipableWrapper`, if a `side` prop is not provided, default it from direction:

```tsx
const resolvedSide = side ?? (I18nManager.isRTL ? 'left' : 'right');
const translationDirection = resolvedSide === 'right' ? -1 : 1;
```

### 6) Directional SVG icons

For arrow/chevron/reply/send/thread/search/message-bubble icons:

```tsx
<Svg ...>
  <Path
    transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}
    d="..."
  />
</Svg>
```

The translate component (`20` here) must equal the SVG's `width` so the mirror lands inside the viewBox. Special case for `arrow-left.tsx`: it rotates instead of matrix-mirrors — keep that style consistent with its sibling.

When adding a new icon, ask: does this icon point in a direction (e.g., →) or carry directional meaning (e.g., "next", "reply")? If yes, mirror. If no (checkmark, bell, gear, emoji), don't.

### 7) Text content with mixed scripts

```tsx
<Text style={{ writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' }}>{userInput}</Text>
```

Or:

```tsx
import { WritingDirectionAwareText } from '../../RTLComponents/WritingDirectionAwareText';
<WritingDirectionAwareText>{userInput}</WritingDirectionAwareText>
```

Apply to: message body, channel name, member names, poll options, search inputs, autocomplete tokens. Skip for purely numeric/symbolic content (timestamps, unread counts).

### 8) Native `Switch` mirroring on iOS

```tsx
import { useRtlMirrorSwitchStyle } from '../../utils/rtlMirrorSwitchStyle';

const mirror = useRtlMirrorSwitchStyle();
<Switch style={[styles.switch, mirror]} ... />
```

Returns `{ transform: [{ scaleX: -1 }] }` only when `Platform.OS === 'ios' && I18nManager.isRTL`. iOS `Switch` doesn't natively flip; Android does.

### 9) Inverted `FlatList` and horizontal scroll

`FlatList` `inverted` works correctly in RTL (it flips along the cross axis). Horizontal `FlatList`s auto-reverse content order in RTL — verify visually for emoji-reaction pickers and attachment-preview strips that the start of the list is at the **end** of the row in LTR and at the **start** in RTL.

### 10) `transform: translateX` / `scaleX`

`translateX` is in absolute pixels — positive X is *right* on screen regardless of direction. If your animation moves "toward the end" (e.g., sliding off-screen), multiply by `isRTL ? -1 : 1`. `scaleX: -1` is a mirror; only use it intentionally (the iOS Switch helper above, video direction in `AnimatedGalleryVideo`).

## Anti-patterns to avoid

- **Hardcoded `marginLeft` / `paddingRight` for spacing** — use `marginStart` / `paddingEnd` so RN can flip them. Acceptable only when you genuinely want a *fixed visual side* (rare).
- **Absolute `left: X` or `right: X` without a direction check** — these do NOT flip. Add a conditional.
- **`flexDirection: 'row-reverse'` to "fix" alignment** — you've broken RTL. Use `'row'`, which already flips correctly.
- **`textAlign: 'left'` on user content** — pins text to the left even in RTL. Either omit it, use `'auto'`, or conditionalize on `isRTL`.
- **Setting `writingDirection: 'ltr'` unconditionally** on user-generated text — strips bidi resolution for Arabic/Hebrew content. Branch on `I18nManager.isRTL`.
- **Mirroring symmetric icons** (checkmark, bell, gear, emoji, like-heart) — they look wrong flipped. Mirror only directional icons.
- **Forgetting the swipe-direction multiplier** on new pan gestures — the gesture activates in the wrong direction in RTL.
- **Caching `I18nManager.isRTL` at module load and assuming it never changes** is fine within a session; relying on it to update *mid-session without bundle reload* is not — RN reloads on `forceRTL` change.
- **New directional values in `theme.ts`** (`paddingLeft`, `marginRight`, hardcoded `right: -12`) — push the conditional into the consumer, or use `start`/`end`.
- **Assuming `I18nManager.forceRTL(true)` alone flips the running app** — it persists for the next bundle reload. Tests must mock `I18nManager.isRTL` (see Testing).

## Audit checklist

Walk this checklist against any diff that touches layout, positioning, gestures, transforms, icons, or text. Group findings by severity:

- **HIGH**: visible breakage in RTL (text on wrong side, swipe wrong direction, icon points wrong way, overlay anchored to wrong edge).
- **MEDIUM**: misaligned spacing (margins/paddings on wrong side) — readable but off.
- **LOW**: stylistic (could use logical property but current code is technically correct).

### Layout & positioning

- [ ] No new `marginLeft`/`marginRight`/`paddingLeft`/`paddingRight` for *spacing* — use `marginStart`/`marginEnd`/`paddingStart`/`paddingEnd`.
- [ ] No new `borderLeftWidth`/`borderRightWidth`/`borderLeftColor`/`borderRightColor` etc. — use `borderStartWidth` / `borderEndWidth` / `borderStartColor` / `borderEndColor`.
- [ ] Any new absolute `left:`/`right:` positioning is wrapped in `I18nManager.isRTL ? ... : ...` (or uses `insetStart`/`insetEnd`).
- [ ] No new `flexDirection: 'row-reverse'` introduced as an "RTL fix" (it isn't).
- [ ] Negative offsets (e.g., `right: -12` for an overlapping badge) are conditional on direction.

### Text

- [ ] No new `textAlign: 'left'` or `'right'` on user-generated content; if needed, conditional on `I18nManager.isRTL`.
- [ ] `Text` components rendering user-generated/mixed-script content set `writingDirection` (or use `WritingDirectionAwareText`).
- [ ] Number-only / time / count strings are NOT given `writingDirection` (they're neutral).

### Icons

- [ ] New directional SVG icons (arrows, chevrons, send, reply, thread, message-bubble, search) have `transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 <width> 0)' : undefined}` on the Path.
- [ ] The matrix translate value matches the SVG width.
- [ ] Symmetric/neutral icons (checkmark, bell, gear, like-heart, emoji) are NOT mirrored.

### Gestures & animations

- [ ] New `Gesture.Pan()` handlers that act on `translationX` multiply by `I18nManager.isRTL ? -1 : 1`.
- [ ] Reanimated `useAnimatedStyle` returning `translateX` accounts for direction when "toward the end" is meant.
- [ ] `withSpring`/`withTiming` targets toward an edge are flipped in RTL.
- [ ] New swipe-action wrappers default `side` from `I18nManager.isRTL` if not provided.

### Lists & scroll

- [ ] Horizontal `FlatList`/`ScrollView` content visually starts at the end of the row in LTR (start of row in RTL) — verify or accept default RN flip.
- [ ] `inverted` `FlatList` (e.g., `MessageList`) still renders newest at the bottom in both directions.

### Native components

- [ ] iOS `Switch` uses `useRtlMirrorSwitchStyle()`.
- [ ] `TextInput` `textAlign` is conditional or omitted (RN handles default).

### i18n

- [ ] No hardcoded English/LTR-only punctuation assumptions in concatenated strings — prefer interpolation via `t()` with placeholders.
- [ ] If adding strings, verify `he.json` has the same key (`yarn build-translations` keeps locales in sync).

## Testing requirements per change

Minimum:

- For visible RTL changes, manually verify in the sample app by toggling Hebrew (`he`) or by calling `I18nManager.forceRTL(true)` in `index.js` and reloading.
- For unit tests, mock direction:
  ```ts
  import { I18nManager } from 'react-native';
  jest.spyOn(I18nManager, 'isRTL', 'get').mockReturnValue(true);
  ```
  Restore between tests (`afterEach(() => jest.restoreAllMocks())`).

Recommended for non-trivial changes:

- Render the component twice (LTR + RTL) and snapshot the resulting style props for the directional surfaces.
- For gesture handlers, drive a fake `Gesture.Pan` with both positive and negative `translationX` under each direction and assert which one triggers the action.

## Execution checklist (copy this when making an RTL change)

- [ ] Identified directional axes in the change (spacing, absolute pos, gestures, icons, text)
- [ ] Spacing uses `start`/`end` logical properties
- [ ] Absolute positions are conditional on `I18nManager.isRTL` (or use `insetStart`/`insetEnd`)
- [ ] No `flexDirection: 'row-reverse'` added as a flip fix
- [ ] New gestures multiply `translationX` by direction multiplier
- [ ] New directional SVG icons carry the matrix-mirror transform; symmetric ones do not
- [ ] Text components with user-generated content set `writingDirection`
- [ ] Tested with `I18nManager.isRTL` mocked `true` AND `false`
- [ ] Visually verified in Hebrew locale (or via `forceRTL(true)` + reload) for non-trivial UI
- [ ] `yarn lint` passes
- [ ] `yarn test:typecheck` passes (run after any code change)

## Reference files (in this repo)

- `package/src/components/Message/Message.tsx:420-431` — alignment + overlay-alignment flip pattern.
- `package/src/components/Message/MessageItemView/MessageBubble.tsx:33-86` — swipe-direction multiplier on pan gesture.
- `package/src/components/UIComponents/SwipableWrapper.tsx:67,128` — direction-aware default `side` + translation sign.
- `package/src/contexts/overlayContext/MessageOverlayHostLayer.tsx:169` — `right` vs `left` overlay anchor flip.
- `package/src/components/Message/MessageItemView/MessageReplies.tsx:58` — physical-alignment flip helper.
- `package/src/components/ui/Input/Input.tsx:230` and `package/src/components/AutoCompleteInput/AutoCompleteInput.tsx:207` — direction-aware `textAlign` for inputs.
- `package/src/components/RTLComponents/WritingDirectionAwareText.tsx` — drop-in `Text` with `writingDirection`.
- `package/src/utils/rtlMirrorSwitchStyle.ts` — iOS `Switch` mirror hook.
- `package/src/icons/chevron-right.tsx`, `chevron-left.tsx`, `reply.tsx`, `send.tsx`, `thread.tsx`, `search.tsx`, `message-bubble.tsx` — canonical SVG mirror pattern.
- `package/src/i18n/he.json` — only shipped RTL locale; reference for translation parity.

## Known hazard hotspots

Files most prone to RTL bugs when touched (audit these closely):

- `package/src/components/MessageList/ScrollToBottomButton.tsx` — badge absolute positioning (`right: 0`).
- `package/src/components/ui/Avatar/AvatarGroup.tsx`, `AvatarStack.tsx`, `UserAvatar.tsx` — overlapping/clustered avatar offsets and presence dot.
- `package/src/components/MessageInput/MessageComposer.tsx` — overlay anchors, icon-end positioning.
- `package/src/components/MessageList/MessageList.tsx`, `MessageFlashList.tsx` — sticky headers and overlay anchors.
- `package/src/components/MessageMenu/MessageReactionPicker.tsx`, `MessageActionListItem.tsx` — horizontal reaction strip + icon padding.
- `package/src/components/Reply/Reply.tsx` — quoted-message row layout.
- `package/src/components/AutoCompleteInput/AutoCompleteSuggestionItem.tsx` — leading-icon row.
- `package/src/components/ImageGallery/components/AnimatedGalleryVideo.tsx`, `ImageGallery.tsx` — `scaleX`/`translateX` animations.
- `package/src/components/Attachment/Audio/AudioAttachment.tsx`, `WaveProgressBar.tsx`, `ProgressControl.tsx` — progress-bar fill direction.
- `package/src/contexts/themeContext/utils/theme.ts` — any new directional defaults belong in consumers, not here.
