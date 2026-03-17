import React, { useMemo } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { EmojiPickerList } from './EmojiPickerList';
import { useMessageOwnReactions } from './hooks/useMessageOwnReactions';
import { ReactionButton } from './ReactionButton';

import { MessageContextValue } from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { Plus } from '../../icons/Plus';
import { NativeHandlers } from '../../native';
import { scheduleActionOnClose } from '../../state-store';

import { primitives } from '../../theme';
import { ReactionData } from '../../utils/utils';
import { Button } from '../ui';
import { BottomSheetModal } from '../UIComponents';

export type MessageReactionPickerProps = Pick<MessagesContextValue, 'supportedReactions'> &
  Pick<MessageContextValue, 'handleReaction' | 'dismissOverlay'>;

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

export const MessageReactionPickerList = ({
  onSelectReaction,
}: {
  onSelectReaction: (type: string) => void;
}) => {
  const ownReactionTypes = useMessageOwnReactions();
  const { supportedReactions } = useMessagesContext();
  const {
    theme: {
      messageMenu: {
        reactionPicker: { contentContainer },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const reactions: ReactionPickerItemType[] = useMemo(
    () =>
      supportedReactions
        ?.filter((reaction) => reaction.isMain)
        ?.map((reaction) => ({
          ...reaction,
          onSelectReaction,
          ownReactionTypes,
        })) ?? [],
    [onSelectReaction, ownReactionTypes, supportedReactions],
  );

  return (
    <FlatList
      contentContainerStyle={[styles.reactionListContent, contentContainer]}
      data={reactions}
      horizontal
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
};

export const EmojiViewerButton = ({
  onSelectReaction,
}: {
  onSelectReaction: (type: string) => void;
}) => {
  const styles = useStyles();
  const [emojiViewerOpened, setEmojiViewerOpened] = React.useState<boolean>(false);

  const {
    theme: {
      messageMenu: {
        reactionPicker: { emojiViewerButton },
      },
    },
  } = useTheme();

  const handleSelectReaction = useStableCallback((type: string) => {
    setEmojiViewerOpened(false);
    onSelectReaction(type);
  });

  const onOpenEmojiViewer = useStableCallback(() => {
    NativeHandlers.triggerHaptic('impactLight');
    setEmojiViewerOpened(true);
  });

  const closeModal = useStableCallback(() => setEmojiViewerOpened(false));

  return (
    <>
      <View style={[styles.emojiViewerButton, emojiViewerButton]}>
        <Button
          variant='secondary'
          type='outline'
          size='sm'
          iconOnly
          LeadingIcon={Plus}
          onPress={onOpenEmojiViewer}
          testID='more-reactions-button'
        />
      </View>
      {emojiViewerOpened ? (
        <BottomSheetModal height={424} lazy={true} onClose={closeModal} visible={true}>
          <EmojiPickerList onSelectReaction={handleSelectReaction} />
        </BottomSheetModal>
      ) : null}
    </>
  );
};

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
  const { dismissOverlay, handleReaction } = props;
  const {
    theme: {
      messageMenu: {
        reactionPicker: { container },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const own_capabilities = useOwnCapabilitiesContext();

  const onSelectReaction = useStableCallback((type: string) => {
    NativeHandlers.triggerHaptic('impactLight');
    dismissOverlay();
    if (handleReaction) {
      scheduleActionOnClose(() => handleReaction(type));
    }
  });

  if (!own_capabilities.sendReaction) {
    return null;
  }

  return (
    <View
      accessibilityLabel='Reaction Selector on long pressing message'
      style={[styles.container, container]}
    >
      <MessageReactionPickerList onSelectReaction={onSelectReaction} />
      <EmojiViewerButton onSelectReaction={onSelectReaction} />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignSelf: 'stretch',
          borderRadius: primitives.radius4xl,
          marginVertical: 8,
          overflow: 'visible',
          ...(isDark ? primitives.darkElevation3 : primitives.lightElevation3),
          backgroundColor: semantics.backgroundCoreElevation2,
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
      }),
    [isDark, semantics.backgroundCoreElevation2],
  );
};
