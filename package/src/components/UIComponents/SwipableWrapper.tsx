import React, { PropsWithChildren, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import ReanimatedSwipeable, {
  SwipeableProps,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

const ACTION_WIDTH = 50;
const DEFAULT_RIGHT_ACTIONS_WIDTH = ACTION_WIDTH * 2;

type SwipableWrapperProps = PropsWithChildren<{
  swipableProps?: SwipeableProps;
}>;

const DefaultRightActions = ({ progress }: { progress: SharedValue<number> }) => {
  const animatedRedActionStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, ACTION_WIDTH], Extrapolation.CLAMP),
  }));

  const animatedBlueActionStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, ACTION_WIDTH], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.rightActionsContainer}>
      <Animated.View style={[styles.action, styles.redAction, animatedRedActionStyle]} />
      <Animated.View style={[styles.action, styles.blueAction, animatedBlueActionStyle]} />
    </View>
  );
};

export const SwipableWrapper = ({ children, swipableProps }: SwipableWrapperProps) => {
  const defaultRenderRightActions = useCallback(
    (progress: SharedValue<number>) => <DefaultRightActions progress={progress} />,
    [],
  );

  return (
    <ReanimatedSwipeable
      {...swipableProps}
      overshootLeft={false}
      overshootFriction={16}
      renderRightActions={swipableProps?.renderRightActions ?? defaultRenderRightActions}
    >
      {children}
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  rightActionsContainer: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: DEFAULT_RIGHT_ACTIONS_WIDTH,
  },
  action: {
    width: ACTION_WIDTH,
  },
  redAction: {
    backgroundColor: 'red',
  },
  blueAction: {
    backgroundColor: 'blue',
  },
});
