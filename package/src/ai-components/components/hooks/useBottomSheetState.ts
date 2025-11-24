import {
  type BottomSheetState,
  closeSheet,
  openSheet,
  store,
} from '../../store/bottom-sheet-state-store';
import { useStateStore } from '@stream-io/state-store/react-bindings';
import { useStableCallback } from '../../internal/hooks/useStableCallback';

const selector = ({ open, height }: BottomSheetState) => ({
  open,
  height,
});

export const useBottomSheetState = () => {
  const data = useStateStore(store, selector);

  const openSheetInternal = useStableCallback(() => {
    openSheet();
  });

  const closeSheetInternal = useStableCallback(() => {
    closeSheet();
  });

  return {
    ...data,
    openSheet: openSheetInternal,
    closeSheet: closeSheetInternal,
  };
};
