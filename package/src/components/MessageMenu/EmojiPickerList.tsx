import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { emojis } from './emojis';

import { useHasOwnReaction } from './hooks/useHasOwnReaction';
import { toUnicodeScalarString } from './utils/toUnicodeScalarString';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { primitives } from '../../theme';
import { StreamBottomSheetModalFlatList } from '../UIComponents';

const EMOJI_SIZE = Platform.OS === 'ios' ? 32 : 28;
const EMOJI_CELL_SIZE = 54;

const emojiKeyExtractor = (item: string) => `unicode-${item}`;

export const Emoji = ({ item, size }: { item: string; size: number }) => {
  const styles = useStyles();
  return (
    <Text style={[styles.emojiText, { fontSize: size, lineHeight: size + 4 }]} numberOfLines={1}>
      {item}
    </Text>
  );
};

export const EmojiPickerListItem = ({
  emoji,
  onSelectEmoji,
}: {
  emoji: string;
  onSelectEmoji: (emoji: string) => void;
}) => {
  const styles = useStyles();
  const [emojiScalar] = useState(() => toUnicodeScalarString(emoji));
  const hasOwnReaction = useHasOwnReaction(emojiScalar);
  return (
    <Pressable
      onPress={() => onSelectEmoji(emoji)}
      style={[styles.emojiContainer, hasOwnReaction ? styles.selectedEmoji : null]}
    >
      <Emoji item={emoji} size={EMOJI_SIZE} />
    </Pressable>
  );
};

export const EmojiPickerList = ({
  onSelectReaction,
  renderFullInitially = true,
}: {
  onSelectReaction: (unicode: string) => void;
  // Whether every emoji renders on the first pass. Defaults to true.
  renderFullInitially?: boolean;
}) => {
  const styles = useStyles();

  const onSelectEmoji = useStableCallback((emoji: string) => {
    const scalarString = toUnicodeScalarString(emoji);
    onSelectReaction(scalarString);
  });

  const renderEmoji = useCallback(
    ({ item }: { item: string }) => {
      return <EmojiPickerListItem onSelectEmoji={onSelectEmoji} emoji={item} />;
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
      // Needed in some cases: virtualization interferes with the animations, as more native views
      // get bound to JS. Reactions are light, so rendering them all up front is cheap.
      initialNumToRender={renderFullInitially ? emojis.length : undefined}
      renderItem={renderEmoji}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        bottomSheetColumnWrapper: {
          alignItems: 'center',
          justifyContent: 'space-evenly',
          width: '100%',
          height: EMOJI_CELL_SIZE,
        },
        bottomSheetContentContainer: { paddingBottom: 16 },
        emojiContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: primitives.radiusMax,
          padding: primitives.spacingXs,
        },
        emojiText: {
          textAlign: 'center',
        },
        selectedEmoji: {
          backgroundColor: semantics.backgroundUtilitySelected,
        },
      }),
    [semantics.backgroundUtilitySelected],
  );
};
