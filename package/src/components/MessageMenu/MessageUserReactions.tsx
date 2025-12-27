import React, { useCallback, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { ReactionSortBase } from 'stream-chat';

import { useFetchReactions } from './hooks/useFetchReactions';

import { MessageContextValue } from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Reaction } from '../../types/types';

export type MessageUserReactionsProps = Partial<
  Pick<
    MessagesContextValue,
    'MessageUserReactionsAvatar' | 'MessageUserReactionsItem' | 'supportedReactions'
  >
> &
  Partial<Pick<MessageContextValue, 'message'>> & {
    /**
     * An array of reactions
     */
    reactions?: Reaction[];
    /**
     * The selected reaction
     */
    selectedReaction?: string;
    reactionFilterEnabled?: boolean;
  };

const sort: ReactionSortBase = {
  created_at: -1,
};

const keyExtractor = (item: Reaction) => item.id;

export const MessageUserReactions = (props: MessageUserReactionsProps) => {
  const {
    message,
    MessageUserReactionsAvatar: propMessageUserReactionsAvatar,
    MessageUserReactionsItem: propMessageUserReactionsItem,
    reactions: propReactions,
    supportedReactions: propSupportedReactions,
  } = props;
  const {
    MessageUserReactionsAvatar: contextMessageUserReactionsAvatar,
    MessageUserReactionsItem: contextMessageUserReactionsItem,
    supportedReactions: contextSupportedReactions,
  } = useMessagesContext();
  const supportedReactions = propSupportedReactions ?? contextSupportedReactions;
  const MessageUserReactionsAvatar =
    propMessageUserReactionsAvatar ?? contextMessageUserReactionsAvatar;
  const MessageUserReactionsItem = propMessageUserReactionsItem ?? contextMessageUserReactionsItem;

  const {
    loading,
    loadNextPage,
    reactions: fetchedReactions,
  } = useFetchReactions({
    message,
    reactionType: undefined,
    sort,
  });

  const {
    theme: {
      colors: { white },
      messageMenu: {
        userReactions: { container, flatlistColumnContainer, flatlistContainer, reactionsText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const reactions = useMemo(
    () =>
      propReactions ||
      (fetchedReactions.map((reaction) => ({
        id: reaction.user?.id,
        image: reaction.user?.image,
        name: reaction.user?.name,
        type: reaction.type,
      })) as Reaction[]),
    [propReactions, fetchedReactions],
  );

  const renderItem = useCallback(
    ({ item }: { item: Reaction }) => (
      <MessageUserReactionsItem
        MessageUserReactionsAvatar={MessageUserReactionsAvatar}
        reaction={item}
        supportedReactions={supportedReactions ?? []}
      />
    ),
    [MessageUserReactionsAvatar, MessageUserReactionsItem, supportedReactions],
  );

  return !loading ? (
    <View
      accessibilityLabel='User Reactions on long press message'
      style={[styles.container, { backgroundColor: white }, container]}
    >
      <>
        <Text style={[styles.reactionsText, reactionsText]}>{t('Message Reactions')}</Text>
        <FlatList
          accessibilityLabel='reaction-flat-list'
          columnWrapperStyle={[styles.flatListColumnContainer, flatlistColumnContainer]}
          contentContainerStyle={[styles.flatListContainer, flatlistContainer]}
          data={reactions}
          keyExtractor={keyExtractor}
          numColumns={4}
          onEndReached={loadNextPage}
          renderItem={renderItem}
        />
      </>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginTop: 16,
    maxHeight: 256,
    width: Dimensions.get('window').width * 0.9,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  flatListColumnContainer: {
    justifyContent: 'space-evenly',
  },
  flatListContainer: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  reactionSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  reactionsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 16,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
});
