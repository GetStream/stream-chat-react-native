import { fromPartial } from '@total-typescript/shoehorn';
import type { LocalMessage } from 'stream-chat';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { generateUser } from './user';

type GenerateMessageOptions = Partial<LocalMessage> & { timestamp?: Date };

// Returns a `LocalMessage`-shaped mock. Components across this SDK consume
// `LocalMessage` (with `Date` objects for `created_at`/`updated_at`/`pinned_at`/
// `deleted_at`), so the mock matches that shape. For tests that feed mock data
// into an API response where the server returns `MessageResponse` (strings for
// dates), cast at the call site — runtime values are the same either way.
export const generateMessage = (options: GenerateMessageOptions = {}): LocalMessage => {
  const timestamp =
    options.timestamp || new Date(new Date().getTime() - Math.floor(Math.random() * 100000));

  return fromPartial<LocalMessage>({
    attachments: [],
    created_at: timestamp,
    deleted_at: null,
    html: '<p>regular</p>',
    id: uuidv4(),
    message_text_updated_at: timestamp.toISOString(),
    pinned_at: null,
    status: 'received',
    text: uuidv4(),
    type: 'regular',
    updated_at: timestamp,
    user: generateUser(),
    ...options,
  });
};

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';
export const generateStaticMessage = (
  seed: string,
  options?: GenerateMessageOptions,
  date?: string | Date,
): LocalMessage => {
  const staticDate = date ? new Date(date) : new Date('2020-04-27T13:39:49.331742Z');
  return generateMessage({
    created_at: staticDate,
    id: uuidv5(seed, StreamReactNativeNamespace),
    message_text_updated_at: staticDate.toISOString(),
    text: seed,
    updated_at: staticDate,
    ...options,
  });
};
