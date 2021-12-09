import { v4 as uuidv4 } from 'uuid';

export const getUserDefaults = () => ({
  banned: false,
  created_at: '2020-04-27T13:39:49.331742Z',
  id: uuidv4(),
  image: uuidv4(),
  name: uuidv4(),
  online: false,
  role: 'user',
  updated_at: '2020-04-27T13:39:49.332087Z',
});

export const generateUser = (options = {}) => ({
  ...getUserDefaults(),
  ...options,
});

const staticUsers = [
  // By the order of...
  generateUser({
    id: 'tommy',
    image: 'https://i.imgur.com/ytIyojl.png',
    name: 'Thomas',
  }),
  generateUser({
    id: 'arthur',
    image: 'https://i.imgur.com/LuuGvh0.png',
    name: 'Arthur',
  }),
  generateUser({
    id: 'john',
    image: 'https://i.imgur.com/LbtxRjf.png',
    name: 'John',
  }),
  generateUser({
    id: 'finn',
    image: 'https://i.imgur.com/spueyAP.png',
    name: 'Finn',
  }),
];

export const generateStaticUser = (userNumber) => {
  if (userNumber - 1 > staticUsers.length) {
    throw new Error(`Tried getting a static user that doesn't exist.
Index: ${userNumber} , number of users: ${staticUsers.length}`);
  }
  return staticUsers[userNumber];
};
