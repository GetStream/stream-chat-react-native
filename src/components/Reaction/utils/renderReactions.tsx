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
  reactions?.map((item) => {
    if (reactionsByType[item.type] === undefined) {
      return (reactionsByType[item.type] = [item as ReactionResponse<Re, Us>]);
    } else {
      return (reactionsByType[item.type] = [
        ...reactionsByType[item.type],
        item as ReactionResponse<Re, Us>,
      ]);
    }
  });

  const emojiDataByType: { [key: string]: Reaction } = {};
  supportedReactions.forEach((e) => (emojiDataByType[e.id] = e));

  const reactionTypes = supportedReactions.map((e) => e.id);
  return Object.keys(reactionsByType).map((type) =>
    reactionTypes.indexOf(type) > -1 ? (
      <Text key={type} testID={type}>
        {emojiDataByType[type].icon}
      </Text>
    ) : null,
  );
};
