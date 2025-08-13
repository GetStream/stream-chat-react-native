import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PollComposerOption, PollComposerState } from 'stream-chat';

import { useCreatePollContentContext, useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';
import { DragHandle } from '../../../icons';
import { POLL_OPTION_HEIGHT } from '../../../utils/constants';

export type CurrentOptionPositionsCache = {
  inverseIndexCache: {
    [key: number]: string;
  };
  positionCache: {
    [key: string]: {
      updatedIndex: number;
      updatedTop: number;
    };
  };
};

export type CreatePollOptionType = {
  boundaries: { maxBound: number; minBound: number };
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  draggedItemId: SharedValue<string | null>;
  error?: string;
  handleChangeText: (newText: string, index: number) => void;
  handleBlur: () => void;
  index: number;
  isDragging: SharedValue<1 | 0>;
  option: PollComposerOption;
  /**
   *
   * @param newOrder The inverse index object of the new options position after re-ordering.
   * @returns
   */
  onNewOrder: (newOrder: CurrentOptionPositionsCache['inverseIndexCache']) => void;
};

export const CreatePollOption = ({
  boundaries,
  currentOptionPositions,
  draggedItemId,
  error,
  handleBlur,
  handleChangeText,
  index,
  isDragging,
  option,
  onNewOrder,
}: CreatePollOptionType) => {
  const { t } = useTranslationContext();
  const { createPollOptionHeight = POLL_OPTION_HEIGHT } = useCreatePollContentContext();
  const top = useSharedValue(index * createPollOptionHeight);
  const isDraggingDerived = useDerivedValue(() => isDragging.value);

  const draggedItemIdDerived = useDerivedValue(() => draggedItemId.value);

  const isCurrentDraggingItem = useDerivedValue(
    () => isDraggingDerived.value && draggedItemIdDerived.value === option.id,
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

  // The sanity check for position cache updated index, is added because after a poll is sent its been reset
  // by the composer and it throws an undefined error. This can be removed in future.
  useAnimatedReaction(
    () => currentOptionPositionsDerived.value.positionCache[option.id]?.updatedIndex ?? 0,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        const updatedIndex =
          currentOptionPositionsDerived.value.positionCache[option.id]?.updatedIndex ?? 0;
        top.value = withSpring(updatedIndex * createPollOptionHeight);
      }
    },
  );

  const gesture = Gesture.Pan()
    .onStart(() => {
      // start dragging
      isDragging.value = withSpring(1);

      // keep track of dragged item
      draggedItemId.value = option.id;

      // store dragged item id for future swap
      currentIndex.value =
        currentOptionPositionsDerived.value.positionCache[option.id].updatedIndex;
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
      runOnJS(onNewOrder)(currentOptionPositionsDerived.value.inverseIndexCache);
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

  const onChangeTextHandler = useCallback(
    (newText: string) => {
      handleChangeText(newText, index);
    },
    [handleChangeText, index],
  );

  return (
    <Animated.View
      style={[
        styles.optionWrapper,
        optionStyle.wrapper,
        {
          backgroundColor: bg_user,
          borderColor: error ? accent_error : bg_user,
          position: 'absolute',
          width: '100%',
        },
        animatedStyles,
      ]}
    >
      {error ? (
        <Text
          style={[
            styles.optionValidationError,
            { color: accent_error },
            optionStyle.validationErrorText,
          ]}
        >
          {t(error)}
        </Text>
      ) : null}
      <TextInput
        onBlur={handleBlur}
        onChangeText={onChangeTextHandler}
        placeholder={t('Add an option')}
        style={[styles.optionInput, { color: black }, optionStyle.input]}
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
  errors: state.errors.options,
  options: state.data.options,
});

export type CreatePollOptionsProps = {
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
};

export const CreatePollOptions = ({ currentOptionPositions }: CreatePollOptionsProps) => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { errors, options } = useStateStore(pollComposer.state, pollComposerStateSelector);
  const { createPollOptionHeight = POLL_OPTION_HEIGHT } = useCreatePollContentContext();

  const updateOption = useCallback(
    (newText: string, index: number) => {
      pollComposer.updateFields({
        options: { index, text: newText },
      });
    },
    [pollComposer],
  );

  const handleBlur = useCallback(() => {
    pollComposer.handleFieldBlur('options');
  }, [pollComposer]);

  // used to know if drag is happening or not
  const isDragging = useSharedValue<0 | 1>(0);

  // this will hold id for item which user started dragging
  const draggedItemId = useSharedValue<string | null>(null);

  // holds the animated height of the option container
  const animatedOptionsContainerHeight = useSharedValue(createPollOptionHeight * options.length);

  useEffect(() => {
    animatedOptionsContainerHeight.value = withTiming(createPollOptionHeight * options.length, {
      duration: 200,
    });
  }, [animatedOptionsContainerHeight, createPollOptionHeight, options.length]);

  const animatedOptionsContainerStyle = useAnimatedStyle(() => ({
    height: animatedOptionsContainerHeight.value,
  }));

  const boundaries = useMemo(
    () => ({ maxBound: (options.length - 1) * createPollOptionHeight, minBound: 0 }),
    [createPollOptionHeight, options.length],
  );

  const {
    theme: {
      colors: { black },
      poll: {
        createContent: {
          pollOptions: { container, title },
        },
      },
    },
  } = useTheme();

  const onNewOrderChange = useCallback(
    async (newOrder: CurrentOptionPositionsCache['inverseIndexCache']) => {
      const reorderedPollOptions = [];

      for (let i = 0; i < options.length; i++) {
        const currentOption = options.find((option) => option.id === newOrder[i]);
        if (currentOption) {
          reorderedPollOptions.push(currentOption);
        }
      }

      await pollComposer.updateFields({
        options: reorderedPollOptions,
      });
    },
    [options, pollComposer],
  );

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.text, { color: black }, title]}>{t('Options')}</Text>
      <Animated.View style={animatedOptionsContainerStyle}>
        {options.map((option, index) => (
          <MemoizedCreatePollOption
            boundaries={boundaries}
            currentOptionPositions={currentOptionPositions}
            draggedItemId={draggedItemId}
            error={errors?.[option.id]}
            handleBlur={handleBlur}
            handleChangeText={updateOption}
            index={index}
            isDragging={isDragging}
            key={option.id}
            onNewOrder={onNewOrderChange}
            option={option}
          />
        ))}
      </Animated.View>
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
