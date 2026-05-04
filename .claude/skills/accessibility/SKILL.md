---
name: accessibility
description: Maintain VoiceOver/TalkBack-focused accessibility in stream-chat-react-native. Use when changing interactive components, gestures, modals, lists, media controls, notifications, focus behavior, or live announcements.
---

# Accessibility Maintenance (stream-chat-react-native)

Use this skill whenever code changes can affect screen-reader users (VoiceOver on iOS, TalkBack on Android), gesture-driven flows, focus behavior, motion preferences, or semantic React Native accessibility props.

## Non-negotiable rules

1. **Native semantics first.** Use `Pressable`, `TextInput`, `Switch`, `Image` directly. Use `accessibilityRole` only when native semantics cannot represent the widget (`menu`, `menuitem`, `progressbar`, `radio`, `checkbox`, `article`, `alert`, `tablist`, `tab`).
2. **Never hardcode English** in `accessibilityLabel`/`accessibilityHint`/announcement strings. Use `useA11yLabel('a11y/...', params)` (or `t('a11y/...')` directly when you don't need the disabled-state short-circuit). Add the key to all 12 locale files in `package/src/i18n/`.
3. **Gate behavior on `useAccessibilityContext().enabled`.** A11y is opt-in. New listeners, subscriptions, and announcer mounts must be no-ops when `enabled` is false. New `accessibilityRole`/`accessibilityState` props are fine to render unconditionally — they cost ~zero.
4. **One focusable target per action.** Don't nest `Pressable` inside `Pressable`. Mark inner decorative views with `accessibilityElementsHidden` (iOS) + `importantForAccessibility='no-hide-descendants'` (Android) so the parent carries the label.
5. **Decorative visuals stay hidden from AT.** Icon-only buttons must carry an `accessibilityLabel` on the wrapper, and the SVG icon should be hidden.
6. **Backward-compatible.** All new props are optional. Component override pattern (`WithComponents`) must continue to work.

## Where to put what

- **Foundation primitives** → `package/src/a11y/` (utilities + low-level hooks).
- **Runtime announcer infra** → `package/src/components/Accessibility/` (`AccessibilityAnnouncer`, `NotificationAnnouncer`, `useIncomingMessageAnnouncements`).
- **Config + provider** → `package/src/contexts/accessibilityContext/`.
- **i18n** → `a11y/*` keys in all 12 locale JSONs (`en, es, fr, he, hi, it, ja, ko, nl, pt-br, ru, tr`).
- **Component-level a11y attributes** → in the component itself.
- **Platform divergence (iOS vs Android)** → use `Platform.OS` or `useResolvedModalAccessibilityProps`. Don't duplicate the file — RN doesn't need `.ios.tsx`/`.android.tsx` splits for a11y.
- **Tests** → nearest `__tests__/` folder; use `@testing-library/react-native` semantic queries (`getByRole`, `getByLabelText`).

## Patterns to follow

### 1) Composing accessible names

```tsx
import { useA11yLabel } from 'stream-chat-react-native';

const label = useA11yLabel('a11y/Reaction {{emoji}} by {{count}} users', { emoji, count });
<Pressable accessibilityLabel={label} accessibilityRole='button' accessibilityState={{ selected }} />
```

`useA11yLabel` returns `undefined` when `accessibility.enabled` is false, so the `t()` call is skipped on hot list paths.

For composite labels (sender + timestamp + body + reactions summary), use `composeAccessibilityLabel(...parts)` from `package/src/a11y/a11yUtils.ts` — it filters out empty/null parts and joins with `, ` so screen readers add a brief pause.

### 2) Live-region announcements

Two complementary mechanisms:

- **Imperative**: `useAccessibilityAnnouncer()` returns `(message, priority?) => void`. Same shape as `stream-chat-react`'s `useAriaLiveAnnouncer`. Wraps `AccessibilityInfo.announceForAccessibility` with sequence/debounce so repeat announcements still re-announce.
- **Declarative**: `accessibilityLiveRegion="polite"` (Android only) on a View that re-renders when its label changes.

Use `useAnnounceOnStateChange(message, { debounceMs, priority })` for transitions (AI typing, indicators) — it dedups consecutive same-message calls and applies a default 250ms debounce.

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

- **Hardcoded English `accessibilityLabel`** strings inside component code. Always use `useA11yLabel('a11y/...')` or `t('a11y/...')`.
- **Nested focusables**: `<Pressable><Pressable>` causes VO to stop on each. Mark the outer `accessible={false}` or the inner `accessibilityElementsHidden`.
- **Subscribing to `AccessibilityInfo` events when `enabled` is false** — wastes a listener slot. The provided hooks already gate on this; mirror that pattern.
- **`useScreenReaderEnabled()` inside list items** — toggling SR re-renders every item. Only subscribe in components that actually swap UI on SR (`AudioRecorder`, `ImageGallery`, `Message`'s alternative-actions button).
- **Using live regions to force-announce static modal text** — fix the dialog semantics instead (`useResolvedModalAccessibilityProps` + correct `accessibilityRole='alert'`).
- **Mutating `AccessibilityInfo` polyfill state in tests without restoring** — use the mock-builder helpers in `package/src/mock-builders/accessibility/` (or jest.mock the module) and reset between tests.

## Testing requirements per change

Minimum:
- Unit tests for new keyboard/focus/semantics behavior in nearest `__tests__/`.
- Use `@testing-library/react-native` semantic queries: `getByRole`, `getByLabelText`, `getByA11yState`, `getByA11yValue`.

Recommended for non-trivial changes:
- Render with `accessibility={{ enabled: true, forceScreenReaderMode: true }}` and assert the accessible variant renders.
- Render with `accessibility={{ enabled: false }}` and assert the legacy behavior is unchanged (no extra buttons, no listeners).

## Execution checklist (copy this when making an a11y change)

- [ ] Identified the interaction type (button / menuitem / dialog / progressbar / radio / checkbox / live region / image)
- [ ] Picked a native element first; ARIA-style `accessibilityRole` only when necessary
- [ ] Composed `accessibilityLabel` via `useA11yLabel('a11y/...')` (not hardcoded)
- [ ] Added the new `a11y/*` key to all 12 locale JSONs and ran `yarn build-translations`
- [ ] Set `accessibilityState` for stateful widgets (`disabled`, `selected`, `checked`, `busy`, `expanded`)
- [ ] Decorative visuals hidden from AT (`accessibilityElementsHidden` / `importantForAccessibility='no-hide-descendants'`)
- [ ] Modal surfaces use `useResolvedModalAccessibilityProps`
- [ ] New behavior (announcers, listeners) gated on `useAccessibilityContext().enabled`
- [ ] Tested with `accessibility={{ enabled: true, forceScreenReaderMode: true }}` and `enabled: false`
- [ ] Verified `yarn lint` passes (`validate-translations` enforces non-empty `a11y/*` keys)
- [ ] Verified `yarn tsc --noEmit` passes (RN's a11y prop types are strict about `boolean | null | undefined`)

## Reference files (in this repo)

- `package/src/contexts/accessibilityContext/AccessibilityContext.tsx` — config schema + provider.
- `package/src/components/Accessibility/AccessibilityAnnouncer.tsx` — imperative announcer.
- `package/src/components/Accessibility/hooks/useIncomingMessageAnnouncements.ts` — port of stream-chat-react's hook.
- `package/src/a11y/hooks/useA11yLabel.ts` — translated-label-or-undefined.
- `package/src/a11y/hooks/useResolvedModalAccessibilityProps.ts` — modal a11y props.
- `package/src/components/ui/Avatar/Avatar.tsx` — example of `name` + `useA11yLabel` usage.
- `package/src/components/UIComponents/BottomSheetModal.tsx` — example of `useResolvedModalAccessibilityProps`.
- `package/src/components/AITypingIndicatorView/AITypingIndicatorView.tsx` — example of `useAnnounceOnStateChange`.

## Cross-SDK parity

API shapes mirror [`stream-chat-react#3146`](https://github.com/GetStream/stream-chat-react/pull/3146):
- `useAccessibilityAnnouncer` ≈ React's `useAriaLiveAnnouncer`
- `useIncomingMessageAnnouncements` — same params, same throttle/batch logic
- `a11y/*` i18n namespace shared
- `<NotificationAnnouncer />` — same component name, `connection-state`-only on RN since RN has no shared notifications queue

When changing one SDK's a11y API, mirror it in the other where the platforms agree.
