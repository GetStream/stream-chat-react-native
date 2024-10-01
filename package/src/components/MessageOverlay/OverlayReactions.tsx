import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ReactionSortBase } from 'stream-chat';

import { useFetchReactions } from './hooks/useFetchReactions';
import { ReactionButton } from './ReactionButton';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { DefaultStreamChatGenerics, Reaction } from '../../types/types';
import { ReactionData } from '../../utils/utils';
import { MessageType } from '../MessageList/hooks/useMessageList';

export type OverlayReactionsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    'OverlayReactionsAvatar' | 'OverlayReactionsItem' | 'supportedReactions'
  >
> & {
  /**
   * The message object
   */
  message?: MessageType<StreamChatGenerics>;
  /**
   * An array of reactions
   */
  reactions?: Reaction[];
};

const sort: ReactionSortBase = {
  created_at: -1,
};

export const OverlayReactions = (props: OverlayReactionsProps) => {
  const {
    message,
    OverlayReactionsAvatar: propOverlayReactionsAvatar,
    OverlayReactionsItem: propOverlayReactionsItem,
    reactions: propReactions,
    supportedReactions: propSupportedReactions,
  } = props;
  const reactionTypes = Object.keys(message?.reaction_groups ?? {});
  const [selectedReaction, setSelectedReaction] = React.useState<string | undefined>(
    reactionTypes[0],
  );
  const {
    OverlayReactionsAvatar: contextOverlayReactionsAvatar,
    OverlayReactionsItem: contextOverlayReactionsItem,
    supportedReactions: contextSupportedReactions,
  } = useMessagesContext();
  const supportedReactions = propSupportedReactions ?? contextSupportedReactions;
  const OverlayReactionsAvatar = propOverlayReactionsAvatar ?? contextOverlayReactionsAvatar;
  const OverlayReactionsItem = propOverlayReactionsItem ?? contextOverlayReactionsItem;

  const messageReactions = reactionTypes.reduce<ReactionData[]>((acc, reaction) => {
    const reactionData = supportedReactions?.find(
      (supportedReaction) => supportedReaction.type === reaction,
    );
    if (reactionData) {
      acc.push(reactionData);
    }
    return acc;
  }, []);

  const {
    loading,
    loadNextPage,
    reactions: fetchedReactions,
  } = useFetchReactions({
    messageId: message?.id,
    reactionType: selectedReaction,
    sort,
  });

  const {
    theme: {
      overlay: {
        reactions: {
          container,
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
    <OverlayReactionsItem
      OverlayReactionsAvatar={OverlayReactionsAvatar}
      reaction={item}
      supportedReactions={supportedReactions ?? []}
    />
  );

  const renderHeader = () => (
    <Text style={[styles.reactionsText, reactionsText]}>{t<string>('Message Reactions')}</Text>
  );

  const onSelectReaction = (reactionType: string) => {
    setSelectedReaction(reactionType);
  };

  return (
    <View
      accessibilityLabel='User Reactions on long press message'
      style={[styles.container, container]}
    >
      <View style={[styles.reactionSelectorContainer, reactionSelectorContainer]}>
        {messageReactions?.map(({ Icon, type }, index) => (
          <ReactionButton
            Icon={Icon}
            key={`${type}_${index}`}
            onPress={onSelectReaction}
            selected={selectedReaction === type}
            type={type}
          />
        ))}
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
