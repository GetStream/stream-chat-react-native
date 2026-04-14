# Message Overlay Customization Notes

Status: design note / implementation history / future reference

Audience: SDK maintainers working on `Message`, message overlay, context menu customization, and performance-sensitive message rendering paths.

Scope: this note documents the customization problem we tried to solve, the approaches we explored, the performance constraints that matter in this codepath, what we implemented experimentally, why we stopped, and what a future production-ready solution should look like.

This document is intentionally detailed. `Message` is a hot path. Small architectural mistakes here get multiplied by every visible message row, every rerender, every scroll, and every overlay open/close cycle.

## Why This Came Up

We wanted to revisit message overlay customizability for a new major version.

The main integrator-facing goals were:

1. Top and bottom overlay items should be configurable or overridable.
2. The actual content portaled into the overlay should be overridable.
   In plain terms: integrators should be able to choose which part of the message is teleported and measured.
3. Ideally, the whole overlay block should be overridable.
   In practice, this is much harder because the current animation and measurement model is tightly coupled to the existing structure.

The driving product requirement was not “nice abstraction for maintainers”. It was:

- integrators should be able to satisfy custom layout requirements without forking core message logic
- customization should not degrade behavior
- customization should not tank performance

The performance requirement is non-negotiable because `Message` is one of the hottest paths in the SDK.

## Baseline Mental Model

Before this work, the message overlay effectively assumed a mostly fixed structure:

- `Message` owned overlay opening and measurement
- the default rendered message subtree was the thing measured and teleported
- top and bottom overlay items were rendered from `Message`
- deep subtree override of “what exactly moves into the overlay” was not a first-class concept

That is simple and efficient, but restrictive.

The moment we say “integrators can choose a smaller subtree, such as only the bubble content”, we introduce a new architectural problem:

- how does `Message` know which mounted native view should be measured and portaled?

That question is where all the complexity came from.

## The Core Constraint

There are two very different ways to decide overlay target ownership:

1. Discover it after mount.
   Wrappers register themselves, parent figures out which one wins.

2. Declare it before render.
   Parent already knows which target id should win, wrappers simply declare whether they match.

The first model is flexible but reactive.
The second model is stricter but much better for performance and predictability.

Most of the work below is really about moving from model 1 to model 2.

## Requirements and Non-Requirements

### Hard requirements

- Custom message renderers must be able to choose the teleported subtree.
- The measured layout must correspond to the teleported subtree.
- Overlay styles must only apply to the teleported subtree when customization is active.
- The default whole-message behavior must remain available.
- The solution must avoid unnecessary subscriptions, context churn, and mount-time rerenders.

### Nice-to-haves

- Integrators should not need to replace the entire `Message` component just to customize the teleported subtree.
- The API should be understandable from user code without having to know overlay internals.
- The solution should degrade predictably when misconfigured.

### Non-goals for the first serious version

- Full arbitrary override of the entire top/message/bottom animated block.
- Preserving every possible “multiple competing wrappers register themselves and the system figures it out” behavior.
- Allowing extremely flexible internals if they materially harm the hot path.

## What We Tried

## Phase 1: Wrapper Registration Model

The first serious idea was:

- introduce `MessageOverlayWrapper`
- allow integrators to wrap a custom subtree
- every wrapper registers itself with `Message`
- `Message` chooses the winning target
- the winning target is measured and portaled

The default path wrapped the whole `MessageItemView`.
Custom integrator paths could wrap a smaller subtree, such as `MessageContent`.

This solved the raw customization problem:

- it allowed “portal only the bubble”
- it allowed future extension to other subtrees
- it kept measurement and teleport coupled

But it introduced a series of costs.

### Why the registration model is heavier than it looks

For each message instance:

- wrapper renders once before registration
- wrapper ref mounts
- wrapper registers itself into parent state
- parent computes the active target
- message rerenders so wrappers know whether they are active

That means even the default case pays a mount-time “discovery pass”.

This is not just a cosmetic rerender. It means target identity is not known during the initial render, so every optimization that depends on `isActiveTarget` is delayed by one render.

### Performance concerns in this model

The first version carried several kinds of overhead:

- registration itself
- React state updates in `Message` to store active target metadata
- broad `MessageContext` invalidation because target-selection state lived there
- an overlay store subscription inside `MessageOverlayWrapper`
- extra portal wrappers even for inactive candidates

The cumulative effect was small per row, but dangerous in aggregate because messages are many and frequent.

## Phase 2: Narrow Runtime Context Split

The next optimization was to remove the most obvious duplicate subscription path.

At that point, overlay state was effectively being consumed in multiple places:

- `Message.tsx` needed it for overlay orchestration
- `MessageOverlayWrapper` needed it to decide whether to portal and render a placeholder
- `useShouldUseOverlayStyles()` needed it to know whether overlay styles should apply inside the teleported subtree

The first refinement was:

- stop putting active target runtime data into the broad `MessageContext`
- move runtime bits used by the wrapper into a narrow dedicated context
- remove the wrapper’s direct overlay-store subscription

This helped, because:

- fewer broad message context invalidations
- one fewer `useIsOverlayActive(messageOverlayId)` subscription per wrapper

But it did not solve the deeper issue:

- target identity was still discovered after mount

So the mount-time second render still existed.

## Phase 3: “Why Are Inactive Wrappers Paying for Portal Machinery?”

A key observation during review was:

- if a wrapper is not the active target, why is it still rendering through the full portal branch?

This question was valid.

The original wrapper shape effectively kept a portal-capable structure in place and toggled teleport via `hostName`.
That preserved subtree shape, but it meant inactive wrappers still paid for some inert structure.

The natural follow-up proposal was:

- inactive wrapper: render normal wrapped content only
- active wrapper: render portal branch and placeholder

This is the right instinct, but in the discovery-based model it is not fully safe because:

- on first render the wrapper does not yet know whether it is active
- it only learns that after ref registration and parent state update
- that means switching from plain branch to portal branch can happen after mount

That is exactly the kind of structural flip that can remount or reparent the subtree in ways we do not want to rely on in a hot path.

Important detail:

- the ref being set after commit does not prevent remounts
- a ready ref does not mean “React will preserve this tree if the parent element type changes”

So the question exposed the real problem correctly:

- the issue was not just “we have too many portals”
- the issue was “the winner is discovered too late”

## Phase 4: Declarative Target ID Model

The next design step was the first one that actually addressed the root cause.

The idea:

- `Message` should know the desired overlay target id before render
- `MessageOverlayWrapper` should declare its own stable `targetId`
- `isActiveTarget` should become a synchronous string comparison
- registration should exist only to store mounted refs, not to drive React state

This changes the model from:

- wrappers register
- parent discovers winner
- parent stores winner in state
- wrappers rerender

to:

- parent already knows requested target id
- wrappers know their own target ids
- wrappers can decide active vs inactive in one pass
- registration only fills a ref map for measurement

This is the first architecture that meaningfully supports the “inactive wrappers should not pay portal costs” goal.

## The Experimental Declarative Shape

The experimental refactor introduced the following ideas:

### 1. Stable target ids

- default whole-message target gets a stable constant id
- custom targets must provide a stable id via `MessageOverlayWrapper`

Example shape:

```tsx
<MessageOverlayWrapper targetId="message-root">
  <MessageItemView />
</MessageOverlayWrapper>
```

Custom integrator shape:

```tsx
const CustomMessageContent = (props) => (
  <MessageOverlayWrapper targetId="message-content">
    <DefaultMessageContent {...props} />
  </MessageOverlayWrapper>
);
```

### 2. Parent-declared selected target

`Message` receives a selected target id up front.

Default:

```ts
messageOverlayTargetId = DEFAULT_MESSAGE_OVERLAY_TARGET_ID
```

Custom:

```tsx
<Channel
  MessageContent={CustomMessageContent}
  messageOverlayTargetId="message-content"
/>
```

### 3. Registration becomes imperative bookkeeping only

Wrappers still register their mounted native views, but registration no longer sets React state.

Instead, `Message` stores:

```ts
const messageOverlayTargetsRef = useRef<Record<string, View | null>>({});
```

Registration becomes:

```ts
messageOverlayTargetsRef.current[targetId] = view;
```

Unregistration becomes:

```ts
delete messageOverlayTargetsRef.current[targetId];
```

No active target state.
No post-mount selection rerender.

### 4. Wrapper can branch immediately

Because both values are known on the first render:

- `requestedTargetId`
- `wrapper.targetId`

the wrapper can immediately decide:

- inactive branch: normal local `View`
- active branch: portal-capable branch

This is the key performance win in the design.

### 5. Overlay open measures the requested target directly

On overlay open:

```ts
const activeTargetView = messageOverlayTargetsRef.current[messageOverlayTargetId];
```

The selected target is measured directly.

There is no “find last registered custom target else fallback to default” logic in React state anymore.

## Why This Direction Is Better

Conceptually, the declarative id model is much stronger than the registration-discovery model.

It gives us:

- single-pass target selection
- no mount-time “discover winner” rerender
- no stateful active-target bookkeeping in `Message`
- no need for inactive wrappers to carry portal machinery
- a much clearer mental model for integrators

For performance-sensitive code, these are meaningful wins.

## Why We Stopped Anyway

Even though the direction is strong, it is still too invasive to rush before release.

This is no longer a small internal refactor. It changes the public customization contract.

Specifically, the declarative model raises real design questions:

### 1. What should happen when the selected target id does not register?

There are two plausible answers:

- hard fail or warning
- silent fallback to default target

Hard fail is cleaner and more predictable.
Fallback is friendlier, but it muddies behavior and can hide configuration bugs.

For a hot path, silent fallback is risky because it creates “works but not really” states.

### 2. Where should the selected target id live?

Possible owners:

- `Message`
- `Channel`
- `MessagesContext`
- some combination of the above

We experimented with plumbing it through `Channel` / `MessagesContext` because that gives integrators a practical way to override only `MessageContent`.

That is likely the right UX, but it should be designed intentionally, not patched in casually.

### 3. Do we still want multiple candidates?

The old model allowed:

- default wrapper
- one or more custom wrappers
- parent picks one

The declarative model strongly encourages:

- exactly one declared target id
- any non-matching wrappers are inactive by definition

This is better for performance, but it is also more opinionated.

### 4. How much freedom are we willing to give up to protect performance?

This is the central architectural question.

A message overlay system can be:

- very flexible
- very predictable
- very cheap

but getting all three at once is difficult.

For `Message`, the bias should probably be toward:

- predictable
- cheap

with only the minimum flexibility needed for real integrator use cases.

## Important Performance Lessons

These are the main performance takeaways from the work so far.

### 1. Do not discover active target identity through React state if it can be declared synchronously

If target identity is known before render, keep it out of React state.

Stateful discovery forces:

- extra renders
- context churn
- more complicated active/inactive branching

### 2. Be very careful what lives in `MessageContext`

`MessageContext` is consumed widely across message internals.

Putting rapidly changing overlay-target metadata there causes:

- broad rerenders
- hidden coupling between overlay internals and unrelated message UI

Any overlay-runtime data that does not need to invalidate the whole message subtree should live in a narrower context.

### 3. Avoid duplicate subscriptions in wrapper-level code

If `Message` already knows overlay state and wrapper code can receive it cheaply, do not add another direct store subscription per wrapper unless it is strictly necessary.

### 4. Inactive candidates should be as cheap as possible

If we support multiple possible overlay targets, only the selected one should pay for teleport-specific machinery.

At minimum, inactive wrappers should avoid:

- portal-specific behavior
- placeholder rendering
- unnecessary style gating complexity

### 5. Ref registration is cheaper than stateful registration, but not free

Even with the declarative model, wrappers still register refs.
That is acceptable.

What is not acceptable is allowing registration to drive render-time selection state.

### 6. Shape changes after mount are dangerous

Switching a subtree from:

- plain local branch

to

- portal branch

after mount can cause remount or reparenting behavior that is hard to reason about.

If we want inactive wrappers to bypass portal machinery, we should do it only when active/inactive status is known before the first render.

## Integrator Experience We Were Optimizing For

The real-world use case we kept in mind was:

- an integrator likes the SDK
- their PM or designer asks for “only the message bubble should lift into the overlay”
- they do not want to replace the whole `Message`
- they want a small override with predictable behavior

The ideal integrator story would look like this:

```tsx
const CustomMessageContent = (props) => (
  <MessageOverlayWrapper targetId="message-content">
    <DefaultMessageContent {...props} />
  </MessageOverlayWrapper>
);

<Channel
  MessageContent={CustomMessageContent}
  messageOverlayTargetId="message-content"
/>
```

That is simple enough to document and reason about.

The moment the integrator wants to portal an arbitrary combination of message parts from multiple places, the complexity rises sharply. That is where we should be careful not to overspec the public API too early.

## What Exists in the Experimental Branch

At the time this note was written, the local experimental work had explored all of the following:

- wrapper-based overlay target customization
- narrow overlay runtime context split
- declarative target ids
- `Channel`/`MessagesContext` plumbing for `messageOverlayTargetId`
- sample app experiment where only `MessageContent` is the overlay target

This work proved the concept, but it should not be treated as final design merely because it works locally.

## Why This Should Not Ship Hastily

Before shipping a major-version API around this, we should be able to answer all of these confidently:

- What is the exact public API?
- What is the missing-target behavior?
- What is the migration path from default whole-message behavior?
- What is the fallback strategy, if any?
- What are the expected rerender characteristics in idle state?
- What are the expected rerender characteristics on overlay open/close?
- How does this behave with custom `MessageItemView`, custom `MessageContent`, and future whole-block overrides?
- How do we document the contract so integrators do not accidentally build slow or broken setups?

If any of those are still vague, the work is not ready.

## Recommended Future Plan

When revisiting this, treat it as a design task first and an implementation task second.

Recommended order:

1. Decide the public API.
   Choose whether the selected overlay target is configured on `Channel`, `Message`, or both.

2. Decide the contract.
   Define whether one target id is selected globally per message instance, and whether multiple candidate wrappers are supported.

3. Decide failure behavior.
   Explicitly choose hard error vs warning vs fallback when the selected target does not register.

4. Decide styling semantics.
   Define exactly which subtree receives overlay-specific styles when a non-default target is selected.

5. Write migration examples.
   Especially for the common “portal only `MessageContent`” case.

6. Profile before and after.
   Measure real message list behavior rather than relying on feel alone.

7. Only then finalize implementation.

## Concrete Guardrails for the Future Implementation

Any future production-ready implementation should satisfy these guardrails:

- No mount-time target-selection rerender in the default case.
- No broad `MessageContext` invalidation from overlay-target identity changes.
- No redundant overlay store subscription in wrapper-level code unless clearly justified.
- Inactive overlay targets must not pay for portal-specific runtime behavior.
- Measurement target identity must be explicit and predictable.
- Customization must not require overriding the entire `Message` for the common bubble-only case.
- The API contract must be documented with real examples, not just types.

## Short Conclusion

The concept is good.

The main insight is:

- overlay target identity should be declarative, not discovered after mount

That is the version with the best chance of being both customizable and performant.

However, this is not small enough to rush before release.

The work should be revisited later with a proper design pass, explicit API decisions, and profiling, because `Message` is too hot a path for a half-settled abstraction.
