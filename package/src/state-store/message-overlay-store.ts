import { useCallback } from 'react';

import { makeMutable, type SharedValue } from 'react-native-reanimated';

import { StateStore } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { useStateStore } from '../hooks';

type OverlayState = {
  id: string | undefined;
  closing: boolean;
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
  closing: false,
  id: undefined,
};
const DefaultClosingPortalLayoutsState: ClosingPortalLayoutsState = {
  layouts: {},
};

let closingPortalLayoutRegistrationCounter = 0;

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

export const openOverlay = (id: string) => {
  sharedValueController?.resetCloseCorrectionY();
  overlayStore.partialNext({ closing: false, id });
};

export const closeOverlay = () => {
  requestAnimationFrame(() => {
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
  overlayStore.partialNext(DefaultState);
  sharedValueController?.reset();
};

export const overlayStore = new StateStore<OverlayState>(DefaultState);
const closingPortalLayoutsStore = new StateStore<ClosingPortalLayoutsState>(
  DefaultClosingPortalLayoutsState,
);

export const createClosingPortalLayoutRegistrationId = () =>
  `closing-portal-layout-${closingPortalLayoutRegistrationCounter++}`;

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
});

export const useOverlayController = () => {
  return useStateStore(overlayStore, selector);
};

const overlayClosingSelector = (nextState: OverlayState) => ({
  closing: nextState.closing,
});

export const useIsOverlayClosing = () => {
  return useStateStore(overlayStore, overlayClosingSelector).closing;
};

export const useShouldTeleportToClosingPortal = (hostName: string, id: string) => {
  const closing = useIsOverlayClosing();
  const closingPortalLayouts = useClosingPortalLayouts();
  const hostEntries = closingPortalLayouts[hostName];

  return !!closing && hostEntries?.[hostEntries.length - 1]?.id === id;
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

export const useIsOverlayActive = (messageId: string) => {
  const messageOverlaySelector = useCallback(
    (nextState: OverlayState) =>
      nextState.id === messageId ? { active: true, closing: nextState.closing } : noOpObject,
    [messageId],
  );

  return useStateStore(overlayStore, messageOverlaySelector);
};
