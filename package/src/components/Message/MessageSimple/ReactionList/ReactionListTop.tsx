import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../contexts';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../../contexts/messagesContext/MessagesContext';

import { primitives } from '../../../../theme';

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
    | 'showReactionsOverlay'
    | 'handleReaction'
  > &
    Pick<
      MessagesContextValue,
      | 'supportedReactions'
      | 'reactionListType'
      | 'ReactionListClustered'
      | 'ReactionListItem'
      | 'ReactionListCountItem'
    >
> & {
  type?: 'clustered' | 'segmented';
  showCount?: boolean;
};

/**
 * ReactionListTop - A high level component which implements all the logic required for a message reaction list
 */
export const ReactionListTop = (props: ReactionListTopProps) => {
  const {
    alignment: propAlignment,
    hasReactions: propHasReactions,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    reactions: propReactions,
    showReactionsOverlay: propShowReactionsOverlay,
    supportedReactions: propSupportedReactions,
    handleReaction: propHandleReaction,
    type,
    showCount = true,
    ReactionListClustered: propReactionListClustered,
    ReactionListItem: propReactionListItem,
    ReactionListCountItem: propReactionListCountItem,
  } = props;

  const {
    alignment: contextAlignment,
    hasReactions: contextHasReactions,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    reactions: contextReactions,
    showReactionsOverlay: contextShowReactionsOverlay,
    handleReaction: contextHandleReaction,
  } = useMessageContext();

  const {
    supportedReactions: contextSupportedReactions,
    ReactionListClustered: contextReactionListClustered,
    ReactionListItem: contextReactionListItem,
    ReactionListCountItem: contextReactionListCountItem,
  } = useMessagesContext();

  const alignment = propAlignment || contextAlignment;
  const hasReactions = propHasReactions || contextHasReactions;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPress = propOnPress || contextOnPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const preventPress = propPreventPress || contextPreventPress;
  const reactions = propReactions || contextReactions;
  const showReactionsOverlay = propShowReactionsOverlay || contextShowReactionsOverlay;
  const supportedReactions = propSupportedReactions || contextSupportedReactions;
  const handleReaction = propHandleReaction || contextHandleReaction;
  const ReactionListClustered = propReactionListClustered || contextReactionListClustered;
  const ReactionListItem = propReactionListItem || contextReactionListItem;
  const ReactionListCountItem = propReactionListCountItem || contextReactionListCountItem;

  const styles = useStyles({ alignment });

  const supportedReactionTypes = supportedReactions?.map(
    (supportedReaction) => supportedReaction.type,
  );

  const hasSupportedReactions = reactions.some((reaction) =>
    supportedReactionTypes?.includes(reaction.type),
  );

  if (!hasSupportedReactions || !hasReactions) {
    return null;
  }

  const moreReactionsCount = reactions.slice(4).length;

  if (type === 'clustered') {
    return (
      <View style={styles.container} accessibilityLabel='Reaction List Top'>
        <ReactionListClustered {...props} />
      </View>
    );
  }

  return (
    <ScrollView
      accessibilityLabel='Reaction List Top'
      contentContainerStyle={styles.contentContainer}
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={[styles.container, styles.list]}
    >
      {reactions.slice(0, 4).map((reaction) => (
        <ReactionListItem
          key={reaction.type}
          reaction={reaction}
          handleReaction={handleReaction}
          onLongPress={onLongPress}
          onPress={onPress}
          onPressIn={onPressIn}
          preventPress={preventPress}
          showReactionsOverlay={showReactionsOverlay}
          supportedReactions={supportedReactions}
          showCount={showCount}
          selected={reaction.own}
        />
      ))}
      <ReactionListCountItem
        count={moreReactionsCount}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressIn={onPressIn}
        preventPress={preventPress}
        showReactionsOverlay={showReactionsOverlay}
      />
    </ScrollView>
  );
};

const useStyles = ({ alignment }: { alignment: 'left' | 'right' }) => {
  const {
    theme: {
      messageSimple: {
        reactionListTop: { container, position, contentContainer, list },
      },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        contentContainer: {
          gap: primitives.spacingXxs,
          ...contentContainer,
        },
        container: {
          marginBottom: -position,
          zIndex: 1,
          right: alignment === 'right' ? position : undefined,
          left: alignment === 'left' ? position : undefined,
          ...container,
        },
        list: {
          flexGrow: 0,
          ...list,
        },
      }),
    [alignment, container, contentContainer, list, position],
  );
};
