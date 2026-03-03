import React, { ReactNode, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Portal } from 'react-native-teleport';

import { useOverlayController } from '../../state-store';

type PortalWhileClosingViewProps = {
  children: ReactNode;
  placeholderHeight?: number;
  portalHostName: string;
  portalName: string;
};

export const PortalWhileClosingView = ({
  children,
  placeholderHeight,
  portalHostName,
  portalName,
}: PortalWhileClosingViewProps) => {
  const { closing } = useOverlayController();
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const shouldMeasure = placeholderHeight == null;

  const resolvedPlaceholderHeight = useMemo(
    () => placeholderHeight ?? measuredHeight,
    [placeholderHeight, measuredHeight],
  );

  return (
    <>
      <Portal hostName={closing ? portalHostName : undefined} name={portalName}>
        {shouldMeasure ? (
          <View
            onLayout={(event) => {
              setMeasuredHeight(event.nativeEvent.layout.height);
            }}
          >
            {children}
          </View>
        ) : (
          children
        )}
      </Portal>
      {closing && resolvedPlaceholderHeight > 0 ? (
        <View pointerEvents='none' style={{ height: resolvedPlaceholderHeight, width: '100%' }} />
      ) : null}
    </>
  );
};
