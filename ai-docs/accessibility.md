# Accessibility (a11y) — `stream-chat-react-native`

This SDK ships an opt-in accessibility layer for VoiceOver (iOS) and TalkBack (Android). When enabled, components add the appropriate `accessibilityRole`, `accessibilityState`, `accessibilityLabel`, `accessibilityValue`, and `accessibilityLiveRegion` attributes; the SDK announces incoming messages, AI typing transitions, and connection-state changes via a single imperative announcer; and modal/sheet surfaces apply the platform-correct focus-trap props.

## Opt-in default

A11y is **off by default**. Existing integrators see no behavior change. To enable:

```tsx
import { Chat } from 'stream-chat-react-native';

<Chat client={client} accessibility={{ enabled: true }}>
  {/* ... */}
</Chat>
```

When `enabled` is false:

- No `<AccessibilityAnnouncer>` mounts; `useAccessibilityAnnouncer()` returns a noop.
- No `<NotificationAnnouncer />` mounts.
- `useIncomingMessageAnnouncements` does not subscribe to `channel.on('message.new')`.
- No `AccessibilityInfo` event listeners attach.
- Components still render their `accessibilityRole` / `accessibilityState` / etc. attributes (these are passed to native views and only consulted by VO/TalkBack when active — sighted users incur ~zero cost).
- `useA11yLabel(key, params)` returns `undefined` so `t('aria/...')` is **not** called on hot list paths.

## Configuration shape

```ts
type A11yMode = 'auto' | 'always' | 'never';

type AccessibilityConfig = {
  enabled?: boolean;                    // default false — must opt in
  forceScreenReaderMode?: boolean;      // default false — testing aid
  announceNewMessages?: boolean;        // default true (when enabled)
  announceTypingIndicator?: boolean;    // default false (noisy)
  announceConnectionState?: boolean;    // default true
  audioRecorderTapMode?: A11yMode;          // default 'auto'
  imageGalleryScreenReaderMode?: A11yMode;  // default 'auto'
  messageActionsTrigger?: 'long-press' | 'auto' | 'always-button'; // default 'auto'
};
```

For RN-specific gesture-alternative toggles, the enum semantics are:

- `auto` — swap UI when a screen reader is detected via `AccessibilityInfo`.
- `always` — show the accessible variant for everyone (sighted + SR users).
- `never` — SDK never swaps UI; the integrator handles it (e.g. when shipping a custom component via `WithComponents`).

## Localization

All a11y strings flow through the existing `Streami18n` translation pipeline under the `aria/*` namespace. Defaults ship in English in every locale; integrators can override per-key via the same mechanism they use for other strings:

```ts
const i18n = new Streami18n('nl');
i18n.registerTranslation('nl', {
  'aria/Avatar of {{name}}': 'Avatar van {{name}}',
  'aria/{{count}} new messages': '{{count}} nieuwe berichten',
});
<Chat client={client} i18nInstance={i18n} accessibility={{ enabled: true }}>
```

`validate-translations` (run as part of `yarn lint`) enforces non-empty values for every `aria/*` key in every locale.

## Public hooks and components

Importable from `stream-chat-react-native`:

- `useAccessibilityContext()` — read the resolved config.
- `useAccessibilityAnnouncer()` — `(message, priority?) => void` imperative announcer; mirrors `useAriaLiveAnnouncer` from `stream-chat-react`.
- `useScreenReaderEnabled()` — live boolean from `AccessibilityInfo.screenReaderChanged`.
- `useReducedMotionPreference()` — live boolean from `AccessibilityInfo.reduceMotionChanged`.
- `useResolvedModalAccessibilityProps()` — returns `{ accessibilityViewIsModal, importantForAccessibility }` for the active platform.
- `useA11yLabel(key, params)` — translated label or `undefined` when disabled.
- `useAnnounceOnStateChange(message, options)` — debounced live-region helper.
- `useIncomingMessageAnnouncements({ channel, ownUserId, activeThreadId, threadList })` — throttled, batched announcement of new messages.
- `<AccessibilityAnnouncer>` — provider component (mounted by `<Chat>`).
- `<NotificationAnnouncer />` — connection-state announcer (mounted by `<Channel>`).

## Cross-SDK parity

API shapes mirror [`stream-chat-react#3146`](https://github.com/GetStream/stream-chat-react/pull/3146) wherever the platforms agree (`useAccessibilityAnnouncer` ≈ `useAriaLiveAnnouncer`, `useIncomingMessageAnnouncements` ≈ identical params and throttle semantics, `aria/*` i18n namespace shared). Mobile-only deviations:

- `<Chat accessibility={...}>` config object — RN needs gesture-alternative toggles (audio hold-to-record, gallery pinch/pan) that don't exist on web.
- No `<VisuallyHidden>`, no `<SkipNavigation>`, no roving-focus utilities — RN announcer is imperative, mobile has no Tab key.
- `useResolvedModalAccessibilityProps` returns `accessibilityViewIsModal` (iOS) + `importantForAccessibility='yes'` (Android) instead of `aria-modal`.
- Live regions: `AccessibilityInfo.announceForAccessibility` cross-platform; Android `accessibilityLiveRegion='polite'` on hidden Views as a backup where useful.

## Platform-specific notes

- **iOS / VoiceOver**: focus management uses `AccessibilityInfo.setAccessibilityFocus(reactTag)`. After modal open or layout shift, defer the focus call by one frame (`requestAnimationFrame`) so the a11y tree has settled.
- **Android / TalkBack**: prefer `accessibilityLiveRegion` over imperative announcements where both are an option — TalkBack interrupts more aggressively when announcing imperatively. The announcer uses `announceForAccessibility` for both platforms because behavior is closer to predictable across devices.
- `setAccessibilityFocus` on Android requires the React tag to come from `findNodeHandle(ref)`; if your custom component override uses a functional ref, expose a method or pass `ref` through.

## Out of scope (current state)

- AudioRecorder gesture-alternative tap mode (planned; gated on `audioRecorderTapMode`).
- ImageGallery screen-reader-mode UI swap (planned; gated on `imageGalleryScreenReaderMode`).
- Reassure performance benchmark (planned for the lint/perf commit).
- ESLint `react-native-a11y` rule plugin (deferred — adds a runtime dependency).
