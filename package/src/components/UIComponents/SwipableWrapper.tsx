import React, { PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

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
const MAX_RIGHT_ACTIONS_WIDTH = 240;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const animationOptions = {
  damping: 24,
  mass: 1,
  overshootClamping: false,
  stiffness: 180,
};

export type SwipableActionItem = {
  action: () => void | Promise<void>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  Content: React.ComponentType<Record<string, unknown>>;
  id: string;
};

export type SwipableWrapperProps = PropsWithChildren<{
  items?: SwipableActionItem[];
  swipeableId?: string;
  swipableProps?: SwipeableProps;
}>;

export const getRightActionsLayout = (itemCount: number) => {
  if (!itemCount) {
    return { containerWidth: 0, itemWidth: 0 };
  }

  const containerWidth = Math.min(itemCount * ACTION_WIDTH, MAX_RIGHT_ACTIONS_WIDTH);
  const itemWidth = containerWidth / itemCount;

  return { containerWidth, itemWidth };
};

export const RightActions = ({
  items,
  translation,
}: {
  items: SwipableActionItem[];
  translation: SharedValue<number>;
}) => {
  const { containerWidth, itemWidth } = useMemo(
    () => getRightActionsLayout(items.length),
    [items.length],
  );

  const animatedActionWidthStyle = useAnimatedStyle(() => ({
    width: interpolate(
      -translation.value,
      [0, containerWidth, containerWidth + 40],
      [0, itemWidth, itemWidth + 8],
      Extrapolation.CLAMP,
    ),
  }));

  const animatedIconScaleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          -translation.value,
          [0, containerWidth, containerWidth + 40],
          [0, 1, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.rightActionsContainer, { width: containerWidth }]}>
      {items.map((item) => {
        const Content = item.Content;
        return (
          <AnimatedPressable
            key={item.id}
            onPress={item.action}
            style={[styles.action, animatedActionWidthStyle]}
          >
            <View style={item.contentContainerStyle}>
              <Animated.View style={animatedIconScaleStyle}>
                <Content />
              </Animated.View>
            </View>
          </AnimatedPressable>
        );
      })}
    </Animated.View>
  );
};

export const SwipableWrapper = ({ children, swipeableId, swipableProps }: SwipableWrapperProps) => {
  const swipeRegistry = useSwipeRegistryContext();
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  useEffect(() => {
    if (!swipeRegistry || !swipeableId) {
      return;
    }

    return swipeRegistry.registerSwipeable(swipeableId, () => {
      swipeableRef.current?.close();
    });
  }, [swipeRegistry, swipeableId]);

  const onSwipeableOpenStartDrag = useStableCallback(
    (direction: SwipeDirection.LEFT | SwipeDirection.RIGHT) => {
      if (swipeRegistry && swipeableId) {
        swipeRegistry.notifyWillOpen(swipeableId);
      }
      swipableProps?.onSwipeableWillOpen?.(direction);
    },
  );

  const onSwipeableWillClose = useStableCallback(() => {
    if (swipeableId) {
      swipeRegistry?.updateOpenTracker(swipeableId, false);
    }
  });

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      onSwipeableOpenStartDrag={onSwipeableOpenStartDrag}
      animationOptions={animationOptions}
      friction={1.5}
      onSwipeableWillClose={onSwipeableWillClose}
      overshootLeft={false}
      overshootRight={true}
      overshootFriction={16}
      renderLeftActions={undefined}
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
  },
  action: {
    overflow: 'hidden',
    width: 0,
  },
});
