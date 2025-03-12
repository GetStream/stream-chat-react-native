import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

import { Unknown } from '../../../../icons/Unknown';

import type { IconProps } from '../../../../icons/utils/base';

import type { ReactionData } from '../../../../utils/utils';
import { ReactionSummary } from '../../hooks/useProcessReactions';

type Props = Pick<IconProps, 'pathFill' | 'style'> & {
  size: number;
  type: string;
  supportedReactions?: ReactionData[];
};

const Icon = ({ pathFill, size, style, supportedReactions, type }: Props) => {
  const ReactionIcon =
    supportedReactions?.find((reaction) => reaction.type === type)?.Icon || Unknown;

  return (
    <View>
      <ReactionIcon height={size} pathFill={pathFill} style={style} width={size} />
    </View>
  );
};

export type ReactionListTopItemProps = Partial<Pick<MessageContextValue, 'reactions'>> &
  Partial<Pick<MessagesContextValue, 'supportedReactions'>> & {
    index: number;
    reaction: ReactionSummary;
  };

export const ReactionListTopItem = (props: ReactionListTopItemProps) => {
  const { index, reaction, reactions, supportedReactions } = props;
  const {
    theme: {
      messageSimple: {
        reactionListTop: {
          item: { container, icon, iconFillColor, iconUnFillColor, reactionSize },
        },
      },
    },
  } = useTheme();

  const reactionsLength = reactions ? reactions.length : 0;

  return (
    <View
      key={reaction.type}
      style={[
        styles.reactionContainer,
        {
          marginRight: index < reactionsLength - 1 ? 5 : 0,
        },
        container,
      ]}
    >
      <Icon
        key={reaction.type}
        pathFill={reaction.own ? iconFillColor : iconUnFillColor}
        size={reactionSize / 2}
        style={icon}
        supportedReactions={supportedReactions}
        type={reaction.type}
      />
    </View>
  );
};

export type ReactionListTopProps = Partial<
  Pick<
    MessageContextValue,
    | 'alignment'
    | 'hasReactions'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'reactions'
    | 'showMessageOverlay'
  >
> &
  Pick<MessagesContextValue, 'supportedReactions'> & {
    messageContentWidth: number;
    fill?: string;
    reactionSize?: number;
  };

/**
 * ReactionListTop - A high level component which implements all the logic required for a message reaction list
 */
export const ReactionListTop = (props: ReactionListTopProps) => {
  const {
    alignment: propAlignment,
    fill: propFill,
    hasReactions: propHasReactions,
    messageContentWidth,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    reactions: propReactions,
    reactionSize: propReactionSize,
    showMessageOverlay: propShowMessageOverlay,
    supportedReactions: propSupportedReactions,
  } = props;

  const {
    alignment: contextAlignment,
    hasReactions: contextHasReactions,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    reactions: contextReactions,
    showMessageOverlay: contextShowMessageOverlay,
  } = useMessageContext();

  const { supportedReactions: contextSupportedReactions } = useMessagesContext();

  const alignment = propAlignment || contextAlignment;
  const hasReactions = propHasReactions || contextHasReactions;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPress = propOnPress || contextOnPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const preventPress = propPreventPress || contextPreventPress;
  const reactions = propReactions || contextReactions;
  const showMessageOverlay = propShowMessageOverlay || contextShowMessageOverlay;
  const supportedReactions = propSupportedReactions || contextSupportedReactions;

  const {
    theme: {
      colors: { grey_gainsboro, grey_whisper, white },
      messageSimple: {
        reactionListTop: {
          container,
          item: { reactionSize: themeReactionSize },
          position: reactionPosition,
        },
      },
    },
  } = useTheme();

  const supportedReactionTypes = supportedReactions?.map(
    (supportedReaction) => supportedReaction.type,
  );

  const hasSupportedReactions = reactions.some((reaction) =>
    supportedReactionTypes?.includes(reaction.type),
  );

  if (!hasSupportedReactions || messageContentWidth === 0 || !hasReactions) {
    return null;
  }

  const alignmentLeft = alignment === 'left';
  const fill = propFill || (alignmentLeft ? grey_gainsboro : grey_whisper);
  const reactionSize = propReactionSize || themeReactionSize;

  // This is an estimated value for the message length that is considered small
  const SMALL_MESSAGE_LENGTH_THRESHOLD = 80;

  // It is the length of the reaction list
  const totalReactionSize = reactionSize * reactions.length;
  const halfReactionSize = totalReactionSize / 2;

  const position =
    messageContentWidth < SMALL_MESSAGE_LENGTH_THRESHOLD
      ? messageContentWidth - reactionPosition
      : messageContentWidth - halfReactionSize;

  return (
    <TouchableOpacity
      accessibilityLabel='Reaction List Top'
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
        styles.container,
        {
          backgroundColor: fill,
          borderColor: white,
          borderRadius: reactionSize,
          height: reactionSize,
          top: -reactionPosition,
        },
        alignmentLeft ? { left: position } : { right: position },
        container,
      ]}
    >
      {reactions.map((reaction, index) => (
        <ReactionListTopItem
          index={index}
          key={reaction.type}
          reaction={reaction}
          reactions={reactions}
          supportedReactions={supportedReactions}
        />
      ))}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
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
