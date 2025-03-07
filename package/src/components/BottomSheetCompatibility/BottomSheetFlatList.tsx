import React, { useCallback } from 'react';
import type { FlatListProps } from 'react-native';

import type { AnimatedProps } from 'react-native-reanimated';

import { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';

import {
  BottomSheetFlatList as BottomSheetFlatListOriginal,
  BottomSheetScrollableProps,
} from '@gorhom/bottom-sheet';

export type BottomSheetFlatListProps<T> = Omit<
  AnimatedProps<FlatListProps<T>>,
  'decelerationRate' | 'onScroll' | 'scrollEventThrottle'
> &
  BottomSheetScrollableProps & {
    ref?: React.Ref<BottomSheetFlatListMethods>;
  };

export const BottomSheetFlatList = <T,>(props: BottomSheetFlatListProps<T>) => {
  const MemoizedBottomSheetFlatList = useCallback(
    BottomSheetFlatListOriginal as React.ComponentType<BottomSheetFlatListProps<T>>,
    [],
  );

  return <MemoizedBottomSheetFlatList {...props} />;
};
