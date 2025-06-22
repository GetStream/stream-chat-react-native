import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

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

  return (
    <Swipeable
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={() => (
        <View style={[styles.swipeableContainer]}>
          <RectButton
            onPress={() => {
              setOverlay('channelInfo');
            }}
            style={[styles.leftSwipeableButton]}
           />
          <RectButton
            onPress={() => {
              setDataBottomSheet({
                confirmText: 'DELETE',
                onConfirm: () => {
                  channel.delete();
                  setOverlay('none');
                },
                subtext: `Are you sure you want to delete this ${
                  otherMembers.length === 1 ? 'conversation' : 'group'
                }?`,
                title: `Delete ${otherMembers.length === 1 ? 'Conversation' : 'Group'}`,
              });
              setOverlay('confirmation');
            }}
            style={[styles.rightSwipeableButton]}
           />
        </View>
      )}
     />
  );
};
