import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {
  MessageAction as MessageActionType,
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { Theme } from '../../contexts/themeContext/utils/theme';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  bottomBorder: {
    borderBottomColor: '#0000001A', // 1A = 10% opacity
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleStyle: {
    paddingLeft: 20,
  },
});

type MessageActionProps = MessageActionType & {
  index: number;
  length: number;
};

const MessageAction: React.FC<MessageActionProps> = (props) => {
  const { action, icon, index, length, title, titleStyle } = props;

  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: opacity.value,
  }));

  return (
    <TapGestureHandler
      onHandlerStateChange={({ nativeEvent: { state } }) => {
        if (state === State.BEGAN) {
          opacity.value = 0.2;
        }

        if (state === State.END) {
          action();
          opacity.value = 1;
        }

        if (state === State.CANCELLED || state === State.FAILED) {
          opacity.value = 1;
        }
      }}
    >
      <Animated.View
        style={[
          styles.row,
          index !== length - 1 ? styles.bottomBorder : {},
          animatedStyle,
        ]}
      >
        {icon}
        <Text style={[styles.titleStyle, titleStyle]}>{title}</Text>
      </Animated.View>
    </TapGestureHandler>
  );
};

const messageActionIsEqual = (
  prevProps: MessageActionProps,
  nextProps: MessageActionProps,
) => prevProps.length === nextProps.length;

const MemoizedMessageAction = React.memo(
  MessageAction,
  messageActionIsEqual,
) as typeof MessageAction;

export type MessageActionsPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageOverlayData<At, Ch, Co, Ev, Me, Re, Us>,
  'alignment' | 'messageActions'
> & {
  light: Theme['colors']['light'];
  showScreen: Animated.SharedValue<number>;
};
const MessageActionsWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, light, messageActions, showScreen } = props;
  const height = useSharedValue(0);
  const width = useSharedValue(0);

  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: interpolate(
            showScreen.value,
            [0, 1],
            [-height.value / 2, 0],
          ),
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
      style={[styles.container, { backgroundColor: light }, showScreenStyle]}
    >
      {messageActions?.map((messageAction, index) => (
        <MemoizedMessageAction
          key={messageAction.title}
          {...{ ...messageAction, index, length: messageActions.length }}
        />
      ))}
    </Animated.View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { messageActions: prevMessageActions } = prevProps;
  const { messageActions: nextMessageActions } = nextProps;

  const messageActionsEqual =
    prevMessageActions?.length === nextMessageActions?.length;

  return messageActionsEqual;
};

const MemoizedMessageActions = React.memo(
  MessageActionsWithContext,
  areEqual,
) as typeof MessageActionsWithContext;

export type MessageActionsProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'showScreen'>
> &
  Pick<
    MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'showScreen'
  >;

/**
 * MessageActions - A high level component which implements all the logic required for MessageActions
 */
export const MessageActions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageActionsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    light: propLight,
    messageActions: propMessageActions,
    showScreen,
  } = props;

  const { data } = useMessageOverlayContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    theme: {
      colors: { light: contextLight },
    },
  } = useTheme();

  const { alignment, messageActions: contextMessageActions } = data || {};

  const messageActions = propMessageActions || contextMessageActions;

  if (!messageActions?.length) return null;

  const light = propLight || contextLight;

  return (
    <MemoizedMessageActions
      {...{ alignment, light, messageActions, showScreen }}
    />
  );
};
