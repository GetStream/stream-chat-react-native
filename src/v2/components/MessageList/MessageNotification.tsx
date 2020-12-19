import React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Down } from '../../icons';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  animatedView: {
    bottom: 0,
    position: 'absolute',
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    bottom: 20,
    elevation: 5,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 40,
  },
  unreadCountNotificationContainer: {
    alignItems: 'center',
    backgroundColor: '#026CFF',
    borderRadius: 25,
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    position: 'absolute',
    top: -10,
  },
  unreadCountNotificationText: {
    color: 'white',
    fontSize: 11,
  },
});

export type MessageNotificationProps = {
  /** onPress handler */
  onPress: (event: GestureResponderEvent) => void;
  /** If we should show the notification or not */
  showNotification?: boolean;
  unreadCount?: number;
};

/**
 * @example ./MessageNotification.md
 */
export const MessageNotification: React.FC<MessageNotificationProps> = (
  props,
) => {
  const { onPress, showNotification = true, unreadCount } = props;

  const {
    theme: {
      messageList: {
        messageNotification: {
          container,
          unreadCountNotificationContainer,
          unreadCountNotificationText,
        },
      },
    },
  } = useTheme();

  if (!showNotification) return null;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, container]}>
      <Down height={25} width={25} />
      {!!unreadCount && unreadCount > 0 && (
        <View
          style={[
            styles.unreadCountNotificationContainer,
            unreadCountNotificationContainer,
          ]}
        >
          <Text
            style={[
              styles.unreadCountNotificationText,
              unreadCountNotificationText,
            ]}
          >
            {unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

MessageNotification.displayName =
  'MessageNotification{messageList{messageNotification}}';
