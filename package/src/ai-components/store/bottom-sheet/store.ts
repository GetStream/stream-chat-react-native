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

export const sheetStore = new StateStore<BottomSheetState>(DEFAULT_STATE);

const openSheet = () => {
  Keyboard.dismiss();
  sheetStore.partialNext({ open: true });
};

const closeSheet = () => sheetStore.partialNext(DEFAULT_STATE);

const setHeight = (height: number) => sheetStore.partialNext({ height });

export const sheetStoreApi = {
  openSheet,
  closeSheet,
  setHeight,
};
