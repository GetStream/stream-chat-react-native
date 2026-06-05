---
name: accessibility
description: Maintain VoiceOver/TalkBack-focused accessibility in stream-chat-react-native. Use when changing interactive components, gestures, modals, lists, media controls, notifications, focus behavior, or live announcements.
---

# Accessibility Maintenance (stream-chat-react-native)

Use this skill whenever code changes can affect screen-reader users (VoiceOver on iOS, TalkBack on Android), gesture-driven flows, focus behavior, motion preferences, or semantic React Native accessibility props.

## Non-negotiable rules

1. **Native semantics first.** Use `Pressable`, `TextInput`, `Switch`, `Image` directly. Use `accessibilityRole` only when native semantics cannot represent the widget (`menu`, `menuitem`, `progressbar`, `radio`, `checkbox`, `article`, `alert`, `tablist`, `tab`). **Platform caveat:** `'menu'` and `'menuitem'` are honored by iOS VoiceOver but Android TalkBack silently ignores them (no `UIAccessibilityTraits` equivalent). For interactive items that must be announceable on both platforms, use `'button'` on the leaf `Pressable`; the `'menu'` role can stay on the container as an iOS hint. iOS-supported roles that survive to VoiceOver: `button`, `link`, `search`, `image`, `keyboardkey`, `text`, `adjustable`, `imagebutton`, `header`, `summary`, `none`.
2. **Never hardcode English** in `accessibilityLabel`/`accessibilityHint`/announcement strings. For SDK `Button`, pass `accessibilityLabelKey='a11y/...'` (and `accessibilityLabelParams` when needed). For non-Button components, use `useA11yLabel('a11y/...', params)` or `t('a11y/...')` directly when you don't need the disabled-state short-circuit. Add the key to all 12 locale files in `package/src/i18n/`.
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
- **i18n** → `a11y/*` keys in all 12 locale JSONs (`en, es, fr, he, hi, it, ja, ko, nl, pt-br, ru, tr`).
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
const useTapMode =
  audioRecorderTapMode === 'always' ||
  (audioRecorderTapMode === 'auto' && screenReaderOn);
```

Three-state semantics: `'auto'` (swap when SR is on), `'always'` (swap for everyone), `'never'` (integrator handles).

### 5) Reduced-motion

```tsx
const reduceMotion = useReducedMotionPreference();
const transitionDuration = reduceMotion ? 0 : 250;
```

Disable spring animations and limit fade durations when this is true.

## Anti-patterns to avoid

- **Hardcoded English `accessibilityLabel`** strings inside component code. For SDK `Button`, use `accessibilityLabelKey='a11y/...'`; otherwise use `useA11yLabel('a11y/...')` or `t('a11y/...')`.
- **Nested focusables**: `<Pressable><Pressable>` causes VO to stop on each. Mark the outer `accessible={false}` or the inner `accessibilityElementsHidden`.
- **Subscribing to `AccessibilityInfo` events when `enabled` is false** — wastes a listener slot. The provided hooks already gate on this; mirror that pattern.
- **`useScreenReaderEnabled()` inside list items** — toggling SR re-renders every item. Only subscribe in components that actually swap UI on SR (`AudioRecorder`, `ImageGallery`, `Message`'s alternative-actions button).
- **Using live regions to force-announce static modal text** — fix the dialog semantics instead (`useResolvedModalAccessibilityProps` + correct `accessibilityRole='alert'`).
- **Auto-focusing the suggestions/listbox of a typeahead on appear** — anti-pattern for combobox-style UI. Each keystroke that produces new suggestions would re-steal focus from the active `TextInput`, breaking continuous typing. ARIA combobox spec specifically forbids this; iOS VoiceOver and Android TalkBack have the same constraint. Announce on show via `useAnnounceOnShow` instead and rely on standard screen-reader navigation gestures (swipe) for the user to reach the list when they want.
- **Mutating `AccessibilityInfo` polyfill state in tests without restoring** — use the mock-builder helpers in `package/src/mock-builders/accessibility/` (or jest.mock the module) and reset between tests.

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
- [ ] New behavior (announcers, listeners) gated on `useAccessibilityContext().enabled`
- [ ] Tested with `<OverlayProvider accessibility={{ enabled: true, forceScreenReaderMode: true }}>` and `enabled: false`
- [ ] Verified `yarn lint` passes (`validate-translations` enforces non-empty `a11y/*` keys)
- [ ] Verified `yarn tsc --noEmit` passes (RN's a11y prop types are strict about `boolean | null | undefined`)

## Reference files (in this repo)

- `package/src/contexts/accessibilityContext/AccessibilityContext.tsx` — config schema + provider + imperative announcer context.
- `package/src/components/Accessibility/hooks/useIncomingMessageAnnouncements.ts` — port of stream-chat-react's hook.
- `package/src/a11y/hooks/useA11yLabel.ts` — translated-label-or-undefined.
- `package/src/a11y/hooks/useResolvedModalAccessibilityProps.ts` — modal a11y props.
- `package/src/a11y/hooks/useAnnounceOnShow.ts` — announce-on-visible helper for transient surfaces.
- `package/src/components/ui/Avatar/Avatar.tsx` — example of `name` + `useA11yLabel` usage.
- `package/src/components/UIComponents/BottomSheetModal.tsx` — example of `useResolvedModalAccessibilityProps` and `useAnnounceOnShow`.
- `package/src/components/AITypingIndicatorView/AITypingIndicatorView.tsx` — example of `useAnnounceOnStateChange`.
- `package/src/components/AutoCompleteInput/AutoCompleteSuggestionList.tsx` — example of `useAnnounceOnShow` with a per-trigger label (mention/command/emoji).

## Cross-SDK parity

API shapes mirror [`stream-chat-react#3146`](https://github.com/GetStream/stream-chat-react/pull/3146):
- `useAccessibilityAnnouncer` ≈ React's `useAriaLiveAnnouncer`
- `useIncomingMessageAnnouncements` — same params, same throttle/batch logic
- `a11y/*` i18n namespace shared
- `<NotificationAnnouncer />` — same component name, `connection-state`-only on RN since RN has no shared notifications queue

When changing one SDK's a11y API, mirror it in the other where the platforms agree.
