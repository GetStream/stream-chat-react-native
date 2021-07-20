import { v4 as uuidv4 } from 'uuid';

export const generateUser = (options = {}) => ({
  banned: false,
  created_at: '2020-04-27T13:39:49.331742Z',
  id: uuidv4(),
  image: uuidv4(),
  name: uuidv4(),
  online: false,
  role: 'user',
  updated_at: '2020-04-27T13:39:49.332087Z',
  ...options,
});

export const generateStaticUser = (userNumber) => {
  switch (userNumber) {
    case 0:
      return generateUser({
        id: 'DannyBoi1',
        image: 'https://images-na.ssl-images-amazon.com/images/I/51t29lLkg8L._AC_SL1000_.jpg',
        name: 'Dan',
      });
    case 1:
      return generateUser({
        id: 'GrantyBoi2',
        image: 'https://i.imgur.com/SLx06PP.png',
        name: 'Grant',
      });
    case 2:
      return generateUser({
        id: 'ViriBoi2',
        image: 'https://i.imgur.com/iNaC3K7.jpg',
        name: 'Vir',
      });
    default:
      return generateUser({
        id: 'NeiliBoi3',
        image: 'https://i.imgur.com/T68W8nR_d.webp?maxwidth=728&fidelity=grand',
        name: 'Neil',
      });
  }
};
