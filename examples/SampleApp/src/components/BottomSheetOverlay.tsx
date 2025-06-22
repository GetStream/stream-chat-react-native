import React, { useEffect } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';

import { AddMemberBottomSheet } from './AddMemberBottomSheet';
import { ConfirmationBottomSheet } from './ConfirmationBottomSheet';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';

const styles = StyleSheet.create({
  addMembers: { borderRadius: 16, marginHorizontal: 8 },
  animatedContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

export type BottomSheetOverlayProps = {
  overlayOpacity: number;
  visible: boolean;
};

export const BottomSheetOverlay = (props: BottomSheetOverlayProps) => {
  const { overlayOpacity, visible } = props;

  const { overlay, setOverlay } = useAppOverlayContext();

  const { reset } = useBottomSheetOverlayContext();

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return null;
};
