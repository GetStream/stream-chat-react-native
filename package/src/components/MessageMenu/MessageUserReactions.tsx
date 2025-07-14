import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { ReactionSortBase } from 'stream-chat';

import { useFetchReactions } from './hooks/useFetchReactions';
import { ReactionButton } from './ReactionButton';

import { MessageContextValue } from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Reaction } from '../../types/types';
import { ReactionData } from '../../utils/utils';

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
  };

const sort: ReactionSortBase = {
  created_at: -1,
};

export type ReactionSelectorItemType = ReactionData & {
  onSelectReaction: (type: string) => void;
  selectedReaction?: string;
};

const renderSelectorItem = ({ index, item }: { index: number; item: ReactionSelectorItemType }) => (
  <ReactionButton
    Icon={item.Icon}
    key={`${item.type}_${index}`}
    onPress={item.onSelectReaction}
    selected={item.selectedReaction === item.type}
    type={item.type}
  />
);

export const MessageUserReactions = (props: MessageUserReactionsProps) => {
  const {
    message,
    MessageUserReactionsAvatar: propMessageUserReactionsAvatar,
    MessageUserReactionsItem: propMessageUserReactionsItem,
    reactions: propReactions,
    selectedReaction: propSelectedReaction,
    supportedReactions: propSupportedReactions,
  } = props;
  const reactionTypes = Object.keys(message?.reaction_groups ?? {});
  const [selectedReaction, setSelectedReaction] = React.useState<string | undefined>(
    propSelectedReaction ?? reactionTypes[0],
  );
  const {
    MessageUserReactionsAvatar: contextMessageUserReactionsAvatar,
    MessageUserReactionsItem: contextMessageUserReactionsItem,
    supportedReactions: contextSupportedReactions,
  } = useMessagesContext();
  const supportedReactions = propSupportedReactions ?? contextSupportedReactions;
  const MessageUserReactionsAvatar =
    propMessageUserReactionsAvatar ?? contextMessageUserReactionsAvatar;
  const MessageUserReactionsItem = propMessageUserReactionsItem ?? contextMessageUserReactionsItem;

  const onSelectReaction = (reactionType: string) => {
    setSelectedReaction(reactionType);
  };

  useEffect(() => {
    if (selectedReaction && reactionTypes.length > 0 && !reactionTypes.includes(selectedReaction)) {
      setSelectedReaction(reactionTypes[0]);
    }
  }, [reactionTypes, selectedReaction]);

  const messageReactions = useMemo(
    () =>
      reactionTypes.reduce<ReactionData[]>((acc, reaction) => {
        const reactionData = supportedReactions?.find(
          (supportedReaction) => supportedReaction.type === reaction,
        );
        if (reactionData) {
          acc.push(reactionData);
        }
        return acc;
      }, []),
    [reactionTypes, supportedReactions],
  );

  const {
    loading,
    loadNextPage,
    reactions: fetchedReactions,
  } = useFetchReactions({
    message,
    reactionType: selectedReaction,
    sort,
  });

  const {
    theme: {
      messageMenu: {
        userReactions: {
          container,
          contentContainer,
          flatlistColumnContainer,
          flatlistContainer,
          reactionSelectorContainer,
          reactionsText,
        },
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

  const renderItem = ({ item }: { item: Reaction }) => (
    <MessageUserReactionsItem
      MessageUserReactionsAvatar={MessageUserReactionsAvatar}
      reaction={item}
      supportedReactions={supportedReactions ?? []}
    />
  );

  const renderHeader = () => (
    <Text style={[styles.reactionsText, reactionsText]}>{t('Message Reactions')}</Text>
  );

  const selectorReactions: ReactionSelectorItemType[] = messageReactions.map((reaction) => ({
    ...reaction,
    onSelectReaction,
    selectedReaction,
  }));

  return (
    <View
      accessibilityLabel='User Reactions on long press message'
      style={[styles.container, container]}
    >
      <View style={[styles.reactionSelectorContainer, reactionSelectorContainer]}>
        <FlatList
          contentContainerStyle={[styles.contentContainer, contentContainer]}
          data={selectorReactions}
          horizontal
          keyExtractor={(item) => item.type}
          renderItem={renderSelectorItem}
        />
      </View>

      {!loading ? (
        <FlatList
          accessibilityLabel='reaction-flat-list'
          columnWrapperStyle={[styles.flatListColumnContainer, flatlistColumnContainer]}
          contentContainerStyle={[styles.flatListContainer, flatlistContainer]}
          data={reactions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          numColumns={4}
          onEndReached={loadNextPage}
          renderItem={renderItem}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  reactionSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  reactionsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
});
