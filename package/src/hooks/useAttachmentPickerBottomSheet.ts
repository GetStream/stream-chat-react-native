import { useCallback, useRef } from 'react';

import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

/**
 * This hook is used to manage the state of the attachment picker bottom sheet.
 * It provides functions to open and close the bottom sheet, as well as a reference to the bottom sheet itself.
 * The bottom sheet is used to display the attachment picker UI.
 * The `openPicker` function opens the bottom sheet, and the `closePicker` function closes it.
 * The `bottomSheetRef` is a reference to the bottom sheet component, which allows for programmatic control of the bottom sheet.
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
