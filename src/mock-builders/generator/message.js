import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { generateUser } from './user';

export const generateMessage = (options = {}) => {
  const timestamp =
    options.timestamp || new Date(new Date().getTime() - Math.floor(Math.random() * 100000));

  return {
    attachments: [],
    created_at: timestamp.toString(),
    html: '<p>regular</p>',
    id: uuidv4(),
    text: uuidv4(),
    type: 'regular',
    updated_at: timestamp.toString(),
    user: generateUser(),
    ...options,
  };
};

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';
export const generateStaticMessage = (seed, options, date) =>
  generateMessage({
    created_at: date || '2020-04-27T13:39:49.331742Z',
    id: uuidv5(seed, StreamReactNativeNamespace),
    text: seed,
    updated_at: date || '2020-04-27T13:39:49.331742Z',
    ...options,
  });
