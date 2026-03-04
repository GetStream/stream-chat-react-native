import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from 'react-native-teleport';

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
  const measuredSizeRef = useRef<{ h: number; w: number }>({ h: 0, w: 0 });
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const insets = useSafeAreaInsets();

  const resolvedPlaceholderHeight = useMemo(() => measuredHeight, [measuredHeight]);

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

        const { h, w } = measuredSizeRef.current;
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

  return (
    <>
      <Portal hostName={closing ? portalHostName : undefined} name={portalName}>
        <View
          collapsable={false}
          ref={containerRef}
          onLayout={(event) => {
            const { height, width } = event.nativeEvent.layout;
            setMeasuredHeight(height);
            setMeasuredWidth(width);
            measuredSizeRef.current = { h: height, w: width };

            const absolute = absolutePositionRef.current;
            if (!absolute) return;

            setClosingPortalLayout(portalHostName, { ...absolute, h: height, w: width });
          }}
        >
          {children}
        </View>
      </Portal>
      {closing && resolvedPlaceholderHeight > 0 ? (
        <View
          pointerEvents='none'
          style={{ height: resolvedPlaceholderHeight, width: measuredWidth || '100%' }}
        />
      ) : null}
    </>
  );
};
