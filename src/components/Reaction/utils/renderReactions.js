import React from 'react';
import { Text } from 'react-native';

export const renderReactions = (reactions, supportedReactions) => {
  const reactionsByType = {};
  reactions.map((item) => {
    if (reactions[item.type] === undefined) {
      return (reactionsByType[item.type] = [item]);
    } else {
      return (reactionsByType[item.type] = [
        ...reactionsByType[item.type],
        item,
      ]);
    }
  });

  const emojiDataByType = {};
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
