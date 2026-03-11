import React, { ReactNode, useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from 'react-native-teleport';

import { useStableCallback } from '../../hooks';
import {
  clearClosingPortalLayout,
  createClosingPortalLayoutRegistrationId,
  setClosingPortalLayout,
  useShouldTeleportToClosingPortal,
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
 * and a `portalName`. Once the wrapped view has a valid measured layout, it can participate in the closing host layer.
 *
 * Behavior:
 * - renders children in place during normal operation
 * - registers absolute layout for `portalHostName` once a valid measurement exists
 * - while overlay state is `closing`, teleports children to the matching closing host
 * - renders a local placeholder while closing to preserve original layout space
 *
 * Stack presence only starts after first valid measurement. That prevents unmeasured entries from taking over a host
 * slot and rendering with incomplete geometry.
 *
 * Note: As the `PortalWhileClosingView` relies heavily on being able to calculate the layout and positioning
 * properties of its children automatically, make sure that you do not wrap absolutely positioned views with
 * it as positioning parameters specifically will not be calculated correctly as the absolute position of
 * the immediate child will be towards its immediate parent (which is our `Portal` view). Instead, wrap its
 * children directly (the non-absolutely positioned ones). Since we use `measureInWindow` to get a hold of
 * the initial measurements, we'll always have the correct position of the relevant content.
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
  const containerRef = useRef<View | null>(null);
  const registrationIdRef = useRef<string | null>(null);
  const placeholderLayout = useSharedValue({ h: 0, w: 0 });
  const insets = useSafeAreaInsets();

  if (!registrationIdRef.current) {
    registrationIdRef.current = createClosingPortalLayoutRegistrationId();
  }

  const registrationId = registrationIdRef.current;
  const shouldTeleport = useShouldTeleportToClosingPortal(portalHostName, registrationId);

  const syncPortalLayout = useStableCallback(() => {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      const absolute = {
        x,
        y: y + (Platform.OS === 'android' ? insets.top : 0),
      };

      if (!width || !height) {
        return;
      }

      placeholderLayout.value = { h: height, w: width };

      setClosingPortalLayout(portalHostName, registrationId, {
        ...absolute,
        h: height,
        w: width,
      });
    });
  });

  useEffect(() => {
    return () => {
      clearClosingPortalLayout(portalHostName, registrationId);
    };
  }, [portalHostName, registrationId]);

  useEffect(() => {
    // Measure once after mount and layout settle.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncPortalLayout();
      });
    });
  }, [insets.top, portalHostName, syncPortalLayout]);

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
