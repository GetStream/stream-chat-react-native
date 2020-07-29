import { generateUser } from './user';

export const generateReaction = (options = {}) => {
  const user = options.user || generateUser();
  return {
    user,
    user_id: user.user_id,
    type: 'love',
    created_at: new Date(),
    ...options,
  };
};
