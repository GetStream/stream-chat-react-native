import React from 'react';
import { Text } from 'react-native';

import type { ReactionResponse } from 'stream-chat';

import type { LatestReactions, Reaction } from '../ReactionList';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const renderReactions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  reactions: LatestReactions<At, Ch, Co, Me, Re, Us>,
  supportedReactions: Reaction[],
) => {
  const reactionsByType: {
    [key: string]: ReactionResponse<Re, Us>[];
  } = {};
  reactions?.map((reaction) => {
    if (!reactionsByType[reaction.type]) {
      return (reactionsByType[reaction.type] = [reaction]);
    }
    return (reactionsByType[reaction.type] = [
      ...reactionsByType[reaction.type],
      reaction,
    ]);
  });

  const emojiDataByType: { [key: string]: Reaction } = {};
  const reactionTypes = supportedReactions.map((supportedReaction) => {
    emojiDataByType[supportedReaction.id] = supportedReaction;
    return supportedReaction.id;
  });

  return Object.keys(reactionsByType).map((type) =>
    reactionTypes.indexOf(type) > -1 ? (
      <Text key={type} testID={type}>
        {emojiDataByType[type].icon}
      </Text>
    ) : null,
  );
};
