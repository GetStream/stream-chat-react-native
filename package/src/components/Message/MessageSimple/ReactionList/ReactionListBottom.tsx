import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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
import { ReactionSummary } from '../../hooks/useProcessReactions';

type Props = Pick<IconProps, 'pathFill' | 'style'> & {
  size: number;
  type: string;
  supportedReactions?: ReactionData[];
};

const Icon = ({ pathFill, size, style, supportedReactions, type }: Props) => {
  const ReactionIcon =
    supportedReactions?.find((reaction) => reaction.type === type)?.Icon || Unknown;

  return <ReactionIcon size={size} pathFill={pathFill} style={style} />;
};

export type ReactionListBottomItemProps = Partial<
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

export const ReactionListBottomItem = (props: ReactionListBottomItemProps) => {
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
        reactionListBottom: {
          item: { icon, iconSize },
        },
      },
    },
  } = useTheme();
  const styles = useStyles({});

  return (
    <ReactionListItemWrapper
      accessibilityLabel='Reaction List Bottom Item'
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
        size={iconSize}
        style={icon}
        supportedReactions={supportedReactions}
        type={reaction.type}
      />
      {showCount ? <Text style={styles.reactionCount}>{reaction.count}</Text> : null}
    </ReactionListItemWrapper>
  );
};

const renderItem = ({ index, item }: { index: number; item: ReactionListBottomItemProps }) => (
  <ReactionListBottomItem
    handleReaction={item.handleReaction}
    key={index}
    onLongPress={item.onLongPress}
    onPress={item.onPress}
    onPressIn={item.onPressIn}
    preventPress={item.preventPress}
    reaction={item.reaction}
    showReactionsOverlay={item.showReactionsOverlay}
    supportedReactions={item.supportedReactions}
    selected={item.reaction.own}
    showCount={item.showCount}
  />
);

export type ReactionListBottomProps = Partial<
  Pick<
    MessageContextValue,
    | 'alignment'
    | 'handleReaction'
    | 'hasReactions'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'reactions'
    | 'showReactionsOverlay'
  >
> &
  Partial<Pick<MessagesContextValue, 'supportedReactions'>> & {
    type?: 'clustered' | 'segmented';
    showCount?: boolean;
  };

const ItemSeparatorComponent = () => {
  const styles = useStyles({});
  return <View style={styles.itemSeparator} />;
};

export const ReactionListBottom = (props: ReactionListBottomProps) => {
  const {
    alignment: propAlignment,
    handleReaction: propHandlerReaction,
    hasReactions: propHasReactions,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    reactions: propReactions,
    showReactionsOverlay: propShowReactionsOverlay,
    supportedReactions: propSupportedReactions,
    type,
    showCount = true,
  } = props;

  const {
    alignment: contextAlignment,
    handleReaction: contextHandleReaction,
    hasReactions: contextHasReactions,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    reactions: contextReactions,
    showReactionsOverlay: contextShowReactionsOverlay,
  } = useMessageContext();

  const { supportedReactions: contextSupportedReactions } = useMessagesContext();

  const alignment = propAlignment || contextAlignment;
  const handleReaction = propHandlerReaction || contextHandleReaction;
  const hasReactions = propHasReactions || contextHasReactions;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPress = propOnPress || contextOnPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const preventPress = propPreventPress || contextPreventPress;
  const reactions = propReactions || contextReactions;
  const showReactionsOverlay = propShowReactionsOverlay || contextShowReactionsOverlay;
  const supportedReactions = propSupportedReactions || contextSupportedReactions;
  const {
    theme: {
      messageSimple: {
        reactionListBottom: {
          item: { iconSize, icon },
        },
      },
    },
  } = useTheme();
  const styles = useStyles({ messageAlignment: alignment });
  const supportedReactionTypes = supportedReactions?.map(
    (supportedReaction) => supportedReaction.type,
  );
  const reactionsCount = reactions.length;
  const moreReactionsCount = reactionsCount - 4;
  const reactionsCountText =
    moreReactionsCount < 99 ? moreReactionsCount : `+${moreReactionsCount}`;

  const hasSupportedReactions = reactions.some((reaction) =>
    supportedReactionTypes?.includes(reaction.type),
  );

  if (!hasSupportedReactions || !hasReactions) {
    return null;
  }

  const reactionListBottomItemData: ReactionListBottomItemProps[] = reactions.map((reaction) => ({
    handleReaction,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    reaction,
    showReactionsOverlay,
    supportedReactions,
    showCount,
  }));

  if (type === 'segmented') {
    return (
      <FlatList
        numColumns={showCount ? 5 : 6}
        accessibilityLabel='Reaction List Bottom'
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.columnWrapper}
        data={reactionListBottomItemData}
        keyExtractor={(item) => item.reaction.type}
        ItemSeparatorComponent={ItemSeparatorComponent} // This is for the gap between the rows of reactions
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    );
  } else {
    return (
      <ReactionListItemWrapper
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
      >
        {reactions.slice(0, 4).map((reaction) => (
          <Icon
            key={reaction.type}
            size={iconSize}
            style={icon}
            supportedReactions={supportedReactions}
            type={reaction.type}
          />
        ))}
        {reactionsCount > 4 ? <Text style={styles.reactionCount}>{reactionsCountText}</Text> : null}
      </ReactionListItemWrapper>
    );
  }
};

const useStyles = ({
  messageAlignment,
}: {
  messageAlignment?: MessageContextValue['alignment'];
}) => {
  const {
    theme: {
      semantics,
      messageSimple: {
        reactionListBottom: {
          contentContainer,
          columnWrapper,
          rowSeparator,
          item: { countText },
        },
      },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        columnWrapper: {
          gap: primitives.spacingXxs, // Horizontal spacing between items
          justifyContent: messageAlignment === 'right' ? 'flex-end' : 'flex-start',
          ...columnWrapper,
        },
        contentContainer: {
          ...contentContainer,
        },
        reactionCount: {
          color: semantics.reactionText,
          fontSize: primitives.typographyFontSizeXxs,
          fontWeight: primitives.typographyFontWeightBold,
          lineHeight: primitives.typographyLineHeightTight,
          ...countText,
        },
        itemSeparator: {
          height: primitives.spacingXxs,
          ...rowSeparator,
        },
      }),
    [semantics, countText, contentContainer, columnWrapper, rowSeparator, messageAlignment],
  );
};
