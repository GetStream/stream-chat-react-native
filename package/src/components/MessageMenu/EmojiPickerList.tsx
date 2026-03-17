import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { emojis } from './emojis';

import { useHasOwnReaction } from './hooks/useHasOwnReaction';
import { toUnicodeScalarString } from './MessageReactionPicker';

import { useTheme } from '../../contexts';
import { useStableCallback } from '../../hooks';
import { primitives } from '../../theme';
import { StreamBottomSheetModalFlatList } from '../UIComponents';

const EMOJI_SIZE = Platform.OS === 'ios' ? 32 : 28;

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
  // whether all of the items should be rendered initially or not
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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        bottomSheetColumnWrapper: {
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: 54,
        },
        bottomSheetContentContainer: { paddingVertical: 16 },
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
