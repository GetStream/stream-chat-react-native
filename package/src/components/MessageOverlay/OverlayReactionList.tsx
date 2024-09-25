import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FillProps } from 'react-native-svg';

import { ReactionButton } from './ReactionButton';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { triggerHaptic } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type OverlayReactionListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessagesContextValue<StreamChatGenerics>, 'supportedReactions'> & {
  dismissOverlay: () => void;
  ownReactionTypes: string[];
  fill?: FillProps['fill'];
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

  const supportedReactions = propSupportedReactions || contextSupportedReactions;

  const onSelectReaction = (type: string) => {
    triggerHaptic('impactLight');
    if (handleReaction) {
      handleReaction(type);
    }
    dismissOverlay();
  };

  return (
    <View style={[styles.container, container]} testID='overlay-reaction-list'>
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
    paddingHorizontal: 16,
  },
});

OverlayReactionList.displayName = 'OverlayReactionList{overlay{reactionList}}';
