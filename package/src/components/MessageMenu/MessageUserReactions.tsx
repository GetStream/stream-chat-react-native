import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ReactionSortBase } from 'stream-chat';

import { EmojiPickerList } from './EmojiPickerList';
import { useFetchReactions } from './hooks/useFetchReactions';
import { ReactionButton } from './ReactionButton';

import { useBottomSheetContext } from '../../contexts';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks';
import { IconProps } from '../../icons';
import { MoreEmojis } from '../../icons/MoreEmojis';
import { primitives } from '../../theme';
import { Reaction } from '../../types/types';
import { ReactionData } from '../../utils/utils';
import { Button } from '../ui';
import { StreamBottomSheetModalFlatList } from '../UIComponents';

const ITEM_WIDTH = 60;

// @ts-ignore
const getItemLayout = (_, index: number) => ({
  length: ITEM_WIDTH,
  offset: ITEM_WIDTH * index,
  index,
});

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
  count: string;
};

export const MessageUserReactionsSelectorItem = (props: ReactionSelectorItemType) => {
  const { Icon, type, onSelectReaction, selectedReaction, count } = props;
  const SelectorIcon = useCallback(({ ...props }) => <Icon {...props} size={16} />, [Icon]);

  return (
    <ReactionButton
      Icon={SelectorIcon}
      onPress={onSelectReaction}
      selected={selectedReaction === type}
      type={type}
      count={count}
      size={'sm'}
    />
  );
};

const renderSelectorItem = ({ index, item }: { index: number; item: ReactionSelectorItemType }) => (
  <MessageUserReactionsSelectorItem
    Icon={item.Icon}
    key={`${item.type}_${index}`}
    onSelectReaction={item.onSelectReaction}
    selectedReaction={item.selectedReaction}
    type={item.type}
    count={item.count}
  />
);

const reactionsKeyExtractor = (item: Reaction) => item.id;
const reactionSelectorKeyExtractor = (item: ReactionSelectorItemType) => item.type;

export const MessageUserReactions = (props: MessageUserReactionsProps) => {
  const styles = useStyles();
  const [showMoreReactions, setShowMoreReactions] = useState(false);
  const {
    message,
    MessageUserReactionsAvatar: propMessageUserReactionsAvatar,
    MessageUserReactionsItem: propMessageUserReactionsItem,
    reactions: propReactions,
    selectedReaction: propSelectedReaction,
    supportedReactions: propSupportedReactions,
  } = props;
  const selectorListRef = useRef<FlatList>(null);
  const { close } = useBottomSheetContext();
  const reactionTypes = useMemo(
    () => Object.keys(message?.reaction_groups ?? {}),
    [message?.reaction_groups],
  );
  const [selectedReaction, setSelectedReaction] = useState<string | undefined>(
    propSelectedReaction ?? reactionTypes[0],
  );
  const {
    MessageUserReactionsAvatar: contextMessageUserReactionsAvatar,
    MessageUserReactionsItem: contextMessageUserReactionsItem,
    supportedReactions: contextSupportedReactions,
  } = useMessagesContext();
  const { handleReaction } = useMessageContext();
  const supportedReactions = propSupportedReactions ?? contextSupportedReactions;
  const MessageUserReactionsAvatar =
    propMessageUserReactionsAvatar ?? contextMessageUserReactionsAvatar;
  const MessageUserReactionsItem = propMessageUserReactionsItem ?? contextMessageUserReactionsItem;

  const onSelectReaction = useStableCallback((reactionType: string) => {
    setSelectedReaction(reactionType);
  });

  useEffect(() => {
    if (selectedReaction && reactionTypes.length > 0 && !reactionTypes.includes(selectedReaction)) {
      setSelectedReaction(reactionTypes[0]);
    }
  }, [reactionTypes, selectedReaction]);

  const selectorReactions: ReactionSelectorItemType[] = useMemo(
    () =>
      reactionTypes.reduce<ReactionSelectorItemType[]>((acc, reaction) => {
        const reactionData = supportedReactions?.find(
          (supportedReaction) => supportedReaction.type === reaction,
        );
        if (reactionData) {
          acc.push({
            ...reactionData,
            onSelectReaction,
            selectedReaction,
            count: (message?.reaction_counts?.[reactionData.type] ?? 0).toString(),
          });
        }
        return acc;
      }, []),
    [
      message?.reaction_counts,
      onSelectReaction,
      reactionTypes,
      selectedReaction,
      supportedReactions,
    ],
  );

  const selectedIndex = useMemo(() => {
    if (!propSelectedReaction) {
      return -1;
    }
    return selectorReactions.findIndex((reaction) => reaction.type === propSelectedReaction);
  }, [propSelectedReaction, selectorReactions]);

  useEffect(() => {
    if (selectedIndex !== -1 && selectorListRef.current) {
      selectorListRef.current?.scrollToIndex({
        index: selectedIndex + 1, // +1 to account for the show more reactions button
        animated: true,
      });
    }
  }, [selectedIndex]);

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
          flatlistContainer,
          reactionSelectorContainer,
          reactionsText,
        },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const totalReactionCount = useMemo(
    () =>
      Object.values(message?.reaction_counts ?? {}).reduce(
        (acc, reactionCount) => acc + reactionCount,
        0,
      ),
    [message?.reaction_counts],
  );

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

  const handleSelectReaction = useStableCallback((emoji: string) => {
    if (handleReaction) {
      handleReaction(emoji);
    }
    close();
  });

  const onShowMoreReactionsPress = useStableCallback(() => setShowMoreReactions(true));

  const MoreEmojisIcon = useCallback(
    (props: IconProps) => (
      <View style={styles.showMoreReactionsButton}>
        <MoreEmojis {...props} />
      </View>
    ),
    [styles.showMoreReactionsButton],
  );

  const ShowMoreReactionsButton = useCallback(
    () => (
      <Button
        accessibilityLabel={'more-reactions-button'}
        variant={'secondary'}
        type={'outline'}
        size={'sm'}
        LeadingIcon={MoreEmojisIcon}
        onPress={onShowMoreReactionsPress}
      />
    ),
    [onShowMoreReactionsPress, MoreEmojisIcon],
  );

  return (
    <View
      accessibilityLabel='User Reactions on long press message'
      style={[styles.container, container]}
    >
      {showMoreReactions ? (
        <Animated.View
          key={'emoji-viewer'}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <EmojiPickerList onSelectReaction={handleSelectReaction} renderFullInitially={false} />
        </Animated.View>
      ) : (
        <Animated.View
          key={'reaction-details'}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <Text style={[styles.reactionsText, reactionsText]}>
            {t('{{count}} Reactions', { count: totalReactionCount })}
          </Text>
          <View style={[styles.reactionSelectorContainer, reactionSelectorContainer]}>
            <FlatList
              contentContainerStyle={[styles.contentContainer, contentContainer]}
              data={selectorReactions}
              getItemLayout={getItemLayout}
              horizontal
              keyExtractor={reactionSelectorKeyExtractor}
              ListHeaderComponent={ShowMoreReactionsButton}
              renderItem={renderSelectorItem}
              ref={selectorListRef}
            />
          </View>

          {!loading ? (
            <StreamBottomSheetModalFlatList
              accessibilityLabel='reaction-flat-list'
              contentContainerStyle={[styles.flatListContainer, flatlistContainer]}
              data={reactions}
              keyExtractor={reactionsKeyExtractor}
              onEndReached={loadNextPage}
              renderItem={renderItem}
            />
          ) : null}
        </Animated.View>
      )}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        contentContainer: {
          flexGrow: 1,
          gap: primitives.spacingXs,
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingSm,
        },
        flatListContainer: {
          justifyContent: 'center',
        },
        reactionSelectorContainer: {
          flexDirection: 'row',
        },
        reactionsText: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
          paddingBottom: primitives.spacingXxs,
          textAlign: 'center',
        },
        showMoreReactionsButton: { paddingHorizontal: primitives.spacingXs },
      }),
    [semantics.textPrimary],
  );
};
