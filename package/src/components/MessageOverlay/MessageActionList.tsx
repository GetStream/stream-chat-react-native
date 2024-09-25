import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { MessageActionListItem as DefaultMessageActionListItem } from './MessageActionListItem';

import {
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import type { OverlayProviderProps } from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useViewport } from '../../hooks/useViewport';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type MessageActionListPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  OverlayProviderProps<StreamChatGenerics>,
  | 'MessageActionListItem'
  | 'error'
  | 'isMyMessage'
  | 'isThreadMessage'
  | 'message'
  | 'messageReactions'
> &
  Pick<MessageOverlayData<StreamChatGenerics>, 'alignment' | 'messageActions'> & {
    showScreen: Animated.SharedValue<number>;
  };

const MessageActionListWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageActionListPropsWithContext<StreamChatGenerics>,
) => {
  const {
    alignment,
    error,
    isMyMessage,
    isThreadMessage,
    message,
    MessageActionListItem = DefaultMessageActionListItem,
    messageActions,
    messageReactions,
    showScreen,
  } = props;

  const messageActionProps = {
    error,
    isMyMessage,
    isThreadMessage,
    message,
    messageReactions,
  };
  const { vw } = useViewport();

  const {
    theme: {
      colors: { white_snow },
      overlay: {
        messageActionsList: { container },
      },
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
      style={[
        styles.container,
        { backgroundColor: white_snow, minWidth: vw(65) },
        showScreenStyle,
        container,
      ]}
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

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageActionListPropsWithContext<StreamChatGenerics>,
  nextProps: MessageActionListPropsWithContext<StreamChatGenerics>,
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<MessageActionListPropsWithContext<StreamChatGenerics>, 'showScreen'>> &
  Pick<
    MessageActionListPropsWithContext<StreamChatGenerics>,
    'showScreen' | 'message' | 'isMyMessage' | 'error' | 'isThreadMessage' | 'messageReactions'
  >;

/**
 * MessageActionList - A high level component which implements all the logic required for MessageActions
 */
export const MessageActionList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageActionListProps<StreamChatGenerics>,
) => {
  const { data } = useMessageOverlayContext<StreamChatGenerics>();

  const { alignment, messageActions } = data || {};

  return <MemoizedMessageActionList {...{ alignment, messageActions }} {...props} />;
};

const styles = StyleSheet.create({
  bottomBorder: {
    borderBottomWidth: 1,
  },
  container: {
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  titleStyle: {
    paddingLeft: 20,
  },
});
