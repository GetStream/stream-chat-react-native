import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ReactionListItemProps } from './ReactionListItem';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

import { primitives } from '../../../../theme';

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
  Partial<
    Pick<MessagesContextValue, 'supportedReactions' | 'ReactionListClustered' | 'ReactionListItem'>
  > & {
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
    ReactionListClustered: propReactionListClustered,
    ReactionListItem: propReactionListItem,
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

  const {
    supportedReactions: contextSupportedReactions,
    ReactionListClustered: contextReactionListClustered,
    ReactionListItem: contextReactionListItem,
  } = useMessagesContext();

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
  const ReactionListClustered = propReactionListClustered || contextReactionListClustered;
  const ReactionListItem = propReactionListItem || contextReactionListItem;

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: ReactionListItemProps }) => (
      <ReactionListItem
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
    ),
    [ReactionListItem],
  );

  const styles = useStyles({ messageAlignment: alignment });
  const supportedReactionTypes = supportedReactions?.map(
    (supportedReaction) => supportedReaction.type,
  );

  const hasSupportedReactions = reactions.some((reaction) =>
    supportedReactionTypes?.includes(reaction.type),
  );

  if (!hasSupportedReactions || !hasReactions) {
    return null;
  }

  const reactionListBottomItemData: ReactionListItemProps[] = reactions.map((reaction) => ({
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
    return <ReactionListClustered accessibilityLabel='Reaction List Bottom' {...props} />;
  }
};

const useStyles = ({
  messageAlignment,
}: {
  messageAlignment?: MessageContextValue['alignment'];
}) => {
  const {
    theme: {
      messageSimple: {
        reactionListBottom: { contentContainer, columnWrapper, rowSeparator },
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
        itemSeparator: {
          height: primitives.spacingXxs,
          ...rowSeparator,
        },
      }),
    [contentContainer, columnWrapper, rowSeparator, messageAlignment],
  );
};
