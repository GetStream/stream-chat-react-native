import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { PollOptionData } from 'stream-chat';

import { useAttachmentPickerContext } from '../../../contexts';
import { DragHandle } from '../../../icons';

export type CurrentOptionPositionsCache = {
  inverseIndexCache: {
    [key: number]: number;
  };
  positionCache: {
    [key: number]: {
      updatedIndex: number;
      updatedTop: number;
    };
  };
};

const OPTION_HEIGHT = 69;

export const CreatePollOption = ({
  boundaries,
  currentOptionPositions,
  draggedItemId,
  handleChangeText,
  index,
  isDragging,
  option,
}: {
  boundaries: { maxBound: number; minBound: number };
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  draggedItemId: SharedValue<number | null>;
  handleChangeText: (newText: string, index: number) => void;
  index: number;
  isDragging: SharedValue<1 | 0>;
  option: PollOptionData;
}) => {
  const { createPollOptionHeight = OPTION_HEIGHT } = useAttachmentPickerContext();
  const top = useSharedValue(index * createPollOptionHeight);
  const isDraggingDerived = useDerivedValue(() => isDragging.value);

  const draggedItemIdDerived = useDerivedValue(() => draggedItemId.value);

  const isCurrentDraggingItem = useDerivedValue(
    () => isDraggingDerived.value && draggedItemIdDerived.value === index,
  );

  const animatedStyles = useAnimatedStyle(() => ({
    top: top.value,
    transform: [
      {
        scale: isCurrentDraggingItem.value
          ? interpolate(isDraggingDerived.value, [0, 1], [1, 1.025])
          : interpolate(isDraggingDerived.value, [0, 1], [1, 0.98]),
      },
    ],
  }));
  const currentOptionPositionsDerived = useDerivedValue<CurrentOptionPositionsCache>(
    () => currentOptionPositions.value,
  );

  // used for swapping with currentIndex
  const newIndex = useSharedValue<number | null>(null);

  // used for swapping with newIndex
  const currentIndex = useSharedValue<number | null>(null);

  useAnimatedReaction(
    () => currentOptionPositionsDerived.value.positionCache[index].updatedIndex,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        top.value = withSpring(
          currentOptionPositionsDerived.value.positionCache[index].updatedIndex *
            createPollOptionHeight,
        );
      }
    },
  );

  const gesture = Gesture.Pan()
    .onStart(() => {
      // start dragging
      isDragging.value = withSpring(1);

      // keep track of dragged item
      draggedItemId.value = index;

      // store dragged item id for future swap
      currentIndex.value = currentOptionPositionsDerived.value.positionCache[index].updatedIndex;
    })
    .onUpdate((e) => {
      const { inverseIndexCache, positionCache } = currentOptionPositionsDerived.value;
      if (draggedItemIdDerived.value === null || currentIndex.value === null) {
        return;
      }
      const newTop = positionCache[draggedItemIdDerived.value].updatedTop + e.translationY;
      // we add a small leeway to account for sharp animations which tend to bug out otherwise
      if (newTop < boundaries.minBound - 10 || newTop > boundaries.maxBound + 10) {
        // out of bounds, exit out of the animation early
        return;
      }
      top.value = newTop;

      // calculate the new index where drag is headed to
      newIndex.value = Math.floor((newTop + createPollOptionHeight / 2) / createPollOptionHeight);

      // swap the items present at newIndex and currentIndex
      if (newIndex.value !== currentIndex.value) {
        // find id of the item that currently resides at newIndex
        const newIndexItemKey = inverseIndexCache[newIndex.value];

        // find id of the item that currently resides at currentIndex
        const currentDragIndexItemKey = inverseIndexCache[currentIndex.value];

        if (newIndexItemKey !== undefined && currentDragIndexItemKey !== undefined) {
          // if we indeed have a candidate for a new index, we update our cache so that
          // it can be reflected through animations
          currentOptionPositions.value = {
            inverseIndexCache: {
              ...inverseIndexCache,
              [newIndex.value]: currentDragIndexItemKey,
              [currentIndex.value]: newIndexItemKey,
            },
            positionCache: {
              ...positionCache,
              [currentDragIndexItemKey]: {
                ...positionCache[currentDragIndexItemKey],
                updatedIndex: newIndex.value,
              },
              [newIndexItemKey]: {
                ...positionCache[newIndexItemKey],
                updatedIndex: currentIndex.value,
                updatedTop: currentIndex.value * createPollOptionHeight,
              },
            },
          };

          // update new index as current index
          currentIndex.value = newIndex.value;
        }
      }
    })
    .onEnd(() => {
      const { inverseIndexCache, positionCache } = currentOptionPositionsDerived.value;
      if (currentIndex.value === null || newIndex.value === null) {
        return;
      }

      top.value = withSpring(newIndex.value * createPollOptionHeight);

      // find original id of the item that currently resides at currentIndex
      const currentDragIndexItemKey = inverseIndexCache[currentIndex.value];

      if (currentDragIndexItemKey !== undefined) {
        // update the values for item whose drag we just stopped
        currentOptionPositions.value = {
          ...currentOptionPositionsDerived.value,
          positionCache: {
            ...positionCache,
            [currentDragIndexItemKey]: {
              ...positionCache[currentDragIndexItemKey],
              updatedTop: newIndex.value * createPollOptionHeight,
            },
          },
        };
      }
      // stop dragging
      isDragging.value = withDelay(200, withSpring(0));
      console.log(currentOptionPositionsDerived.value);
    });

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          backgroundColor: '#F7F7F8',
          borderRadius: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingHorizontal: 16,
          paddingVertical: 18,
          position: 'absolute',
          width: '100%',
        },
        animatedStyles,
      ]}
    >
      <TextInput
        onChangeText={(newText) => handleChangeText(newText, index)}
        placeholder='Option'
        style={{
          flex: 1, // check if it causes trouble on Android
          fontSize: 16,
          paddingVertical: 0, // android is adding extra padding so we remove it
        }}
        value={option.text}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View>
          <DragHandle pathFill='#7E828B' />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const MemoizedCreatePollOption = React.memo(CreatePollOption);

export const CreatePollOptions = (props: {
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  pollOptions: PollOptionData[];
  setPollOptions: Dispatch<SetStateAction<PollOptionData[]>>;
}) => {
  const { createPollOptionHeight = OPTION_HEIGHT } = useAttachmentPickerContext();
  const { currentOptionPositions, pollOptions, setPollOptions } = props;
  const updateOption = useCallback(
    (newText: string, index: number) => {
      setPollOptions((prevOptions) =>
        prevOptions.map((option, idx) => (idx === index ? { ...option, text: newText } : option)),
      );
    },
    [setPollOptions],
  );

  // used to know if drag is happening or not
  const isDragging = useSharedValue<0 | 1>(0);
  // this will hold id for item which user started dragging
  const draggedItemId = useSharedValue<number | null>(null);

  const boundaries = useMemo(
    () => ({ maxBound: (pollOptions.length - 1) * createPollOptionHeight, minBound: 0 }),
    [createPollOptionHeight, pollOptions.length],
  );
  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ fontSize: 16 }}>Options</Text>
      <View style={{ height: createPollOptionHeight * pollOptions.length }}>
        {pollOptions.map((option, index) => (
          <MemoizedCreatePollOption
            boundaries={boundaries}
            currentOptionPositions={currentOptionPositions}
            draggedItemId={draggedItemId}
            handleChangeText={updateOption}
            index={index}
            isDragging={isDragging}
            key={index}
            option={option}
          />
        ))}
      </View>
      <TouchableOpacity
        onPress={() => {
          const newIndex = pollOptions.length;
          currentOptionPositions.value = {
            inverseIndexCache: {
              ...currentOptionPositions.value.inverseIndexCache,
              [newIndex]: newIndex,
            },
            positionCache: {
              ...currentOptionPositions.value.positionCache,
              [newIndex]: {
                updatedIndex: newIndex,
                updatedTop: newIndex * createPollOptionHeight,
              },
            },
          };
          setPollOptions([...pollOptions, { text: '' }]);
        }}
        style={{
          backgroundColor: '#F7F7F8',
          borderRadius: 12,
          marginTop: 8,
          paddingHorizontal: 16,
          paddingVertical: 18,
        }}
      >
        <Text style={{ fontSize: 16 }}>Add an option</Text>
      </TouchableOpacity>
    </View>
  );
};