import { convertUserToStorable } from './UserMapper';

export const convertReactionToStorable = (r, storables, appUserId) => {
  const reaction = {
    created_at: r.created_at,
    id: r.id,
    type: r.type,
    user: convertUserToStorable(r.user_id, r.user, storables, appUserId),
    user_id: r.user_id,
  };

  return reaction;
};

export const convertReactionsToStorable = (reactions, storables, appUserId) => {
  if (!reactions) return [];

  return reactions.map((lr) =>
    convertReactionToStorable(lr, storables, appUserId),
  );
};
