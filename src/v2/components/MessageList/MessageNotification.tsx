import React, { useEffect, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  animatedView: {
    bottom: 0,
    position: 'absolute',
  },
  container: {
    alignItems: 'center',
    borderRadius: 13,
    height: 27,
    justifyContent: 'center',
    transform: [{ translateY: 9 }],
    width: 112,
    zIndex: 10,
  },
  messageNotificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export type MessageNotificationProps = {
  /** onPress handler */
  onPress: (event: GestureResponderEvent) => void;
  /** If we should show the notification or not */
  showNotification?: boolean;
};

/**
 * @example ./MessageNotification.md
 */
export const MessageNotification: React.FC<MessageNotificationProps> = (
  props,
) => {
  const { onPress, showNotification = true } = props;

  const {
    theme: {
      colors: { primary },
      messageList: {
        messageNotification: { container, text },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      duration: 500,
      toValue: showNotification ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [showNotification]);

  return showNotification ? (
    <Animated.View
      style={[
        styles.animatedView,
        {
          opacity,
        },
      ]}
      testID='message-notification'
    >
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, { backgroundColor: primary }, container]}
      >
        <Text style={[styles.messageNotificationText, text]}>
          {t('New Messages')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  ) : null;
};

MessageNotification.displayName =
  'MessageNotification{messageList{messageNotification}}';
