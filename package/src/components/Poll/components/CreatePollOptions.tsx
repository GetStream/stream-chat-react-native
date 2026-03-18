import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  LinearTransition,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { PollComposerOption, PollComposerState } from 'stream-chat';

import { useCreatePollContentContext, useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';
import { CircleMinus } from '../../../icons/CircleMinus';
import { DotGrid } from '../../../icons/DotGrid';
import { InfoTooltip } from '../../../icons/InfoTooltip';
import { primitives } from '../../../theme';

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
  optionsCount: number;
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  draggedItemId: SharedValue<string | null>;
  error?: string;
  handleChangeText: (newText: string, index: number) => void;
  handleBlur: () => void;
  index: number;
  isDragging: SharedValue<1 | 0>;
  optionId: string;
  onOptionLayout: (optionId: string, height: number) => void;
  /**
   *
   * @param newOrder The inverse index object of the new options position after re-ordering.
   * @returns
   */
  onNewOrder: (newOrder: CurrentOptionPositionsCache['inverseIndexCache']) => void;
  onRemoveOption: (optionId: string) => void;
};

// Run after two frames so nested layout (including error rows) has settled.
const runAfterNextPaint = (cb: () => void) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
};

const recalculatePositionCache = (
  inverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache'],
  positionCache: CurrentOptionPositionsCache['positionCache'],
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
        : 0;
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

const findTargetIndex = (
  inverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache'],
  positionCache: CurrentOptionPositionsCache['positionCache'],
  currentIndex: number,
  draggedTop: number,
  draggedBottom: number,
  translationY: number,
) => {
  'worklet';

  const indices = Object.keys(inverseIndexCache)
    .map((key) => Number(key))
    .sort((a, b) => a - b);

  if (!indices.length) {
    return 0;
  }

  let targetIndex = currentIndex;

  if (translationY > 0) {
    // Moving down: cross next sibling center with dragged bottom edge.
    while (targetIndex < indices.length - 1) {
      const nextIndex = targetIndex + 1;
      const nextOptionId = inverseIndexCache[nextIndex];
      if (!nextOptionId) {
        break;
      }
      const nextPosition = positionCache[nextOptionId];
      if (!nextPosition) {
        break;
      }
      const nextCenter = nextPosition.updatedTop + nextPosition.updatedHeight / 2;
      if (draggedBottom > nextCenter) {
        targetIndex = nextIndex;
        continue;
      }
      break;
    }
  } else if (translationY < 0) {
    // Moving up: cross previous sibling center with dragged top edge.
    while (targetIndex > 0) {
      const previousIndex = targetIndex - 1;
      const previousOptionId = inverseIndexCache[previousIndex];
      if (!previousOptionId) {
        break;
      }
      const previousPosition = positionCache[previousOptionId];
      if (!previousPosition) {
        break;
      }
      const previousCenter = previousPosition.updatedTop + previousPosition.updatedHeight / 2;
      if (draggedTop < previousCenter) {
        targetIndex = previousIndex;
        continue;
      }
      break;
    }
  }

  return targetIndex;
};

const getSortedIndices = (inverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache']) =>
  Object.keys(inverseIndexCache)
    .map((key) => Number(key))
    .sort((a, b) => a - b);

const reconcileInverseIndexCacheWithOptionIds = (
  inverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache'],
  latestOptionIds: string[],
) => {
  const existingOrder: string[] = [];
  const latestIdSet = new Set(latestOptionIds);
  const sortedIndices = getSortedIndices(inverseIndexCache);

  for (let i = 0; i < sortedIndices.length; i++) {
    const optionId = inverseIndexCache[sortedIndices[i]];
    if (!optionId || !latestIdSet.has(optionId)) {
      continue;
    }
    existingOrder.push(optionId);
  }

  const existingIdSet = new Set(existingOrder);
  const missingOptionIds = latestOptionIds.filter((id) => !existingIdSet.has(id));
  const nextOrder = [...existingOrder, ...missingOptionIds];

  const nextInverse: CurrentOptionPositionsCache['inverseIndexCache'] = {};
  for (let i = 0; i < nextOrder.length; i++) {
    nextInverse[i] = nextOrder[i];
  }

  return nextInverse;
};

const reorderInverseIndexCache = (
  inverseIndexCache: CurrentOptionPositionsCache['inverseIndexCache'],
  draggedItemId: string,
  targetIndex: number,
) => {
  'worklet';

  const indices = Object.keys(inverseIndexCache)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
  const orderedIds: string[] = [];

  for (let i = 0; i < indices.length; i++) {
    const optionId = inverseIndexCache[indices[i]];
    if (!optionId || optionId === draggedItemId) {
      continue;
    }
    orderedIds.push(optionId);
  }

  const boundedIndex = Math.min(Math.max(targetIndex, 0), orderedIds.length);
  orderedIds.splice(boundedIndex, 0, draggedItemId);

  const nextInverse: CurrentOptionPositionsCache['inverseIndexCache'] = {};
  for (let i = 0; i < orderedIds.length; i++) {
    nextInverse[i] = orderedIds[i];
  }

  return nextInverse;
};

const getFallbackTopForIndex = (
  index: number,
  positionCache: CurrentOptionPositionsCache['positionCache'],
  gap: number,
) => {
  const knownPositions = Object.values(positionCache)
    .filter(
      (position) =>
        Number.isFinite(position.updatedIndex) &&
        position.updatedIndex >= 0 &&
        Number.isFinite(position.updatedHeight) &&
        position.updatedHeight >= 0,
    )
    .sort((a, b) => a.updatedIndex - b.updatedIndex);

  let runningTop = 0;
  for (let i = 0; i < knownPositions.length; i++) {
    if (knownPositions[i].updatedIndex >= index) {
      break;
    }
    runningTop += knownPositions[i].updatedHeight + gap;
  }

  return runningTop;
};

export const CreatePollOption = ({
  optionsCount,
  currentOptionPositions,
  draggedItemId,
  error,
  handleBlur,
  handleChangeText,
  index,
  isDragging,
  optionId,
  onOptionLayout,
  onNewOrder,
  onRemoveOption,
}: CreatePollOptionType) => {
  const { t } = useTranslationContext();
  const { createPollOptionGap = 8 } = useCreatePollContentContext();
  const normalizedCreatePollOptionGap =
    Number.isFinite(createPollOptionGap) && createPollOptionGap > 0 ? createPollOptionGap : 0;
  const initialTop =
    currentOptionPositions.value.positionCache[optionId]?.updatedTop ??
    getFallbackTopForIndex(
      index,
      currentOptionPositions.value.positionCache,
      normalizedCreatePollOptionGap,
    );
  const top = useSharedValue(initialTop);
  const optionContainerRef = useRef<View>(null);
  const isMeasurementScheduledRef = useRef(false);
  const isDraggingDerived = useDerivedValue(() => isDragging.value);

  const draggedItemIdDerived = useDerivedValue(() => draggedItemId.value);

  const isCurrentDraggingItem = useDerivedValue(
    () => isDraggingDerived.value && draggedItemIdDerived.value === optionId,
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

  // Target index computed during drag.
  const newIndex = useSharedValue<number | null>(null);

  // Current dragged item's index in the live reorder cache.
  const currentIndex = useSharedValue<number | null>(null);

  // Keep drag translation anchored to drag-start top.
  const dragStartTop = useSharedValue(0);
  const previousDragTop = useSharedValue(0);

  useAnimatedReaction(
    () => currentOptionPositionsDerived.value.positionCache[optionId]?.updatedTop ?? 0,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue && !isCurrentDraggingItem.value) {
        top.value = withSpring(currentValue);
      }
    },
  );

  const gesture = Gesture.Pan()
    .onStart(() => {
      const currentPosition = currentOptionPositionsDerived.value.positionCache[optionId];
      if (!currentPosition) {
        return;
      }

      // start dragging
      isDragging.value = withSpring(1);

      // keep track of dragged item
      draggedItemId.value = optionId;

      // capture drag start position/index
      currentIndex.value = currentPosition.updatedIndex;
      dragStartTop.value = currentPosition.updatedTop;
      previousDragTop.value = currentPosition.updatedTop;
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
      const frameDeltaY = newTop - previousDragTop.value;
      previousDragTop.value = newTop;

      // we add a small leeway to account for sharp animations which tend to bug out otherwise
      if (newTop < -10 || newTop > maxBound + 10) {
        // out of bounds, exit out of the animation early
        return;
      }
      top.value = newTop;

      // calculate the new index where drag is headed to
      const draggedTop = newTop;
      const draggedBottom = newTop + draggedItemPosition.updatedHeight;
      newIndex.value = findTargetIndex(
        inverseIndexCache,
        positionCache,
        currentIndex.value,
        draggedTop,
        draggedBottom,
        frameDeltaY,
      );

      // Reorder by inserting dragged item into target slot.
      if (newIndex.value !== currentIndex.value) {
        const nextInverseIndexCache = reorderInverseIndexCache(
          inverseIndexCache,
          draggedItemIdDerived.value,
          newIndex.value,
        );
        const recalculated = recalculatePositionCache(
          nextInverseIndexCache,
          positionCache,
          normalizedCreatePollOptionGap,
        );

        currentOptionPositions.value = {
          inverseIndexCache: nextInverseIndexCache,
          positionCache: recalculated.positionCache,
          totalHeight: recalculated.totalHeight,
        };

        currentIndex.value = newIndex.value;
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
    onRemoveOption(optionId);
  }, [onRemoveOption, optionId]);

  const onLayoutHandler = useCallback(
    (event: LayoutChangeEvent) => {
      onOptionLayout(optionId, event.nativeEvent.layout.height);
    },
    [onOptionLayout, optionId],
  );

  const measureOptionHeight = useCallback(() => {
    if (isMeasurementScheduledRef.current) {
      return;
    }
    isMeasurementScheduledRef.current = true;
    runAfterNextPaint(() => {
      const currentOptionContainer = optionContainerRef.current;
      if (!currentOptionContainer) {
        isMeasurementScheduledRef.current = false;
        return;
      }
      currentOptionContainer.measure((_x, _y, _width, height) => {
        isMeasurementScheduledRef.current = false;
        if (Number.isFinite(height) && height > 0) {
          onOptionLayout(optionId, height);
        }
      });
    });
  }, [onOptionLayout, optionId]);
  const onErrorLayoutHandler = useCallback(() => {
    measureOptionHeight();
  }, [measureOptionHeight]);

  useEffect(() => {
    measureOptionHeight();
  }, [error, measureOptionHeight, optionsCount]);

  return (
    <Animated.View
      onLayout={onLayoutHandler}
      ref={optionContainerRef}
      style={[
        styles.optionWrapper,
        optionStyle.wrapper,
        {
          position: 'absolute',
        },
        animatedStyles,
      ]}
    >
      <Animated.View layout={LayoutTransition} style={[styles.optionContent, optionStyle.content]}>
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
      </Animated.View>

      {error ? (
        <View
          onLayout={onErrorLayoutHandler}
          style={[styles.optionValidationErrorContainer, optionStyle.validationErrorContainer]}
        >
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
  const { createPollOptionGap = 8 } = useCreatePollContentContext();
  const normalizedCreatePollOptionGap =
    Number.isFinite(createPollOptionGap) && createPollOptionGap > 0 ? createPollOptionGap : 0;
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
      if (currentValue === previousValue) {
        return;
      }

      animatedOptionsContainerHeight.value = currentValue;
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
      const latestOptions = optionsRef.current;
      const optionById: Record<string, PollComposerOption> = {};
      for (let i = 0; i < latestOptions.length; i++) {
        optionById[latestOptions[i].id] = latestOptions[i];
      }

      const reorderedPollOptions: PollComposerOption[] = [];
      for (let i = 0; i < latestOptions.length; i++) {
        const optionId = newOrder[i];
        if (!optionId) {
          continue;
        }
        const currentOption = optionById[optionId];
        if (currentOption) {
          reorderedPollOptions.push(currentOption);
        }
      }

      await pollComposer.updateFields({
        options: reorderedPollOptions,
      });
    },
    [pollComposer],
  );

  const onRemoveOptionHandler = useCallback(
    (optionId: string) => {
      const latestOptions = optionsRef.current;
      if (latestOptions.length === 1) {
        return;
      }
      pollComposer.updateFields({
        options: latestOptions.filter((option) => option.id !== optionId),
      });
    },
    [pollComposer],
  );

  const onOptionLayout = useCallback(
    (optionId: string, height: number) => {
      if (!Number.isFinite(height) || height <= 0) {
        return;
      }

      const { inverseIndexCache, positionCache } = currentOptionPositions.value;
      const currentPosition = positionCache[optionId];
      if (currentPosition && Math.abs(currentPosition.updatedHeight - height) < 1) {
        return;
      }

      const latestOptions = optionsRef.current;
      const latestOptionIds = latestOptions.map((option) => option.id);
      const isKnownOption = latestOptionIds.includes(optionId);
      if (!isKnownOption) {
        return;
      }

      const nextInverseIndexCache = reconcileInverseIndexCacheWithOptionIds(
        inverseIndexCache,
        latestOptionIds,
      );

      const nextPositionCache: CurrentOptionPositionsCache['positionCache'] = {};
      const sortedIndices = getSortedIndices(nextInverseIndexCache);
      sortedIndices.forEach((index) => {
        const currentOptionId = nextInverseIndexCache[index];
        if (!currentOptionId) {
          return;
        }
        const cachedPosition = positionCache[currentOptionId];
        nextPositionCache[currentOptionId] = cachedPosition
          ? cachedPosition
          : {
              updatedHeight: 0,
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
        normalizedCreatePollOptionGap,
      );

      currentOptionPositions.value = {
        inverseIndexCache: nextInverseIndexCache,
        positionCache: recalculated.positionCache,
        totalHeight: recalculated.totalHeight,
      };
    },
    [currentOptionPositions, normalizedCreatePollOptionGap],
  );

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.title, title]}>{t('Options')}</Text>
      <Animated.View layout={LinearTransition.duration(200)} style={animatedOptionsContainerStyle}>
        {options.map((option, index) => (
          <MemoizedCreatePollOption
            optionsCount={options.length}
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
            optionId={option.id}
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
        borderColor: semantics.borderCoreDefault,
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

const LayoutTransition = LinearTransition.duration(200).springify();
