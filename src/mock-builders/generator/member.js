import { generateUser } from './user';

export const generateMember = (options = {}) => {
  const user = (options && options.user) || generateUser();
  return {
    invited: false,
    is_moderator: false,
    role: 'member',
    user,
    user_id: user.id,
    ...options,
  };
};
