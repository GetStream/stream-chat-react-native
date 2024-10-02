import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ReactionButton } from './ReactionButton';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { triggerHaptic } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type OverlayReactionListProps<
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

/**
 * OverlayReactionList - A high level component which implements all the logic required for a message overlay reaction list
 */
export const OverlayReactionList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: OverlayReactionListProps<StreamChatGenerics>,
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
      overlay: {
        reactionsList: { container },
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

  return (
    <View
      accessibilityLabel='Reaction Selector on long pressing message'
      style={[styles.container, container]}
    >
      {supportedReactions?.map(({ Icon, type }, index) => (
        <ReactionButton
          Icon={Icon}
          key={`${type}_${index}`}
          onPress={onSelectReaction}
          selected={ownReactionTypes.includes(type)}
          type={type}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});

OverlayReactionList.displayName = 'OverlayReactionList{overlay{reactionList}}';
