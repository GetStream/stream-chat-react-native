import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { ArrowUp } from '../../icons/ArrowUp';
import { NewClose } from '../../icons/NewClose';
import { primitives } from '../../theme';
import { Button } from '../ui';

export type UnreadMessagesNotificationProps = {
  /**
   * Callback to handle the close event
   */
  onCloseHandler?: () => void;
  /**
   * Callback to handle the press event
   */
  onPressHandler?: () => Promise<void>;
};

export const UnreadMessagesNotification = (props: UnreadMessagesNotificationProps) => {
  const { onCloseHandler, onPressHandler } = props;
  const { t } = useTranslationContext();
  const {
    channelUnreadStateStore,
    loadChannelAtFirstUnreadMessage,
    markRead,
    setChannelUnreadState,
    setTargetedMessage,
  } = useChannelContext();

  const handleOnPress = async () => {
    if (onPressHandler) {
      await onPressHandler();
    } else {
      await loadChannelAtFirstUnreadMessage({
        channelUnreadState: channelUnreadStateStore.channelUnreadState,
        setChannelUnreadState,
        setTargetedMessage,
      });
    }
  };

  const handleClose = async () => {
    if (onCloseHandler) {
      await onCloseHandler();
    } else {
      await markRead();
    }
  };

  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.leftButtonContainer}>
        <Button
          variant='secondary'
          type='ghost'
          LeadingIcon={ArrowUp}
          label={t('Unread Messages')}
          onPress={handleOnPress}
          size='md'
        />
      </View>
      <View style={styles.rightButtonContainer}>
        <Button
          variant='secondary'
          type='ghost'
          iconOnly
          LeadingIcon={NewClose}
          onPress={handleClose}
          size='md'
        />
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      messageList: {
        unreadMessagesNotification: { container, leftButtonContainer, rightButtonContainer },
      },
      semantics,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: primitives.radiusMax,
          borderWidth: 1,
          borderColor: semantics.borderCoreDefault,
          backgroundColor: semantics.backgroundCoreApp,
          flexDirection: 'row',
          alignItems: 'center',
          ...primitives.lightElevation4,
          ...container,
        },
        leftButtonContainer: {
          flexShrink: 0,
          borderRightWidth: 1,
          borderRightColor: semantics.borderCoreDefault,
          ...leftButtonContainer,
        },
        rightButtonContainer: {
          flexShrink: 0,
          ...rightButtonContainer,
        },
      }),
    [semantics, container, leftButtonContainer, rightButtonContainer],
  );
};
