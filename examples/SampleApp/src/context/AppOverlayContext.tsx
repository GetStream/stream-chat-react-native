import React, { PropsWithChildren, useState } from 'react';
import { BlurView } from '@react-native-community/blur';
import { StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurType } from '../../../../src/v2';
import { BottomSheet } from '../components/BottomSheet';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';
import { Channel } from 'stream-chat';

type BottomSheetType = 'confirmation' | 'addMembers';
type BottomSheetConfig =
  | undefined
  | {
      params:
        | {
            onConfirm: () => void;
            title: string;
            cancelText?: string;
            confirmText?: string;
            dismissHandler?: () => void;
            subtext?: string;
          }
        | {
            channel: Channel<
              LocalAttachmentType,
              LocalChannelType,
              LocalCommandType,
              LocalEventType,
              LocalMessageType,
              LocalReactionType,
              LocalUserType
            >;
          };
      type: 'confirmation' | 'addMembers';
    };

export type AppOverlayContextValue = {
  closeBottomSheet: () => void;
  openBottomSheet: (config: BottomSheetConfig) => void;
};
export const AppOverlayContext = React.createContext<AppOverlayContextValue>({
  closeBottomSheet: () => null,
  openBottomSheet: () => null,
});

export const AppOverlayProvider = ({ children }: PropsWithChildren<any>) => {
  const [bottomSheetProps, setBottomSheetProps] = useState({});
  const [bottomSheetType, setBottomSheetType] = useState<
    BottomSheetType | undefined
  >(undefined);
  const [blurType, setBlurType] = useState<BlurType>();
  const { height, width } = useWindowDimensions();
  const overlayOpacity = useSharedValue(0);

  const openBottomSheet = (config?: BottomSheetConfig) => {
    if (!config) return null;

    setBottomSheetType(config.type);
    setBottomSheetProps({ ...config.params });
    setBlurType('dark');
    overlayOpacity.value = withTiming(1);
  };

  const closeBottomSheet = () => {
    cancelAnimation(overlayOpacity);
    overlayOpacity.value = withTiming(0);

    setBlurType(undefined);
    setBottomSheetProps({});
    setBottomSheetType(undefined);
  };

  const overlayStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: overlayOpacity.value,
    }),
    [],
  );

  return (
    <AppOverlayContext.Provider
      value={{
        closeBottomSheet,
        openBottomSheet,
      }}
    >
      {children}
      <Animated.View
        pointerEvents={!bottomSheetType ? 'none' : 'auto'}
        style={[StyleSheet.absoluteFill, overlayStyle]}
      >
        <BlurView
          blurType={blurType}
          style={[StyleSheet.absoluteFill, { height, width }]}
        />
      </Animated.View>
      <BottomSheet
        dismissHandler={closeBottomSheet}
        overlayOpacity={overlayOpacity}
        params={bottomSheetProps}
        type={bottomSheetType}
        visible={
          bottomSheetType === 'addMembers' || bottomSheetType === 'confirmation'
        }
      />
    </AppOverlayContext.Provider>
  );
};
