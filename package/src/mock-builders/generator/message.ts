import { fromPartial } from '@total-typescript/shoehorn';
import type { MessageResponse } from 'stream-chat';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { generateUser } from './user';

type GenerateMessageOptions = Partial<MessageResponse> & { timestamp?: Date };

export const generateMessage = (options: GenerateMessageOptions = {}): MessageResponse => {
  const timestamp =
    options.timestamp || new Date(new Date().getTime() - Math.floor(Math.random() * 100000));

  // NOTE: `created_at` / `updated_at` on `MessageResponse` are typed as `string`,
  // but tests here treat the generated message as if it were a `LocalMessage`
  // (where those fields are `Date`). Keeping `Date` objects at runtime preserves
  // behavior of component code that calls e.g. `.toDateString()` on them.
  return fromPartial<MessageResponse>({
    attachments: [],
    created_at: timestamp as unknown as string,
    html: '<p>regular</p>',
    id: uuidv4(),
    message_text_updated_at: timestamp as unknown as string,
    text: uuidv4(),
    type: 'regular',
    updated_at: timestamp.toString(),
    user: generateUser(),
    ...options,
  });
};

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';
export const generateStaticMessage = (
  seed: string,
  options?: GenerateMessageOptions,
  date?: string,
): MessageResponse =>
  generateMessage({
    created_at: date || '2020-04-27T13:39:49.331742Z',
    id: uuidv5(seed, StreamReactNativeNamespace),
    message_text_updated_at: date || '2020-04-27T13:39:49.331742Z',
    text: seed,
    updated_at: date || '2020-04-27T13:39:49.331742Z',
    ...options,
  });
