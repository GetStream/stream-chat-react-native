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

export const generateStaticUser = (userNumber) => {
  switch (userNumber) {
    case 0:
      return generateUser({
        id: 'DannyBoi1',
        name: 'Dan',
        image:
          'https://images-na.ssl-images-amazon.com/images/I/51t29lLkg8L._AC_SL1000_.jpg',
      });
    case 1:
      return generateUser({
        id: 'GrantyBoi2',
        name: 'Grant',
        image: 'https://i.imgur.com/SLx06PP.png',
      });
    default:
      return generateUser({
        id: 'NeiliBoi3',
        name: 'Neil',
        image: 'https://i.imgur.com/T68W8nR_d.webp?maxwidth=728&fidelity=grand',
      });
  }
};
