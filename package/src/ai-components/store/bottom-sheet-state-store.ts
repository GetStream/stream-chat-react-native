import { StateStore } from '@stream-io/state-store';
import { Keyboard } from 'react-native';

export type BottomSheetState = {
  open: boolean;
  height: number;
};

const DEFAULT_STATE: BottomSheetState = {
  open: false,
  height: Number.MAX_SAFE_INTEGER,
};

export const store = new StateStore<BottomSheetState>(DEFAULT_STATE);

export const openSheet = () => {
  Keyboard.dismiss();
  store.partialNext({ open: true });
};

export const closeSheet = () => store.partialNext(DEFAULT_STATE);

export const setHeight = (height: number) => store.partialNext({ height });
