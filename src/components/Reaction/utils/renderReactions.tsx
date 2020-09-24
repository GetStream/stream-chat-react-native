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
} from '../../../types/types';

export const renderReactions = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
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
