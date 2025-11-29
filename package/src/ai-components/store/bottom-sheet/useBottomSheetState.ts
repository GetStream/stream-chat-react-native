import { type BottomSheetState, sheetStore } from './store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

const selector = ({ open, height }: BottomSheetState) => ({
  open,
  height,
});

export const useBottomSheetState = () => useStateStore(sheetStore, selector);
