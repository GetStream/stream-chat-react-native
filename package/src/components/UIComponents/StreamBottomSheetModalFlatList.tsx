import React, { useRef } from 'react';
import { FlatListProps } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useBottomSheetContext } from '../../contexts/bottomSheetContext/BottomSheetContext';
import { useStableCallback } from '../../hooks';

type StreamBottomSheetModalFlatListProps<ItemT> = FlatListProps<ItemT>;

export const StreamBottomSheetModalFlatList = <ItemT,>({
  scrollEnabled: scrollEnabledProp,
  ...props
}: StreamBottomSheetModalFlatListProps<ItemT>) => {
  const { currentSnapIndex, topSnapIndex } = useBottomSheetContext();
  const listRef = useRef<FlatList<ItemT>>(null);

  const setNativeScrollEnabled = useStableCallback((value: boolean) =>
    listRef.current?.setNativeProps({ scrollEnabled: value }),
  );

  useAnimatedReaction(
    () => ({
      currentSnapIndex: currentSnapIndex.value,
      topSnapIndex: topSnapIndex.value,
    }),
    (value, prev) => {
      if (
        scrollEnabledProp !== undefined ||
        (prev &&
          value.currentSnapIndex === prev.currentSnapIndex &&
          value.topSnapIndex === prev.topSnapIndex)
      ) {
        return;
      }

      runOnJS(setNativeScrollEnabled)(value.currentSnapIndex === value.topSnapIndex);
    },
    [currentSnapIndex, topSnapIndex],
  );

  return <FlatList ref={listRef} {...props} scrollEnabled={false} />;
};
