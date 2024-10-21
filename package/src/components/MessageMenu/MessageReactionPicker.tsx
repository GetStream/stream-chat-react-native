import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ReactionButton } from './ReactionButton';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { triggerHaptic } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { ReactionData } from '../../utils/utils';

export type MessageReactionPickerProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessagesContextValue<StreamChatGenerics>, 'supportedReactions'> & {
  /**
   * Function to dismiss the action bottom sheet.
   * @returns void
   */
  dismissOverlay: () => void;
  /**
   * An array of reaction types that the current user has reacted with
   */
  ownReactionTypes: string[];
  /**
   * Function to handle reaction on press
   * @param reactionType
   * @returns
   */
  handleReaction?: (reactionType: string) => Promise<void>;
};

export type ReactionPickerItemType = ReactionData & {
  onSelectReaction: (type: string) => void;
  ownReactionTypes: string[];
};

const renderItem = ({ index, item }: { index: number; item: ReactionPickerItemType }) => (
  <ReactionButton
    Icon={item.Icon}
    key={`${item.type}_${index}`}
    onPress={item.onSelectReaction}
    selected={item.ownReactionTypes.includes(item.type)}
    type={item.type}
  />
);

/**
 * MessageReactionPicker - A high level component which implements all the logic required for a message overlay reaction list
 */
export const MessageReactionPicker = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageReactionPickerProps<StreamChatGenerics>,
) => {
  const {
    dismissOverlay,
    handleReaction,
    ownReactionTypes,
    supportedReactions: propSupportedReactions,
  } = props;
  const { supportedReactions: contextSupportedReactions } = useMessagesContext();
  const {
    theme: {
      messageMenu: {
        reactionPicker: { container, contentContainer },
      },
    },
  } = useTheme();
  const own_capabilities = useOwnCapabilitiesContext();

  const supportedReactions = propSupportedReactions || contextSupportedReactions;

  const onSelectReaction = (type: string) => {
    triggerHaptic('impactLight');
    if (handleReaction) {
      handleReaction(type);
    }
    dismissOverlay();
  };

  if (!own_capabilities.sendReaction) {
    return null;
  }

  const reactions: ReactionPickerItemType[] =
    supportedReactions?.map((reaction) => ({
      ...reaction,
      onSelectReaction,
      ownReactionTypes,
    })) ?? [];

  return (
    <View
      accessibilityLabel='Reaction Selector on long pressing message'
      style={[styles.container, container]}
    >
      <FlatList
        contentContainerStyle={[styles.contentContainer, contentContainer]}
        data={reactions}
        horizontal
        keyExtractor={(item) => item.type}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-around',
    marginVertical: 8,
  },
});
