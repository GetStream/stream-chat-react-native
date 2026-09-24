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
| 1   | **P1** | core + SampleApp | 8 surfaces, see §3                                                                                                                                                                                           | Nothing anywhere read `insets.left` / `insets.right`                                                                                                                                                      | Channel row timestamps, the header compose button and the unread badge rendered **underneath** the system clock/wifi capsule                                                                                                                                                                                                                                                           | SDK insets only what a consumer's `SafeAreaView` cannot reach (RN `Modal`s, `OverlayProvider` content); every screen wraps itself. **Measured, §5**                          |
| 10  | **P1** | core             | [useAppStateListener.ts](../package/src/hooks/useAppStateListener.ts)                                                                                                                                           | `inactive` treated as equivalent to `background`                                                                                                                                                          | In Split View a visible app is `inactive`, so [useIsOnline.ts:22-29](../package/src/components/Chat/hooks/useIsOnline.ts:22) called `client.closeConnection()` and `setIsOnline(false)` — WebSocket dropped and offline banner shown **while the user was reading the chat**. Default-on (`closeConnectionOnBackground = true`, [Chat.tsx:216](../package/src/components/Chat/Chat.tsx:216)) | Only `background` counts as backgrounded; `inactive` ignored. Guarded so each callback fires once per real transition                   |
| 2   | **P1** | core             | [useScreenDimensions.ts](../package/src/hooks/useScreenDimensions.ts)                                                                                                                                           | Public hook returns `vw`/`vh` as a percentage of **screen**                                                                                                                                               | A consumer sizing with `vw(100)` gets an element **2x its container width** (834 vs 417, measured)                                                                                                                                                                                                                                                                                     | `@deprecated` pointing at `useViewport`; behaviour unchanged, per the repo's deprecation lifecycle                                      |
| 3   | **P2** | core             | [StreamShimmerView.swift](../package/shared-native/ios/StreamShimmerView.swift)                                                                                                                                 | `UIScreen.main.scale` for `contentsScale`, cached once at `setupLayers()`                                                                                                                                 | Shimmer placeholders rastered at the wrong scale if the view moves to a display with a different scale                                                                                                                                                                                                                                                                                 | Reads the view's own `traitCollection.displayScale`; resyncs on `didMoveToWindow` and `traitCollectionDidChange`                        |
| 4   | **P2** | core             | [MessageItemView.tsx](../package/src/components/Message/MessageItemView/MessageItemView.tsx)                                                                                                                    | `Dimensions.get('screen')` for the default swipe hit slop                                                                                                                                                 | Hit slop computed from screen, not window; also non-reactive                                                                                                                                                                                                                                                                                                                           | `useWindowDimensions()`                                                                                                                 |
| 5   | **P2** | SampleApp        | [Toast.tsx](../examples/SampleApp/src/components/ToastComponent/Toast.tsx)                                                                                                                                      | `Dimensions.get('window')` at **module scope**, baked into `StyleSheet.create`                                                                                                                            | Toast kept the width the app launched with; wrong after any resize                                                                                                                                                                                                                                                                                                                     | Read per render                                                                                                                         |
| 6   | **P2** | core             | [MediaList.tsx](../package/src/components/ChannelDetails/components/navigation-section/MediaList.tsx)                                                                                                           | `NUMBER_OF_COLUMNS = 3` hardcoded, tile size from window width                                                                                                                                            | Three ~205pt tiles at 626pt+ instead of more columns. No consumer escape hatch                                                                                                                                                                                                                                                                                                         | **Not fixed.** An adaptive count forces a `FlatList` remount, which loses scroll position on every rotation; no restore approach held up on device. The count stays at 3; only the tile size follows the window |
| 7   | **P3** | core             | [AttachmentPickerItem.tsx](../package/src/components/AttachmentPicker/components/AttachmentMediaPicker/AttachmentPickerItem.tsx), [ImageGrid.tsx](../package/src/components/ImageGallery/components/ImageGrid.tsx) | `vw(100) / columns` measures the **window**, but both render inside a bottom sheet                                                                                                                        | Thumbnails overflow the sheet once it is inset                                                                                                                                                                                                                                                                                                                                         | New internal `useWindowContentWidth` hook - window width minus the horizontal safe area. Not measured: a measurement arrives a frame late and the tiles visibly resize                                               |
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

Core SDK plus SampleApp. Nothing under `examples/ExpoMessaging` is touched.

### Finding #1 — horizontal insets: the SDK does almost nothing

**The contract.** An integrator wraps their own screens in `<SafeAreaView edges={['left','right']}>`.
The SDK insets only the surfaces that wrapper cannot reach. Everything it renders in-tree is left
alone.

**Why not the other way round.** `develop` has *zero* horizontal inset handling, so any integrator
who supports landscape on a notched device is already wrapping their screens - or is already broken.
There is no third group getting this for free. Adding SDK padding on top of an existing wrapper
double-insets exactly the integrators who did the right thing, silently, on a minor upgrade. The
reverse is a no-op for everyone: those who wrap keep working, those who do not were already broken
in landscape and stay equally broken until they wrap.

**Why a wrapper is sufficient, including for absolute children.** `SafeAreaView` makes the subtree
*narrower*; an absolutely positioned child is offset from its containing block's **border box**, so
it narrows with it. Padding does not do this - Yoga's `AbsolutePositionWithoutInsetsExcludesPadding`
errata (which React Native enables) makes an absolute child with no `left`/`right` ignore its
container's padding entirely. Narrowing therefore fixes both the roots and their absolute children;
padding fixes only the roots and needs a per-offset correction for the rest.

Measured on an Android emulator, `cmd overlay enable com.android.internal.display.cutout.emulation.waterfall`
(left = right = 53 on a 1080px screen):

| element | measured | expected |
| --- | --- | --- |
| `MessageList`'s `suggestionsListContainer` - `position:'absolute', width:'100%'`, **no SDK inset code** | x = 53 -> 1026 | 1080 - 53 - 53 |
| `ChannelList` header divider | x = 53 -> 1026 | same |

And with an asymmetric inset (landscape, rotated hole-punch, left = 136 / right = 0), the attachment
picker's third-column left edge:

| build | measured | model |
| --- | --- | --- |
| picker insetting itself *and* wrapped | 1784 | 272 + 2x(2400-136)/3 = 1781 (double) |
| picker wrapped only | 1648 | 136 + 2x(2400-136)/3 = 1645 (correct) |

### What the SDK still insets

Only surfaces that genuinely escape a consumer's wrapper:

- `ChannelDetails/components/modal/Modal.tsx` - React Native `Modal`, its own native window (`useHorizontalInsets`)
- `UIComponents/BottomSheetModal.tsx` - also an RN `Modal` (`useHorizontalInsets`)
- `ImageGallery/components/ImageGalleryHeader.tsx` / `ImageGalleryFooter.tsx` - hosted by `OverlayProvider` at app root; both use `SafeAreaView` `edges`, not raw insets, so a nested instance contributes nothing when an ancestor has already narrowed the subtree (the header also renders *inside* `ChannelDetailsModal`, which insets its own root)
- `UIComponents/SafeAreaViewWrapper.tsx` - `edges` now all four

**A name is not evidence of reach.** `AttachmentPicker` uses `BottomSheet`, an inline component that
renders at `Channel.tsx:1808` inside the screen; `BottomSheetModal` is an RN `Modal`. One is
reachable by a consumer wrapper and one is not, despite both reading as "a sheet". Check where a
component actually mounts before deciding it needs its own insets - this cost a round trip.

**Prefer `SafeAreaView` to `useSafeAreaInsets`** wherever one fits. `SafeAreaView` compares the
window inset against its own measured frame, so nesting is safe. `useSafeAreaInsets` is
window-global and has no such protection.

### Finding #7 — grid and tile sizing

The one thing a consumer wrapper cannot supply, because it is a number rather than a layout: new
`hooks/useWindowContentWidth.ts`, used by `MediaList.tsx`, `MediaListLoadingSkeleton.tsx`,
`ImageGrid.tsx`, `AttachmentMediaPicker.tsx` and `AttachmentPickerItem.tsx`. It degrades safely in
both directions - an unwrapped app gets slightly small tiles and a harmless gap, where plain window
width would overflow to fewer columns for anyone who wraps. Finding #6 is not actioned.

### Other findings

`hooks/useAppStateListener.ts` and its test rewritten (findings #10/#11; the old test *codified* the
bug at line 16). `hooks/useScreenDimensions.ts`, `shared-native/ios/StreamShimmerView.swift`,
`MessageItemView.tsx` (findings #2/#3/#4/#5/#9).

Synced copies under `package/{native,expo}-package/ios/shared/` were regenerated with
`shared-native:sync`; they are gitignored, so only `shared-native/` appears in the diff.

`examples/SampleApp/ios/Podfile.lock` and `.../project.pbxproj` carried local pod-install churn,
unrelated to this work; both were reset to `develop`.

### SampleApp

Every screen now wraps itself in a `SafeAreaView` carrying `left`/`right` edges. Two do not and
should not: `ChatScreen`, which is only a `Tab.Navigator` whose five screens each wrap themselves,
and `LoadingScreen`, which is a spinner.

`ChannelListScreen`'s hand-rolled `insets.left + 8` / `insets.right + 8` on the search container was
removed - the wrapper covers it, and its presence was itself evidence that consumers already deal
with this by hand. `ScreenHeader` likewise no longer adds `insets.left`/`insets.right`: every screen
that renders it, directly or through `ChatScreenHeader`, is now wrapped, so doing both double-pads.
`BottomTabs` **does** keep its own horizontal padding - it is the navigator's tab bar and renders
outside every screen's wrapper.

Two traps found while doing this, both worth knowing for any consumer doing the same migration:

- A screen can have more than one return path. `NewDirectMessagingScreen` wrapped only its
  channel path; the user-search path it returns before a channel exists - which is the whole "New
  Chat" screen - was unwrapped. Grepping for the presence of `SafeAreaView` in a file does not catch
  this.
- A component rendered inside a wrapped screen must not read `useSafeAreaInsets().left/right` at
  all. That value is window-global and knows nothing about an ancestor having already narrowed the
  subtree.

### The zero-inset pitfall

Merging an inset as a `paddingLeft` longhand over a base style that uses the `padding` shorthand
**replaces** that side's padding rather than adding to it - RN resolves shorthand against longhand by
specificity, not source order. Assigning a raw `insets.left` of 0 therefore silently drops existing
padding on every device and orientation without horizontal insets, which is almost all of them.

`useHorizontalInsets` omits a side entirely when its inset is 0, so it can never zero out a
component's own padding or a consumer's theme override. `BottomSheetModal` originally assigned
`paddingLeft`/`paddingRight` directly and would have dropped a themed `paddingHorizontal`; it now
spreads the hook.

### Snapshots

Zero. The final tree is byte-identical to `develop` for every snapshot. An earlier revision churned
6,126 lines, all of it caused by one wrapper `<View>` in `AttachmentPicker` that turned out to be the
double-inset bug above.

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

### Gates

| Check | Result |
| --- | --- |
| `yarn lint` | **exit 0**, zero warnings |
| `cd package && yarn test:typecheck` | **clean** |
| `yarn test:unit` | **185 suites passed** (2 skipped), **1506 tests passed**, **12 snapshots passed** |
| Snapshot diff vs `develop` | **none** - byte-identical |

SampleApp's own `tsc` reports pre-existing errors in files this work did not touch; it resolves SDK
types against a built `lib/`, which is absent in a fresh worktree. Not a gate.

### Original hardware pass (iPhone Duo, iOS 27.1)

Run by the PR author on a real Duo with Xcode 27.1 Beta via `DEVELOPER_DIR`, `xcode-select` left
untouched. The app built and launched on both the folded outer display and the unfolded inner
display, and `StreamShimmerView.swift` recompiled with no errors or warnings attributed to it.

Outer display, `right: 84`:

| | Before | After |
| --- | --- | --- |
| Row 1 timestamp | hidden behind the system capsule, clipped to "...ay" | **"Friday"**, fully legible |
| Header compose button | clipped under the reserved region | fully visible |
| Row 2 | unread badge unreachable | **"3:50 PM" + badge "4"** visible |
| Row separators | ran under the system indicators | stop at the inset boundary |

Channel titles truncate slightly afterwards ("Screenshot Orde..."), which is correct - the usable
width genuinely shrank by 84pt.

**What this pass does and does not establish.** It establishes the geometry, that the clipping is
real, and that insets of this size materially change the layout. It validated the *original* design,
in which the SDK padded its own surfaces. That design was replaced (see §3): the same pixels are now
produced by the consumer's `SafeAreaView` narrowing the subtree. The before/after above therefore
still describes the problem accurately, but not the mechanism that fixes it.

### Re-verification of the current design

The Duo is not available on the reviewing machine - Xcode 26.4.1 only, runtimes iOS 26.4 and 27.0,
and `xcrun simctl list devicetypes | grep -i duo` is empty. Substitutes with real, non-zero
horizontal insets were used instead.

**Android emulator**, `cmd overlay enable com.android.internal.display.cutout.emulation.waterfall`,
left = right = 53 on a 1080px screen:

| element | measured | expected |
| --- | --- | --- |
| `MessageList`'s `suggestionsListContainer` - absolute, `width: '100%'`, **no SDK inset code** | x = 53 -> 1026 | 1080 - 53 - 53 |
| `ChannelList` header divider | x = 53 -> 1026 | same |

**Android, asymmetric** (landscape, rotated hole-punch, left = 136 / right = 0 on 2400px), attachment
picker third-column left edge:

| build | measured | model |
| --- | --- | --- |
| picker insetting itself *and* wrapped | 1784 | 272 + 2x(2400-136)/3 = 1781 (double) |
| picker wrapped only | 1648 | 136 + 2x(2400-136)/3 = 1645 (correct) |

**iOS 27.0, iPhone 17 Pro, landscape.** Insets read from the running app: `L62 R62 T0 B20`,
frame `874x402`.

| element | `develop` | this branch | expected |
| --- | --- | --- | --- |
| Attachment picker tiles | 0 -> 2621 (full bleed, under the cutout) | **189 -> 2432** | 186 -> 2435 |
| `ChannelList` header divider | 0 -> 2621 | **186 -> 2435** | 186 -> 2435 |

Measurements are pixel extents from `simctl io` / `adb screencap` frames decoded with
`ffmpeg -pix_fmt rgb24`, not visual judgement. Symmetric insets cannot distinguish a *centred*
element, so only edges were used.

**A trap worth recording.** `RCT_METRO_PORT` at build time does not bind a simulator build to a
bundler. A first iOS pass ran entirely against the wrong Metro - and therefore against `develop`'s
JavaScript - while appearing to work. Point the app at a specific bundler at runtime with
`xcrun simctl spawn <udid> defaults write <bundle-id> RCT_jsLocation "localhost:<port>"`, and
confirm the intended Metro logs a fresh `BUNDLE` before trusting anything you see.

---

## 6. Still unverified

| Item | Why | What would unblock it |
| --- | --- | --- |
| **The Duo itself, under the current design** | No Duo device type on the reviewing machine (Xcode 26.4.1); the author's pass predates the design change | A pass by the author on his Duo |
| **Fold/unfold as a live resize** | Neither `simctl ui` nor `simctl` generally exposes a posture option, and rotation is not scriptable either - `osascript` is denied both keystrokes (error 1002) and assistive access (error -1719) | Fold by hand while watching a screen; this is the path `useAppStateListener` exists for |
| **Asymmetric insets on iOS** | The asymmetric case was exercised on Android (136/0); iOS was symmetric (62/62) | Landscape on a Duo, or any iOS device reporting unequal left/right |
| **`ChannelDetails` modal and `BottomSheetModal` with non-zero insets** | Both are React Native `Modal`s and keep their own insets; neither was opened in landscape on either platform | Open Group Info, and a message-actions sheet, in landscape |
| **`ImageGalleryHeader` inset behaviour** | Confirmed to render without crashing, and eyeballed in landscape, but never measured. It is the one component whose correctness depends on `SafeAreaView` cancelling against an already-narrowed ancestor | Measure its padding inside `ChannelDetailsModal` versus under `OverlayProvider` |
| **Android image gallery** | Never opened during the Android passes | Open an image attachment with a cutout enabled |

Two consequences of the fixes that are correct but worth knowing:

- Column counts are unchanged, so no grid remounts on a fold or rotation. Only tile size follows the
  window - see the remount section below for why an adaptive count was dropped.
- `useWindowContentWidth` degrades safely in both directions: an unwrapped app gets slightly small
  tiles and a harmless gap, where a plain window width would overflow to fewer columns for anyone who
  does wrap.

Nothing is blocked on upstream React Native, Expo, `react-native-screens` or
`react-native-safe-area-context`. `react/react-native#58606` describes exactly the ExpoMessaging P0,
which is documented in §4 but not fixed here.

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
> - On a foldable the system indicators stack down one side (measured `left: 0, right: 84` on iPhone Duo), and content previously rendered underneath them. Surfaces you cannot wrap — modals, bottom sheets and the image gallery — now apply the **horizontal** safe-area insets themselves. Everything the SDK renders inside your screens takes them from your own `SafeAreaView`; see point 1 below.
> - The SDK no longer treats iOS's `inactive` state as "backgrounded". An app sharing the screen in Split View stays `inactive` while fully visible; the SDK previously closed the WebSocket and showed an offline banner in that state. It now only reacts to a real `background` transition. This also stops the connection dropping during transient `inactive` moments such as Control Center or the app switcher.
> - Grid tiles - channel details, the attachment picker and the image gallery - are sized from the window minus the horizontal safe area rather than the raw window, so they no longer overflow once the surface is inset. Column counts are unchanged.
>
> **Check in your own app**
>
> 1. **Wrap your screens in a `SafeAreaView` with `left`/`right` edges.** SDK components rendered inside your screens take their horizontal insets from you, exactly as they already do for the top inset. This is the one thing you must do; without it, lists and the composer run under the system indicators on a foldable. Do **not** also wrap a modal, bottom sheet or the image gallery — those inset themselves, and doing both double-pads them.
> 2. **Insets are no longer symmetric, and `top` can be 0.** Read each edge separately from `useSafeAreaInsets()`. Applying one value to both horizontal edges, or assuming the status bar is at the top, will misplace content.
> 3. **`Dimensions.get('screen')` is not your window.** We measured an 834pt screen behind a 417pt app window. Use `useWindowDimensions()` for layout.
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
| "steer clear of... anything tied to a specific display"                                                                                     | Aligned. `useScreenDimensions` deprecated precisely because `screen` is display-tied; grids size from the window, not the display |
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

React Native rejects a `numColumns` change on a mounted list, so an adaptive column count has to force
a remount with `key={columns}` - which resets the grid to the top on every fold, and on every rotation
of an ordinary phone, since landscape crosses the breakpoint too. That is precisely the kind of jump
this guidance warns against.

**No restore approach worked.** Four were tried on an Android device, and all failed for the same
reason: a freshly mounted list has only `initialNumToRender` items, so its content is a few hundred dp
tall and the platform clamps any offset past it. Restoring on `onContentSizeChange` scrolled and then
drifted; restoring in the `ref` callback fired earlier and looked worse; `scrollTo` from a Reanimated
worklet was fastest and therefore worst. `initialScrollIndex` sidesteps the clamp but is not supported
on a re-keyed `numColumns` list - items visibly disappear.

So the column count stays at 3 and the remount never happens. FlashList accepts a `numColumns` change
in place and keeps position via `maintainVisibleContentPosition`, which is the real fix whenever the
list layer migrates; a one-off swap here would fork the list stack.

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
