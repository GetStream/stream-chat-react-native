import { convertUserToStorable } from './UserMapper';

export const convertReactionToStorable = (r, storables) => {
  const reaction = {
    id: r.id,
    type: r.type,
    user_id: r.user_id,
    user: convertUserToStorable(r.user, storables),
    created_at: r.created_at,
  };

  return reaction;
};
export const convertReactionsToStorable = (reactions, storables) =>
  reactions.map((lr) => convertReactionToStorable(lr, storables));
