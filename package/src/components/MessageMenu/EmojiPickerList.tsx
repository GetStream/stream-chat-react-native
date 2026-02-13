import React, { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { emojis } from './emojis';

import { StreamBottomSheetModalFlatList } from '../UIComponents';

const EMOJI_SIZE = 32;

const emojiKeyExtractor = (item: string) => `unicode-${item}`;

export const EmojiPickerList = ({
  onSelectEmoji,
}: {
  onSelectEmoji: (unicode: string) => void;
}) => {
  const renderEmoji = useCallback(
    ({ item }: { item: string }) => {
      return (
        <Pressable onPress={() => onSelectEmoji(item)} style={styles.emojiContainer}>
          <Text
            style={[styles.emojiText, { fontSize: EMOJI_SIZE, lineHeight: EMOJI_SIZE + 4 }]}
            numberOfLines={1}
          >
            {item}
          </Text>
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
      // This is sort of needed, because when virtualization kicks in
      // it messes with the animations, as more native views get their
      // bindings to JS. For the reactions specifically it does not really
      // matter as they aren't too heavy - but we should anyway revisit
      // this in the future.
      initialNumToRender={emojis.length}
      renderItem={renderEmoji}
      style={styles.bottomSheet}
    />
  );
};

const styles = StyleSheet.create({
  bottomSheet: { height: 300 },
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
