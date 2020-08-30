import { convertUserToStorable } from './UserMapper';

export const convertReactionToStorable = (r, storables, appUserId) => {
  const reaction = {
    id: r.id,
    type: r.type,
    user_id: r.user_id,
    user: convertUserToStorable(r.user_id, r.user, storables, appUserId),
    created_at: r.created_at,
  };

  return reaction;
};

export const convertReactionsToStorable = (reactions, storables, appUserId) => {
  if (!reactions) return [];

  return reactions.map((lr) =>
    convertReactionToStorable(lr, storables, appUserId),
  );
};
