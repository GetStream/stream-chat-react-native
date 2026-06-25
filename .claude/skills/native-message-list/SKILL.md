---
name: native-message-list
description: Use when working on the first-party native Android recycled MessageList for stream-chat-react-native — the "native list" spike (StreamMessageListView; New-Arch/Fabric-only; Android-only; opt-in flag) meant to replace FlatList/FlashList/LegendList. Orients you fast — what it is, where everything lives, current state + next steps, how to work on it, and the load-bearing design rules.
---

# Native message list

A long-term effort: a first-party **native Android recycled list** for the SDK's `MessageList` (New-Arch/Fabric-only, Android-only, behind an opt-in flag), replacing FlatList/FlashList/LegendList for full control over jank / blank / memory. Model: **JS owns recycling + variable-height windowing; native owns scroll, absolute positioning, render-ahead, and our own MVCP.** Must stay a drop-in for `MessageList` (imperative scroll, scroll-to-bottom, jump-to-message, prepend-without-jump, viewability, sticky header, pagination, a11y). Discord-FastestList / FlashList-V1 inspired. **No `RecyclerView` hosting React rows** (it fights Fabric) — recycling stays in JS; native only repositions Fabric-mounted children.

## Read these first (the map)

- **Full plan — M1→M4, parity contract, milestones:** `/Users/isekovanic/.claude/plans/hi-claude-since-we-ve-vivid-aurora.md`
- **Architecture, hard-won findings, dev gotchas, commit log:** memory `[[native-recycled-list]]`
- **Chronological build journal (how/why + meta-lessons):** memory `[[native-recycled-list-log]]`
- **Scroll/MVCP fixes — per fix: what / regression-test / why-NOT-to-revert:** memory `[[native-list-scroll-mvcp-fixes]]` — *check before touching the scroll engine or the JS window.*
- Standing rule: keep those memories current after each commit (`[[feedback-update-native-list-memory]]`).

## The code

- **Native engine:** `package/shared-native/android/StreamMessageListLayout.kt` (OverScroller engine, MVCP anchor, stick-to-bottom, `dispatchDraw` clip) + `StreamMessageListViewManager.kt` (ViewGroupManager). Authored in `shared-native/`; synced into both wrappers — **never edit the synced copies.**
- **JS:** `package/src/components/MessageList/NativeMessageList/index.tsx` (windowing, absolute positioning, the JS half of MVCP).
- **TS spec:** `package/native-package/src/native/StreamMessageListViewNativeComponent.ts` (mirrors `StreamShimmerViewNativeComponent.ts`).
- **Spike harness (test bed, never ship):** `examples/SampleApp/src/screens/NativeListSpikeScreen.tsx` — 1000 fake rows; buttons **Older** (prepend), **+1** (append), **Burst** (append 20–25).
- **Template to copy:** `StreamShimmerFrameLayout.kt` / `StreamShimmerViewManager.kt` (proven codegen ViewGroupManager path).

## Current state — UPDATE this on each commit

- Branch `chore/legendlist-poc-2`. **M1 (prove the engine) is essentially done:** native fling scroll, JS recycle/windowing, absolute positioning, our MVCP — prepend holds position, stick-to-bottom works, and the whole scroll/MVCP **flicker class is fixed** (see `[[native-list-scroll-mvcp-fixes]]`).
- **Next:** **#8** imperative commands + ref bridge (`scrollToIndex` / `scrollToOffset` / `scrollToEnd` / `setNativeProps`; net-new `codegenNativeCommands` / `receiveCommand` — *no repo precedent, prove the round-trip in isolation*) → **#9** integrate behind an `enableNativeMessageList` flag + on-device perf proof vs FlatList on a real channel. Then **M2** parity (real onScroll/viewability/pagination), **M3** canvas skeletons (kill blank on fling), **M4** robustness + flag rollout.
- **Deferred / known:** #4-Part-2 first-prepend break (spike-only — real chat paginates near the *top*, never 1–2 rows from the bottom).

## How to work on it

- **Build:** edit `shared-native/` Kotlin → `yarn workspace stream-chat-react-native-core shared-native:sync` → `yarn workspace sampleapp android`. After JS changes: `yarn test:typecheck`.
- **Debugging discipline (the one that actually worked):** instrument → reproduce on device → **confirm the cause from the logs → THEN fix** → verify. Guess-fixing cost two wrong turns on this project. Tools: `adb logcat` (native tag `StreamMsgList`, JS tag `ReactNativeJS`), `adb exec-out screencap -p`, `adb shell input swipe/tap`; drive the spike via Older/+1/Burst.
- **Gotchas:** taps in the first ~14s post-launch are dropped; `Read` on a screencap needs ≤2000px (downscale `sips -Z 1600`); commitlint (conventional messages) + pre-commit `yarn lint` (max-warnings 0, watch `no-bitwise` on `>> 1`); repeated `am force-stop`+restart disrupts the developer's live session — don't reload gratuitously.
- **Git:** `git-hands-off` — never commit; hand the developer the file list.
- **Load-bearing design rule (don't relearn the hard way):** native can't tell a prepend from an append/measurement from `contentHeight` alone — the **anchor delta** distinguishes prepend (above-fold → *hold position*) from append (→ *stick to bottom*), and **JS is the source of truth for change-type**. `[[native-list-scroll-mvcp-fixes]]` lists the exact rules and why each shape must not be "simplified."
