import { useCallback } from 'react';
import Animated from 'react-native-reanimated';

import { StateStore } from 'stream-chat';

import { useStateStore } from '../hooks';

type OverlayState = {
  topH: Animated.SharedValue<Rect> | undefined;
  bottomH: Animated.SharedValue<Rect> | undefined;
  messageH: Animated.SharedValue<Rect> | undefined;
  id: string | undefined;
  closing: boolean;
};

type Rect = { x: number; y: number; w: number; h: number } | undefined;

const DefaultState = {
  bottomH: undefined,
  closing: false,
  id: undefined,
  messageH: undefined,
  topH: undefined,
};

export const openOverlay = (id: string, { messageH, topH, bottomH }: Partial<OverlayState>) =>
  overlayStore.partialNext({ bottomH, closing: false, id, messageH, topH });

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

export const finalizeCloseOverlay = () => overlayStore.partialNext(DefaultState);

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
  bottomH: nextState.bottomH,
  closing: nextState.closing,
  id: nextState.id,
  messageH: nextState.messageH,
  topH: nextState.topH,
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
