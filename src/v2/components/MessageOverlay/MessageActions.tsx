import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {
  MessageAction as MessageActionType,
  MessageOverlayContextValue,
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

type MessageActionProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'reset'> &
  MessageActionType & {
    index: number;
    length: number;
  };

const MessageAction = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageActionProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { action, icon, index, length, reset, title, titleStyle } = props;

  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <TapGestureHandler
      onHandlerStateChange={({ nativeEvent: { state } }) => {
        if (state === State.BEGAN) {
          opacity.value = 0.2;
        }

        if (state === State.END) {
          reset();
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

const messageActionIsEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageActionProps<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageActionProps<At, Ch, Co, Ev, Me, Re, Us>,
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
> = Pick<MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'reset'> &
  Pick<MessageOverlayData<At, Ch, Co, Ev, Me, Re, Us>, 'messageActions'> & {
    light: Theme['colors']['light'];
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
  const { light, messageActions, reset } = props;

  return (
    <View style={[styles.container, { backgroundColor: light }]}>
      {messageActions?.map((messageAction, index) => (
        <MemoizedMessageAction<At, Ch, Co, Ev, Me, Re, Us>
          key={messageAction.title}
          {...{ ...messageAction, index, length: messageActions.length, reset }}
        />
      ))}
    </View>
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
> = Partial<MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

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
    reset: propReset,
  } = props;

  const { data, reset: contextReset } = useMessageOverlayContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const {
    theme: {
      colors: { light: contextLight },
    },
  } = useTheme();

  const { messageActions: contextMessageActions } = data || {};

  const messageActions = propMessageActions || contextMessageActions;
  const reset = propReset || contextReset;

  if (!messageActions?.length) return null;

  const light = propLight || contextLight;

  return <MemoizedMessageActions {...{ light, messageActions, reset }} />;
};
