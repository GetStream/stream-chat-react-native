import React, { PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';
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
import { useStableCallback } from '../../hooks';

const ACTION_WIDTH = 80;
const DEFAULT_RIGHT_ACTIONS_WIDTH = ACTION_WIDTH * 2;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
      <AnimatedPressable
        onPress={() => Alert.alert('Red pressed')}
        style={[styles.action, animatedActionWidthStyle]}
      >
        <View style={{ flex: 1, backgroundColor: 'red' }} />
      </AnimatedPressable>
      <AnimatedPressable
        onPress={() => Alert.alert('Blue pressed')}
        style={[styles.action, animatedActionWidthStyle]}
      >
        <View style={{ flex: 1, backgroundColor: 'blue' }} />
      </AnimatedPressable>
    </Animated.View>
  );
};

export const SwipableWrapper = ({ children, swipeableId, swipableProps }: SwipableWrapperProps) => {
  const swipeRegistry = useSwipeRegistryContext();
  const swipeableRef = useRef<SwipeableMethods | null>(null);

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
      swipableProps?.onSwipeableWillOpen?.(direction);
    },
    [swipableProps, swipeRegistry, swipeableId],
  );

  const onSwipeableWillClose = useStableCallback(() => {
    if (swipeableId) {
      swipeRegistry?.updateOpenTracker(swipeableId, false);
    }
  });

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      animationOptions={animationOptions}
      friction={2}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableWillClose={onSwipeableWillClose}
      overshootLeft={false}
      overshootRight={true}
      overshootFriction={16}
      renderLeftActions={undefined}
      renderRightActions={defaultRenderRightActions}
      {...swipableProps}
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
