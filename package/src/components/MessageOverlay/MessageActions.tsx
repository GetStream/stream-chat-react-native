import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TapGestureHandler, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {
  MessageAction as MessageActionType,
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { vw } from '../../utils/utils';

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

type MessageActionProps = MessageActionType & {
  index: number;
  length: number;
};

const MessageAction: React.FC<MessageActionProps> = (props) => {
  const { action, icon, index, length, title, titleStyle } = props;

  const {
    theme: {
      colors: { black, border },
      overlay: { messageActions },
    },
  } = useTheme();

  const opacity = useSharedValue(1);

  const onTap = useAnimatedGestureHandler<TapGestureHandlerStateChangeEvent>(
    {
      onEnd: () => {
        runOnJS(action)();
      },
      onFinish: () => {
        opacity.value = 1;
      },
      onStart: () => {
        opacity.value = 0.2;
      },
    },
    [action],
  );

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: opacity.value,
  }));

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

const messageActionIsEqual = (prevProps: MessageActionProps, nextProps: MessageActionProps) =>
  prevProps.length === nextProps.length;

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
  Us extends UnknownType = DefaultUserType,
> = Pick<MessageOverlayData<At, Ch, Co, Ev, Me, Re, Us>, 'alignment' | 'messageActions'> & {
  showScreen: Animated.SharedValue<number>;
};
const MessageActionsWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, messageActions, showScreen } = props;

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
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment: prevAlignment, messageActions: prevMessageActions } = prevProps;
  const { alignment: nextAlignment, messageActions: nextMessageActions } = nextProps;

  const messageActionsEqual = prevMessageActions?.length === nextMessageActions?.length;
  if (!messageActionsEqual) return false;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

  return true;
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
  Us extends UnknownType = DefaultUserType,
> = Partial<Omit<MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'showScreen'>> &
  Pick<MessageActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'showScreen'>;

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
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageActionsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { data } = useMessageOverlayContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { alignment, messageActions } = data || {};

  return <MemoizedMessageActions {...{ alignment, messageActions }} {...props} />;
};
