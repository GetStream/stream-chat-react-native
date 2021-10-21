import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useMessageActionAnimation } from './hooks/useMessageActionAnimation';
import { vw } from '../../utils/utils';
import type { MessageActionListProps } from './MessageActionList';

const styles = StyleSheet.create({
  bottomBorder: {
    borderBottomWidth: 1,
  },
  container: {
    borderRadius: 16,
    marginTop: 8,
    maxWidth: 275,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    minWidth: vw(65),
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleStyle: {
    paddingLeft: 20,
  },
});

export type ActionType =
  | 'blockUser'
  | 'copyMessage'
  | 'deleteMessage'
  | 'editMessage'
  | 'flagMessage'
  | 'muteUser'
  | 'pinMessage'
  | 'selectReaction'
  | 'reply'
  | 'retry'
  | 'quotedReply'
  | 'threadReply'
  | 'unpinMessage';

export type MessageActionType = {
  action: () => void;
  actionType: ActionType;
  title: string;
  icon?: React.ReactElement;
  titleStyle?: StyleProp<TextStyle>;
};

export type MessageActionListItemProps = MessageActionType &
  Pick<
    MessageActionListProps,
    | 'canModifyMessage'
    | 'error'
    | 'isMyMessage'
    | 'isThreadMessage'
    | 'message'
    | 'messageReactions'
    | 'mutesEnabled'
    | 'pinMessageEnabled'
    | 'quotedRepliesEnabled'
    | 'threadRepliesEnabled'
  > & {
    index: number;
    length: number;
  };

const MessageActionListItemWithContext = (props: MessageActionListItemProps) => {
  const { action, icon, index, length, title, titleStyle } = props;

  const {
    theme: {
      colors: { black, border },
      overlay: { messageActions },
    },
  } = useTheme();

  const { animatedStyle, onTap } = useMessageActionAnimation({ action });

  return (
    <TapGestureHandler onHandlerStateChange={onTap}>
      <Animated.View
        style={[
          styles.row,
          index !== length - 1 ? { ...styles.bottomBorder, borderBottomColor: border } : {},
          animatedStyle,
          messageActions.actionContainer,
        ]}
      >
        <View style={messageActions.icon}>{icon}</View>
        <Text style={[styles.titleStyle, messageActions.title, { color: black }, titleStyle]}>
          {title}
        </Text>
      </Animated.View>
    </TapGestureHandler>
  );
};

const messageActionIsEqual = (
  prevProps: MessageActionListItemProps,
  nextProps: MessageActionListItemProps,
) => prevProps.length === nextProps.length;

export const MemoizedMessageActionListItem = React.memo(
  MessageActionListItemWithContext,
  messageActionIsEqual,
) as typeof MessageActionListItemWithContext;

/**
 * MessageActionListItem - A high-level component that implements all the logic required for a `MessageAction` in a `MessageActionList`
 */
export const MessageActionListItem = (props: MessageActionListItemProps) => (
  <MemoizedMessageActionListItem {...props} />
);
