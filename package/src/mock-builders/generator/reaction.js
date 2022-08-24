import { generateUser } from './user';

export const generateReaction = (options = {}) => {
  const user = options.user || generateUser();
  return {
    created_at: new Date(),
    type: 'love',
    user,
    user_id: user.id,
    ...options,
  };
};
