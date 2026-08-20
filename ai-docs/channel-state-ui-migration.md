# Unified `channel.state` migration — UI-SDK change reference

> **What this is.** A record of what `stream-chat-react-native` changed on its **UI side** when it
> moved onto the unified `channel.state` (the `stream-chat` v10 reactive state). It exists as a
> **guideline** for the equivalent work in the other UI SDK — a map of the *kinds* of change and the
> surface RN touched, not a checklist of anyone else's files. The model-layer work is already done
> in the LLC; this covers only the consuming (UI) side. LLC-side and integrator-facing detail lives
> in `ai-migration-v9-to-v10.md` Part K.

## The LLC change, in one line

`channel.state` became a single `StateStore<ChannelStateData>` — subscribe with
`useStateStore(channel.state, selector)`, like `thread.state`. The per-concern handles
(`readStore` / `typingStore` / `membersStore` / `watcherStore` / `ownCapabilitiesStore` /
`mutedUsersStore`) were removed; the state is flat and gained new slices (`data`, `membership`,
git`muteStatus`, `initialized` / `offlineMode` / `pendingDisposal` (replaces `disconnected`, which is
removed), `active`, `aiState`). AI-indicator
state and its connection-loss resets are now LLC-owned.

## What RN changed on the UI side

**1. Reads off the removed `*Store` handles → `useStateStore(channel.state, sameSelector)`.**
Mechanical: delete the `.<X>Store` segment and keep the selector verbatim — the flat
`ChannelStateData` carries the same top-level keys, so a `(s: ReadState) => O` stays contravariantly
assignable to `(s: ChannelStateData) => O`. This covered the read / typing / members / watcher /
ownCapabilities consumers.

**2. Hooks moved off ad-hoc `channel.on(...)` / direct `channel.data` reads onto `channel.state` slices.**
- name / image / member-count / membership → the `data` / `memberCount` / `membership` slices.
- mute (`useIsChannelMuted`, `useChannelMuteActive`) → the reactive `muteStatus` slice; dropped the
  `client.on(...)` subscription + imperative `channel.muteStatus()` call. `useMutedChannels` stayed
  event-based on purpose (it's the client-global muted-channel *list*, not this channel's status).

**3. Channel lifecycle wired.** `<Channel>` calls `channel.activate()` on mount and
`channel.deactivate()` on unmount (refcounted). This is what gates the reconnect no-destructive-reseed
of an open channel's message list.

**4. AI indicator.** `useAIState` became a thin `useStateStore(channel.state, (s) => ({ aiState: s.aiState }))`
reader — the public `{ aiState }` shape is unchanged, and it now honors `ai_indicator.stop`. The
connection-loss reset (clear the indicator when the WS drops or on a deliberate close such as
backgrounding) is **LLC-owned**, so there is no UI code for it. Two consumer sites were tightened for
the now-literal `AIStates` union: `AITypingIndicatorView`'s allowed-states map and `OutputButtons`'
membership check.

**5. Test mocks.** Any mock of `channel.state` must now be a real `StateStore` — plain-object mocks
crash the `useStateStore` hooks (`getLatestValue is not a function`). RN added
`mock-builders/generator/channelState.ts` for this.

## The RN UI surface that ended up reading `channel.state`

Handles / hooks (the concrete scope RN touched):

- **read/receipts:** `Message/hooks/useMessageReadCount.ts`, `useMessageReadData.ts`,
  `useMessageDeliveryData.ts`, `Message/Message.tsx`, `MessageList/ScrollToBottomButton.tsx`
- **typing:** `MessageList/TypingIndicatorContainer.tsx`, `MessageList/hooks/useTypingUsers.ts`
- **members / watchers / online:** `ChannelList/hooks/useChannelMembersState.ts`,
  `ChannelList/hooks/useChannelOnlineMemberCount.ts`, `hooks/useChannelMemberCount.ts`,
  `hooks/useChannelMembershipState.ts`
- **capabilities:** `Channel/hooks/useCreateOwnCapabilitiesContext.ts`, `hooks/useChannelOwnCapabilities.ts`
- **channel data (name/image) / preview:** `hooks/useChannelName.ts`, `hooks/useChannelImage.ts`,
  `ChannelPreview/hooks/useChannelPreviewData.ts`
- **mute:** `ChannelPreview/hooks/useIsChannelMuted.ts`
- **composer / cooldown:** `MessageInput/MessageComposer.tsx`, `MessageInput/hooks/useCooldownRemaining.tsx`,
  `MessageInput/hooks/useIsCooldownActive.ts`
- **AI:** `AITypingIndicatorView/hooks/useAIState.ts`
- **test helper:** `mock-builders/generator/channelState.ts`

## Gotchas when consuming `channel.state`

Things that bit us / are easy to get wrong subscribing to the unified store:

- **Selectors must be referentially stable — define them at module scope.** `useStateStore` keys
  its subscription on `[store, selector]`, so an inline `(s) => ({ … })` re-subscribes on every
  render.
- **Selectors must return direct slice references, not freshly-computed values.** `useStateStore`
  shallow-compares the selected output per key with `===`. `(s) => ({ read: s.read })` is fine;
  `(s) => ({ members: Object.values(s.members) })` returns a new array every call, defeats the
  cache, and re-renders (or loops) forever. Do any deriving in the component, after the selector.
- **The selector must return an object or a readonly array, never a bare value.** Wrap it:
  `(s) => ({ read: s.read })`, not `(s) => s.read`.
- **The convenience getters are non-reactive.** Reading `channel.state.members` / `.read` /
  `.typing` / `.watchers` directly gives a one-shot snapshot; it does **not** subscribe. Use
  `useStateStore(channel.state, selector)` for anything that must re-render.
- **Drive unread badges off `read`, not `unreadCount`.** `channel.state.unreadCount` is a
  non-reactive getter over the store (it's what `channel.countUnread()` returns and what
  scroll-gating reads) — it derives from `read[ownUserId].unread_messages` rather than holding a
  count of its own, so there is nothing separate to `useStateStore`-select. Subscribe to `read` and
  read `read[userId]?.unread_messages` for a badge that re-renders.
- **Reactivity needs a store write, not a nested mutation.** Subscribers update only when the write
  side reassigns / `partialNext`es (e.g. reassign `channel.data` or `channel.state.membership`).
  Mutating a nested field in place (`channel.data.name = …`, `channel.state.membership.user = …`)
  changes the value but fires no notification.

## Finding the equivalent surface

Pattern-level, SDK-agnostic — how to locate the same surface in a codebase (what to do with it is
the reader's call):

- Grep for every `channel.state.<X>Store` read → maps to change #1 (drop the segment, keep the selector).
- Grep for bespoke `channel.on('ai_indicator.*')`, `channel.on('notification.channel_mutes_updated')`,
  or member/watcher event subscriptions in the UI → a `channel.state` slice (#2 / #4) likely covers it now.
- Any test that mocks `channel.state` as a plain object → change #5.
