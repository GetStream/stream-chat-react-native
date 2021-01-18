import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {
  ChannelPreviewMessenger,
  ChannelPreviewMessengerProps,
  Delete,
  MenuPointHorizontal,
  useChatContext,
  useTheme,
} from 'stream-chat-react-native';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useChannelInfoOverlayContext } from '../context/ChannelInfoOverlayContext';

import type { StackNavigationProp } from '@react-navigation/stack';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';

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
});

type ChannelListScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChannelListScreen'
>;

export const ChannelPreview: React.FC<
  ChannelPreviewMessengerProps<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >
> = (props) => {
  const { channel } = props;

  const { setOverlay } = useAppOverlayContext();

  const { setData } = useChannelInfoOverlayContext();

  const { client } = useChatContext<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >();

  const navigation = useNavigation<ChannelListScreenNavigationProp>();

  const {
    theme: {
      colors: { accent_red, white_smoke },
    },
  } = useTheme();

  return (
    <Swipeable
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={() => (
        <View
          style={[styles.swipeableContainer, { backgroundColor: white_smoke }]}
        >
          <RectButton
            onPress={() => {
              setData({ channel, clientId: client.userID, navigation });
              setOverlay('channelInfo');
            }}
            style={[styles.leftSwipeableButton]}
          >
            <MenuPointHorizontal />
          </RectButton>
          <RectButton
            onPress={() => channel.delete()}
            style={[styles.rightSwipeableButton]}
          >
            <Delete pathFill={accent_red} />
          </RectButton>
        </View>
      )}
    >
      <ChannelPreviewMessenger {...props} />
    </Swipeable>
  );
};
