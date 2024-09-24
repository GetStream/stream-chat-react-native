import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import Svg, { Circle } from 'react-native-svg';

import { ReactionGroupResponse, ReactionResponse } from 'stream-chat';

import {
  MessageContextValue,
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
import { ReactionSummary } from '../hooks/useProcessReactions';

export type MessageReactions = {
  reactions: ReactionSummary[];
  supportedReactions?: ReactionData[];
};

type Props = Pick<IconProps, 'pathFill' | 'style'> & {
  size: number;
  supportedReactions: ReactionData[];
  type: string;
};

const Icon = ({ pathFill, size, style, supportedReactions, type }: Props) => {
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
    /** An array of the reaction objects to display in the list */
    latest_reactions?: ReactionResponse<StreamChatGenerics>[];
    /** An array of the own reaction objects to distinguish own reactions visually */
    own_reactions?: ReactionResponse<StreamChatGenerics>[] | null;
    radius?: number; // not recommended to change this
    /** An object containing summary for each reaction type on a message */
    reaction_groups?: Record<string, ReactionGroupResponse> | null;
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
        black,
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
          iconFillColor,
          middleIcon,
          radius: themeRadius,
          reactionBubble,
          reactionContainer,
          reactionCount,
          reactionSize: themeReactionSize,
          strokeSize: themeStrokeSize,
        },
      },
      screenPadding,
    },
  } = useTheme();

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
  const fill = propFill || (alignmentLeft ? grey_gainsboro : grey_whisper);
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
      pointerEvents='box-none'
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
        <View pointerEvents='box-none' style={[StyleSheet.absoluteFill]}>
          <Svg pointerEvents='none'>
            <Circle cx={x1} cy={y1} fill={stroke} r={radius + strokeSize * 3} />
            <Circle cx={x2} cy={y2} fill={stroke} r={radius * 2 + strokeSize * 3} />
            <Circle cx={x1} cy={y1} fill={fill} r={radius + strokeSize} />
            <Circle cx={x2} cy={y2} fill={fill} r={radius * 2 + strokeSize} />
            <Circle cx={x1} cy={y1} fill={alignmentLeft ? fill : white} r={radius} />
            <Circle cx={x2} cy={y2} fill={alignmentLeft ? fill : white} r={radius * 2} />
          </Svg>
          <View pointerEvents='none' style={[StyleSheet.absoluteFill]}>
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
                  defaultHandler: () => showMessageOverlay(false),
                  emitter: 'reactionList',
                  event,
                });
              }
            }}
            onPressIn={(event) => {
              if (onPressIn) {
                onPressIn({
                  defaultHandler: () => showMessageOverlay(false),
                  emitter: 'reactionList',
                  event,
                });
              }
            }}
            style={[
              styles.reactionBubble,
              {
                backgroundColor: alignmentLeft ? fill : white,
                borderColor: fill,
                borderRadius: reactionSize,
                borderWidth: strokeSize,
                height: reactionSize - strokeSize * 2,
                left: left + strokeSize,
                top: strokeSize,
              },
              reactionBubble,
            ]}
          >
            {reactions.map((reaction, index) => (
              <View
                key={reaction.type}
                style={[
                  styles.reactionContainer,
                  {
                    marginRight: index < reactions.length - 1 ? 5 : 0,
                  },
                  reactionContainer,
                ]}
              >
                <Icon
                  key={reaction.type}
                  pathFill={reaction.own ? iconFillColor || accent_blue : grey}
                  size={reactionSize / 2}
                  style={middleIcon}
                  supportedReactions={supportedReactions}
                  type={reaction.type}
                />
                <Text style={[styles.reactionCount, { color: black }, reactionCount]}>
                  {reaction.count}
                </Text>
              </View>
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

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) && Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length === nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) => type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) return false;

  const reactionsEqual =
    Array.isArray(prevReactions) && Array.isArray(nextReactions)
      ? prevReactions.length === nextReactions.length &&
        prevReactions.every(
          ({ count, type }, index) =>
            type === nextMessage.latest_reactions?.[index].type &&
            count === nextMessage.latest_reactions?.[index].count,
        )
      : prevReactions === nextReactions;

  if (!reactionsEqual) return false;

  return true;
};

const MemoizedReactionList = React.memo(
  ReactionListWithContext,
  areEqual,
) as typeof ReactionListWithContext;

export type ReactionListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<ReactionListPropsWithContext<StreamChatGenerics>> &
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
  } = useMessageContext<StreamChatGenerics>();
  const { supportedReactions, targetedMessage } = useMessagesContext<StreamChatGenerics>();

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
    paddingHorizontal: 5,
    position: 'absolute',
  },
  reactionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});
