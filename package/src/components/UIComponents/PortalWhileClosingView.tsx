import React, { ReactNode, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Platform, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from 'react-native-teleport';

import { useStableCallback } from '../../hooks';
import {
  clearClosingPortalLayout,
  setClosingPortalLayout,
  useOverlayController,
} from '../../state-store';

type PortalWhileClosingViewProps = {
  /**
   * Content that should render in place normally and teleport to a closing portal host
   * while the message overlay is closing.
   */
  children: ReactNode;
  /**
   * Name of the closing `PortalHost` in `MessageOverlayHostLayer`.
   * This key is also used in the closing layout registry.
   */
  portalHostName: string;
  /**
   * Stable portal instance name used by `react-native-teleport` to move this content
   * between the in-place tree and the closing host.
   */
  portalName: string;
};

/**
 * Keeps wrapped UI above the message overlay during close animation by teleporting it to a closing portal host.
 *
 * Why this is needed:
 *
 * When the overlay closes, the animated message can visually pass over fixed UI (for example composer/header).
 * This wrapper moves that UI into the overlay host layer for the closing phase, so stacking stays correct.
 *
 * To use it, simply wrap any view that should remain on top while the overlay is closing, and pass a `portalHostName`
 * and a `portalName`. Registration within the host layer will happen automatically, as will calculating layout.
 *
 * Behavior:
 * - renders children in place during normal operation
 * - registers absolute layout for `portalHostName`
 * - while overlay state is `closing`, teleports children to the matching closing host
 * - renders a local placeholder while closing to preserve original layout space
 *
 * Host registration is done once per key; subsequent layout updates are pushed via shared values.
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
  const { closing } = useOverlayController();
  const containerRef = useRef<View | null>(null);
  const absolutePositionRef = useRef<{ x: number; y: number } | null>(null);
  const layoutRef = useRef<{ h: number; w: number }>({ h: 0, w: 0 });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;

    const measureAbsolutePosition = () => {
      containerRef.current?.measureInWindow((x, y) => {
        if (cancelled) return;
        const absolute = {
          x,
          y: y + (Platform.OS === 'android' ? insets.top : 0),
        };

        absolutePositionRef.current = absolute;

        const { h, w } = layoutRef.current;
        if (!w || !h) return;

        setClosingPortalLayout(portalHostName, {
          ...absolute,
          h,
          w,
        });
      });
    };

    // Measure once after mount and layout settle.
    requestAnimationFrame(() => {
      requestAnimationFrame(measureAbsolutePosition);
    });

    return () => {
      cancelled = true;
    };
  }, [insets.top, portalHostName]);

  const unregisterPortalHost = useStableCallback(() => clearClosingPortalLayout(portalHostName));

  useEffect(() => {
    return () => {
      unregisterPortalHost();
    };
  }, [unregisterPortalHost]);

  const onWrapperViewLayout = useStableCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    layoutRef.current = { h: height, w: width };

    const absolute = absolutePositionRef.current;
    if (!absolute) return;

    setClosingPortalLayout(portalHostName, { ...absolute, h: height, w: width });
  });

  return (
    <>
      <Portal hostName={closing ? portalHostName : undefined} name={portalName}>
        <View collapsable={false} ref={containerRef} onLayout={onWrapperViewLayout}>
          {children}
        </View>
      </Portal>
      {closing && layoutRef.current.h > 0 ? (
        <View
          pointerEvents='none'
          style={{ height: layoutRef.current.h, width: layoutRef.current.w || '100%' }}
        />
      ) : null}
    </>
  );
};
