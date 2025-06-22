import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useChannelInfoOverlayContext } from '../context/ChannelInfoOverlayContext';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  leftSwipeableButton: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 20,
  },
  rightSwipeableButton: {
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 20,
  },
  swipeableContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  pinIconContainer: {
    marginLeft: 8,
  },
});

export const ChannelPreview = (
  props,
) => {
  const { channel } = props;

  const { setOverlay } = useAppOverlayContext();

  const { setData: setDataBottomSheet } = useBottomSheetOverlayContext();

  const { data, setData } = useChannelInfoOverlayContext();

  const otherMembers = channel
    ? Object.values(channel.state.members).filter((member) => member.user?.id !== data?.clientId)
    : [];

  return null;
};
