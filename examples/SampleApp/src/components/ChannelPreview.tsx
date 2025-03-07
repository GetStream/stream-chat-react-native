import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {
  ChannelPreviewMessenger,
  ChannelPreviewMessengerProps,
  ChannelPreviewStatus,
  ChannelPreviewStatusProps,
  Delete,
  MenuPointHorizontal,
  Pin,
  useChannelMembershipState,
  useChatContext,
  useTheme,
} from 'stream-chat-react-native';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useChannelInfoOverlayContext } from '../context/ChannelInfoOverlayContext';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList } from '../types';
import { ChannelState } from 'stream-chat';

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

type ChannelListScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChannelListScreen'
>;

const CustomChannelPreviewStatus = (
  props: ChannelPreviewStatusProps & { membership: ChannelState['membership'] },
) => {
  const { membership } = props;

  return (
    <View style={styles.statusContainer}>
      <ChannelPreviewStatus {...props} />
      {membership.pinned_at && (
        <View style={styles.pinIconContainer}>
          <Pin size={24} />
        </View>
      )}
    </View>
  );
};

export const ChannelPreview: React.FC<ChannelPreviewMessengerProps> = (
  props,
) => {
  const { channel } = props;

  const { setOverlay } = useAppOverlayContext();

  const { setData: setDataBottomSheet } = useBottomSheetOverlayContext();

  const { data, setData } = useChannelInfoOverlayContext();

  const { client } = useChatContext();

  const navigation = useNavigation<ChannelListScreenNavigationProp>();

  const membership = useChannelMembershipState(channel);

  const {
    theme: {
      colors: { accent_red, white_smoke },
    },
  } = useTheme();

  const otherMembers = channel
    ? Object.values(channel.state.members).filter((member) => member.user?.id !== data?.clientId)
    : [];

  return (
    <Swipeable
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={() => (
        <View style={[styles.swipeableContainer, { backgroundColor: white_smoke }]}>
          <RectButton
            onPress={() => {
              setData({ channel, clientId: client.userID, membership, navigation });
              setOverlay('channelInfo');
            }}
            style={[styles.leftSwipeableButton]}
          >
            <MenuPointHorizontal />
          </RectButton>
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
          >
            <Delete size={32} fill={accent_red} />
          </RectButton>
        </View>
      )}
    >
      <ChannelPreviewMessenger
        {...props}
        // eslint-disable-next-line react/no-unstable-nested-components
        PreviewStatus={(statusProps) => (
          <CustomChannelPreviewStatus {...statusProps} membership={membership} />
        )}
      />
    </Swipeable>
  );
};
