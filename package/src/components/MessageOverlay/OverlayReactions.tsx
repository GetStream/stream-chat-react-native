import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ReactionSortBase } from 'stream-chat';

import { useFetchReactions } from './hooks/useFetchReactions';

import { OverlayReactionsItem } from './OverlayReactionsItem';

import type { Alignment } from '../../contexts/messageContext/MessageContext';
import type { MessageOverlayContextValue } from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  LOLReaction,
  LoveReaction,
  ThumbsDownReaction,
  ThumbsUpReaction,
  WutReaction,
} from '../../icons';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReactionData } from '../../utils/utils';

const styles = StyleSheet.create({
  avatarContainer: {
    padding: 8,
  },
  container: {
    alignItems: 'center',
    borderRadius: 16,
    marginTop: 8,
    width: '100%',
  },
  flatListContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  flatListContentContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    paddingTop: 16,
  },
  unseenItemContainer: {
    opacity: 0,
    position: 'absolute',
  },
});

const reactionData: ReactionData[] = [
  {
    Icon: LoveReaction,
    type: 'love',
  },
  {
    Icon: ThumbsUpReaction,
    type: 'like',
  },
  {
    Icon: ThumbsDownReaction,
    type: 'sad',
  },
  {
    Icon: LOLReaction,
    type: 'haha',
  },
  {
    Icon: WutReaction,
    type: 'wow',
  },
];

export type Reaction = {
  alignment: Alignment;
  id: string;
  name: string;
  type: string;
  image?: string;
};

export type OverlayReactionsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageOverlayContextValue<StreamChatGenerics>, 'OverlayReactionsAvatar'> & {
  showScreen: Animated.SharedValue<number>;
  title: string;
  alignment?: Alignment;
  messageId?: string;
  reactions?: Reaction[];
  supportedReactions?: ReactionData[];
};

const sort: ReactionSortBase = {
  created_at: -1,
};

/**
 * OverlayReactions - A high level component which implements all the logic required for message overlay reactions
 */
export const OverlayReactions = (props: OverlayReactionsProps) => {
  const [itemHeight, setItemHeight] = React.useState(0);
  const {
    alignment: overlayAlignment,
    messageId,
    OverlayReactionsAvatar,
    reactions: propReactions,
    showScreen,
    supportedReactions = reactionData,
    title,
  } = props;
  const layoutHeight = useSharedValue(0);
  const layoutWidth = useSharedValue(0);
  const {
    loading,
    loadNextPage,
    reactions: fetchedReactions,
  } = useFetchReactions({
    messageId,
    sort,
  });

  const reactions = useMemo(
    () =>
      propReactions ||
      (fetchedReactions.map((reaction) => ({
        alignment: 'left',
        id: reaction.user?.id,
        image: reaction.user?.image,
        name: reaction.user?.name,
        type: reaction.type,
      })) as Reaction[]),
    [propReactions, fetchedReactions],
  );

  const {
    theme: {
      colors: { black, white },
      overlay: {
        padding: overlayPadding,
        reactions: { avatarContainer, avatarSize, container, flatListContainer, title: titleStyle },
      },
    },
  } = useTheme();

  const width = useWindowDimensions().width;

  const supportedReactionTypes = supportedReactions.map(
    (supportedReaction) => supportedReaction.type,
  );

  const filteredReactions = reactions.filter((reaction) =>
    supportedReactionTypes.includes(reaction.type),
  );

  const numColumns = Math.floor(
    (width -
      overlayPadding * 2 -
      ((Number(flatListContainer.paddingHorizontal || 0) ||
        styles.flatListContainer.paddingHorizontal) +
        (Number(avatarContainer.padding || 0) || styles.avatarContainer.padding)) *
        2) /
      (avatarSize + (Number(avatarContainer.padding || 0) || styles.avatarContainer.padding) * 2),
  );

  const renderItem = ({ item }: { item: Reaction }) => (
    <OverlayReactionsItem
      OverlayReactionsAvatar={OverlayReactionsAvatar}
      reaction={item}
      supportedReactions={supportedReactions}
    />
  );

  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: interpolate(showScreen.value, [0, 1], [-layoutHeight.value / 2, 0]),
        },
        {
          translateX: interpolate(
            showScreen.value,
            [0, 1],
            [overlayAlignment === 'left' ? -layoutWidth.value / 2 : layoutWidth.value / 2, 0],
          ),
        },
        {
          scale: showScreen.value,
        },
      ],
    }),
    [overlayAlignment],
  );

  return (
    <>
      <Animated.View
        onLayout={({ nativeEvent: { layout } }) => {
          layoutWidth.value = layout.width;
          layoutHeight.value = layout.height;
        }}
        style={[
          styles.container,
          { backgroundColor: white, opacity: itemHeight ? 1 : 0 },
          container,
          showScreenStyle,
        ]}
      >
        <Text style={[styles.title, { color: black }, titleStyle]}>{title}</Text>
        {!loading && (
          <FlatList
            contentContainerStyle={styles.flatListContentContainer}
            data={filteredReactions}
            key={numColumns}
            keyExtractor={({ id, name }, index) => `${name}${id}_${index}`}
            numColumns={numColumns}
            onEndReached={loadNextPage}
            renderItem={renderItem}
            scrollEnabled={filteredReactions.length / numColumns > 1}
            style={[
              styles.flatListContainer,
              flatListContainer,
              {
                // we show the item height plus a little extra to tease for scrolling if there are more than one row
                maxHeight:
                  itemHeight + (filteredReactions.length / numColumns > 1 ? itemHeight / 4 : 8),
              },
            ]}
          />
        )}
        {/* The below view is unseen by the user, we use it to compute the height that the item must be */}
        {!loading && (
          <View
            onLayout={({ nativeEvent: { layout } }) => {
              setItemHeight(layout.height);
            }}
            style={[styles.unseenItemContainer, styles.flatListContentContainer]}
          >
            {renderItem({ item: filteredReactions[0] })}
          </View>
        )}
      </Animated.View>
    </>
  );
};

OverlayReactions.displayName = 'OverlayReactions{overlay{reactions}}';
