import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from 'react-native-teleport';

import { measureInWindow } from '../../components/Message/utils/measureInWindow';
import { useOverlayHostLayerId } from '../../contexts/overlayContext/OverlayHostLayerContext';
import { useStableCallback } from '../../hooks';
import {
  clearClosingPortalLayout,
  createClosingPortalLayoutRegistrationId,
  setClosingPortalLayout,
  useShouldTeleportToClosingPortal,
  useHasActiveId,
  useIsOverlayClosing,
  useIsTopOverlayHostLayer,
} from '../../state-store';
import type { ViewRef } from '../../types/react-native-compat';

type PortalWhileClosingViewProps = {
  /** Content that renders in place and teleports to the closing portal host during close. */
  children: ReactNode;
  /** Name of the closing `PortalHost` in `MessageOverlayHostLayer` and the layout registry key. */
  portalHostName: string;
  /** Stable `react-native-teleport` portal name that moves the content to the closing host. */
  portalName: string;
};

/**
 * Keeps wrapped UI above the message overlay while it closes by teleporting it to a closing portal
 * host, so the animated message does not pass over fixed UI such as the composer or header.
 *
 * Children render in place normally. The layout is measured with `measureInWindow` and registered
 * under `portalHostName`; only entries with a valid measurement can take a host slot. While the
 * overlay is `closing`, the children teleport to the matching host and a placeholder keeps their
 * space in the layout.
 *
 * Wrap non-absolutely positioned views only: an absolutely positioned child is positioned against
 * the `Portal` view, so its measured position would be wrong.
 *
 * @param props.children content to render and teleport while closing
 * @param props.portalHostName closing host slot name used for layout registration and portal target
 * @param props.portalName stable portal instance name for `react-native-teleport`
 */
export const PortalWhileClosingView = ({
  children,
  portalHostName,
  portalName,
}: PortalWhileClosingViewProps) => {
  const registrationIdRef = useRef<string | null>(null);

  if (!registrationIdRef.current) {
    registrationIdRef.current = createClosingPortalLayoutRegistrationId();
  }

  const registrationId = registrationIdRef.current;

  const overlayHostLayerId = useOverlayHostLayerId();
  const isTopOverlayHostLayer = useIsTopOverlayHostLayer(overlayHostLayerId);

  const { syncPortalLayout, containerRef, placeholderLayout } = useSyncingApi(
    portalHostName,
    registrationId,
    isTopOverlayHostLayer,
  );
  const shouldTeleport =
    useShouldTeleportToClosingPortal(portalHostName, registrationId) && isTopOverlayHostLayer;

  useEffect(() => {
    return () => {
      clearClosingPortalLayout(portalHostName, registrationId);
    };
  }, [portalHostName, registrationId]);

  const placeholderStyle = useAnimatedStyle(() => ({
    height: placeholderLayout.value.h,
    width: placeholderLayout.value.w > 0 ? placeholderLayout.value.w : '100%',
  }));

  return (
    <>
      <Portal hostName={shouldTeleport ? portalHostName : undefined} name={portalName}>
        <View collapsable={false} ref={containerRef} onLayout={syncPortalLayout}>
          {children}
        </View>
      </Portal>
      {shouldTeleport ? (
        <Animated.View
          pointerEvents='none'
          style={placeholderStyle}
          testID={`portal-while-closing-placeholder-${portalName}`}
        />
      ) : null}
    </>
  );
};

const useSyncingApi = (
  portalHostName: string,
  registrationId: string,
  isTopOverlayHostLayer: boolean,
) => {
  const containerRef = useRef<ViewRef | null>(null);
  const placeholderLayout = useSharedValue({ h: 0, w: 0 });
  const insets = useSafeAreaInsets();
  const hasActiveId = useHasActiveId();
  const isClosing = useIsOverlayClosing();

  const syncPortalLayout = useStableCallback(() => {
    if ((!hasActiveId && !isClosing) || !isTopOverlayHostLayer) {
      return;
    }

    measureInWindow(containerRef, insets)
      .then((rect) => {
        placeholderLayout.value = { h: rect.h, w: rect.w };
        setClosingPortalLayout(portalHostName, registrationId, rect);
      })
      .catch(() => {
        // Not measurable yet; the next layout or effect pass retries.
      });
  });

  useEffect(() => {
    if (hasActiveId || isClosing) {
      syncPortalLayout();
    }
  }, [insets.bottom, isClosing, hasActiveId, isTopOverlayHostLayer, syncPortalLayout]);

  return useMemo(
    () => ({ syncPortalLayout, containerRef, placeholderLayout }),
    [placeholderLayout, syncPortalLayout],
  );
};
