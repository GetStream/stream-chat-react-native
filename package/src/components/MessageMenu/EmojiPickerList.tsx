import React, { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { emojis } from './emojis';

import { toUnicodeScalarString } from './MessageReactionPicker';

import { useStableCallback } from '../../hooks';
import { StreamBottomSheetModalFlatList } from '../UIComponents';

const EMOJI_SIZE = 32;

const emojiKeyExtractor = (item: string) => `unicode-${item}`;

export const Emoji = ({ item, size }: { item: string; size: number }) => {
  return (
    <Text style={[styles.emojiText, { fontSize: size, lineHeight: size + 4 }]} numberOfLines={1}>
      {item}
    </Text>
  );
};

export const EmojiPickerList = ({
  onSelectReaction,
  renderFullInitially = true,
}: {
  onSelectReaction: (unicode: string) => void;
  // whether all of the items should be rendered initially or not
  renderFullInitially?: boolean;
}) => {
  const onSelectEmoji = useStableCallback((emoji: string) => {
    const scalarString = toUnicodeScalarString(emoji);
    onSelectReaction(scalarString);
  });

  const renderEmoji = useCallback(
    ({ item }: { item: string }) => {
      return (
        <Pressable onPress={() => onSelectEmoji(item)} style={styles.emojiContainer}>
          <Emoji item={item} size={EMOJI_SIZE} />
        </Pressable>
      );
    },
    [onSelectEmoji],
  );

  return (
    <StreamBottomSheetModalFlatList
      columnWrapperStyle={styles.bottomSheetColumnWrapper}
      contentContainerStyle={styles.bottomSheetContentContainer}
      data={emojis}
      keyExtractor={emojiKeyExtractor}
      numColumns={7}
      removeClippedSubviews={false}
      // This is sort of needed in some instances, because when virtualization
      // kicks in it messes with the animations, as more native views get their
      // bindings to JS. For the reactions specifically it does not really
      // matter as they aren't too heavy - but we should anyway revisit
      // this in the future.
      initialNumToRender={renderFullInitially ? emojis.length : undefined}
      renderItem={renderEmoji}
    />
  );
};

const styles = StyleSheet.create({
  bottomSheetColumnWrapper: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    height: 54,
  },
  bottomSheetContentContainer: { paddingVertical: 16 },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    textAlign: 'center',
  },
});
