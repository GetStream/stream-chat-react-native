import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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

  const overlayOpacity = useSharedValue(0);
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

  useEffect(() => {
    cancelAnimation(overlayOpacity);
    if (overlay !== 'none') {
      overlayOpacity.value = withTiming(1);
    } else {
      overlayOpacity.value = withTiming(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  const overlayStyle = useAnimatedStyle(
    () => ({
      opacity: overlayOpacity.value,
    }),
    [],
  );

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
            <Animated.View
              pointerEvents={overlay === 'none' ? 'none' : 'auto'}
              style={[StyleSheet.absoluteFill, overlayStyle]}
            >
              <OverlayBackdrop style={[StyleSheet.absoluteFill, { height, width }]} />
            </Animated.View>
            <UserInfoOverlay overlayOpacity={overlayOpacity} visible={overlay === 'userInfo'} />
            <ChannelInfoOverlay
              overlayOpacity={overlayOpacity}
              visible={overlay === 'channelInfo'}
            />
            <BottomSheetOverlay
              overlayOpacity={overlayOpacity}
              visible={overlay === 'addMembers' || overlay === 'confirmation'}
            />
          </UserInfoOverlayProvider>
        </ChannelInfoOverlayProvider>
      </BottomSheetOverlayProvider>
    </AppOverlayContext.Provider>
  );
};
