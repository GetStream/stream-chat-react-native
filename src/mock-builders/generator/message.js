import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { generateUser } from './user';

export const generateMessage = (options) => ({
  id: uuidv4(),
  text: uuidv4(),
  type: 'regular',
  html: '<p>regular</p>',
  attachments: [],
  created_at: new Date().toString(),
  updated_at: new Date().toString(),
  user: generateUser(),
  ...options,
});

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';
export const generateStaticMessage = (seed, options, date) =>
  generateMessage({
    id: uuidv5(seed, StreamReactNativeNamespace),
    text: seed,
    created_at: date || '2020-04-27T13:39:49.331742Z',
    updated_at: date || '2020-04-27T13:39:49.331742Z',
    ...options,
  });
