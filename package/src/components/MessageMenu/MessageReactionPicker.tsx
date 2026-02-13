import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { EmojiPickerList } from './EmojiPickerList';
import { ReactionButton } from './ReactionButton';

import { MessageContextValue } from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { NewPlus } from '../../icons/NewPlus';
import { NativeHandlers } from '../../native';
import { scheduleActionOnClose } from '../../state-store';

import { primitives } from '../../theme';
import { ReactionData } from '../../utils/utils';
import { Button } from '../ui';
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
      colors: { white },
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

  const onSelectEmoji = useStableCallback((emoji: string) => {
    const scalarString = toUnicodeScalarString(emoji);
    onSelectReaction(scalarString);
  });

  const closeModal = useStableCallback(() => setEmojiViewerOpened(false));

  if (!own_capabilities.sendReaction) {
    return null;
  }

  return (
    <View
      accessibilityLabel='Reaction Selector on long pressing message'
      style={[styles.container, { backgroundColor: white }, container]}
    >
      <FlatList
        contentContainerStyle={[styles.reactionListContent, contentContainer]}
        data={reactions}
        horizontal
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
      <View style={styles.emojiViewerButton}>
        <Button
          variant='secondary'
          type='outline'
          size='sm'
          iconOnly
          LeadingIcon={NewPlus}
          onPress={onOpenEmojiViewer}
          testID='more-reactions-button'
        />
      </View>
      {emojiViewerOpened ? (
        <BottomSheetModal height={300} lazy={true} onClose={closeModal} visible={true}>
          <EmojiPickerList onSelectEmoji={onSelectEmoji} />
        </BottomSheetModal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderRadius: primitives.radius4xl,
    marginVertical: 8,
  },
  reactionListContent: {
    flexGrow: 1,
    justifyContent: 'space-around',
    gap: primitives.spacingXxxs,
    paddingVertical: primitives.spacingXxs,
    paddingLeft: primitives.spacingXxs,
  },
  emojiViewerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: primitives.spacingXs,
    paddingLeft: primitives.spacingXs,
  },
});
