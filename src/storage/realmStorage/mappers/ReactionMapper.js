/* eslint-disable no-underscore-dangle */
import { convertUserToRealm } from './UserMapper';

export const getReactionFromRealmObject = (ro) => {
  const reaction = { ...ro };
  return reaction;
};

export const getReactionsFromRealmList = (rl) =>
  rl.map(getReactionFromRealmObject);

export const convertReactionsToRealm = (reactions, realm) =>
  reactions.map((r) => convertReactionToRealm(r, realm));

export const convertReactionToRealm = (lr, realm) => {
  const latestReaction = {
    created_at: lr.created_at,
    id: lr.id,
    message_id: lr.message_id,
    type: lr.type,
    user_id: lr.user_id,
  };
  latestReaction.id =
    latestReaction.message_id + latestReaction.user_id + latestReaction.type;

  latestReaction.user = convertUserToRealm(lr.user, realm);
  return realm.create('Reaction', latestReaction, true);
};

export const convertReactionCountsToRealm = (
  reaction_counts,
  messageId,
  realm,
) => {
  const rcKeys = reaction_counts ? Object.keys(reaction_counts) : [];

  const reactionsCount = rcKeys.map((type) => {
    const reactionCount = {
      count: reaction_counts[type],
      id: `${messageId}${type}`,
      type,
    };

    return realm.create('ReactionCount', reactionCount, true);
  });
  return reactionsCount;
};

export const getReactionCountsFromRealmList = (rcList) => {
  const reactionCounts = {};
  rcList.forEach((rc) => {
    reactionCounts[rc.type] = rc.count;
  });

  return reactionCounts;
};
