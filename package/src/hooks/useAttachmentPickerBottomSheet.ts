import { useCallback, useEffect, useRef } from 'react';

import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

/**
 * This hook is used to manage the state of the attachment picker bottom sheet.
 * It provides functions to open and close the bottom sheet, as well as a reference to the bottom sheet itself.
 * It also handles the cleanup of the timeout used to close the bottom sheet.
 * The bottom sheet is used to display the attachment picker UI.
 * The `openPicker` function opens the bottom sheet, and the `closePicker` function closes it.
 * The `bottomSheetRef` is a reference to the bottom sheet component, which allows for programmatic control of the bottom sheet.
 * The `bottomSheetCloseTimeoutRef` is used to store the timeout ID for the close operation, allowing for cleanup if necessary.
 */
export const useAttachmentPickerBottomSheet = () => {
  const bottomSheetCloseTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(
    () =>
      // cleanup the timeout if the component unmounts
      () => {
        if (bottomSheetCloseTimeoutRef.current) {
          clearTimeout(bottomSheetCloseTimeoutRef.current);
        }
      },
    [],
  );

  const openPicker = useCallback((ref: React.RefObject<BottomSheetMethods | null>) => {
    if (bottomSheetCloseTimeoutRef.current) {
      clearTimeout(bottomSheetCloseTimeoutRef.current);
    }
    if (ref.current?.snapToIndex) {
      ref.current.snapToIndex(0);
    } else {
      console.warn('bottom and top insets must be set for the image picker to work correctly');
    }
  }, []);

  const closePicker = useCallback((ref: React.RefObject<BottomSheetMethods | null>) => {
    if (ref.current?.close) {
      if (bottomSheetCloseTimeoutRef.current) {
        clearTimeout(bottomSheetCloseTimeoutRef.current);
      }
      ref.current.close();
      // Attempt to close the bottomsheet again to circumvent accidental opening on Android.
      // Details: This to prevent a race condition where the close function is called during the point when a internal container layout happens within the bottomsheet due to keyboard affecting the layout
      // If the container layout measures a shorter height than previous but if the close snapped to the previous height's position, the bottom sheet will show up
      // this short delay ensures that close function is always called after a container layout due to keyboard change
      // NOTE: this timeout has to be above 500 as the keyboardAnimationDuration is 500 in the bottomsheet library - see src/hooks/useKeyboard.ts there for more details
      bottomSheetCloseTimeoutRef.current = setTimeout(() => {
        ref.current?.close();
      }, 600);
    }
  }, []);

  useEffect(() => {
    closePicker(bottomSheetRef);
  }, [closePicker]);

  return {
    bottomSheetCloseTimeoutRef,
    bottomSheetRef,
    closePicker,
    openPicker,
  };
};
