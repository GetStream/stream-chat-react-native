import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import type { ExtendableGenerics } from 'stream-chat';

import { MessageActionListItem as DefaultMessageActionListItem } from './MessageActionListItem';

import {
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import type { OverlayProviderProps } from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { vw } from '../../utils/utils';

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

export type MessageActionListPropsWithContext<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<
  OverlayProviderProps,
  | 'MessageActionListItem'
  | 'error'
  | 'isMyMessage'
  | 'isThreadMessage'
  | 'message'
  | 'messageReactions'
> &
  Pick<MessageOverlayData<StreamChatClient>, 'alignment' | 'messageActions'> & {
    showScreen: Animated.SharedValue<number>;
  };

const MessageActionListWithContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageActionListPropsWithContext<StreamChatClient>,
) => {
  const {
    alignment,
    messageActions,
    showScreen,
    MessageActionListItem = DefaultMessageActionListItem,
    isMyMessage,
    message,
    messageReactions,
    error,
    isThreadMessage,
  } = props;

  const messageActionProps = {
    error,
    isMyMessage,
    isThreadMessage,
    message,
    messageReactions,
  };

  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();

  const height = useSharedValue(0);
  const width = useSharedValue(0);

  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: interpolate(showScreen.value, [0, 1], [-height.value / 2, 0]),
        },
        {
          translateX: interpolate(
            showScreen.value,
            [0, 1],
            [alignment === 'left' ? -width.value / 2 : width.value / 2, 0],
          ),
        },
        {
          scale: showScreen.value,
        },
      ],
    }),
    [alignment],
  );

  return (
    <Animated.View
      onLayout={({ nativeEvent: { layout } }) => {
        width.value = layout.width;
        height.value = layout.height;
      }}
      style={[styles.container, { backgroundColor: white_snow }, showScreenStyle]}
      testID='message-action-list'
    >
      {messageActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...messageActionProps}
          {...{ ...messageAction, index, length: messageActions.length }}
        />
      ))}
    </Animated.View>
  );
};

const areEqual = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageActionListPropsWithContext<StreamChatClient>,
  nextProps: MessageActionListPropsWithContext<StreamChatClient>,
) => {
  const { alignment: prevAlignment, messageActions: prevMessageActions } = prevProps;
  const { alignment: nextAlignment, messageActions: nextMessageActions } = nextProps;

  const messageActionsEqual = prevMessageActions?.length === nextMessageActions?.length;
  if (!messageActionsEqual) return false;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

  return true;
};

const MemoizedMessageActionList = React.memo(
  MessageActionListWithContext,
  areEqual,
) as typeof MessageActionListWithContext;

export type MessageActionListProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<MessageActionListPropsWithContext<StreamChatClient>, 'showScreen'>> &
  Pick<
    MessageActionListPropsWithContext<StreamChatClient>,
    'showScreen' | 'message' | 'isMyMessage' | 'error' | 'isThreadMessage' | 'messageReactions'
  >;

/**
 * MessageActionList - A high level component which implements all the logic required for MessageActions
 */
export const MessageActionList = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageActionListProps<StreamChatClient>,
) => {
  const { data } = useMessageOverlayContext<StreamChatClient>();

  const { alignment, messageActions } = data || {};

  return <MemoizedMessageActionList {...{ alignment, messageActions }} {...props} />;
};
