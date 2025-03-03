import React from 'react';

import {
  BottomSheetModal as BottomSheetModalOriginal,
  BottomSheetModalProps,
  BottomSheetModalProvider as BottomSheetModalProviderOriginal,
} from '@gorhom/bottom-sheet';

export interface BottomSheetModalProviderProps {
  children?: React.ReactNode;
}

export const BottomSheetModalProvider =
  BottomSheetModalProviderOriginal as React.ComponentType<BottomSheetModalProviderProps>;
export const BottomSheetModal =
  BottomSheetModalOriginal as React.ComponentType<BottomSheetModalProps>;
