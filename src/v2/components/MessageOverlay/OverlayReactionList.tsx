import React from 'react';
import { StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, CircleProps, FillProps } from 'react-native-svg';

import {
  MessageOverlayContextValue,
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { ReactionData, reactionData } from '../../utils/utils';

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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  reaction: {
    marginRight: 8,
  },
  reactionList: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'absolute',
  },
});

export type OverlayReactionListPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Pick<MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'reset'> &
  Pick<
    MessageOverlayData<At, Ch, Co, Ev, Me, Re, Us>,
    'handleReaction' | 'supportedReactions'
  > & {
    messageLayout: Animated.SharedValue<{
      x: number;
      y: number;
    }>;
    ownReactionTypes: string[];
    reactionListHeight: Animated.SharedValue<number>;
    fill?: FillProps['fill'];
  };

const OverlayReactionListWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: OverlayReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    fill,
    handleReaction,
    messageLayout,
    ownReactionTypes,
    reactionListHeight,
    reset,
    supportedReactions = reactionData,
  } = props;

  const {
    theme: {
      colors: { grey, primary, textGrey },
      overlay: {
        padding: screenPadding,
        reactionsList: { radius, reaction, reactionList },
      },
    },
  } = useTheme();

  const reactionListLayout = useSharedValue({
    height: 0,
    width: 0,
  });

  const { width } = useWindowDimensions();

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => {
    const borderRadius =
      reactionList.borderRadius || styles.reactionList.borderRadius;
    const insideLeftBound =
      messageLayout.value.x - reactionListLayout.value.width >
      screenPadding + borderRadius;
    const insideRightBound =
      messageLayout.value.x + borderRadius < width - screenPadding;
    const left = !insideLeftBound
      ? screenPadding
      : !insideRightBound
      ? width - screenPadding - reactionListLayout.value.width
      : messageLayout.value.x - reactionListLayout.value.width + borderRadius;
    const top =
      messageLayout.value.y - reactionListLayout.value.height - radius * 2;

    return {
      left,
      top,
    };
  });

  const animatedBigCircleProps = useAnimatedProps<CircleProps>(() => ({
    cx: messageLayout.value.x - radius * 3,
    cy: messageLayout.value.y - radius * 3,
    fill: fill || grey,
    r: radius * 2,
  }));

  const animateSmallCircleProps = useAnimatedProps<CircleProps>(() => ({
    cx: messageLayout.value.x - radius,
    cy: messageLayout.value.y,
    fill: fill || grey,
    r: radius,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg>
        <AnimatedCircle animatedProps={animatedBigCircleProps} />
        <AnimatedCircle animatedProps={animateSmallCircleProps} />
      </Svg>
      <Animated.View
        onLayout={({
          nativeEvent: {
            layout: { height, width: layoutWidth },
          },
        }) => {
          reactionListLayout.value = { height, width: layoutWidth };
          reactionListHeight.value = height;
        }}
        style={[styles.reactionList, animatedStyle, reactionList]}
      >
        {supportedReactions?.map(({ Icon, type }: ReactionData, index) => (
          <Icon
            key={`${type}_${index}`}
            onPress={() => {
              if (handleReaction) {
                handleReaction(type);
                reset();
              }
            }}
            pathFill={ownReactionTypes.includes(type) ? primary : textGrey}
            style={
              index !== reactionData.length - 1
                ? [styles.reaction, reaction]
                : {}
            }
          />
        ))}
      </Animated.View>
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
  prevProps: OverlayReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: OverlayReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    ownReactionTypes: prevOwnReactionTypes,
    reactionListHeight: prevReactionListHeight,
  } = prevProps;
  const {
    ownReactionTypes: nextOwnReactionTypes,
    reactionListHeight: nextReactionListHeight,
  } = nextProps;

  const reactionListHeightEqual =
    prevReactionListHeight === nextReactionListHeight;
  if (!reactionListHeightEqual) return false;

  const ownReactionTypesEqual =
    prevOwnReactionTypes.length === nextOwnReactionTypes.length;
  if (!ownReactionTypesEqual) return false;

  return true;
};

const MemoizedOverlayReactionList = React.memo(
  OverlayReactionListWithContext,
  areEqual,
) as typeof OverlayReactionListWithContext;

export type OverlayReactionListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Omit<
  OverlayReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  'reset'
> &
  Partial<
    Pick<
      OverlayReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
      'reset'
    >
  >;

/**
 * OverlayReactionList - A high level component which implements all the logic required for a message overlay reaction list
 */
export const OverlayReactionList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: OverlayReactionListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    fill,
    handleReaction: propHandleReaction,
    messageLayout,
    ownReactionTypes,
    reactionListHeight,
    reset: propReset,
    supportedReactions: propSupportedReactions,
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

  const handleReaction = propHandleReaction || data?.handleReaction;
  const reset = propReset || contextReset;
  const supportedReactions = propSupportedReactions || data?.supportedReactions;

  return (
    <MemoizedOverlayReactionList
      {...{
        fill,
        handleReaction,
        messageLayout,
        ownReactionTypes,
        reactionListHeight,
        reset,
        supportedReactions,
      }}
    />
  );
};

OverlayReactionList.displayName = 'OverlayReactionList{overlay{reactionList}}';
