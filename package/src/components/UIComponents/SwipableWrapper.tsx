import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { MenuPointHorizontal } from '../../icons';
import { ChannelActionItem } from '../ChannelList/hooks/useChannelActionItems';

const ACTION_WIDTH = 80;
const MAX_RIGHT_ACTIONS_WIDTH = 240;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const animationOptions = {
  damping: 24,
  mass: 1,
  overshootClamping: false,
  stiffness: 180,
};

type SwipableWrapperProps = PropsWithChildren<{
  items?: ChannelActionItem[];
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

const RightActions = ({
  items,
  translation,
}: {
  items: ChannelActionItem[];
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
      {items.map((item) => (
        <AnimatedPressable
          key={item.id}
          onPress={item.action}
          style={[styles.action, animatedActionWidthStyle]}
        >
          <View
            style={[
              styles.actionContent,
              item.type === 'destructive' ? styles.destructiveAction : styles.standardAction,
            ]}
          >
            <Animated.View style={animatedIconScaleStyle}>{item.Icon}</Animated.View>
          </View>
        </AnimatedPressable>
      ))}
    </Animated.View>
  );
};

const swipableActions = [
  {
    id: 'openSheet',
    action: () => Alert.alert('Pressed open sheet !'),
    type: 'standard',
    Icon: <MenuPointHorizontal stroke={'green'} />,
    label: 'View more',
  },
  {
    id: 'delete',
    action: () => Alert.alert('Pressed delete !'),
    type: 'destructive',
    Icon: <View style={{ width: 15, height: 15, backgroundColor: 'green' }} />,
    label: 'Delete',
  },
] as ChannelActionItem[];

export const SwipableWrapper = ({ children, swipeableId, swipableProps }: SwipableWrapperProps) => {
  const swipeRegistry = useSwipeRegistryContext();
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, translation: SharedValue<number>) => (
      <RightActions items={swipableActions} translation={translation} />
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

  const onSwipeableWillOpen = useStableCallback(
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
      animationOptions={animationOptions}
      friction={2}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableWillClose={onSwipeableWillClose}
      overshootLeft={false}
      overshootRight={true}
      overshootFriction={16}
      renderLeftActions={undefined}
      renderRightActions={renderRightActions}
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
  actionContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  actionLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  destructiveAction: {
    backgroundColor: '#ef4444',
  },
  standardAction: {
    backgroundColor: '#64748b',
  },
});
