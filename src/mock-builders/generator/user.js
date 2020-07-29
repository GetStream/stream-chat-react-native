import { v4 as uuidv4 } from 'uuid';

export const generateUser = (options = {}) => ({
  id: uuidv4(),
  name: uuidv4(),
  image: uuidv4(),
  role: 'user',
  created_at: '2020-04-27T13:39:49.331742Z',
  updated_at: '2020-04-27T13:39:49.332087Z',
  banned: false,
  online: false,
  ...options,
});
