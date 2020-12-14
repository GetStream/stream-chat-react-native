import React from 'react';
import { StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import {
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, CircleProps, FillProps } from 'react-native-svg';

import {
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { triggerHaptic } from '../../native';
import { ReactionData, reactionData } from '../../utils/utils';

import type { IconProps } from '../../icons';
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
  notLastReaction: {
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

type ReactionButtonProps = Pick<
  OverlayReactionListPropsWithContext,
  'ownReactionTypes' | 'handleReaction' | 'setOverlay'
> & {
  Icon: React.FC<IconProps>;
  index: number;
  numberOfReactions: number;
  showScreen: Animated.SharedValue<number>;
  type: string;
};

export const ReactionButton: React.FC<ReactionButtonProps> = (props) => {
  const {
    handleReaction,
    Icon,
    index,
    numberOfReactions,
    ownReactionTypes,
    setOverlay,
    showScreen,
    type,
  } = props;
  const {
    theme: {
      colors: { primary, textGrey },
      overlay: {
        reactionsList: { reaction },
      },
    },
  } = useTheme();
  const animationScale = useSharedValue(0);
  const hasShown = useSharedValue(0);
  const scale = useSharedValue(1);

  const onTap = useAnimatedGestureHandler<TapGestureHandlerStateChangeEvent>(
    {
      onEnd: () => {
        runOnJS(triggerHaptic)('impactLight');
        if (handleReaction) {
          runOnJS(handleReaction)(type);
        }
        runOnJS(setOverlay)('none');
      },
      onFinish: () => {
        cancelAnimation(scale);
        scale.value = withTiming(1, { duration: 100 });
      },
      onStart: () => {
        cancelAnimation(scale);
        scale.value = withTiming(1.5, { duration: 100 });
      },
    },
    [handleReaction, setOverlay, type],
  );

  useAnimatedReaction(
    () => {
      if (showScreen.value > 0.8 && hasShown.value === 0) {
        return 1;
      }
      return 0;
    },
    (result) => {
      if (hasShown.value === 0 && result !== 0) {
        hasShown.value = 1;
        animationScale.value = withSequence(
          withDelay(
            60 * (numberOfReactions - (index + 1)),
            withTiming(1.5, { duration: 300 }),
          ),
          withTiming(1, { duration: 200 }),
        );
      }
    },
    [index, numberOfReactions],
  );

  const iconStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          scale: animationScale.value,
        },
        {
          scale: scale.value,
        },
      ],
    }),
    [],
  );

  return (
    <TapGestureHandler
      hitSlop={{
        bottom:
          Number(reaction.paddingVertical || 0) ||
          Number(reaction.paddingBottom || 0) ||
          styles.reactionList.paddingVertical,
        left:
          (Number(reaction.paddingHorizontal || 0) ||
            Number(reaction.paddingLeft || 0) ||
            styles.notLastReaction.marginRight) / 2,
        right:
          (Number(reaction.paddingHorizontal || 0) ||
            Number(reaction.paddingRight || 0) ||
            styles.notLastReaction.marginRight) / 2,
        top:
          Number(reaction.paddingVertical || 0) ||
          Number(reaction.paddingTop || 0) ||
          styles.reactionList.paddingVertical,
      }}
      maxDurationMs={3000}
      onHandlerStateChange={onTap}
    >
      <Animated.View
        style={[
          index !== reactionData.length - 1 ? styles.notLastReaction : {},
          reaction,
          iconStyle,
        ]}
      >
        <Icon pathFill={ownReactionTypes.includes(type) ? primary : textGrey} />
      </Animated.View>
    </TapGestureHandler>
  );
};

export type OverlayReactionListPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Pick<
  MessageOverlayData<At, Ch, Co, Ev, Me, Re, Us>,
  'handleReaction' | 'supportedReactions' | 'alignment'
> &
  Pick<OverlayContextValue, 'setOverlay'> & {
    messageLayout: Animated.SharedValue<{
      x: number;
      y: number;
    }>;
    ownReactionTypes: string[];
    reactionListHeight: Animated.SharedValue<number>;
    showScreen: Animated.SharedValue<number>;
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
    alignment,
    fill,
    handleReaction,
    messageLayout,
    ownReactionTypes,
    reactionListHeight,
    showScreen,
    setOverlay,
    supportedReactions = reactionData,
  } = props;

  const {
    theme: {
      colors: { grey },
      overlay: {
        padding: screenPadding,
        reactionsList: { radius, reactionList },
      },
    },
  } = useTheme();

  const reactionBubbleWidth = useSharedValue(0);
  const reactionListLayout = useSharedValue(
    {
      height: 0,
      width: 0,
    },
    false,
  );

  const { width } = useWindowDimensions();

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => {
    const borderRadius =
      reactionList.borderRadius || styles.reactionList.borderRadius;
    const insideLeftBound =
      messageLayout.value.x - reactionListLayout.value.width + borderRadius >
      screenPadding;
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

  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: interpolate(
            showScreen.value,
            [0, 1],
            [-reactionListHeight.value / 2, 0],
          ),
        },
        {
          translateX: interpolate(
            showScreen.value,
            [0, 1],
            [
              alignment === 'left'
                ? -reactionBubbleWidth.value / 2
                : reactionBubbleWidth.value / 2,
              0,
            ],
          ),
        },
        {
          scale: interpolate(showScreen.value, [0, 0.8, 1], [0, 0, 1]),
        },
      ],
    }),
    [alignment],
  );

  const numberOfReactions = supportedReactions.length;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        onLayout={({ nativeEvent: { layout } }) => {
          reactionBubbleWidth.value = layout.width;
        }}
        style={showScreenStyle}
      >
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
            <ReactionButton
              handleReaction={handleReaction}
              Icon={Icon}
              index={index}
              key={`${type}_${index}`}
              numberOfReactions={numberOfReactions}
              ownReactionTypes={ownReactionTypes}
              setOverlay={setOverlay}
              showScreen={showScreen}
              type={type}
            />
          ))}
        </Animated.View>
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
    alignment: prevAlignment,
    ownReactionTypes: prevOwnReactionTypes,
    reactionListHeight: prevReactionListHeight,
  } = prevProps;
  const {
    alignment: nextAlignment,
    ownReactionTypes: nextOwnReactionTypes,
    reactionListHeight: nextReactionListHeight,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

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
> = OverlayReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>;

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
  props: Omit<
    OverlayReactionListProps<At, Ch, Co, Ev, Me, Re, Us>,
    'setOverlay'
  >,
) => {
  const {
    fill,
    handleReaction: propHandleReaction,
    messageLayout,
    ownReactionTypes,
    reactionListHeight,
    showScreen,
    supportedReactions: propSupportedReactions,
  } = props;

  const { data } = useMessageOverlayContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setOverlay } = useOverlayContext();
  const handleReaction = propHandleReaction || data?.handleReaction;
  const supportedReactions = propSupportedReactions || data?.supportedReactions;

  return (
    <MemoizedOverlayReactionList
      {...{
        alignment: data?.alignment,
        fill,
        handleReaction,
        messageLayout,
        ownReactionTypes,
        reactionListHeight,
        setOverlay,
        showScreen,
        supportedReactions,
      }}
    />
  );
};

OverlayReactionList.displayName = 'OverlayReactionList{overlay{reactionList}}';
