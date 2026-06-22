---
name: accessibility
description: Maintain VoiceOver/TalkBack-focused accessibility in stream-chat-react-native. Use when changing interactive components, gestures, modals, lists, media controls, notifications, focus behavior, or live announcements.
---

# Accessibility Maintenance (stream-chat-react-native)

Use this skill whenever code changes can affect screen-reader users (VoiceOver on iOS, TalkBack on Android), gesture-driven flows, focus behavior, motion preferences, or semantic React Native accessibility props.

## Non-negotiable rules

1. **Native semantics first.** Use `Pressable`, `TextInput`, `Switch`, `Image` directly. Use `accessibilityRole` only when native semantics cannot represent the widget (`menu`, `menuitem`, `progressbar`, `radio`, `checkbox`, `article`, `alert`, `tablist`, `tab`). **Platform caveat:** `'menu'` and `'menuitem'` are honored by iOS VoiceOver but Android TalkBack silently ignores them (no `UIAccessibilityTraits` equivalent). For interactive items that must be announceable on both platforms, use `'button'` on the leaf `Pressable`; the `'menu'` role can stay on the container as an iOS hint. iOS-supported roles that survive to VoiceOver: `button`, `link`, `search`, `image`, `keyboardkey`, `text`, `adjustable`, `imagebutton`, `header`, `summary`, `none`.
2. **Never hardcode English** in `accessibilityLabel`/`accessibilityHint`/announcement strings. For SDK `Button`, pass `accessibilityLabelKey='a11y/...'` (and `accessibilityLabelParams` when needed). For non-Button components, use `useA11yLabel('a11y/...', params)` or `t('a11y/...')` directly when you don't need the disabled-state short-circuit. Add the key to all 13 locale files in `package/src/i18n/` (`ar, en, es, fr, he, hi, it, ja, ko, nl, pt-br, ru, tr`). You can omit a11y keys if a button contains a text label that describes what it does.
3. **Gate behavior on `useAccessibilityContext().enabled`.** A11y is opt-in. New listeners, subscriptions, and announcer mounts must be no-ops when `enabled` is false. New `accessibilityRole`/`accessibilityState` props are fine to render unconditionally — they cost ~zero.
4. **One focusable target per action.** Don't nest `Pressable` inside `Pressable`. Mark inner decorative views with `accessibilityElementsHidden` (iOS) + `importantForAccessibility='no-hide-descendants'` (Android) so the parent carries the label.
5. **Decorative visuals stay hidden from AT.** Icon-only buttons must carry an `accessibilityLabel` on the wrapper, and the SVG icon should be hidden.
6. **Backward-compatible.** All new props are optional. Component override pattern (`WithComponents`) must continue to work.
7. **Floating overlays need a tall parent for Android a11y.** Android's accessibility framework uses each view's measured layout bounds (`getBoundsInScreen()`) to decide what's focusable at a given screen coordinate. Children rendered *outside* their parent's measured rect get pruned / reported with inverted (empty) bounds — RN doesn't clip them by default so the visual looks fine, but TalkBack can't focus them and `uiautomator dump` shows degenerate `[x,y][x,y]` rects. **Implication:** when mounting a floating overlay (autocomplete picker, popover, tooltip), pick a parent whose measured bounds contain the rendered area. A `flex: 1` Channel-area parent works; a `position: absolute` wrapper inside a small input-row container does not. This is why `AutoCompleteSuggestionList` is mounted from `MessageList` / `MessageFlashList` (full-screen flex parent) instead of `MessageComposer` (~228px composer parent — the suggestion list overflowed it and was a11y-invisible). Verify with `adb shell uiautomator dump` after mounting; if rows show `top > bottom`, the parent isn't tall enough.

## Diagnosing Android a11y with `uiautomator dump`

When TalkBack ignores a view, can't focus a row, or seems to focus the wrong thing, dump the a11y tree and read the bounds directly. This was the load-bearing technique behind rule #7.

**Procedure:**

```bash
# 1. Put the app in the state you want to inspect (open the suggestion list, modal, etc.)
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml ./window_dump.xml

# 2. Find your view. Grep by a known accessibilityLabel, text, or resource-id.
grep -A2 'text="@channel"' window_dump.xml
grep -B1 -A1 'content-desc="Mention suggestions available"' window_dump.xml
```

**Reading the output:** each `<node>` has `bounds="[left,top][right,bottom]"` in screen pixels.

| Symptom in `bounds` | Meaning |
|---|---|
| `[0,0][0,0]` | View never measured (mid-mount or detached from a11y tree). |
| `top > bottom` or `left > right` | Clipped by parent — `getBoundsInScreen()` clamped to a smaller ancestor. TalkBack treats this as empty. **Move the mount to a taller parent.** |
| Bounds outside the screen | Off-screen or pushed by keyboard; TalkBack won't focus it. |
| Bounds present, `clickable="true"`, `focusable="true"`, but still unreachable | Check `importantForAccessibility` chain and sibling z-order — something opaque may be above it. |

**Other useful node attributes:**
- `class` — the underlying Android View class (`android.widget.HorizontalScrollView`, etc.). Useful when an RN component compiles to something unexpected.
- `package` — confirms you're looking at *your* app, not the system UI.
- `clickable`, `focusable`, `enabled` — these must all be true for a row to take TalkBack focus.
- `content-desc` — what TalkBack will speak. If empty when you expected an `accessibilityLabel`, the prop didn't bind to the right native view.

**Caveats:**
- The dump is a single snapshot. If the view animates in, dump after the animation settles.
- TalkBack can affect what gets dumped on some devices — turn it off when diagnosing layout, on when diagnosing focus order.
- The XML reflects native bounds *after* RN's layout pass, so a wrong dump usually means RN gave Android wrong layout, not that the dump lied.

## Where to put what

- **Foundation primitives** → `package/src/a11y/` (utilities + low-level hooks).
- **Runtime announcer infra** → `package/src/components/Accessibility/` (`NotificationAnnouncer`, `useAccessibilityAnnouncer`, `useIncomingMessageAnnouncements`).
- **Config + provider** → `package/src/contexts/accessibilityContext/`, mounted by `OverlayProvider`.
- **i18n** → `a11y/*` keys in all 13 locale JSONs (`ar, en, es, fr, he, hi, it, ja, ko, nl, pt-br, ru, tr`).
- **Component-level a11y attributes** → in the component itself.
- **Platform divergence (iOS vs Android)** → use `Platform.OS` or `useResolvedModalAccessibilityProps`. Don't duplicate the file — RN doesn't need `.ios.tsx`/`.android.tsx` splits for a11y.
- **Tests** → nearest `__tests__/` folder; use `@testing-library/react-native` semantic queries (`getByRole`, `getByLabelText`).

## Patterns to follow

### 1) Composing accessible names

```tsx
import { Button, useA11yLabel } from 'stream-chat-react-native';

const labelParams = useMemo(() => ({ count, emoji }), [count, emoji]);
const label = useA11yLabel('a11y/Reaction {{emoji}} by {{count}} users', labelParams);
<Pressable accessibilityLabel={label} accessibilityRole='button' accessibilityState={{ selected }} />

<Button accessibilityLabelKey='a11y/Send message' iconOnly {...buttonProps} />
```

`useA11yLabel` returns `undefined` when `accessibility.enabled` is false, so the `t()` call is skipped on hot list paths.
`Button` centralizes this same behavior for SDK-owned buttons. In SDK code, pass the key/params only. When migrating a released button that already had an `accessibilityLabel`, make the new translation resolve to the same existing label unless the change is intentionally breaking.

For composite labels (sender + timestamp + body + reactions summary), use `composeAccessibilityLabel(...parts)` from `package/src/a11y/a11yUtils.ts` — it filters out empty/null parts and joins with `, ` so screen readers add a brief pause.

### 2) Live-region announcements

Two complementary mechanisms:

- **Imperative**: `useAccessibilityAnnouncer()` returns `(message, priority?) => void`. Same shape as `stream-chat-react`'s `useAriaLiveAnnouncer`. Wraps `AccessibilityInfo.announceForAccessibility` with sequence/debounce so repeat announcements still re-announce.
- **Declarative**: `accessibilityLiveRegion="polite"` (Android only) on a View that re-renders when its label changes.

Use `useAnnounceOnStateChange(message, { debounceMs, priority })` for transitions (AI typing, indicators) — it dedups consecutive same-message calls and applies a default 250ms debounce.

Use `useAnnounceOnShow(visible, message, { delayMs, priority })` for **transient surfaces that appear and disappear repeatedly** (modals, sheets, autocomplete pickers). It announces on each `visible: false → true` transition and resets on hide, so the next show re-announces. The two announcer hooks are not interchangeable: `useAnnounceOnStateChange` dedupes on string equality (correct for "AI is typing" → "AI is generating"), while `useAnnounceOnShow` dedupes on visibility transition (correct for "Suggestions available" each time the picker reopens with the same label). Pair with `useA11yLabel('a11y/…')` for the message so the announcement is i18n'd and gated on the SDK's a11y opt-in.

For incoming messages: use `useIncomingMessageAnnouncements({ channel, ownUserId, activeThreadId, threadList })`. It throttles to 1 announcement per second, batches multi-message bursts, and bounds memory at 500 announced ids.

### 3) Modal / sheet focus trap

Use `useResolvedModalAccessibilityProps()` and spread the result on the modal root:

```tsx
const a11yProps = useResolvedModalAccessibilityProps();
<Animated.View {...a11yProps} style={...}>
  {/* ... */}
</Animated.View>
```

This returns:

- iOS: `{ accessibilityViewIsModal: true }`
- Android: `{ importantForAccessibility: 'yes' }`
- Either platform when `enabled` is false: `{}`

After opening, set initial focus via `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(titleRef.current))` deferred behind `requestAnimationFrame` so the a11y tree has settled.

### 4) Gesture alternatives

Mobile gestures (long-press, hold-to-record, pinch/pan) must have a tap-equivalent for SR users. Read the component's mode flag from `AccessibilityConfig`:

```tsx
const { audioRecorderTapMode } = useAccessibilityContext();
const screenReaderOn = useScreenReaderEnabled();
const useTapMode = audioRecorderTapMode === 'always' || (audioRecorderTapMode === 'auto' && screenReaderOn);
```

Three-state semantics: `'auto'` (swap when SR is on), `'always'` (swap for everyone), `'never'` (integrator handles).

### 5) Reduced-motion

```tsx
const reduceMotion = useReducedMotionPreference();
const transitionDuration = reduceMotion ? 0 : 250;
```

Disable spring animations and limit fade durations when this is true.

### 6) Curated single focus stop for visual content — `CompositeAccessibilityProbe`

```tsx
import { CompositeAccessibilityProbe } from 'stream-chat-react-native';

<CompositeAccessibilityProbe label={accessibilityLabel}>
  {/* avatars, icons, composed graphics — visually decorative */}
</CompositeAccessibilityProbe>
```

Wraps non-Text visual content with a single, cross-platform-stable focus stop carrying the provided `label`. Renders a hidden `Text` sibling that carries the label + a `View accessibilityElementsHidden importantForAccessibility='no-hide-descendants'` around the children. Use for avatars, mute icons, isolated badges, composed graphics that should announce as one semantic unit.

Pass the result of `useA11yLabel(...)` directly — when `label` is `undefined` (a11y opt-out), the probe is a no-op and renders children untouched.

Live examples: `ChannelAvatar.tsx`, `ChannelPreviewMutedStatus.tsx`, `ChannelMessagePreviewDeliveryStatus.tsx`.

### 7) Splicing extra a11y info into compose — `HiddenA11yText`

```tsx
import { HiddenA11yText } from 'stream-chat-react-native';

<Pressable>
  <Icon />
  {selected ? <HiddenA11yText label={useA11yLabel('a11y/you reacted')} /> : null}
</Pressable>
```

A visually-invisible `<Text>` that exists only to contribute extra information to a parent's compose loop. Use it to splice in supplementary state ("you reacted", "and N more", "unread") that doesn't have a natural visible Text in the tree.

Different concern from `CompositeAccessibilityProbe`:
- `HiddenA11yText` — "inject extra a11y-only text into a compose chain"
- `CompositeAccessibilityProbe` — "make this whole visual element one focus stop with a curated label"

Live examples: `MessageStatus.tsx`, `ReactionListClustered.tsx`, `ReactionListItem.tsx`.

### 8) Cross-platform auto-compose on a plain View

```tsx
<View accessible accessibilityRole='text'>
  {/* children whose labels should auto-compose into one announcement */}
</View>
```

iOS auto-composes descendant labels when a `View` is `accessible={true}` without an explicit `accessibilityLabel`. Android requires the parent to trip a gate — set any of `accessibilityRole`, `accessibilityState`, `accessibilityActions`, or `accessibilityLabelledBy`. `accessibilityRole='text'` (or `'none'`) is the lightest gate-tripper and a no-op for iOS composition.

`Pressable` defaults `accessibilityRole='button'`, so it auto-trips the gate. Plain `View accessible={true}` without a role does NOT — Android falls back to its default heuristic (reads one visible Text descendant only).

Live example: `MessageFooter.tsx` — `<View accessible accessibilityRole='text'>` makes the footer one focus stop on both platforms reading `"Read 11:05 AM"`.

See full memory: `rn_android_a11y_compose_gate.md`.

### 9) Drill-in for interactive children inside a Pressable

```tsx
<Pressable accessible={hasInteractiveContent ? false : undefined} onLongPress={...}>
  {/* mix of interactive children — attachments, quoted reply, poll options, etc. */}
</Pressable>
```

When a Pressable wraps mixed content that includes interactive children, the row's default single-focus-stop behavior subsumes them — screen-reader users can't activate the children individually. Setting `accessible={false}` on the Pressable removes the row stop, so VO/TalkBack drill into each interactive child. The Pressable's `onPress` / `onLongPress` still fire because VO/TalkBack synthesize taps at the focused child's coordinates, which land inside the Pressable's hit area.

Live example: `MessageContent.tsx` — `accessible={hasInteractiveContent ? false : undefined}` where `hasInteractiveContent` covers poll, quoted message, attachments, shared location.

### 10) Reshow announcements — `useAnnounceOnShow`

```tsx
useAnnounceOnShow(visible, useA11yLabel('a11y/Replying to {{user}}', { user: name }));
```

Announces `label` once each time `visible` flips from `false` to `true`. Resets on hide, so reshows re-announce — unlike `useAnnounceOnStateChange` which dedupes consecutive identical strings.

Use for transient surfaces that appear and disappear repeatedly within a session (modals, autocomplete pickers, reply previews) where the user benefits from hearing the affordance on every reappearance.

Live example: `Reply.tsx` — fires when a reply preview shows in the composer.

### 11) Screen-reader focus on screen entry — `useSetAccessibilityFocus` / `useScreenReaderMountFocus`

```tsx
// imperative primitive — moves the SR cursor onto a ref/node. NEVER .focus(): no keyboard,
// no first responder. The user still double-taps to act on whatever is focused.
const setAccessibilityFocus = useSetAccessibilityFocus();
setAccessibilityFocus(someRef);   // SR-gated, rAF-deferred; reads .current at call time

// declarative on-mount wrapper (MessageComposer uses it on inputBoxRef)
useScreenReaderMountFocus(someRef);
```

Use to land the SR cursor on the place the user came to act (e.g. the composer) when a message view is entered, instead of an arbitrary focus stop. No-op unless a screen reader is running.

**Navigation timing is platform-split, and the SDK stays navigation-agnostic:**
- **Android forward-nav** honors a focus set on **mount** → `useScreenReaderMountFocus` (used internally by `MessageComposer`).
- **iOS forward-nav, and back-nav on both platforms,** need the focus set **after the screen transition finishes** — firing mid-transition loses a race with the OS's own screen-entry focus pass. That's navigation-specific, so the **integrator** wires it (React Navigation `transitionEnd` → `setAccessibilityFocus`). SampleApp reference: `useScreenReaderComposerFocusEffect`.

Get the composer node via the already-public `<Channel setInputRef={...}>`; pass a **stable** `setInputRef` (an inline arrow re-fires the ref every parent render).

Live: `MessageComposer.tsx` (`useScreenReaderMountFocus(inputBoxRef)`); SampleApp `useScreenReaderComposerFocusEffect.tsx`.

### 12) Reachable header + the `onAccessibilityEscape` New-Architecture gotcha

When initial focus moves off the header, keep it reachable via standard gestures:
- **Mark the header title `accessibilityRole='header'`** → reachable via iOS VoiceOver Headings rotor / jump-to-top (4-finger tap top) and Android TalkBack **Headings reading control → swipe up**. Android has **no** bare-swipe "jump to first element" like iOS — reaching the header is reading-control-dependent. Custom `accessibilityActions` are **per-node and do NOT bubble**, and the Android system Back gesture can't be repurposed to focus (breaks go-back; `BackHandler` can't isolate TalkBack from a normal back).
- **iOS back-scrub** → `onAccessibilityEscape={() => navigation.goBack()}` on the screen-root view; Android's system Back already pops via the navigation lib.

**⚠️ `onAccessibilityEscape` is INERT on a layout-only `View` under the New Architecture (Fabric).** The VoiceOver scrub just "bonks." Fabric flattens the view to **no backing `UIView`** — `onAccessibilityEscape` is a standalone prop (not in `events.bits`, not a `formsView` trigger in `ViewShadowNode`), and `backgroundColor:'transparent'` isn't a "meaningful" color, so nothing forces a view. **Fix: `collapsable={false}`** on the hosting view (it's the first `formsStackingContext` term). Applies to any native-only a11y handler under Fabric.

## Anti-patterns to avoid

- **Hardcoded English `accessibilityLabel`** strings inside component code. For SDK `Button`, use `accessibilityLabelKey='a11y/...'`; otherwise use `useA11yLabel('a11y/...')` or `t('a11y/...')`.
- **Nested focusables**: `<Pressable><Pressable>` causes VO to stop on each. Mark the outer `accessible={false}` or the inner `accessibilityElementsHidden`.
- **Subscribing to `AccessibilityInfo` events when `enabled` is false** — wastes a listener slot. The provided hooks already gate on this; mirror that pattern.
- **`useScreenReaderEnabled()` inside list items** — toggling SR re-renders every item. Only subscribe in components that actually swap UI on SR (`AudioRecorder`, `ImageGallery`, `Message`'s alternative-actions button).
- **Using live regions to force-announce static modal text** — fix the dialog semantics instead (`useResolvedModalAccessibilityProps` + correct `accessibilityRole='alert'`).
- **Auto-focusing the suggestions/listbox of a typeahead on appear** — anti-pattern for combobox-style UI. Each keystroke that produces new suggestions would re-steal focus from the active `TextInput`, breaking continuous typing. ARIA combobox spec specifically forbids this; iOS VoiceOver and Android TalkBack have the same constraint. Announce on show via `useAnnounceOnShow` instead and rely on standard screen-reader navigation gestures (swipe) for the user to reach the list when they want.
- **Mutating `AccessibilityInfo` polyfill state in tests without restoring** — use the mock-builder helpers in `package/src/mock-builders/accessibility/` (or jest.mock the module) and reset between tests.
- **`onAccessibilityEscape` (or other native-only a11y handlers) on a flattened View under the New Architecture** — Fabric drops the backing view and the handler never fires (VoiceOver bonks). Add `collapsable={false}` (or a view-forming prop).
- **Repurposing the Android system Back gesture to move focus** — `BackHandler` can't distinguish TalkBack's back-gesture from a normal back, and consuming it breaks go-back for everyone.
- **Expecting a bare swipe-up to reach a header on Android** — TalkBack only jumps to headings/controls when the reading control is set to that granularity; there's no iOS-style "jump to first element" gesture.
- **Passing an unstable `setInputRef` (inline arrow) to `<Channel>`** — re-fires the ref callback on every parent render (detach→null→reattach); wrap it in a stable `useCallback`.
- **Using `.focus()` to move screen-reader focus** — that activates the input (opens the keyboard / makes it first responder). To only move the SR cursor, use `useSetAccessibilityFocus` (`AccessibilityInfo.setAccessibilityFocus`), not `inputBoxRef.focus()`.

## Testing requirements per change

Minimum:

- Unit tests for new keyboard/focus/semantics behavior in nearest `__tests__/`.
- Use `@testing-library/react-native` semantic queries: `getByRole`, `getByLabelText`, `getByA11yState`, `getByA11yValue`.

Recommended for non-trivial changes:

- Render with `<OverlayProvider accessibility={{ enabled: true, forceScreenReaderMode: true }}>` and assert the accessible variant renders.
- Render with `<OverlayProvider accessibility={{ enabled: false }}>` and assert the legacy behavior is unchanged (no extra buttons, no listeners).

## Execution checklist (copy this when making an a11y change)

- [ ] Identified the interaction type (button / menuitem / dialog / progressbar / radio / checkbox / live region / image)
- [ ] Picked a native element first; ARIA-style `accessibilityRole` only when necessary
- [ ] Composed the accessible name via `Button accessibilityLabelKey='a11y/...'` or `useA11yLabel('a11y/...')` (not hardcoded)
- [ ] Added the new `a11y/*` key to all 12 locale JSONs and ran `yarn build-translations`
- [ ] Set `accessibilityState` for stateful widgets (`disabled`, `selected`, `checked`, `busy`, `expanded`)
- [ ] Decorative visuals hidden from AT (`accessibilityElementsHidden` / `importantForAccessibility='no-hide-descendants'`)
- [ ] Modal surfaces use `useResolvedModalAccessibilityProps`
- [ ] Native-only a11y handlers (`onAccessibilityEscape`, etc.) sit on a non-flattened view (`collapsable={false}` under the New Architecture)
- [ ] New behavior (announcers, listeners) gated on `useAccessibilityContext().enabled`
- [ ] Tested with `<OverlayProvider accessibility={{ enabled: true, forceScreenReaderMode: true }}>` and `enabled: false`
- [ ] Verified `yarn lint` passes (`validate-translations` enforces non-empty `a11y/*` keys)
- [ ] Verified `yarn tsc --noEmit` passes (RN's a11y prop types are strict about `boolean | null | undefined`)

## Reference files (in this repo)

- `package/src/contexts/accessibilityContext/AccessibilityContext.tsx` — config schema + provider + imperative announcer context.
- `package/src/components/Accessibility/hooks/useIncomingMessageAnnouncements.ts` — port of stream-chat-react's hook.
- `package/src/components/Accessibility/CompositeAccessibilityProbe.tsx` — curated-single-focus-stop wrapper for visual content (avatar, icons, badges).
- `package/src/components/Accessibility/HiddenA11yText.tsx` — visually-invisible Text that splices extra info into a parent's compose chain ("you reacted", "and N more", etc).
- `package/src/a11y/hooks/useA11yLabel.ts` — translated-label-or-undefined.
- `package/src/a11y/hooks/useAnnounceOnStateChange.ts` — announce on string-change with dedup.
- `package/src/a11y/hooks/useAnnounceOnShow.ts` — announce on `visible: false → true` transitions, resets on hide (no dedup).
- `package/src/a11y/hooks/useResolvedModalAccessibilityProps.ts` — modal a11y props.
- `package/src/a11y/hooks/useAnnounceOnShow.ts` — announce-on-visible helper for transient surfaces.
- `package/src/a11y/hooks/useSetAccessibilityFocus.ts` — imperative "move the SR cursor onto a ref/node" primitive (never `.focus()`); SR-gated, rAF-deferred.
- `package/src/a11y/hooks/useScreenReaderMountFocus.ts` — focus-a-ref-on-mount wrapper (composer uses it on `inputBoxRef`); the Android forward-nav path.
- `examples/SampleApp/src/utils/useScreenReaderComposerFocusEffect.tsx` — integration reference: React Navigation `transitionEnd` → `setAccessibilityFocus`, stable `setInputRef`, and `onAccessibilityEscape` + `collapsable={false}` on the screen root.
- `package/src/components/ui/Avatar/Avatar.tsx` — example of `name` + `useA11yLabel` usage.
- `package/src/components/UIComponents/BottomSheetModal.tsx` — example of `useResolvedModalAccessibilityProps` and `useAnnounceOnShow`.
- `package/src/components/AITypingIndicatorView/AITypingIndicatorView.tsx` — example of `useAnnounceOnStateChange`.
- `package/src/components/AutoCompleteInput/AutoCompleteSuggestionList.tsx` — example of `useAnnounceOnShow` with a per-trigger label (mention/command/emoji).
- `package/src/components/Message/MessageItemView/MessageFooter.tsx` — example of cross-platform auto-compose on a View (`accessible + accessibilityRole='text'`).
- `package/src/components/Message/MessageItemView/MessageContent.tsx` — example of conditional drill-in (`accessible={hasInteractiveContent ? false : undefined}`).

## Cross-SDK parity

API shapes mirror [`stream-chat-react#3146`](https://github.com/GetStream/stream-chat-react/pull/3146):

- `useAccessibilityAnnouncer` ≈ React's `useAriaLiveAnnouncer`
- `useIncomingMessageAnnouncements` — same params, same throttle/batch logic
- `a11y/*` i18n namespace shared
- `<NotificationAnnouncer />` — same component name, `connection-state`-only on RN since RN has no shared notifications queue

When changing one SDK's a11y API, mirror it in the other where the platforms agree.
