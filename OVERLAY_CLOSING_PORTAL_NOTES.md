# Overlay Closing Portal Notes

Status: `WIP / parked for now`
Date: `2026-03-04`

## Goal

During message overlay close animations, keep selected UI (for example message input, header) visually above the animating message by teleporting those views into overlay-hosted slots.

## What We Agreed

1. The overall idea is valid and should be kept.
2. Current implementation is too unstable/perf-heavy on Android and is parked for now.
3. The long-term direction is:
   - keep less state in JS,
   - keep more geometry/animation state on the UI thread (Reanimated shared values),
   - keep JS coordination minimal.

## Current Constraints

1. Avoid frequent `measureInWindow` calls during close animation on Android (perf issues).
2. If measuring is needed, prefer one-time measurement with explicit invalidation points.
3. `onLayout` local coordinates (`x/y`) are not sufficient for absolute overlay placement.
4. Safe-area handling differs on Android and must be normalized consistently with overlay coordinate space.

## Known Problems Encountered

1. Registration/render timing issues when portals/hosts switch during close.
2. Coordinate-space mismatch (`onLayout` local coords vs absolute screen placement).
3. Android jank when repeatedly measuring/updating layout in JS during animation.

## Implementation Direction (Next Iteration)

1. Keep JS as registration/metadata layer only.
2. Move live layout + transition math to UI thread shared values.
3. Use stable, persistent portal hosts where possible; avoid mount/unmount races at close time.
4. Add a lightweight debug mode to visualize slot rectangles and host resolution.

## Explicitly Parked

The current Android behavior for generalized closing portal teleports is not production-ready and is intentionally not being shipped as-is.

## Session Handoff

When resuming, reference this file and continue from the “Implementation Direction (Next Iteration)” section.
