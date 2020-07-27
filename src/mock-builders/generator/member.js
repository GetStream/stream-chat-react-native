import { generateUser } from './user';

export const generateMember = (options = {}) => {
  const user = options?.user || generateUser();
  return {
    user_id: user.id,
    user,
    is_moderator: false,
    invited: false,
    role: 'member',
    ...options,
  };
};
