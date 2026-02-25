import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { ReactionListItemWrapper } from './ReactionListItemWrapper';

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

import { primitives } from '../../../../theme';
import type { ReactionData } from '../../../../utils/utils';

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

export type ReactionListClusteredPropsWithContext = Partial<
  Pick<
    MessageContextValue,
    'hasReactions' | 'onPress' | 'onPressIn' | 'preventPress' | 'reactions' | 'showReactionsOverlay'
  >
> &
  Partial<Pick<MessagesContextValue, 'supportedReactions'>> & {
    containerStyle?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
  };

export const ReactionListClusteredWithContext = (props: ReactionListClusteredPropsWithContext) => {
  const {
    hasReactions,
    onPress,
    onPressIn,
    preventPress,
    reactions,
    showReactionsOverlay,
    supportedReactions,
    containerStyle,
    accessibilityLabel,
  } = props;

  const {
    theme: {
      messageSimple: {
        reactionListClustered: { icon },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const supportedReactionTypes = supportedReactions?.map(
    (supportedReaction) => supportedReaction.type,
  );
  const reactionsCount = reactions?.length || 0;
  const moreReactionsCount = reactionsCount - 4;
  const reactionsCountText =
    moreReactionsCount < 99 ? moreReactionsCount : `+${moreReactionsCount}`;

  const hasSupportedReactions = reactions?.some((reaction) =>
    supportedReactionTypes?.includes(reaction.type),
  );

  if (!hasSupportedReactions || !hasReactions) {
    return null;
  }

  return (
    <ReactionListItemWrapper
      disabled={preventPress}
      onPress={(event) => {
        if (onPress) {
          onPress({
            defaultHandler: () => {
              if (showReactionsOverlay) {
                showReactionsOverlay(undefined);
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
                showReactionsOverlay(undefined);
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      style={containerStyle}
      accessibilityLabel={accessibilityLabel}
    >
      {reactions
        ?.slice(0, 4)
        .map((reaction) => (
          <Icon
            key={reaction.type}
            size={icon.size}
            style={[styles.iconStyle, icon.style]}
            supportedReactions={supportedReactions}
            type={reaction.type}
          />
        ))}
      {reactionsCount > 4 ? <Text style={styles.reactionCount}>{reactionsCountText}</Text> : null}
    </ReactionListItemWrapper>
  );
};

const areEqual = (
  prevProps: ReactionListClusteredPropsWithContext,
  nextProps: ReactionListClusteredPropsWithContext,
) => {
  const { hasReactions: prevHasReactions, reactions: prevReactions } = prevProps;
  const { hasReactions: nextHasReactions, reactions: nextReactions } = nextProps;

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  if (!hasReactionsEqual) {
    return false;
  }

  const reactionsEqual = prevReactions?.length === nextReactions?.length;
  if (!reactionsEqual) {
    return false;
  }

  return true;
};

const MemoizedReactionListClustered = React.memo(
  ReactionListClusteredWithContext,
  areEqual,
) as typeof ReactionListClusteredWithContext;

export type ReactionListClusteredProps = Partial<ReactionListClusteredPropsWithContext>;

export const ReactionListClustered = (props: ReactionListClusteredProps) => {
  const { hasReactions, onPress, onPressIn, preventPress, reactions, showReactionsOverlay } =
    useMessageContext();
  const { supportedReactions } = useMessagesContext();

  return (
    <MemoizedReactionListClustered
      {...{
        hasReactions,
        onPress,
        onPressIn,
        preventPress,
        reactions,
        showReactionsOverlay,
        supportedReactions,
      }}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        reactionListClustered: { contentContainer, reactionCount, iconStyle },
      },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        contentContainer: {
          ...contentContainer,
        },
        reactionCount: {
          color: semantics.reactionText,
          fontSize: primitives.typographyFontSizeXxs,
          fontWeight: primitives.typographyFontWeightBold,
          lineHeight: primitives.typographyLineHeightTight,
          ...reactionCount,
        },
        iconStyle: {
          ...iconStyle,
        },
      }),
    [semantics, reactionCount, iconStyle, contentContainer],
  );
};
