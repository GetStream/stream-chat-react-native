import { useStateStore } from '@stream-io/state-store/react-bindings';

import { type BottomSheetState, sheetStore } from './store';

const selector = ({ open, height }: BottomSheetState) => ({
  open,
  height,
});

export const useBottomSheetState = () => useStateStore(sheetStore, selector);
