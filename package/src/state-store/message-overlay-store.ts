import { useCallback } from 'react';

import { StateStore } from 'stream-chat';

import { useStateStore } from '../hooks';

type OverlayState = {
  id: string | undefined;
  closing: boolean;
};

export type Rect = { x: number; y: number; w: number; h: number } | undefined;

const DefaultState = {
  closing: false,
  id: undefined,
};

type OverlaySharedValueController = {
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

export const openOverlay = (id: string) => overlayStore.partialNext({ closing: false, id });

export const closeOverlay = () => {
  requestAnimationFrame(() => overlayStore.partialNext({ closing: true }));
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
  sharedValueController?.reset();
  overlayStore.partialNext(DefaultState);
};

export const overlayStore = new StateStore<OverlayState>(DefaultState);

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

const noOpObject = { active: false, closing: false };

export const useIsOverlayActive = (messageId: string) => {
  const messageOverlaySelector = useCallback(
    (nextState: OverlayState) =>
      nextState.id === messageId ? { active: true, closing: nextState.closing } : noOpObject,
    [messageId],
  );

  return useStateStore(overlayStore, messageOverlaySelector);
};
