import { StateStore } from 'stream-chat';

/**
 * Builds a mock `channel.state` as a REAL `StateStore` — the shape v10 hooks require
 * (`useStateStore(channel.state, selector)` calls `getLatestValue`/`subscribeWithSelector`).
 *
 * The real `ChannelState` exposes several slices BOTH as store keys (read via `getLatestValue`)
 * and as convenience getters/properties (e.g. `channel.state.members`, `channel.state.membership`).
 * This mirror installs getters for the commonly-read properties so both access styles work.
 *
 * Pass `overrides` to seed any slice, e.g. `generateChannelState({ ownCapabilities: ['x'] })`.
 */
const DEFAULTS: Record<string, unknown> = {
  members: {},
  memberCount: 0,
  read: {},
  typing: {},
  watchers: {},
  watcherCount: 0,
  watching: true,
  ownCapabilities: [],
  membership: {},
  muteStatus: { createdAt: null, expiresAt: null, muted: false },
  data: undefined,
  initialized: true,
  offlineMode: false,
  pendingDisposal: false,
  active: false,
};

// slice key -> property name(s) the real ChannelState exposes as a getter over that key
const PROPERTY_GETTERS: Record<string, string[]> = {
  members: ['members'],
  memberCount: ['member_count'],
  read: ['read'],
  typing: ['typing'],
  watchers: ['watchers'],
  watcherCount: ['watcher_count'],
  membership: ['membership'],
};

export const generateChannelState = (overrides: Record<string, unknown> = {}) => {
  const state = new StateStore({ ...DEFAULTS, ...overrides });

  Object.entries(PROPERTY_GETTERS).forEach(([sliceKey, propNames]) => {
    propNames.forEach((prop) => {
      Object.defineProperty(state, prop, {
        configurable: true,
        get: () => (state.getLatestValue() as Record<string, unknown>)[sliceKey],
      });
    });
  });

  return state;
};
