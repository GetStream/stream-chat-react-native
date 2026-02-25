import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ReactionListItemWrapper } from './ReactionListItemWrapper';

import { MessageContextValue } from '../../../../contexts/messageContext/MessageContext';
import { MessagesContextValue } from '../../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

import { Unknown } from '../../../../icons/Unknown';

import type { IconProps } from '../../../../icons/utils/base';

import { primitives } from '../../../../theme';
import type { ReactionData } from '../../../../utils/utils';
import { ReactionSummary } from '../../hooks/useProcessReactions';

type Props = Pick<IconProps, 'pathFill' | 'style'> & {
  size: number;
  type: string;
  supportedReactions?: ReactionData[];
};

const Icon = ({ size, style, supportedReactions, type }: Props) => {
  const ReactionIcon =
    supportedReactions?.find((reaction) => reaction.type === type)?.Icon || Unknown;

  return <ReactionIcon size={size} style={style} />;
};

export type ReactionListItemProps = Partial<
  Pick<
    MessageContextValue,
    | 'handleReaction'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'showReactionsOverlay'
  >
> &
  Partial<Pick<MessagesContextValue, 'supportedReactions'>> & {
    reaction: ReactionSummary;
    showCount?: boolean;
    selected?: boolean;
  };

export const ReactionListItem = (props: ReactionListItemProps) => {
  const {
    handleReaction,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    reaction,
    showReactionsOverlay,
    supportedReactions,
    showCount = true,
    selected = false,
  } = props;
  const {
    theme: {
      messageSimple: {
        reactionListItem: { icon },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <ReactionListItemWrapper
      accessibilityLabel='Reaction List Item'
      disabled={preventPress}
      key={reaction.type}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            defaultHandler: () => {
              if (showReactionsOverlay) {
                showReactionsOverlay(reaction.type);
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            defaultHandler: () => {
              if (handleReaction) {
                handleReaction(reaction.type);
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            defaultHandler: () => {
              if (handleReaction) {
                handleReaction(reaction.type);
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      selected={selected}
    >
      <Icon
        key={reaction.type}
        size={icon.size}
        style={icon.style}
        supportedReactions={supportedReactions}
        type={reaction.type}
      />
      {showCount ? <Text style={styles.reactionCount}>{reaction.count}</Text> : null}
    </ReactionListItemWrapper>
  );
};

export type ReactionListCountItemProps = Partial<
  Pick<
    MessageContextValue,
    'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress' | 'showReactionsOverlay'
  >
> & {
  selected?: boolean;
  count: number;
};

export const ReactionListCountItem = (props: ReactionListCountItemProps) => {
  const { count, onLongPress, onPress, onPressIn, preventPress, showReactionsOverlay, selected } =
    props;
  const styles = useStyles();

  if (!count) {
    return null;
  }

  const moreReactionsCount = count < 99 ? count : `+${count}`;

  return (
    <ReactionListItemWrapper
      accessibilityLabel='Reaction List Item'
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            defaultHandler: () => {
              if (showReactionsOverlay) {
                showReactionsOverlay();
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            defaultHandler: () => {
              if (showReactionsOverlay) {
                showReactionsOverlay();
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            defaultHandler: () => {
              if (showReactionsOverlay) {
                showReactionsOverlay();
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      selected={selected}
    >
      <Text style={styles.reactionCount}>+{moreReactionsCount}</Text>
    </ReactionListItemWrapper>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        reactionListItem: { reactionCount },
      },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        reactionCount: {
          color: semantics.reactionText,
          fontSize: primitives.typographyFontSizeXxs,
          fontWeight: primitives.typographyFontWeightBold,
          lineHeight: primitives.typographyLineHeightTight,
          ...reactionCount,
        },
      }),
    [semantics, reactionCount],
  );
};
