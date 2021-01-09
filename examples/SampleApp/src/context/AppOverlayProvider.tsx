import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  AppOverlayContext,
  AppOverlayContextValue,
  BlurType,
} from './AppOverlayContext';

import { BottomSheetOverlay } from '../components/BottomSheetOverlay';
import { ChannelInfoOverlay } from '../components/ChannelInfoOverlay';
import { UserInfoOverlay } from '../components/UserInfoOverlay';
import { BottomSheetOverlayProvider } from '../context/BottomSheetOverlayContext';
import { ChannelInfoOverlayProvider } from '../context/ChannelInfoOverlayContext';
import { UserInfoOverlayProvider } from '../context/UserInfoOverlayContext';

export const AppOverlayProvider: React.FC<{
  value?: Partial<AppOverlayContextValue>;
}> = (props) => {
  const { children, value } = props;

  const [blurType, setBlurType] = useState<BlurType>();
  const [overlay, setOverlay] = useState(value?.overlay || 'none');

  const overlayOpacity = useSharedValue(0);
  const { height, width } = useWindowDimensions();

  useEffect(() => {
    const backAction = () => {
      if (overlay !== 'none') {
        setBlurType(undefined);
        setOverlay('none');
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [overlay]);

  useEffect(() => {
    cancelAnimation(overlayOpacity);
    if (overlay !== 'none') {
      overlayOpacity.value = withTiming(1);
    } else {
      overlayOpacity.value = withTiming(0);
    }
  }, [overlay]);

  const overlayStyle = useAnimatedStyle<ViewStyle>(
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
              <BlurView
                blurType={blurType}
                style={[StyleSheet.absoluteFill, { height, width }]}
              />
            </Animated.View>
            <UserInfoOverlay
              overlayOpacity={overlayOpacity}
              visible={overlay === 'userInfo'}
            />
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
