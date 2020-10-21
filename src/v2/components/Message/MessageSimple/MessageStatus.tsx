import React from 'react';
import { Image, ImageRequireSource, StyleSheet, View } from 'react-native';

import { Avatar } from '../../Avatar/Avatar';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { ForwardedMessageProps } from './MessageContent';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const iconDeliveredUnseen: ImageRequireSource = require('../../../../images/icons/delivered_unseen.png');
const loadingGif: ImageRequireSource = require('../../../../images/loading.gif');

const styles = StyleSheet.create({
  checkMark: {
    height: 6,
    width: 8,
  },
  deliveredCircle: {
    alignItems: 'center',
    borderRadius: 16,
    height: 16,
    justifyContent: 'center',
    padding: 6,
    width: 16,
  },
  deliveredContainer: { alignItems: 'center', height: 20 },
  readByContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sendingContainer: {
    alignItems: 'center',
  },
  sendingImage: {
    height: 10,
    width: 10,
  },
  spacer: {
    height: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 20,
  },
});

export const MessageStatus = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { lastReceivedId, message, readBy = [], threadList } = props;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    theme: {
      colors: { primary },
      message: {
        status: {
          checkMark,
          deliveredCircle,
          deliveredContainer,
          readByContainer,
          sendingContainer,
          sendingImage,
        },
      },
    },
  } = useTheme();

  const justReadByMe = readBy.length === 1 && readBy[0].id === client.user?.id;

  if (message.status === 'sending') {
    return (
      <View style={styles.statusContainer}>
        <View
          style={[styles.sendingContainer, sendingContainer]}
          testID='sending-container'
        >
          <Image
            source={loadingGif}
            style={[styles.sendingImage, sendingImage]}
          />
        </View>
      </View>
    );
  }

  if (
    readBy.length !== 0 &&
    !threadList &&
    message.id === lastReceivedId &&
    !justReadByMe
  ) {
    const lastReadUser = readBy.filter(
      (item) => item.id !== client.user?.id,
    )[0];
    return (
      <View style={styles.statusContainer}>
        <View
          style={[styles.readByContainer, readByContainer]}
          testID='read-by-container'
        >
          <Avatar
            image={lastReadUser.image}
            name={lastReadUser.name || lastReadUser.id}
            size={16}
          />
        </View>
      </View>
    );
  }

  if (
    message.status === 'received' &&
    message.type !== 'ephemeral' &&
    message.id === lastReceivedId &&
    !threadList
  ) {
    return (
      <View style={styles.statusContainer}>
        <View
          style={[styles.deliveredContainer, deliveredContainer]}
          testID='delivered-container'
        >
          <View
            style={[
              styles.deliveredCircle,
              { backgroundColor: primary },
              deliveredCircle,
            ]}
          >
            <Image
              source={iconDeliveredUnseen}
              style={[styles.checkMark, checkMark]}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statusContainer}>
      <View style={styles.spacer} testID='spacer' />
    </View>
  );
};

MessageStatus.displayName = 'MessageStatus{message{status}}';
