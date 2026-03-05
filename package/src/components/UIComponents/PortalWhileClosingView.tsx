import React, { ReactNode, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Platform, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from 'react-native-teleport';

import { useStableCallback } from '../../hooks';
import { setClosingPortalLayout, useOverlayController } from '../../state-store';

type PortalWhileClosingViewProps = {
  children: ReactNode;
  portalHostName: string;
  portalName: string;
};

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
