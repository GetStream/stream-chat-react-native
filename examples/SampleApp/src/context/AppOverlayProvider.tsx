import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions } from 'react-native';

import { AppOverlayContext, AppOverlayContextValue } from './AppOverlayContext';

import { BottomSheetOverlay } from '../components/BottomSheetOverlay';
import { ChannelInfoOverlay } from '../components/ChannelInfoOverlay';
import { UserInfoOverlay } from '../components/UserInfoOverlay';
import { BottomSheetOverlayProvider } from './BottomSheetOverlayContext';
import { ChannelInfoOverlayProvider } from './ChannelInfoOverlayContext';
import { UserInfoOverlayProvider } from './UserInfoOverlayContext';
import { OverlayBackdrop } from '../components/OverlayBackdrop';

export const AppOverlayProvider = (
  props: React.PropsWithChildren<{
    value?: Partial<AppOverlayContextValue>;
  }>,
) => {
  const { children, value } = props;

  const [overlay, setOverlay] = useState(value?.overlay || 'none');

  const { height, width } = useWindowDimensions();

  useEffect(() => {
    const backAction = () => {
      if (overlay !== 'none') {
        setOverlay('none');
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [overlay]);

  const overlayContext = {
    overlay,
    setOverlay,
  };

  return (
    <AppOverlayContext.Provider value={overlayContext}>
      <BottomSheetOverlayProvider>
        <ChannelInfoOverlayProvider>
          <UserInfoOverlayProvider>
            {children}
          </UserInfoOverlayProvider>
        </ChannelInfoOverlayProvider>
      </BottomSheetOverlayProvider>
    </AppOverlayContext.Provider>
  );
};
