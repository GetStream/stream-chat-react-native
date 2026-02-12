import React from 'react';
import { FlatListProps } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';

import { useBottomSheetContext } from '../../contexts/bottomSheetContext/BottomSheetContext';

type StreamBottomSheetModalFlatListProps<ItemT> = FlatListProps<ItemT>;

export const StreamBottomSheetModalFlatList = <ItemT,>({
  scrollEnabled: scrollEnabledProp,
  ...props
}: StreamBottomSheetModalFlatListProps<ItemT>) => {
  const { snapIndex } = useBottomSheetContext();
  const scrollEnabled = scrollEnabledProp ?? snapIndex === 1;

  return <FlatList {...props} scrollEnabled={scrollEnabled} />;
};
