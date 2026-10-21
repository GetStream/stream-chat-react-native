import { useCallback, useRef } from 'react';

import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

/**
 * Manages the attachment picker bottom sheet: a ref to the sheet plus `openPicker` and
 * `closePicker`, which open or close the sheet behind the ref they are given.
 *
 * @returns The `bottomSheetRef`, `openPicker` and `closePicker`.
 */
export const useAttachmentPickerBottomSheet = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const openPicker = useCallback((ref: React.RefObject<BottomSheetMethods | null>) => {
    if (ref.current?.snapToIndex) {
      ref.current.snapToIndex(0);
    } else {
      console.warn('bottom and top insets must be set for the image picker to work correctly');
    }
  }, []);

  const closePicker = useCallback((ref: React.RefObject<BottomSheetMethods | null>) => {
    if (ref.current?.close) {
      ref.current.close();
    }
  }, []);

  return {
    bottomSheetRef,
    closePicker,
    openPicker,
  };
};
