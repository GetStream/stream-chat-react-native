import React, { useContext, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { getDisplayName } from '../utils/getDisplayName';

import { BlurView } from '../../native';

import type { UnknownType } from '../../types/types';

export type Overlay = 'none' | 'gallery' | 'message';

export type OverlayContextValue = {
  overlay: Overlay;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
};

export const OverlayContext = React.createContext<OverlayContextValue>(
  {} as OverlayContextValue,
);

export const OverlayProvider: React.FC<{
  value?: Partial<OverlayContextValue>;
}> = ({ children, value }) => {
  const [overlay, setOverlay] = useState(value?.overlay || 'none');
  const { height, width } = useWindowDimensions();

  const overlayContext = {
    overlay,
    setOverlay,
  };

  return (
    <OverlayContext.Provider value={overlayContext}>
      {children}
      {overlay !== 'none' && (
        <>
          <BlurView style={[StyleSheet.absoluteFill, { height, width }]} />
        </>
      )}
    </OverlayContext.Provider>
  );
};

export const useOverlayContext = () => useContext(OverlayContext);

export const withOverlayContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof OverlayContextValue>> => {
  const WithOverlayContextComponent = (
    props: Omit<P, keyof OverlayContextValue>,
  ) => {
    const keyboardContext = useOverlayContext();

    return <Component {...(props as P)} {...keyboardContext} />;
  };
  WithOverlayContextComponent.displayName = `WithOverlayContext${getDisplayName(
    Component,
  )}`;
  return WithOverlayContextComponent;
};
