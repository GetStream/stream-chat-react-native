import { fromPartial } from '@total-typescript/shoehorn';
import type { LocalMessage } from 'stream-chat';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { convertDateToTimestamp } from './time';
import { generateUser } from './user';

type GenerateMessageOptions = Partial<LocalMessage> & {
  timestamp?: Date | number | string;
};

/** The message fields the API sends as unix-nanosecond numbers. */
const TIMESTAMP_FIELDS = [
  'created_at',
  'updated_at',
  'deleted_at',
  'pinned_at',
  'pin_expires',
  'message_text_updated_at',
] as const;

// Returns a `LocalMessage`-shaped mock. Every timestamp is the unix-nanosecond number the API puts
// on the wire, because that is what the SDK now consumes — a mock carrying `Date` objects cannot
// catch the bugs that unit exists to prevent. Overrides may still be written as date literals; they
// are normalized below.
export const generateMessage = (options: GenerateMessageOptions = {}): LocalMessage => {
  const timestamp = convertDateToTimestamp(
    options.timestamp ?? new Date(Date.now() - Math.floor(Math.random() * 100000)),
  );

  const message = fromPartial<LocalMessage>({
    attachments: [],
    created_at: timestamp,
    deleted_at: undefined,
    html: '<p>regular</p>',
    id: uuidv4(),
    message_text_updated_at: timestamp,
    pinned_at: undefined,
    status: 'received',
    text: uuidv4(),
    type: 'regular',
    updated_at: timestamp,
    user: generateUser(),
    ...options,
  });

  for (const field of TIMESTAMP_FIELDS) {
    const value = (message as unknown as Record<string, unknown>)[field];
    if (value != null && typeof value !== 'number') {
      (message as unknown as Record<string, unknown>)[field] = convertDateToTimestamp(
        value as Date | number | string,
      );
    }
  }

  return message;
};

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';
export const generateStaticMessage = (
  seed: string,
  options?: GenerateMessageOptions,
  date?: string | Date,
): LocalMessage => {
  const staticDate = convertDateToTimestamp(date ?? '2020-04-27T13:39:49.331742Z');
  return generateMessage({
    created_at: staticDate,
    id: uuidv5(seed, StreamReactNativeNamespace),
    message_text_updated_at: staticDate,
    text: seed,
    updated_at: staticDate,
    ...options,
  });
};
