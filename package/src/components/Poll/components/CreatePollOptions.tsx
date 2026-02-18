import React, { useCallback, useMemo } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { CircleMinus } from '../../../icons/CircleMinus';
import { DotGrid } from '../../../icons/DotGrid';
import { InfoTooltip } from '../../../icons/InfoTooltip';
import { primitives } from '../../../theme';
import { POLL_OPTION_HEIGHT } from '../../../utils/constants';

export type CurrentOptionPositionsCache = {
  inverseIndexCache: {
    [key: number]: string;
  };
  positionCache: {
    [key: string]: {
      updatedHeight: number;
      updatedIndex: number;
      updatedTop: number;
    };
  };
  totalHeight: number;
};

export type CreatePollOptionType = {
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  draggedItemId: SharedValue<string | null>;
  error?: string;
  handleChangeText: (newText: string, index: number) => void;
  handleBlur: () => void;
  index: number;
  isDragging: SharedValue<1 | 0>;
  option: PollComposerOption;
  onOptionLayout: (optionId: string, height: number) => void;
  /**
   *
   * @param newOrder The inverse index object of the new options position after re-ordering.
   * @returns
   */
  onNewOrder: (newOrder: CurrentOptionPositionsCache['inverseIndexCache']) => void;
  onRemoveOption: (index: number) => void;
};

const recalculatePositionCache = (
  inverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache'],
  positionCache: CurrentOptionPositionsCache['positionCache'],
  fallbackHeight: number,
  gap: number,
) => {
  'worklet';

  const updatedPositionCache = { ...positionCache };
  const indices = Object.keys(inverseIndexCache)
    .map((key) => Number(key))
    .sort((a, b) => a - b);

  let runningTop = 0;

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    const optionId = inverseIndexCache[index];
    const currentPosition = optionId ? updatedPositionCache[optionId] : undefined;

    if (!optionId) {
      continue;
    }

    const updatedHeight =
      currentPosition &&
      Number.isFinite(currentPosition.updatedHeight) &&
      currentPosition.updatedHeight > 0
        ? currentPosition.updatedHeight
        : fallbackHeight;
    updatedPositionCache[optionId] = {
      ...(currentPosition ?? {}),
      updatedHeight,
      updatedIndex: index,
      updatedTop: runningTop,
    };
    runningTop += updatedHeight + (i === indices.length - 1 ? 0 : gap);
  }

  return {
    positionCache: updatedPositionCache,
    totalHeight: runningTop,
  };
};

const findClosestIndex = (
  inverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache'],
  positionCache: CurrentOptionPositionsCache['positionCache'],
  draggedCenter: number,
) => {
  'worklet';

  const indices = Object.keys(inverseIndexCache).map((key) => Number(key));

  if (!indices.length) {
    return 0;
  }

  let closestIndex = indices[0];
  let closestDistance = Number.MAX_VALUE;

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    const optionId = inverseIndexCache[index];
    if (!optionId) {
      continue;
    }
    const position = positionCache[optionId];
    if (!position) {
      continue;
    }
    const center = position.updatedTop + position.updatedHeight / 2;
    const distance = Math.abs(center - draggedCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
};

export const CreatePollOption = ({
  currentOptionPositions,
  draggedItemId,
  error,
  handleBlur,
  handleChangeText,
  index,
  isDragging,
  option,
  onOptionLayout,
  onNewOrder,
  onRemoveOption,
}: CreatePollOptionType) => {
  const { t } = useTranslationContext();
  const { createPollOptionGap = 8, createPollOptionHeight = POLL_OPTION_HEIGHT } =
    useCreatePollContentContext();
  const normalizedCreatePollOptionGap =
    Number.isFinite(createPollOptionGap) && createPollOptionGap > 0 ? createPollOptionGap : 0;
  const top = useSharedValue(index * (createPollOptionHeight + normalizedCreatePollOptionGap));
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

  // retains the original top from drag start so translation math stays stable across swaps
  const dragStartTop = useSharedValue(0);

  // The sanity check for position cache updated index, is added because after a poll is sent its been reset
  // by the composer and it throws an undefined error. This can be removed in future.
  useAnimatedReaction(
    () => currentOptionPositionsDerived.value.positionCache[option.id]?.updatedTop ?? 0,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue && !isCurrentDraggingItem.value) {
        top.value = withSpring(currentValue);
      }
    },
  );

  const gesture = Gesture.Pan()
    .onStart(() => {
      const currentPosition = currentOptionPositionsDerived.value.positionCache[option.id];
      if (!currentPosition) {
        return;
      }

      // start dragging
      isDragging.value = withSpring(1);

      // keep track of dragged item
      draggedItemId.value = option.id;

      // store dragged item id for future swap
      currentIndex.value = currentPosition.updatedIndex;
      dragStartTop.value = currentPosition.updatedTop;
    })
    .onUpdate((e) => {
      const { inverseIndexCache, positionCache, totalHeight } = currentOptionPositionsDerived.value;
      if (draggedItemIdDerived.value === null || currentIndex.value === null) {
        return;
      }

      const draggedItemPosition = positionCache[draggedItemIdDerived.value];
      if (!draggedItemPosition) {
        return;
      }

      const maxBound = Math.max(totalHeight - draggedItemPosition.updatedHeight, 0);
      const newTop = dragStartTop.value + e.translationY;

      // we add a small leeway to account for sharp animations which tend to bug out otherwise
      if (newTop < -10 || newTop > maxBound + 10) {
        // out of bounds, exit out of the animation early
        return;
      }
      top.value = newTop;

      // calculate the new index where drag is headed to
      const draggedCenter = newTop + draggedItemPosition.updatedHeight / 2;
      newIndex.value = findClosestIndex(inverseIndexCache, positionCache, draggedCenter);

      // swap the items present at newIndex and currentIndex
      if (newIndex.value !== currentIndex.value) {
        // find id of the item that currently resides at newIndex
        const newIndexItemKey = inverseIndexCache[newIndex.value];

        // find id of the item that currently resides at currentIndex
        const currentDragIndexItemKey = inverseIndexCache[currentIndex.value];

        if (newIndexItemKey !== undefined && currentDragIndexItemKey !== undefined) {
          // if we indeed have a candidate for a new index, we update our cache so that
          // it can be reflected through animations
          const nextInverseIndexCache = {
            ...inverseIndexCache,
            [newIndex.value]: currentDragIndexItemKey,
            [currentIndex.value]: newIndexItemKey,
          };
          const recalculated = recalculatePositionCache(
            nextInverseIndexCache,
            positionCache,
            createPollOptionHeight,
            normalizedCreatePollOptionGap,
          );

          currentOptionPositions.value = {
            inverseIndexCache: nextInverseIndexCache,
            positionCache: recalculated.positionCache,
            totalHeight: recalculated.totalHeight,
          };

          // update new index as current index
          currentIndex.value = newIndex.value;
        }
      }
    })
    .onEnd(() => {
      const { inverseIndexCache, positionCache } = currentOptionPositionsDerived.value;
      if (currentIndex.value === null) {
        isDragging.value = withDelay(200, withSpring(0));
        draggedItemId.value = null;
        return;
      }

      const currentDragIndexItemKey = inverseIndexCache[currentIndex.value];
      const currentDragTop =
        currentDragIndexItemKey !== undefined
          ? positionCache[currentDragIndexItemKey]?.updatedTop
          : undefined;
      top.value = withSpring(currentDragTop ?? top.value);

      // stop dragging
      isDragging.value = withDelay(200, withSpring(0));
      draggedItemId.value = null;
      currentIndex.value = null;
      newIndex.value = null;
      runOnJS(onNewOrder)(currentOptionPositionsDerived.value.inverseIndexCache);
    });

  const {
    theme: {
      poll: {
        createContent: {
          pollOptions: { optionStyle },
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const onChangeTextHandler = useCallback(
    (newText: string) => {
      handleChangeText(newText, index);
    },
    [handleChangeText, index],
  );

  const onRemoveOptionHandler = useCallback(() => {
    onRemoveOption(index);
  }, [onRemoveOption, index]);

  const onLayoutHandler = useCallback(
    (event: LayoutChangeEvent) => {
      onOptionLayout(option.id, event.nativeEvent.layout.height);
    },
    [onOptionLayout, option.id],
  );

  return (
    <Animated.View
      onLayout={onLayoutHandler}
      style={[
        styles.optionWrapper,
        optionStyle.wrapper,
        {
          position: 'absolute',
        },
        animatedStyles,
      ]}
    >
      <View style={[styles.optionContent, optionStyle.content]}>
        <GestureDetector gesture={gesture}>
          <Animated.View>
            <DotGrid height={20} width={20} stroke={semantics.inputTextIcon} />
          </Animated.View>
        </GestureDetector>
        <TextInput
          onBlur={handleBlur}
          onChangeText={onChangeTextHandler}
          placeholder={t('Add an option')}
          placeholderTextColor={semantics.inputTextPlaceholder}
          style={[styles.optionInput, optionStyle.input]}
        />
        <Pressable onPress={onRemoveOptionHandler}>
          <CircleMinus height={20} width={20} stroke={semantics.inputTextIcon} />
        </Pressable>
      </View>

      {error ? (
        <View style={[styles.optionValidationErrorContainer, optionStyle.validationErrorContainer]}>
          <InfoTooltip height={20} width={20} fill={semantics.accentError} />
          <Text style={[styles.optionValidationError, optionStyle.validationErrorText]}>
            {t(error)}
          </Text>
        </View>
      ) : null}
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
  const { createPollOptionGap = 8, createPollOptionHeight = POLL_OPTION_HEIGHT } =
    useCreatePollContentContext();
  const normalizedCreatePollOptionGap =
    Number.isFinite(createPollOptionGap) && createPollOptionGap > 0 ? createPollOptionGap : 0;

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
  const animatedOptionsContainerHeight = useSharedValue(currentOptionPositions.value.totalHeight);

  useAnimatedReaction(
    () => currentOptionPositions.value.totalHeight,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        animatedOptionsContainerHeight.value = withTiming(currentValue, {
          duration: 200,
        });
      }
    },
  );

  const animatedOptionsContainerStyle = useAnimatedStyle(() => ({
    height: animatedOptionsContainerHeight.value,
  }));

  const {
    theme: {
      poll: {
        createContent: {
          pollOptions: { container, title },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

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

  const onRemoveOptionHandler = useCallback(
    (index: number) => {
      if (options.length === 1) {
        return;
      }
      pollComposer.updateFields({
        options: options.filter((_, i) => i !== index),
      });
    },
    [options, pollComposer],
  );

  const onOptionLayout = useCallback(
    (optionId: string, height: number) => {
      if (!Number.isFinite(height) || height <= 0) {
        return;
      }

      const { positionCache } = currentOptionPositions.value;
      const currentPosition = positionCache[optionId];
      if (currentPosition && Math.abs(currentPosition.updatedHeight - height) < 1) {
        return;
      }

      const isKnownOption = options.some((option) => option.id === optionId);
      if (!isKnownOption) {
        return;
      }

      // Keep cache indices aligned with composer options order. This avoids transient
      // overlap when an empty option is auto-inserted while typing.
      const nextInverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache'] = {};
      options.forEach((option, index) => {
        nextInverseIndexCache[index] = option.id;
      });

      const nextPositionCache: CurrentOptionPositionsCache['positionCache'] = {};
      options.forEach((option, index) => {
        const cachedPosition = positionCache[option.id];
        nextPositionCache[option.id] = cachedPosition
          ? cachedPosition
          : {
              updatedHeight: createPollOptionHeight,
              updatedIndex: index,
              updatedTop: 0,
            };
      });

      nextPositionCache[optionId] = {
        ...nextPositionCache[optionId],
        updatedHeight: height,
      };

      const recalculated = recalculatePositionCache(
        nextInverseIndexCache,
        nextPositionCache,
        createPollOptionHeight,
        normalizedCreatePollOptionGap,
      );

      currentOptionPositions.value = {
        inverseIndexCache: nextInverseIndexCache,
        positionCache: recalculated.positionCache,
        totalHeight: recalculated.totalHeight,
      };
    },
    [createPollOptionHeight, currentOptionPositions, normalizedCreatePollOptionGap, options],
  );

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.title, title]}>{t('Options')}</Text>
      <Animated.View style={animatedOptionsContainerStyle}>
        {options.map((option, index) => (
          <MemoizedCreatePollOption
            currentOptionPositions={currentOptionPositions}
            draggedItemId={draggedItemId}
            error={errors?.[option.id]}
            handleBlur={handleBlur}
            handleChangeText={updateOption}
            onOptionLayout={onOptionLayout}
            onRemoveOption={onRemoveOptionHandler}
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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingVertical: primitives.spacingXl,
        gap: primitives.spacingXs,
      },
      optionInput: {
        flex: 1,
        fontSize: primitives.typographyFontSizeMd,
        lineHeight: primitives.typographyLineHeightNormal,
        fontWeight: primitives.typographyFontWeightRegular,
        color: semantics.inputTextDefault,
        paddingVertical: 0, // android is adding extra padding so we remove it
      },
      optionValidationErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXs,
        paddingHorizontal: primitives.spacingMd,
        paddingBottom: primitives.spacingSm,
      },
      optionValidationError: {
        color: semantics.accentError,
        fontSize: primitives.typographyFontSizeSm,
        lineHeight: primitives.typographyLineHeightNormal,
        fontWeight: primitives.typographyFontWeightRegular,
      },
      optionWrapper: {
        width: '100%',
        borderWidth: 1,
        borderColor: semantics.inputBorderDefault,
        borderRadius: primitives.radiusLg,
      },
      optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXs,
        paddingHorizontal: primitives.spacingMd,
        paddingVertical: primitives.spacingSm,
      },
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
    });
  }, [semantics]);
};
