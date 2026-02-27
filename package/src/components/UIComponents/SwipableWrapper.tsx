import React, { PropsWithChildren, useCallback } from 'react';
import { StyleSheet } from 'react-native';

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

const DefaultRightActions = ({ translation }: { translation: SharedValue<number> }) => {
  const animatedActionWidthStyle = useAnimatedStyle(() => ({
    width: interpolate(
      -translation.value,
      [0, DEFAULT_RIGHT_ACTIONS_WIDTH, DEFAULT_RIGHT_ACTIONS_WIDTH + 40],
      [0, ACTION_WIDTH, ACTION_WIDTH + 8],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={styles.rightActionsContainer}>
      <Animated.View style={[styles.action, styles.redAction, animatedActionWidthStyle]} />
      <Animated.View style={[styles.action, styles.blueAction, animatedActionWidthStyle]} />
    </Animated.View>
  );
};

export const SwipableWrapper = ({ children, swipableProps }: SwipableWrapperProps) => {
  const defaultRenderRightActions = useCallback(
    (_progress: SharedValue<number>, translation: SharedValue<number>) => (
      <DefaultRightActions translation={translation} />
    ),
    [],
  );
  const animationOptions = {
    damping: 24,
    mass: 1,
    overshootClamping: false,
    stiffness: 180,
    ...swipableProps?.animationOptions,
  };

  return (
    <ReanimatedSwipeable
      {...swipableProps}
      animationOptions={animationOptions}
      overshootLeft={false}
      overshootRight={swipableProps?.overshootRight ?? true}
      overshootFriction={swipableProps?.overshootFriction ?? 8}
      renderLeftActions={undefined}
      renderRightActions={swipableProps?.renderRightActions ?? defaultRenderRightActions}
    >
      {children}
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    overflow: 'visible',
    width: DEFAULT_RIGHT_ACTIONS_WIDTH,
  },
  action: {
    width: 0,
  },
  redAction: {
    backgroundColor: 'red',
  },
  blueAction: {
    backgroundColor: 'blue',
  },
});
