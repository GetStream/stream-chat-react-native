import React from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import Svg, { Circle } from 'react-native-svg';

import {
  MessageContextValue,
  Reactions,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { Unknown } from '../../../icons/Unknown';

import type { IconProps } from '../../../icons/utils/base';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { ReactionData } from '../../../utils/utils';

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  reactionBubble: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'absolute',
  },
  reactionBubbleBackground: {
    position: 'absolute',
  },
});

export type MessageReactions = {
  reactions: Reactions;
  supportedReactions?: ReactionData[];
};

const Icon: React.FC<
  Pick<IconProps, 'pathFill' | 'style'> & {
    size: number;
    supportedReactions: ReactionData[];
    type: string;
  }
> = ({ pathFill, size, style, supportedReactions, type }) => {
  const ReactionIcon =
    supportedReactions.find((reaction) => reaction.type === type)?.Icon || Unknown;

  return (
    <View>
      <ReactionIcon height={size} pathFill={pathFill} style={style} width={size} />
    </View>
  );
};

export type ReactionListPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatGenerics>,
  | 'alignment'
  | 'message'
  | 'onLongPress'
  | 'onPress'
  | 'onPressIn'
  | 'preventPress'
  | 'reactions'
  | 'showMessageOverlay'
> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'targetedMessage'> & {
    messageContentWidth: number;
    supportedReactions: ReactionData[];
    fill?: string;
    radius?: number; // not recommended to change this
    reactionSize?: number;
    stroke?: string;
    strokeSize?: number; // not recommended to change this
  };

const ReactionListWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ReactionListPropsWithContext<StreamChatGenerics>,
) => {
  const {
    alignment,
    fill: propFill,
    message,
    messageContentWidth,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    radius: propRadius,
    reactions,
    reactionSize: propReactionSize,
    showMessageOverlay,
    stroke: propStroke,
    strokeSize: propStrokeSize,
    supportedReactions,
    targetedMessage,
  } = props;

  const {
    theme: {
      colors: {
        accent_blue,
        grey,
        grey_gainsboro,
        grey_whisper,
        targetedMessageBackground,
        white,
        white_snow,
      },
      messageSimple: {
        avatarWrapper: { leftAlign, spacer },
        reactionList: {
          container,
          middleIcon,
          radius: themeRadius,
          reactionBubble,
          reactionBubbleBackground,
          reactionSize: themeReactionSize,
          strokeSize: themeStrokeSize,
        },
      },
      screenPadding,
    },
  } = useTheme('ReactionList');

  const width = useWindowDimensions().width;

  const supportedReactionTypes = supportedReactions.map(
    (supportedReaction) => supportedReaction.type,
  );
  const hasSupportedReactions = reactions.some((reaction) =>
    supportedReactionTypes.includes(reaction.type),
  );

  if (!hasSupportedReactions || messageContentWidth === 0) {
    return null;
  }

  const alignmentLeft = alignment === 'left';
  const fill = propFill || alignmentLeft ? grey_gainsboro : grey_whisper;
  const radius = propRadius || themeRadius;
  const reactionSize = propReactionSize || themeReactionSize;
  const highlighted = message.pinned || targetedMessage === message.id;
  const stroke = propStroke || (highlighted ? targetedMessageBackground : white_snow);
  const strokeSize = propStrokeSize || themeStrokeSize;

  const x1 = alignmentLeft
    ? messageContentWidth +
      (Number(leftAlign.marginRight) || 0) +
      (Number(spacer.width) || 0) -
      radius * 0.5
    : width - screenPadding * 2 - messageContentWidth;
  const x2 = x1 + radius * 2 * (alignmentLeft ? 1 : -1);
  const y1 = reactionSize + radius * 2;
  const y2 = reactionSize - radius;

  const insideLeftBound = x2 - (reactionSize * reactions.length) / 2 > screenPadding;
  const insideRightBound =
    x2 + strokeSize + (reactionSize * reactions.length) / 2 < width - screenPadding * 2;
  const left =
    reactions.length === 1
      ? x1 + (alignmentLeft ? -radius : radius - reactionSize)
      : !insideLeftBound
      ? screenPadding
      : !insideRightBound
      ? width - screenPadding * 2 - reactionSize * reactions.length - strokeSize
      : x2 - (reactionSize * reactions.length) / 2 - strokeSize;

  return (
    <View
      style={[
        styles.container,
        {
          height: reactionSize + radius * 5,
          width,
        },
        container,
      ]}
      testID='reaction-list'
    >
      {reactions.length ? (
        <View style={[StyleSheet.absoluteFill]}>
          <Svg>
            <Circle cx={x1} cy={y1} fill={stroke} r={radius + strokeSize * 3} />
            <Circle cx={x2} cy={y2} fill={stroke} r={radius * 2 + strokeSize * 3} />
            <Circle cx={x1} cy={y1} fill={fill} r={radius + strokeSize} />
            <Circle cx={x2} cy={y2} fill={fill} r={radius * 2 + strokeSize} />
            <Circle cx={x1} cy={y1} fill={alignmentLeft ? fill : white} r={radius} />
            <Circle cx={x2} cy={y2} fill={alignmentLeft ? fill : white} r={radius * 2} />
          </Svg>
          <View
            style={[
              styles.reactionBubbleBackground,
              {
                backgroundColor: alignmentLeft ? fill : white,
                borderColor: fill,
                borderRadius: reactionSize,
                borderWidth: strokeSize,
                height: reactionSize,
                left,
                width: reactionSize * reactions.length,
              },
              reactionBubbleBackground,
            ]}
          />
          <View style={[StyleSheet.absoluteFill]}>
            <Svg>
              <Circle cx={x2} cy={y2} fill={alignmentLeft ? fill : white} r={radius * 2} />
            </Svg>
          </View>
          <TouchableOpacity
            disabled={preventPress}
            onLongPress={(event) => {
              if (onLongPress) {
                onLongPress({
                  emitter: 'reactionList',
                  event,
                });
              }
            }}
            onPress={(event) => {
              if (onPress) {
                onPress({
                  defaultHandler: () => showMessageOverlay(true),
                  emitter: 'reactionList',
                  event,
                });
              }
            }}
            onPressIn={(event) => {
              if (onPressIn) {
                onPressIn({
                  defaultHandler: () => showMessageOverlay(true),
                  emitter: 'reactionList',
                  event,
                });
              }
            }}
            style={[
              styles.reactionBubble,
              {
                backgroundColor: alignmentLeft ? fill : white,
                borderRadius: reactionSize - strokeSize * 2,
                height: reactionSize - strokeSize * 2,
                left: left + strokeSize,
                top: strokeSize,
                width: reactionSize * reactions.length - strokeSize * 2,
              },
              reactionBubble,
            ]}
          >
            {reactions.map((reaction) => (
              <Icon
                key={reaction.type}
                pathFill={reaction.own ? accent_blue : grey}
                size={reactionSize / 2}
                style={middleIcon}
                supportedReactions={supportedReactions}
                type={reaction.type}
              />
            ))}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: ReactionListPropsWithContext<StreamChatGenerics>,
  nextProps: ReactionListPropsWithContext<StreamChatGenerics>,
) => {
  const {
    message: prevMessage,
    messageContentWidth: prevMessageContentWidth,
    reactions: prevReactions,
    targetedMessage: prevTargetedMessage,
  } = prevProps;
  const {
    message: nextMessage,
    messageContentWidth: nextMessageContentWidth,
    reactions: nextReactions,
    targetedMessage: nextTargetedMessage,
  } = nextProps;

  const messageContentWidthEqual = prevMessageContentWidth === nextMessageContentWidth;
  if (!messageContentWidthEqual) return false;

  const messagePinnedEqual = prevMessage.pinned === nextMessage.pinned;

  if (!messagePinnedEqual) return false;

  const targetedMessageEqual = prevTargetedMessage === nextTargetedMessage;

  if (!targetedMessageEqual) return false;

  const reactionsEqual =
    prevReactions.length === nextReactions.length &&
    prevReactions.every(
      (latestReaction, index) =>
        nextReactions[index].own === latestReaction.own &&
        nextReactions[index].type === latestReaction.type,
    );
  if (!reactionsEqual) return false;

  return true;
};

const MemoizedReactionList = React.memo(
  ReactionListWithContext,
  areEqual,
) as typeof ReactionListWithContext;

export type ReactionListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<ReactionListPropsWithContext<StreamChatGenerics>, 'messageContentWidth'>> &
  Pick<ReactionListPropsWithContext<StreamChatGenerics>, 'messageContentWidth'>;

/**
 * ReactionList - A high level component which implements all the logic required for a message reaction list
 */
export const ReactionList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ReactionListProps<StreamChatGenerics>,
) => {
  const {
    alignment,
    message,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    reactions,
    showMessageOverlay,
  } = useMessageContext<StreamChatGenerics>('ReactionList');
  const { supportedReactions, targetedMessage } =
    useMessagesContext<StreamChatGenerics>('ReactionList');

  return (
    <MemoizedReactionList
      {...{
        alignment,
        message,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        reactions,
        showMessageOverlay,
        supportedReactions,
        targetedMessage,
      }}
      {...props}
    />
  );
};
