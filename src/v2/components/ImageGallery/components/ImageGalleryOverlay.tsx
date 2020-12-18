import React, { useEffect, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import {
  State,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#00000033',
  },
});

type Props = {
  animatedBottomSheetIndex: Animated.SharedValue<number>;
  closeGridView: () => void;
  currentBottomSheetIndex: number;
};

export const ImageGalleryOverlay: React.FC<Props> = (props) => {
  const {
    closeGridView,
    animatedBottomSheetIndex,
    currentBottomSheetIndex,
  } = props;

  const {
    theme: {
      imageGallery: {
        grid: { overlay },
      },
    },
  } = useTheme();

  const [visible, setVisible] = useState(false);
  const [fadedIn, setFadedIn] = useState(false);

  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentBottomSheetIndex > 0) {
      setVisible(true);
      opacity.value = withTiming(
        1,
        {
          duration: 200,
          easing: Easing.out(Easing.ease),
        },
        () => runOnJS(setFadedIn)(true),
      );
    } else {
      setVisible(false);
      opacity.value = 0;
      setFadedIn(false);
    }
  }, [currentBottomSheetIndex]);

  const showOverlayStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: fadedIn ? animatedBottomSheetIndex.value : opacity.value,
    }),
    [fadedIn],
  );

  const tapEvent = (event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      closeGridView();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <TapGestureHandler
      maxDeltaX={16}
      maxDeltaY={16}
      onHandlerStateChange={tapEvent}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.overlay,
          overlay,
          showOverlayStyle,
        ]}
      />
    </TapGestureHandler>
  );
};
