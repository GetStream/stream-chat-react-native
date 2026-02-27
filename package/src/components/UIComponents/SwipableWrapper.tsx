import React, { PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import ReanimatedSwipeable, {
  SwipeDirection,
  SwipeableMethods,
  SwipeableProps,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { useSwipeRegistryContext } from '../../contexts/swipeableContext/SwipeRegistryContext';

const ACTION_WIDTH = 50;
const DEFAULT_RIGHT_ACTIONS_WIDTH = ACTION_WIDTH * 2;

const animationOptions = {
  damping: 24,
  mass: 1,
  overshootClamping: false,
  stiffness: 180,
};

type SwipableWrapperProps = PropsWithChildren<{
  swipeableId?: string;
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

export const SwipableWrapper = ({ children, swipeableId, swipableProps }: SwipableWrapperProps) => {
  const swipeRegistry = useSwipeRegistryContext();
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  const {
    onSwipeableWillOpen: onSwipeableWillOpenFromProps,
    renderRightActions: renderRightActionsFromProps,
    ...restSwipableProps
  } = swipableProps ?? {};

  const defaultRenderRightActions = useCallback(
    (_progress: SharedValue<number>, translation: SharedValue<number>) => (
      <DefaultRightActions translation={translation} />
    ),
    [],
  );

  useEffect(() => {
    if (!swipeRegistry || !swipeableId) {
      return;
    }

    return swipeRegistry.registerSwipeable(swipeableId, () => {
      swipeableRef.current?.close();
    });
  }, [swipeRegistry, swipeableId]);

  const onSwipeableWillOpen = useCallback(
    (direction: SwipeDirection.LEFT | SwipeDirection.RIGHT) => {
      if (swipeRegistry && swipeableId) {
        swipeRegistry.notifyWillOpen(swipeableId);
      }
      onSwipeableWillOpenFromProps?.(direction);
    },
    [onSwipeableWillOpenFromProps, swipeRegistry, swipeableId],
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      animationOptions={animationOptions}
      friction={2}
      onSwipeableWillOpen={onSwipeableWillOpen}
      overshootLeft={false}
      overshootRight={true}
      overshootFriction={16}
      renderLeftActions={undefined}
      renderRightActions={renderRightActionsFromProps ?? defaultRenderRightActions}
      {...restSwipableProps}
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
