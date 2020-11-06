import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

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
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import type { ReactionData } from '../../../utils/utils';

const screenPadding = 8;

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
    supportedReactions.find((reaction) => reaction.type === type)?.Icon ||
    Unknown;
  return (
    <ReactionIcon
      height={size}
      pathFill={pathFill}
      style={style}
      width={size}
    />
  );
};

export type ReactionListPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'alignment' | 'reactions' | 'showMessageOverlay'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'supportedReactions'
  > & {
    messageContentWidth: number;
    fill?: string;
    radius?: number; // not recommended to change this
    reactionSize?: number;
    stroke?: string;
  };

const ReactionListWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    fill: propFill,
    messageContentWidth,
    radius: propRadius,
    reactions,
    reactionSize: propReactionSize,
    showMessageOverlay,
    stroke: propStroke,
    supportedReactions,
  } = props;

  const {
    theme: {
      colors: { grey, primary, textGrey, white },
      messageSimple: {
        avatarWrapper: { leftAlign, spacer },
        reactionList: {
          container,
          middleIcon,
          radius: themeRadius,
          reactionBubble,
          reactionBubbleBackground,
          reactionSize: themeReactionSize,
        },
      },
    },
  } = useTheme();

  const width = useWindowDimensions().width;

  const fill = propFill || grey;
  const radius = propRadius || themeRadius;
  const reactionSize = propReactionSize || themeReactionSize;
  const stroke = propStroke || white;

  const x =
    alignment === 'left'
      ? messageContentWidth +
        (Number(leftAlign.marginRight) || 0) +
        (Number(spacer.width) || 0)
      : width - screenPadding * 2 - messageContentWidth - radius * 2;
  const y1 = reactionSize + radius;
  const y2 = reactionSize - radius * 1.25;

  return (
    <TouchableOpacity
      onPress={() => showMessageOverlay(true)}
      style={[
        styles.container,
        {
          height: reactionSize + radius * 5,
          width,
        },
        container,
      ]}
    >
      {reactions.ownReactions.length ? (
        <View style={StyleSheet.absoluteFill}>
          <Svg>
            <Circle
              cx={x + (radius * 2 - radius / 4)}
              cy={y2}
              fill={stroke}
              r={radius * 2}
              stroke={fill}
              strokeWidth={radius / 2}
            />
            <Circle
              cx={x}
              cy={y1}
              fill={stroke}
              r={radius}
              stroke={fill}
              strokeWidth={radius / 2}
            />
          </Svg>
          <View
            style={[
              styles.reactionBubbleBackground,
              {
                backgroundColor: stroke,
                borderColor: fill,
                borderRadius: reactionSize,
                borderWidth: radius,
                height: reactionSize,
                left: x - radius,
                width: reactionSize * reactions.ownReactions.length,
              },
              reactionBubbleBackground,
            ]}
          />
          <View style={[StyleSheet.absoluteFill]}>
            <Svg>
              <Circle
                cx={x + radius * 2 - radius / 4}
                cy={y2}
                fill={stroke}
                r={radius * 2 - radius / 2}
              />
            </Svg>
          </View>
          <View
            style={[
              styles.reactionBubble,
              {
                backgroundColor: stroke,
                borderRadius: reactionSize,
                height: reactionSize - radius,
                left: x - radius / 2,
                top: radius / 2,
                width: reactionSize * reactions.ownReactions.length - radius,
              },
              reactionBubble,
            ]}
          >
            {reactions.ownReactions.map((reaction, index) => (
              <Icon
                key={`${reaction}_${index}`}
                pathFill={primary}
                size={reactionSize / 2}
                style={middleIcon}
                supportedReactions={supportedReactions}
                type={reaction}
              />
            ))}
          </View>
        </View>
      ) : null}
      {reactions.latestReactions.length ? (
        <View style={StyleSheet.absoluteFill}>
          <Svg>
            <Circle
              cx={x - radius * 2 - radius / 4}
              cy={y2}
              fill={fill}
              r={radius * 2}
              stroke={stroke}
              strokeWidth={radius / 2}
            />
            <Circle
              cx={x}
              cy={y1}
              fill={fill}
              r={radius}
              stroke={stroke}
              strokeWidth={radius / 2}
            />
          </Svg>
          <View
            style={[
              styles.reactionBubbleBackground,
              {
                backgroundColor: fill,
                borderColor: stroke,
                borderRadius: reactionSize,
                borderWidth: radius,
                height: reactionSize,
                left:
                  x + radius - reactionSize * reactions.latestReactions.length,
                width: reactionSize * reactions.latestReactions.length,
              },
              reactionBubbleBackground,
            ]}
          />
          <View style={[StyleSheet.absoluteFill]}>
            <Svg>
              <Circle
                cx={x - radius * 2 - radius / 4}
                cy={y2}
                fill={fill}
                r={radius * 2 - radius / 2}
              />
            </Svg>
          </View>
          <View
            style={[
              styles.reactionBubble,
              {
                backgroundColor: fill,
                borderRadius: reactionSize,
                height: reactionSize - radius,
                left:
                  x +
                  radius -
                  reactionSize * reactions.latestReactions.length +
                  radius / 2,
                top: radius / 2,
                width: reactionSize * reactions.latestReactions.length - radius,
              },
              reactionBubble,
            ]}
          >
            {reactions.latestReactions.map((reaction, index) => (
              <Icon
                key={`${reaction.type}_${index}`}
                pathFill={reaction.own ? primary : textGrey}
                size={reactionSize / 2}
                style={middleIcon}
                supportedReactions={supportedReactions}
                type={reaction.type}
              />
            ))}
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
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
  prevProps: ReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: ReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    messageContentWidth: prevMessageContentWidth,
    reactions: prevReactions,
  } = prevProps;
  const {
    messageContentWidth: nextMessageContentWidth,
    reactions: nextReactions,
  } = nextProps;

  const messageContentWidthEqual =
    prevMessageContentWidth === nextMessageContentWidth;
  const reactionsEqual =
    prevReactions.ownReactions.length === nextReactions.ownReactions.length &&
    prevReactions.latestReactions.every(
      (latestReaction, index) =>
        nextReactions.latestReactions[index].own === latestReaction.own &&
        nextReactions.latestReactions[index].type === latestReaction.type,
    );

  return messageContentWidthEqual && reactionsEqual;
};

const MemoizedReactionList = React.memo(
  ReactionListWithContext,
  areEqual,
) as typeof ReactionListWithContext;

export type ReactionListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<
    ReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'messageContentWidth'
  >
> &
  Pick<
    ReactionListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'messageContentWidth'
  >;

/**
 * ReactionList - A high level component which implements all the logic required for a message reaction list
 */
export const ReactionList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ReactionListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment: propAlignment,
    reactions: propReactions,
    showMessageOverlay: propShowMessageOverlay,
    supportedReactions: propSupportedReactions,
  } = props;

  const {
    alignment: contextAlignment,
    reactions: contextReactions,
    showMessageOverlay: contextShowMessageOverlay,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { supportedReactions: contextSupportedReactions } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const alignment = propAlignment || contextAlignment;
  const reactions = propReactions || contextReactions;
  const showMessageOverlay =
    propShowMessageOverlay || contextShowMessageOverlay;
  const supportedReactions =
    propSupportedReactions || contextSupportedReactions;

  return (
    <MemoizedReactionList
      {...props}
      {...{ alignment, reactions, showMessageOverlay, supportedReactions }}
    />
  );
};
