import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

import { PollComposerState, PollOptionData } from 'stream-chat';

import { useCreatePollContentContext, useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';
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

const OPTION_HEIGHT = 71;

export const CreatePollOption = ({
  boundaries,
  currentOptionPositions,
  draggedItemId,
  handleChangeText,
  hasDuplicate,
  index,
  isDragging,
  option,
}: {
  boundaries: { maxBound: number; minBound: number };
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  draggedItemId: SharedValue<number | null>;
  handleChangeText: (newText: string, index: number) => void;
  hasDuplicate: boolean;
  index: number;
  isDragging: SharedValue<1 | 0>;
  option: PollOptionData;
}) => {
  const { t } = useTranslationContext();
  const { createPollOptionHeight = OPTION_HEIGHT } = useCreatePollContentContext();
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
    });

  const {
    theme: {
      colors: { accent_error, bg_user, black, text_low_emphasis },
      poll: {
        createContent: {
          pollOptions: { optionStyle },
        },
      },
    },
  } = useTheme();

  return (
    <Animated.View
      style={[
        styles.optionWrapper,
        optionStyle.wrapper,
        {
          backgroundColor: bg_user,
          borderColor: hasDuplicate ? accent_error : bg_user,
          position: 'absolute',
          width: '100%',
        },
        animatedStyles,
      ]}
    >
      {hasDuplicate ? (
        <Text
          style={[
            styles.optionValidationError,
            { color: accent_error },
            optionStyle.validationErrorText,
          ]}
        >
          {t<string>('This is already an option')}
        </Text>
      ) : null}
      <TextInput
        onChangeText={(newText) => handleChangeText(newText, index)}
        placeholder={t<string>('Option')}
        style={[styles.optionInput, { color: black }, optionStyle.input]}
        value={option.text}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View>
          <DragHandle pathFill={text_low_emphasis} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const MemoizedCreatePollOption = React.memo(CreatePollOption);

const pollComposerStateSelector = (state: PollComposerState) => ({
  options: state.data.options,
});

export const CreatePollOptions = (props: {
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  duplicates: string[];
}) => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { options } = useStateStore(pollComposer.state, pollComposerStateSelector);
  const { createPollOptionHeight = OPTION_HEIGHT } = useCreatePollContentContext();
  const { currentOptionPositions, duplicates = [] } = props;
  const updateOption = useCallback(
    (newText: string, index: number) => {
      pollComposer.updateFields({
        options: { index, text: newText },
      });
    },
    [pollComposer],
  );

  // used to know if drag is happening or not
  const isDragging = useSharedValue<0 | 1>(0);
  // this will hold id for item which user started dragging
  const draggedItemId = useSharedValue<number | null>(null);

  const boundaries = useMemo(
    () => ({ maxBound: (options.length - 1) * createPollOptionHeight, minBound: 0 }),
    [createPollOptionHeight, options.length],
  );

  const {
    theme: {
      colors: { black, bg_user },
      poll: {
        createContent: {
          pollOptions: { addOption, container, title },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.text, { color: black }, title]}>{t<string>('Options')}</Text>
      <View style={{ height: createPollOptionHeight * options.length }}>
        {options.map((option, index) => (
          <MemoizedCreatePollOption
            boundaries={boundaries}
            currentOptionPositions={currentOptionPositions}
            draggedItemId={draggedItemId}
            handleChangeText={updateOption}
            hasDuplicate={duplicates.includes(option.text)}
            index={index}
            isDragging={isDragging}
            key={index}
            option={option}
          />
        ))}
      </View>
      <Pressable
        onPress={() => {
          const newIndex = options.length;
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
        }}
        style={({ pressed }) => [
          { opacity: pressed ? 0.5 : 1 },
          styles.addOptionWrapper,
          { backgroundColor: bg_user },
          addOption.wrapper,
        ]}
      >
        <Text style={[styles.text, { color: black }, addOption.text]}>
          {t<string>('Add an option')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  addOptionWrapper: {
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  container: { marginVertical: 16 },
  optionInput: {
    flex: 1,
    fontSize: 16,
    paddingRight: 4,
    paddingVertical: 0, // android is adding extra padding so we remove it
  },
  optionValidationError: { fontSize: 12, left: 16, position: 'absolute', top: 4 },
  optionWrapper: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  text: { fontSize: 16 },
});
