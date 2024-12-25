import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type ActionType =
  | 'banUser'
  | 'blockUser'
  | 'copyMessage'
  | 'deleteMessage'
  | 'editMessage'
  | 'flagMessage'
  | 'markUnread'
  | 'muteUser'
  | 'pinMessage'
  | 'selectReaction'
  | 'reply'
  | 'retry'
  | 'quotedReply'
  | 'threadReply'
  | 'unpinMessage';

export type MessageActionType = {
  /**
   * Callback when user presses the action button.
   */
  action: () => void;
  /**
   * Type of the action performed.
   * Eg: 'banUser', 'blockUser', 'copyMessage', 'deleteMessage', 'editMessage', 'flagMessage', 'markUnread , 'muteUser', 'pinMessage', 'selectReaction', 'reply', 'retry', 'quotedReply', 'threadReply', 'unpinMessage'
   */
  actionType: ActionType | string;
  /**
   * Title for action button.
   */
  title: string;
  /**
   * Element to render as icon for action button.
   */
  icon?: React.ReactElement;
  /**
   * Styles for underlying Text component of action title.
   */
  titleStyle?: StyleProp<TextStyle>;
};

/**
 * MessageActionListItem - A high-level component that implements all the logic required for a `MessageAction` in a `MessageActionList`
 */
export type MessageActionListItemProps = MessageActionType;

export const MessageActionListItem = (props: MessageActionListItemProps) => {
  const { action, actionType, icon, title, titleStyle } = props;

  const {
    theme: {
      colors: { black },
      messageMenu: {
        actionListItem: { container, icon: iconTheme, title: titleTheme },
      },
    },
  } = useTheme();

  return (
    <Pressable onPress={action} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
      <View
        accessibilityLabel={`${actionType} action list item`}
        style={[styles.container, container]}
      >
        <View style={iconTheme}>{icon}</View>
        <Text style={[styles.titleStyle, { color: black }, titleStyle, titleTheme]}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  titleStyle: {
    paddingLeft: 16,
  },
});
