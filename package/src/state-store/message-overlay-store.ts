import { useCallback, useEffect, useRef } from 'react';

import { makeMutable, type SharedValue } from 'react-native-reanimated';

import { StateStore } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { useStateStore } from '../hooks';

type OverlayState = {
  closingPortalHostBlacklist: string[];
  id: string | undefined;
  messageId: string | undefined;
  closing: boolean;
};

type OpenOverlayParams = {
  id: string;
  messageId?: string;
};

export type Rect = { x: number; y: number; w: number; h: number } | undefined;
export type ClosingPortalLayoutEntry = {
  id: string;
  layout: SharedValue<Rect>;
};
type ClosingPortalLayoutsState = {
  layouts: Record<string, ClosingPortalLayoutEntry[]>;
};

const DefaultState = {
  closingPortalHostBlacklist: [],
  closing: false,
  id: undefined,
  messageId: undefined,
};
const DefaultClosingPortalLayoutsState: ClosingPortalLayoutsState = {
  layouts: {},
};

let closingPortalLayoutRegistrationCounter = 0;
let closingPortalHostBlacklistRegistrationCounter = 0;
let closingPortalHostBlacklistStack: Array<{ hostNames: string[]; id: string }> = [];

type OverlaySharedValueController = {
  incrementCloseCorrectionY: (deltaY: number) => void;
  resetCloseCorrectionY: () => void;
  reset: () => void;
  setBottomH: (rect: Rect) => void;
  setMessageH: (rect: Rect) => void;
  setTopH: (rect: Rect) => void;
};

let sharedValueController: OverlaySharedValueController | undefined;

export const registerOverlaySharedValueController = (controller: OverlaySharedValueController) => {
  sharedValueController = controller;
  return () => {
    if (sharedValueController === controller) {
      sharedValueController = undefined;
    }
  };
};

export const setOverlayMessageH = (messageH: Rect) => {
  sharedValueController?.setMessageH(messageH);
};

export const setOverlayTopH = (topH: Rect) => {
  sharedValueController?.setTopH(topH);
};

export const setOverlayBottomH = (bottomH: Rect) => {
  sharedValueController?.setBottomH(bottomH);
};

export const bumpOverlayLayoutRevision = (closeCorrectionDeltaY = 0) => {
  sharedValueController?.incrementCloseCorrectionY(closeCorrectionDeltaY);
};

export const openOverlay = (params: OpenOverlayParams | string) => {
  const overlayPayload = typeof params === 'string' ? { id: params, messageId: undefined } : params;

  sharedValueController?.resetCloseCorrectionY();
  overlayStore.partialNext({
    closing: false,
    closingPortalHostBlacklist: getCurrentClosingPortalHostBlacklist(),
    ...overlayPayload,
  });
};

export const closeOverlay = () => {
  if (!overlayStore.getLatestValue().id) {
    return;
  }

  requestAnimationFrame(() => {
    if (!overlayStore.getLatestValue().id) {
      return;
    }

    overlayStore.partialNext({ closing: true });
  });
};

let actionQueue: Array<() => void | Promise<void>> = [];

export const scheduleActionOnClose = (action: () => void | Promise<void>) => {
  const { id } = overlayStore.getLatestValue();
  if (id) {
    actionQueue.push(action);
    return;
  }
  action();
};

export const finalizeCloseOverlay = () => {
  overlayStore.next({
    ...DefaultState,
    closingPortalHostBlacklist: getCurrentClosingPortalHostBlacklist(),
  });
  sharedValueController?.reset();
};

export const overlayStore = new StateStore<OverlayState>(DefaultState);
const closingPortalLayoutsStore = new StateStore<ClosingPortalLayoutsState>(
  DefaultClosingPortalLayoutsState,
);

export const createClosingPortalLayoutRegistrationId = () =>
  `closing-portal-layout-${closingPortalLayoutRegistrationCounter++}`;

const getCurrentClosingPortalHostBlacklist = () =>
  closingPortalHostBlacklistStack[closingPortalHostBlacklistStack.length - 1]?.hostNames ?? [];

const syncClosingPortalHostBlacklist = () => {
  overlayStore.partialNext({
    closingPortalHostBlacklist: getCurrentClosingPortalHostBlacklist(),
  });
};

const createClosingPortalHostBlacklistRegistrationId = () =>
  `closing-portal-host-blacklist-${closingPortalHostBlacklistRegistrationCounter++}`;

const setClosingPortalHostBlacklist = (id: string, hostNames: string[]) => {
  const existingEntryIndex = closingPortalHostBlacklistStack.findIndex((entry) => entry.id === id);

  if (existingEntryIndex === -1) {
    closingPortalHostBlacklistStack = [...closingPortalHostBlacklistStack, { hostNames, id }];
  } else {
    closingPortalHostBlacklistStack = closingPortalHostBlacklistStack.map((entry, index) =>
      index === existingEntryIndex ? { ...entry, hostNames } : entry,
    );
  }

  syncClosingPortalHostBlacklist();
};

const clearClosingPortalHostBlacklist = (id: string) => {
  const nextBlacklistStack = closingPortalHostBlacklistStack.filter((entry) => entry.id !== id);

  if (nextBlacklistStack.length === closingPortalHostBlacklistStack.length) {
    return;
  }

  closingPortalHostBlacklistStack = nextBlacklistStack;
  syncClosingPortalHostBlacklist();
};

export const setClosingPortalLayout = (hostName: string, id: string, layout: Rect) => {
  const { layouts } = closingPortalLayoutsStore.getLatestValue();
  const hostEntries = layouts[hostName] ?? [];
  const existingEntry = hostEntries.find((entry) => entry.id === id);

  if (existingEntry) {
    existingEntry.layout.value = layout;
    return;
  }

  if (!layout) return;

  closingPortalLayoutsStore.next({
    layouts: {
      ...layouts,
      [hostName]: [...hostEntries, { id, layout: makeMutable<Rect>(layout) }],
    },
  });
};

export const clearClosingPortalLayout = (hostName: string, id: string) => {
  const { layouts } = closingPortalLayoutsStore.getLatestValue();
  const hostEntries = layouts[hostName];

  if (!hostEntries?.length) {
    return;
  }

  const nextHostEntries = hostEntries.filter((entry) => entry.id !== id);
  const nextLayouts = { ...layouts };

  if (nextHostEntries.length === 0) {
    delete nextLayouts[hostName];
  } else {
    nextLayouts[hostName] = nextHostEntries;
  }

  closingPortalLayoutsStore.next({ layouts: nextLayouts });
};

const actionQueueSelector = (nextState: OverlayState) => ({ active: !!nextState.id });

// TODO: V9: Consider having a store per `MessageOverlayHostLayer` to prevent multi-instance
//  integrations causing UI issues.
overlayStore.subscribeWithSelector(actionQueueSelector, async ({ active }) => {
  if (!active) {
    // flush the queue
    for (const action of actionQueue) {
      await action();
    }

    actionQueue = [];
  }
});

const selector = (nextState: OverlayState) => ({
  closing: nextState.closing,
  id: nextState.id,
  messageId: nextState.messageId,
});

export const useOverlayController = () => {
  return useStateStore(overlayStore, selector);
};

const overlayClosingSelector = (nextState: OverlayState) => ({
  closing: nextState.closing,
});

const closingPortalHostBlacklistSelector = (nextState: OverlayState) => ({
  closingPortalHostBlacklist: nextState.closingPortalHostBlacklist,
});

export const useIsOverlayClosing = () => {
  return useStateStore(overlayStore, overlayClosingSelector).closing;
};

export const useClosingPortalHostBlacklistState = () => {
  return useStateStore(overlayStore, closingPortalHostBlacklistSelector).closingPortalHostBlacklist;
};

export const useShouldTeleportToClosingPortal = (hostName: string, id: string) => {
  const closing = useIsOverlayClosing();
  const closingPortalHostBlacklist = useClosingPortalHostBlacklistState();
  const closingPortalLayouts = useClosingPortalLayouts();
  const hostEntries = closingPortalLayouts[hostName];

  return (
    !!overlayStore.getLatestValue().id &&
    closing &&
    !closingPortalHostBlacklist.includes(hostName) &&
    hostEntries?.[hostEntries.length - 1]?.id === id
  );
};

/**
 * Registers a screen-level blacklist of closing portal hosts that should not render while this hook is active.
 *
 * The blacklist uses stack semantics:
 * - mounting/enabling a new instance makes its blacklist active
 * - unmounting/disabling restores the previous active blacklist automatically
 *
 * This keeps stacked screens predictable without requiring previous screens to rerun effects when the top screen
 * disappears.
 */
export const useClosingPortalHostBlacklist = (hostNames: string[], enabled = true) => {
  const registrationIdRef = useRef<string | null>(null);

  if (!registrationIdRef.current) {
    registrationIdRef.current = createClosingPortalHostBlacklistRegistrationId();
  }

  const registrationId = registrationIdRef.current;
  const serializedNormalizedHostNames = JSON.stringify([...new Set(hostNames)]);

  useEffect(() => {
    if (!enabled) {
      clearClosingPortalHostBlacklist(registrationId);
      return;
    }

    setClosingPortalHostBlacklist(
      registrationId,
      JSON.parse(serializedNormalizedHostNames) as string[],
    );

    return () => {
      clearClosingPortalHostBlacklist(registrationId);
    };
  }, [enabled, registrationId, serializedNormalizedHostNames]);
};

/**
 * NOTE:
 * Do not swap this back to `useStateStore(closingPortalLayoutsStore, selector)`.
 *
 * Why this is special:
 * - `layouts` is a dynamic-key map (hosts are added/removed at runtime)
 * - each host key maintains a stack of registrations
 * - We only need React updates when the key set changes (add/remove/reset)
 * - Per-layout movement is already on UI thread via the top `entry.layout.value`
 *
 * Why `useStateStore` is unsafe here:
 * - Both `stream-chat`'s `subscribeWithSelector` and our `useStateStore` snapshot
 *   comparator use an asymmetric key comparison (they iterate previous keys only)
 * - That means `{}` -> `{ newHost: entry }` can be treated as "no change"
 * - When that happens, overlay slots never mount even though registration has run
 *
 * `useSyncExternalStore` with raw store subscription avoids that selector compare path,
 * so add/remove of hosts is always treated as observable.
 */
export const useClosingPortalLayouts = () => {
  const subscribe = useCallback(
    (listener: () => void) =>
      closingPortalLayoutsStore.subscribe(() => {
        listener();
      }),
    [],
  );
  const getSnapshot = useCallback(() => closingPortalLayoutsStore.getLatestValue().layouts, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

const noOpObject = { active: false, closing: false };

export const useIsOverlayActive = (id: string) => {
  const messageOverlaySelector = useCallback(
    (nextState: OverlayState) =>
      nextState.id === id ? { active: true, closing: nextState.closing } : noOpObject,
    [id],
  );

  return useStateStore(overlayStore, messageOverlaySelector);
};
