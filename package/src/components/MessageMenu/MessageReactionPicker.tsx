import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';

import { emojis } from './emojis';
import { ReactionButton } from './ReactionButton';

import { MessageContextValue } from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { Attach } from '../../icons';
import { NativeHandlers } from '../../native';
import { scheduleActionOnClose } from '../../state-store';

import { ReactionData } from '../../utils/utils';
import { BottomSheetModal } from '../UIComponents';

export type MessageReactionPickerProps = Pick<MessagesContextValue, 'supportedReactions'> &
  Pick<MessageContextValue, 'handleReaction' | 'dismissOverlay'> & {
    /**
     * An array of reaction types that the current user has reacted with
     */
    ownReactionTypes: string[];
  };

export type ReactionPickerItemType = ReactionData & {
  onSelectReaction: (type: string) => void;
  ownReactionTypes: string[];
};

const keyExtractor = (item: ReactionPickerItemType) => item.type;

const renderItem = ({ index, item }: { index: number; item: ReactionPickerItemType }) => (
  <ReactionButton
    Icon={item.Icon}
    key={`${item.type}_${index}`}
    onPress={item.onSelectReaction}
    selected={item.ownReactionTypes.includes(item.type)}
    type={item.type}
  />
);

const emojiKeyExtractor = (item: string) => `unicode-${item}`;

// TODO: V9: Move this to utils and also clean it up a bit.
//  This was done quickly and in a bit of a hurry.
export const toUnicodeScalarString = (emoji: string): string => {
  const out: number[] = [];
  for (const ch of emoji) out.push(ch.codePointAt(0)!);
  return out.map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`).join('-');
};

/**
 * MessageReactionPicker - A high level component which implements all the logic required for a message overlay reaction list
 */
export const MessageReactionPicker = (props: MessageReactionPickerProps) => {
  const [emojiViewerOpened, setEmojiViewerOpened] = React.useState<boolean | null>(null);
  const {
    dismissOverlay,
    handleReaction,
    ownReactionTypes,
    supportedReactions: propSupportedReactions,
  } = props;
  const { supportedReactions: contextSupportedReactions } = useMessagesContext();
  const {
    theme: {
      colors: { white, grey },
      messageMenu: {
        reactionPicker: { container, contentContainer },
      },
    },
  } = useTheme();
  const own_capabilities = useOwnCapabilitiesContext();

  const supportedReactions = propSupportedReactions || contextSupportedReactions;

  const onSelectReaction = useStableCallback((type: string) => {
    NativeHandlers.triggerHaptic('impactLight');
    setEmojiViewerOpened(false);
    dismissOverlay();
    if (handleReaction) {
      scheduleActionOnClose(() => handleReaction(type));
    }
  });

  const onOpenEmojiViewer = useStableCallback(() => {
    NativeHandlers.triggerHaptic('impactLight');
    setEmojiViewerOpened(true);
  });

  const EmojiViewerButton = useCallback(
    () => (
      <Pressable onPress={onOpenEmojiViewer} style={styles.emojiViewerButton}>
        <Attach fill={grey} size={32} />
      </Pressable>
    ),
    [grey, onOpenEmojiViewer],
  );

  const reactions: ReactionPickerItemType[] = useMemo(
    () =>
      supportedReactions
        ?.filter((reaction) => !reaction.isUnicode)
        ?.map((reaction) => ({
          ...reaction,
          onSelectReaction,
          ownReactionTypes,
        })) ?? [],
    [onSelectReaction, ownReactionTypes, supportedReactions],
  );

  const selectEmoji = useStableCallback((emoji: string) => {
    const scalarString = toUnicodeScalarString(emoji);
    onSelectReaction(scalarString);
  });

  const closeModal = useStableCallback(() => setEmojiViewerOpened(false));

  const renderEmoji = useCallback(
    ({ item }: { item: string }) => {
      return (
        <Pressable onPress={() => selectEmoji(item)} style={styles.emojiContainer}>
          <Text style={styles.emojiText}>{item}</Text>
        </Pressable>
      );
    },
    [selectEmoji],
  );

  if (!own_capabilities.sendReaction) {
    return null;
  }

  return (
    <View
      accessibilityLabel='Reaction Selector on long pressing message'
      style={[styles.container, container]}
    >
      <FlatList
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: white },
          contentContainer,
        ]}
        data={reactions}
        horizontal
        keyExtractor={keyExtractor}
        ListFooterComponent={EmojiViewerButton}
        renderItem={renderItem}
      />
      {emojiViewerOpened ? (
        <BottomSheetModal height={300} lazy={true} onClose={closeModal} visible={true}>
          <FlatList
            columnWrapperStyle={styles.bottomSheetColumnWrapper}
            contentContainerStyle={styles.bottomSheetContentContainer}
            data={emojis}
            keyExtractor={emojiKeyExtractor}
            numColumns={4}
            renderItem={renderEmoji}
            style={styles.bottomSheet}
          />
        </BottomSheetModal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: { height: 300 },
  bottomSheetColumnWrapper: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  bottomSheetContentContainer: { paddingVertical: 16 },
  container: {
    alignSelf: 'stretch',
  },
  contentContainer: {
    borderRadius: 20,
    flexGrow: 1,
    justifyContent: 'space-around',
    marginVertical: 8,
    paddingHorizontal: 5,
  },
  emojiContainer: { height: 30 },
  emojiText: { fontSize: 20, padding: 2 },
  emojiViewerButton: { alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: 4 },
});
