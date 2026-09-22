# iPhone Duo / resizable-iPhone readiness audit

**Audited:** 2026-09-21 · **Branch:** `chore/duo-readiness-audit` · **Base:** `develop` @ `6977ea453` (9.9.1)

**Scope:** `stream-chat-react-native-core` (`package/`), `stream-chat-react-native` (`package/native-package/`), `stream-chat-expo` (`package/expo-package/`), shared native source (`package/shared-native/`), and the example app `examples/SampleApp` (RN 0.87.0, bare CLI). **`examples/ExpoMessaging` was audited but is out of scope for the fixes in this branch** - see finding #0. RN peer range is `>=0.76.0` across all three packages.

---

## 1. Executive summary

**SampleApp launches on iOS 27.1 — verified on a Duo simulator, folded and unfolded.** It has been scene-based since `5a76fe7fa`: [AppDelegate.swift:20-34](../examples/SampleApp/ios/AppDelegate.swift:20) creates no window, [SceneDelegate.swift:11-24](../examples/SampleApp/ios/SceneDelegate.swift:11) creates `UIWindow(windowScene:)` and starts React Native in it, and `Info.plist` declares a complete `UIApplicationSceneManifest`. Phase 1, normally the hard blocker for this audit, is the part this repo had already done.

**17 findings raised. 15 are fixed, 1 is disproven and withdrawn (§4), and 1 is a P0 in ExpoMessaging that is documented but deliberately left unfixed (§4).**

Five of those came from a second, full re-sweep run after the first round of fixes was on device (§9). That pass is the most useful thing in this report: the first sweep had a 25% miss rate, and the misses were not random - they were all _second instances_ of a bug class I had already found and fixed once.

| Severity | Raised | Fixed | Withdrawn |
| -------- | ------ | ----- | --------- |
| P0       | 1      | 0     | 0         |
| P1       | 4      | 4     | 0         |
| P2       | 7      | 7     | 0         |
| P3       | 5      | 4     | 1         |

The two defects that actually mattered were not layout arithmetic:

1. **Safe-area insets are asymmetric and `top` is zero.** Measured on device: `left: 0, right: 84, top: 0`. The system clock and indicators render down the _right_ edge. Not one component in the SDK read `insets.left` or `insets.right`, so content rendered underneath them.
2. **`inactive` was treated as `background`.** In Split View a _visible_ app sits `inactive`, so the SDK closed the WebSocket and showed an offline banner while the user was reading the chat. On by default.

### Measured geometry

From a temporary probe overlay mounted in SampleApp (since reverted; not part of the diff) reading `useWindowDimensions()`, `Dimensions.get('screen')` and `useSafeAreaInsets()` live on device:

| Device / mode                                                                | window (pt)        | screen (pt)        | insets t/b/l/r      |
| ---------------------------------------------------------------------------- | ------------------ | ------------------ | ------------------- |
| iPhone Duo, **outer** display, folded, iOS 27.1                              | 466 × 678 @3x      | 466 × 678 @3x      | **0 / 34 / 0 / 84** |
| iPhone Duo, **inner** display, unfolded, landscape, iOS 27.1                 | **951 × 669 @3x**  | **466 × 678 @3x**  | **0 / 34 / 0 / 84** |
| iPad Pro 11" running the iPhone-only app in a compatibility window, iOS 27.0 | **417** × 1210 @2x | **834** × 1210 @2x | 32 / 20 / 0 / 0     |

Three facts drive most of the findings:

1. **Insets are asymmetric with no top inset** — `right: 84`, `left: 0`, `top: 0`, on _both_ displays.
2. **`screen` is not `window`, in either direction.** In the iPad compatibility window the screen is _larger_ (834 vs 417). On the unfolded Duo it is _smaller_: `Dimensions.get('screen')` keeps reporting the **outer** display at 466pt while the app's window is **951pt**. Sizing from `screen` there collapses content to under half width.
3. **The inner display is 669 × 951pt, not the widely cited 626 × 890.** 951 × 3 = 2853 and 669 × 3 = 2007, matching the framebuffer exactly. See §7.

---

## 2. Findings

All statuses below are **fixed** unless marked otherwise.

| #   | Sev    | Package          | File                                                                                                                                                                                                         | What broke                                                                                                                                                                                                | User-visible symptom                                                                                                                                                                                                                                                                                                                                                                   | Fix                                                                                                                                     |
| --- | ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **P0** | ExpoMessaging    | prebuild output (not checked in)                                                                                                                                                                             | Expo SDK 57's prebuild template is pre-scene-lifecycle: the window is created in `didFinishLaunchingWithOptions` from `UIScreen.main.bounds`, with no `SceneDelegate` and no `UIApplicationSceneManifest` | **App fails to launch on iOS 27** — "UIScene life cycle is required", the same failure as `react/react-native#58606`                                                                                                                                                                                                                                                                   | **NOT FIXED — out of scope for this branch.** Verified fix described in §4                                                              |
| 1   | **P1** | core + SampleApp | 8 surfaces, see §3                                                                                                                                                                                           | Nothing anywhere read `insets.left` / `insets.right`                                                                                                                                                      | Channel row timestamps, the header compose button and the unread badge rendered **underneath** the system clock/wifi capsule                                                                                                                                                                                                                                                           | Horizontal insets on every window-owning surface; SampleApp insets its own screens. **Verified on device, §5**                          |
| 10  | **P1** | core             | [useAppStateListener.ts](../package/src/hooks/useAppStateListener.ts)                                                                                                                                           | `inactive` treated as equivalent to `background`                                                                                                                                                          | In Split View a visible app is `inactive`, so [useIsOnline.ts:22-29](../package/src/components/Chat/hooks/useIsOnline.ts:22) called `client.closeConnection()` and `setIsOnline(false)` — WebSocket dropped and offline banner shown **while the user was reading the chat**. Default-on (`closeConnectionOnBackground = true`, [Chat.tsx:216](../package/src/components/Chat/Chat.tsx:216)) | Only `background` counts as backgrounded; `inactive` ignored. Guarded so each callback fires once per real transition                   |
| 2   | **P1** | core             | [useScreenDimensions.ts](../package/src/hooks/useScreenDimensions.ts)                                                                                                                                           | Public hook returns `vw`/`vh` as a percentage of **screen**                                                                                                                                               | A consumer sizing with `vw(100)` gets an element **2x its container width** (834 vs 417, measured)                                                                                                                                                                                                                                                                                     | `@deprecated` pointing at `useViewport`; behaviour unchanged, per the repo's deprecation lifecycle                                      |
| 3   | **P2** | core             | [StreamShimmerView.swift](../package/shared-native/ios/StreamShimmerView.swift)                                                                                                                                 | `UIScreen.main.scale` for `contentsScale`, cached once at `setupLayers()`                                                                                                                                 | Shimmer placeholders rastered at the wrong scale if the view moves to a display with a different scale                                                                                                                                                                                                                                                                                 | Reads the view's own `traitCollection.displayScale`; resyncs on `didMoveToWindow` and `traitCollectionDidChange`                        |
| 4   | **P2** | core             | [MessageItemView.tsx](../package/src/components/Message/MessageItemView/MessageItemView.tsx)                                                                                                                    | `Dimensions.get('screen')` for the default swipe hit slop                                                                                                                                                 | Hit slop computed from screen, not window; also non-reactive                                                                                                                                                                                                                                                                                                                           | `useWindowDimensions()`                                                                                                                 |
| 5   | **P2** | SampleApp        | [Toast.tsx](../examples/SampleApp/src/components/ToastComponent/Toast.tsx)                                                                                                                                      | `Dimensions.get('window')` at **module scope**, baked into `StyleSheet.create`                                                                                                                            | Toast kept the width the app launched with; wrong after any resize                                                                                                                                                                                                                                                                                                                     | Read per render                                                                                                                         |
| 6   | **P2** | core             | [MediaList.tsx](../package/src/components/ChannelDetails/components/navigation-section/MediaList.tsx)                                                                                                           | `NUMBER_OF_COLUMNS = 3` hardcoded, tile size from window width                                                                                                                                            | Three ~205pt tiles at 626pt+ instead of more columns. No consumer escape hatch                                                                                                                                                                                                                                                                                                         | Column count derived from the grid's **own measured width** past a 600pt breakpoint; new `numberOfColumns` prop. Unchanged in phone portrait; a phone in landscape (832pt after insets on a Pro Max) now gets 6 |
| 7   | **P3** | core             | [AttachmentPickerItem.tsx](../package/src/components/AttachmentPicker/components/AttachmentMediaPicker/AttachmentPickerItem.tsx), [ImageGrid.tsx](../package/src/components/ImageGallery/components/ImageGrid.tsx) | `vw(100) / columns` measures the **window**, but both render inside a bottom sheet                                                                                                                        | Thumbnails overflow the sheet once it is inset                                                                                                                                                                                                                                                                                                                                         | New internal `useContainerWidth` hook; the grid measures itself and passes tile size down                                               |
| 9   | **P3** | core             | [StreamShimmerView.swift](../package/shared-native/ios/StreamShimmerView.swift)                                                                                                                                 | `UIApplication.shared.applicationState` is app-wide, not per scene                                                                                                                                        | With Split View the app-level state says nothing about whether _this_ view's scene is on screen                                                                                                                                                                                                                                                                                        | Per-view `isSceneOnScreen` from `window.windowScene.activationState`, plus `UIScene` notification observers                             |
| 11  | **P3** | core             | [Channel.tsx:807-818](../package/src/components/Channel/Channel.tsx:807)                                                                                                                                        | Same `inactive` conflation sent `typing.stop`                                                                                                                                                             | Typing indicator dropped whenever the app went `inactive` while still visible                                                                                                                                                                                                                                                                                                          | Fixed by #10                                                                                                                            |
| 8   | ~~P3~~ | core             | [ImageGallery.tsx:258-270](../package/src/components/ImageGallery/ImageGallery.tsx:258)                                                                                                                         | —                                                                                                                                                                                                         | —                                                                                                                                                                                                                                                                                                                                                                                      | **WITHDRAWN — not a bug.** See §4                                                                                                       |

### Categories that came back clean

Worth stating, because the audit template expects these to be problems:

- **Zero** device-model or idiom branching. The only `DeviceInfo` hit ([KeyboardCompatibleView.tsx:47](../package/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx:47)) reads a static native constant.
- **Zero** orientation locks. [useScreenOrientation.ts:12](../package/src/hooks/useScreenOrientation.ts:12) derives orientation from the window aspect ratio — already lock-independent.
- **Zero** `Math.max(insets.left, insets.right)` collapsing, and zero hardcoded 44/34/20/88 bar constants.
- No remount `key` props derived from width or orientation.
- **Phase 8 (media/camera/calls) is not applicable** — Chat packages, no capture or call surface. No `AVCaptureDevice` anywhere.

### Left as-is, deliberately

- [measureInWindow.ts:44](../package/src/components/Message/utils/measureInWindow.ts:44) uses `Dimensions.get('screen')` as a **generous sanity bound** (x2) for corrupt Android measurements. Screen >= window always, so reading screen makes the threshold more permissive, never less. Correct as written.
- [KeyboardCompatibleView.tsx:136](../package/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx:136) computes `screen.height - window.height` inside an `if (Platform.OS === 'android')` branch, so iOS resizing never reaches it.

---

## 3. Changes made

Core SDK plus SampleApp, on `chore/duo-readiness-audit`. Nothing under `examples/ExpoMessaging` is touched.

**Finding #1 — horizontal insets.** SDK surfaces that own the window (they render above the consumer's own `SafeAreaView`, so the consumer _cannot_ inset them):

- `UIComponents/SafeAreaViewWrapper.tsx` — `edges` now all four
- `ImageGallery/components/ImageGalleryFooter.tsx` — `edges` gains `left`/`right` (share button at one edge, grid button at the other)
- `UIComponents/BottomSheetModal.tsx` — content container padded
- `MessageInput/MessageComposer.tsx` — wrapper padded per side
- `ChannelDetails/components/ChannelDetailsNavHeader.tsx` — padded per side

SampleApp insets its own in-flow content, which is the consumer's job:

- `components/ScreenHeader.tsx`, `components/BottomTabs.tsx`, `screens/ChannelListScreen.tsx`

**Finding #10/#11 —** `hooks/useAppStateListener.ts` rewritten; `hooks/__tests__/useAppStateListener.test.tsx` rewritten (the old test _codified_ the bug at line 16).

**Finding #6/#7 —** new `hooks/useContainerWidth.ts`; new `AttachmentPickerTileSizeContext.tsx`; `MediaList.tsx`, `ImageGrid.tsx`, `AttachmentMediaPicker.tsx`, `AttachmentPickerItem.tsx`.

**Findings #2/#3/#4/#5/#9 —** `hooks/useScreenDimensions.ts`, `shared-native/ios/StreamShimmerView.swift`, `MessageItemView.tsx`, SampleApp `Toast.tsx`.

One snapshot updated (`Thread.test.tsx`): `paddingHorizontal: 16` became `paddingLeft: 16, paddingRight: 16`. Same value at zero insets — a representation change only, inspected before accepting.

Synced copies under `package/{native,expo}-package/ios/shared/` were regenerated with `shared-native:sync`; they are gitignored, so only `shared-native/` appears in the diff.

`examples/SampleApp/ios/Podfile.lock` and `.../project.pbxproj` carried local pod-install churn (CocoaPods 1.17.0 reformatting, plus the 9.8.0 -> 9.9.1 version bump). Unrelated to this work, so both were reset to `develop` and are not in the diff.

### A second style pitfall: padding does not reach absolute children

`position: 'absolute'` children are offset from their container's **border box**, so a container's
horizontal padding never reaches them. Every inset applied as padding therefore missed them silently.

Found when the scroll-to-bottom button was spotted sitting inside the reserved column: `MessageList`
had `paddingRight: 84`, but the button's own `right: 16` still measured it from the screen edge, so it
landed at 406-445pt, squarely under the system indicators. It is an interactive control, so this was
the most reachable-but-unreachable element in the app.

The same applies to every absolute child of a padded container. Fixed by adding the inset to the
offsets themselves, in `MessageList` and `MessageFlashList` (`scrollToBottomButtonContainer`,
`stickyHeaderContainer`, `unreadMessagesNotificationContainer`) and `MessageComposer`
(`audioLockIndicatorWrapper`). `floatingWrapper` was deliberately left alone: the inner `wrapper` it
contains already insets, and doing both would double-pad.

### A style pitfall this work walked into twice

Merging an inset as a `paddingLeft` longhand over a base style that uses the `padding` shorthand
**replaces** that side's padding rather than adding to it. Assigning a raw `insets.left` of 0 therefore
silently drops existing padding - which is exactly what happened to SampleApp's header, where the
avatar went flush to the screen edge.

Two defences are now in place. `useHorizontalInsets` omits a side entirely when its inset is 0, so it
is a no-op on every device and orientation with zero horizontal insets and can never zero out a
component's own padding or a consumer's theme override. And where a base padding does exist
(`ScreenHeader`, `MessageComposer`, `ChannelDetailsNavHeader`), the inset is **added** to a named
constant rather than substituted for it.

### Architectural decision worth reviewing

**Revised during the audit.** The SDK originally applied horizontal insets only on surfaces that own the window, leaving in-flow content to the consumer. That was wrong, and inconsistent with `MessageComposer`, which already insets itself: the message list, thread list and channel list all still ran underneath the system indicators. The SDK now insets its own full-width list roots (`MessageList`, `ChannelList`, `ThreadList`) via `useHorizontalInsets`, and SampleApp's screen-level wrapper was removed so the two do not double-pad.

The residual risk is the inverse: a consumer who already wraps an SDK list in a `SafeAreaView` with horizontal edges now gets double padding. That is mitigated but not eliminated by the zero-inset omission above, and is the decision to revisit if it bites.

---

## 4. Finding #8, withdrawn

I originally flagged `translationX` at [ImageGallery.tsx:258](../package/src/components/ImageGallery/ImageGallery.tsx:258) as freezing at the launch width, because `useSharedValue` does not re-initialise when its seed changes. On closer reading there is a `useAnimatedReaction` with `[fullWindowWidth]` in its dependency list at [ImageGallery.tsx:264-270](../package/src/components/ImageGallery/ImageGallery.tsx:264) that rewrites it. Whether that reaction fires when deps change — as opposed to only on subsequent changes to the watched value — decides whether the bug exists.

Settled by reading the installed Reanimated source rather than reasoning about it:

- `useAnimatedReactionBase` re-runs its `useEffect` when deps change, calling `stopMapper` then `startMapper` with a worklet closing over the new width (`useAnimatedReactionCommon.ts:35-47`).
- `start()` registers the new mapper with **`dirty: true`** and sets `isAnyMapperDirty = true` (`mappers.native.ts:159,166`).
- `mapperRun()` executes every dirty mapper on the next frame (`mappers.native.ts:85-102`).

So the reaction does fire on dep change and `translationX` is correctly recomputed for the new width, one frame later. **Not a bug; no code changed.**

---

## 5. Verification

| Check                                                              | Result                                                                                 |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `yarn lint`                                                        | **exit 0**, zero warnings                                                              |
| `cd package && yarn test:typecheck`                                | **clean**                                                                              |
| `yarn test:unit`                                                   | **186 suites passed, 1517 tests passed, 12 snapshots passed**                          |
| iOS build, Xcode 27.1 Beta, `iphonesimulator27.1`, Duo destination | **BUILD SUCCEEDED** (twice: before and after the native changes)                       |
| `StreamShimmerView.swift` after rewrite                            | recompiled, **0** errors/warnings attributed to it                                     |
| App launched on iPhone Duo (iOS 27.1)                              | **launched, rendered** on both the folded outer display and the unfolded inner display |
| `getNumberOfColumns` unit tests                                    | **11 new tests**, pinning 3 columns below 600pt and 4/6 at the measured 669/951pt      |

SampleApp's own `tsc` reports 4 pre-existing errors about `thread` on `ThreadContextValue` in files this audit did not touch. Confirmed pre-existing by stashing the changes and re-running: same 4.

### Finding #1, before and after on the Duo

Same device, same build pipeline, outer display (`right: 84` inset):

|                       | Before                                               | After                             |
| --------------------- | ---------------------------------------------------- | --------------------------------- |
| Row 1 timestamp       | hidden behind the system capsule, clipped to "...ay" | **"Friday"**, fully legible       |
| Header compose button | clipped under the reserved region                    | fully visible                     |
| Row 2                 | unread badge unreachable                             | **"3:50 PM" + badge "4"** visible |
| Row separators        | ran under the system indicators                      | stop at the inset boundary        |

Channel titles now truncate slightly ("Screenshot Orde..."). That is correct: the usable width genuinely shrank by 84pt.

Toolchain note: default `xcode-select` here is **Xcode 27.0** (which would give "extended coverage" behaviour). Every build in this audit used **Xcode 27.1 Beta** via `DEVELOPER_DIR`, leaving `xcode-select` untouched.

Temporary artifacts created and removed: a probe component in SampleApp (reverted) and a `DuoAuditPad-TEMP` iPad simulator (deleted).

---

## 6. Still unverified

The device was unfolded mid-audit, which cleared most of what was previously blocked. What remains:

| Item                                         | Why                                                                                                                                                                                                                                                            | What would unblock it                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Interactive testing on the inner display** | The simulator MCP tool binds to the **outer** display's coordinate space (466x678) and its taps do not reach the inner display - confirmed by tapping a channel row and observing no navigation. Inner-display screenshots work fine via `simctl io --display` | Tooling limitation; drive it by hand in Device Hub |
| **Fold/unfold as a live resize**             | Same limitation: I can screenshot either display but cannot fold or unfold programmatically. `simctl ui` has no posture option                                                                                                                                 | Fold by hand in Device Hub while watching a screen |

Two consequences of the fixes that are correct but worth knowing:

- `MediaList` and `ImageGrid` key a `FlatList` remount on column count. RN does not support changing `numColumns` on a mounted list, so this is required. Crossing the 600pt breakpoint - a fold, or rotating a phone - would reset the grid to the top; `MediaList` restores its place with `useGridScrollAnchor`. `ImageGrid`'s count comes from a prop, not the width, so rotation never remounts it.
- The picker items keep a window-based size as a fallback for being rendered outside the picker's own list. Inside it, the measured value always wins.

Nothing is blocked on upstream React Native, Expo, `react-native-screens` or `react-native-safe-area-context`. `react/react-native#58606` describes exactly the ExpoMessaging P0, which is documented in §4 but not fixed here.

## 7. Cross-check against external guidance

Checked against <https://iphoneduosupport.com/frameworks/react-native/> (published by Ingenious Techlab, an iOS consultancy; says it derives from Apple's developer resources and Tech Talks, but cites no specific ones). A **secondary source, not Apple** — treated as leads to verify.

**Independently confirmed by my own measurements:** outer display **466pt** (exact match); inner aspect ratio **1.42:1** (inner framebuffer 2007x2853 = 1.4216); module-scope `Dimensions.get` caching; asymmetric insets.

**What it caught that my sweeps missed:** its warning that _"in Split View a visible app can be inactive"_ produced findings **#10 and #11** — #10 being a P1 on the default configuration. My Phase 5 sweep looked for remounts and dimension-keyed effects and never thought to check `AppState`. That is a real bug this audit would otherwise have shipped past.

Its warning against `Math.max(insets.left, insets.right)` was worth running and came back clean — the repo had no `insets.left`/`insets.right` reads at all, which _was_ finding #1.

**Where it is wrong — the inner display's point width.** The site says **626 x 890pt**, and the brief I was given said "roughly 626pt". Both are incorrect. Measured live on the unfolded inner display:

```
win 951x669 @3    scr 466x678 @3    ins t0 b34 l0 r84
```

951 x 3 = 2853 and 669 x 3 = 2007, matching the inner framebuffer exactly, so the inner display is **669 x 951pt** in portrait and 951 x 669 in landscape. My earlier arithmetic from the framebuffer was right and the 626 figure does not survive contact with the device. Anyone taking 626pt from that page as a breakpoint would be off by 43pt.

The same measurement produced a second correction, this time to my own report. I had written that `screen` is _larger_ than `window` (834 vs 417 on iPad). On the unfolded Duo it is **smaller**: `Dimensions.get('screen')` still reports the **outer** display at 466pt while the window is 951pt. So `screen` is not a safe proxy for the window in either direction, and code sizing from it on the inner display renders at under half width rather than overflowing.

## 8. Consumer-facing notes (draft — not for publication)

> **iPhone Duo and resizable iPhone apps (iOS 27)**
>
> From iOS 27 every iPhone app is resizable — Split View, and the fold/unfold of iPhone Duo. This release makes the SDK correct on those devices. You do not need to detect the device.
>
> **Fixed**
>
> - Components that own the window — the image gallery, bottom sheets, modals, the message composer and the channel details header — now apply the **horizontal** safe-area insets. On a foldable the system indicators stack down one side (measured `left: 0, right: 84` on iPhone Duo), and content previously rendered underneath them.
> - The SDK no longer treats iOS's `inactive` state as "backgrounded". An app sharing the screen in Split View stays `inactive` while fully visible; the SDK previously closed the WebSocket and showed an offline banner in that state. It now only reacts to a real `background` transition. This also stops the connection dropping during transient `inactive` moments such as Control Center or the app switcher.
> - The media grid in channel details now picks its column count from its own width instead of a hardcoded 3, and accepts a `numberOfColumns` prop. Portrait phone layouts are unchanged; wider containers, including a phone in landscape, get more columns and keep their scroll position across the change.
> - Attachment picker and image-gallery grids size their tiles from their own container rather than the window.
>
> **Check in your own app**
>
> 1. **Insets are no longer symmetric, and `top` can be 0.** Read each edge separately from `useSafeAreaInsets()`. Applying one value to both horizontal edges, or assuming the status bar is at the top, will misplace content.
> 2. **`Dimensions.get('screen')` is not your window.** We measured an 834pt screen behind a 417pt app window. Use `useWindowDimensions()` for layout.
> 3. **In-flow SDK components inherit their horizontal insets from you**, exactly as they already do for the top inset. Wrap your screens in a `SafeAreaView` with `left`/`right` edges.
> 4. **Expo SDK 57 projects do not launch on iOS 27.** Its prebuild template still creates the window in `application(_:didFinishLaunchingWithOptions:)` with no `UIApplicationSceneManifest`, which iOS 27 rejects with "UIScene life cycle is required". Upgrade to SDK 58, or adopt the scene lifecycle with a config plugin.
>
> **Deprecated:** `useScreenDimensions` — its `vw`/`vh` are percentages of the screen, not the window. Use `useViewport` (same API, measured against the window), or `onLayout` on your own view inside a component that does not fill the window. It still works unchanged and will be removed in the next major.

---

## 9. Second-pass audit

After the first round of fixes was running on the device, the whole sweep was re-run. It found **five**
more real defects. Every one is a second instance of a class already found and fixed once elsewhere -
which is the useful lesson: the first pass fixed the instance it found rather than the class.

| #   | Sev    | File                                                                                                                             | What was missed                                                                                                                                                                                                          | Why the first pass missed it                                            |
| --- | ------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 12  | **P1** | [MessageFlashList.tsx](../package/src/components/MessageList/MessageFlashList.tsx)                                                  | A complete **alternative message list**, switchable at runtime from SampleApp's secret menu, with the same two unpadded container roots as `MessageList`                                                                 | Searched for the component I knew about rather than for every list root |
| 13  | **P2** | [KeyboardCompatibleView.tsx:217](../package/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx:217)                   | Its **own** `AppState` handler, conflating `inactive` with `background` exactly as `useAppStateListener` did. In Split View a visible app would drop its keyboard listeners, so the composer stops tracking the keyboard | Fixed the shared hook and assumed that was the only listener            |
| 14  | **P2** | [AttachmentPicker.tsx](../package/src/components/AttachmentPicker/AttachmentPicker.tsx)                                             | Uses `@gorhom/bottom-sheet`'s `BottomSheet` **directly**, bypassing `UIComponents/BottomSheetModal` and so the inset fix applied there                                                                                   | Assumed one bottom-sheet abstraction; there are two                     |
| 15  | **P2** | [modal/Modal.tsx](../package/src/components/ChannelDetails/components/modal/Modal.tsx)                                              | Full-window modal hosting the member and media lists, applying only `paddingTop`                                                                                                                                         | Inventoried `SafeAreaView` users, not `Modal` users                     |
| 16  | **P2** | [MediaListLoadingSkeleton.tsx](../package/src/components/ChannelDetails/components/navigation-section/MediaListLoadingSkeleton.tsx) | Still hardcoded 3 columns off the window while the grid it stands in for had moved to a measured, derived count - the layout would visibly jump from 3 tiles to 6 on load                                                | Changed the grid without checking its placeholder                       |

Two further things the second pass settled rather than changed:

- [MessageOverlayHostLayer.tsx](../package/src/contexts/overlayContext/MessageOverlayHostLayer.tsx) is a
  full-window overlay that reads only vertical insets, which looks like the same bug but is not. It
  positions its content from `measureInWindow` of the original message, which now comes from an
  already-inset list, so the horizontal offset is inherited. Insetting it again would double-shift it.
- Four `SafeAreaView`s in SampleApp still have no explicit `edges` prop. Implicit means **all** edges,
  which is the safe direction (over-inset, never under-inset), so they are recorded rather than churned.

### A style pitfall worth naming

Extracting `getNumberOfColumns` into `mediaListColumns.ts` was not cosmetic: having the skeleton import
it from `MediaList` would have created an import cycle, since `MediaList` renders the skeleton. This
repo already documents one circular-import hazard (`defaultComponents` uses a lazy `require` to break
it), so a second one was not worth adding.

---

## 10. Cross-check against Apple's Human Interface Guidelines

Checked against <https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo>
(Apple, page dated 2026-09-09). This is the primary source, unlike the consultancy page in §7, and it
reframes several things - most importantly it **explains the geometry measured in §1**.

### The measured insets finally make sense

Apple: _"the system moves controls to the side to preserve vertical space for content"_ - toolbars, tab
bars, navigation controls, **the status bar and the Dynamic Island** all move to the **vertical axis**
on the outer display, and stay there on the inner display in landscape. The exception is the inner
display in portrait, which keeps standard horizontal bars.

That is exactly the `top: 0, right: 84` measured on device. The 84pt reserved column is not an
anomaly - it is where the platform now puts the system controls. Apple states the design requirement
directly: _"Account for asymmetry in your layouts. Because controls sit along one edge, the space for
content is asymmetrical. Use safe areas to make sure controls don't cover your content."_

### Where this branch aligns with the guidance

| Apple guidance                                                                                                                              | Status                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| "Build your app to resize... Use size classes, layout margins, and safe area insets. Avoid fixed widths and display-specific dependencies." | Aligned. Fixed widths and module-scope `Dimensions` removed; layout derives from measured container width                                  |
| "Account for asymmetry... use safe areas"                                                                                                   | Aligned, and this was the single largest workstream. `left`/`right` are read separately and never collapsed                                |
| "steer clear of... anything tied to a specific display"                                                                                     | Aligned. `useScreenDimensions` deprecated precisely because `screen` is display-tied; `useContainerWidth` measures the component's own box |
| "prefer an even number of columns so content divides cleanly"                                                                               | **Now aligned** - the media grid was returning odd counts at some widths (5 at 800pt). Fixed and pinned by a test                          |
| "Maintain the same functionality across device poses"                                                                                       | Aligned. Nothing is hidden or disabled by width                                                                                            |

### Where React Native cannot follow the guidance

An earlier draft of this section claimed React Native simply cannot get the vertical bar placement.
**That was wrong, and testing disproved it.** The corrected picture:

**A real native bar does get the Duo treatment, and React Native can have one.** Verified empirically:
`headerShown: true` was temporarily enabled on one `createNativeStackNavigator` screen in SampleApp
(which already uses `react-native-screens` 4.27.0, so the header is a genuine `UINavigationController`
bar). On the Duo's outer display the system **relocated the back button into the reserved vertical
strip** - a circular chevron stacked below the clock and wifi indicator, inside the 84pt column. The
large title stayed horizontal at the top, which is also per spec: Apple notes _"Labels that include
text stay in a horizontal bar, so prefer a symbol wherever one works."_ The experiment was reverted.

So the requirement is not "use UIKit instead of React Native" - it is **the bar has to be an actual
native bar**. UIKit relocates `UINavigationBar` / `UITabBar` items; it cannot relocate a JavaScript
`<View>`, which is inert as far as the system is concerned.

**Why SampleApp does not get it.** It opts out of the native chrome on both axes:

- Every `Stack.Screen` sets `headerShown: false` and the app draws its own `ScreenHeader` in JS.
- The tab bar is `createBottomTabNavigator` with a custom `tabBar` prop rendering a JS view.

Both are ordinary, extremely common React Native choices - and both forfeit the platform behaviour,
which the two experiments above show is otherwise available for free. Adopting `Tabs.Host` and the
native stack header is a real option and the single highest-leverage change available for making an RN
app feel native on this device. It is a design decision for the sample app rather than a bug, so it is
recorded here rather than actioned - but it is no longer accurate to call it impossible.

**Native tab bars relocate too - also verified.** `react-native-screens` 4.27.0 ships `Tabs.Host` /
`Tabs.Screen`, backed on iOS by `RNSTabBarController`, a `UITabBarController` subclass. It is already
compiled into SampleApp's binary, so testing it needed no new dependency and no `pod install`. A
temporary three-tab probe rendered at the app root produced the clearest result of this audit: iOS
**moved the tab bar off the bottom entirely and drew it as a vertical pill on the trailing edge**,
three symbol icons stacked below the clock and wifi. Measured at **393-442pt**, wholly inside the
382-466pt reserved column. Reverted after measuring.

That is the platform pattern Apple describes, obtained from React Native with no native code written.
Note the probe used symbol-only items (`systemItem`), consistent with Apple's advice to prefer symbols
because text labels keep a bar horizontal.

**Genuinely unavailable in React Native today.** These have no JS bridge at all:

1. **`ReservedRegion` / `UIView.ReservedRegion`** - Apple's mechanism for keeping custom content clear
   of the camera and, critically, the **folding region**. Nothing in this codebase can currently avoid
   placing a control on the fold when the device is partially open.
2. **`ArrangementView` / `UIArrangementViewController`**, and `NavigationSplitView` /
   `UISplitViewController` - the containers Apple recommends for the inner display, which adapt their
   columns to the fold automatically.
3. **Toolbar overflow and visibility priorities** (`ToolbarItemVisibilityPriority`,
   `ToolbarVerticalCompressionBehavior`, `ToolbarOverflowMenu`).

### Where the guidance argues against a choice made here

**The grid remount on fold.** Apple: _"Avoid extreme layout changes as people fold the device. Move only
what's necessary to keep elements visible and easy to tap... favor small adjustments over rearrangement."_

`MediaList` and `ImageGrid` key a `FlatList` remount on column count, because React Native rejects a
change to `numColumns` on a mounted list. On its own that resets the grid to the top on every fold -
and, as testing on an iPhone 18 Pro Max showed, on every rotation of an ordinary phone, since landscape
crosses the breakpoint too. That is precisely the kind of jump this guidance warns against.

Now actioned: `useGridScrollAnchor` tracks the first visible item and scrolls the remounted list back
to the row holding it, verified on device across a portrait -> landscape -> portrait round trip. It
ignores scroll events that arrive with a changed viewport, because rotating to a taller viewport over
shorter content makes iOS clamp the offset before the grid re-lays out. The layout still reflows
rather than adjusting in place; a `flexWrap` layout would avoid the remount entirely, at the cost of
list virtualization.

**Two-pane layouts are Apple's explicit recommendation, not a nice-to-have.** Apple: _"show an additional
level of hierarchy on the larger inner display if it makes sense for your content. Mail, for example,
shows either a list of emails or an email when the device is closed. When it's open, it shows both side
by side."_ That is exactly `ChannelList` + `Channel`. §4 lists this as deliberately not done pending
sign-off; the HIG raises its priority from polish to the headline adaptation, so it deserves a product
decision rather than sitting in a backlog.

### Smaller points worth noting

- Apple confirms **Device Hub in Xcode** is the tool for previewing poses, which matches what this audit
  found empirically: Xcode 27 ships no `Simulator.app`.
- The **inner camera** is a reserved region _only while the camera is active_, and the UI is expected to
  move aside when it activates. Not applicable to these packages (no capture surface), but relevant to
  Stream's Video SDK.
- Apple says a full-width layout is fine _"for visual, immersive interfaces that don't scroll, as long as
  nothing conflicts with the Dynamic Island or the status bar."_ The image gallery is the one surface
  here that plausibly qualifies; it currently insets its footer controls, which is the safe reading.
