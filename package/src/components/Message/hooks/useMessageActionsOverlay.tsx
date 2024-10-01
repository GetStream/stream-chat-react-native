import { useEffect, useRef, useState } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

/**
 * Hook to manage the message actions overlay
 */
export const useMessageActionsOverlay = () => {
  const [messageOverlayVisible, setMessageOverlayVisible] = useState(false);

  const messageActionsBottomSheetRef = useRef<BottomSheetModal>(null);

  /**
   * Function to open the message actions bottom sheet
   */
  const openMessageActionsBottomSheet = () => {
    if (messageActionsBottomSheetRef.current?.present) {
      messageActionsBottomSheetRef.current.present();
    } else {
      console.warn('bottom and top insets must be set for the image picker to work correctly');
    }
  };

  /**
   * Function to close the message actions bottom sheet
   */
  const closeMessageActionsBottomSheet = () => {
    if (messageActionsBottomSheetRef.current?.dismiss) {
      messageActionsBottomSheetRef.current.dismiss();
    }
  };

  /**
   * Effect to open or close the message actions bottom sheet
   */
  useEffect(() => {
    if (messageOverlayVisible) {
      openMessageActionsBottomSheet();
    } else {
      closeMessageActionsBottomSheet();
    }
  }, [messageOverlayVisible]);

  return {
    messageActionsBottomSheetRef,
    messageOverlayVisible,
    setMessageOverlayVisible,
  };
};
