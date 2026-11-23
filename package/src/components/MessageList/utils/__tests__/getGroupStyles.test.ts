import { msToNs } from 'stream-chat';
import type { LocalMessage } from 'stream-chat';

import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getGroupStyle } from '../getGroupStyles';

describe('getGroupStyle with played messages', () => {
  const user = generateUser({ id: 'me' });
  const played = { played: { count: 1, latest_by: [{ created_at: msToNs(1), user_id: 'other' }] } };
  // Drop the generator's `message_text_updated_at`, which reads as edited.
  const [first, second, third] = [1, 2, 3].map(
    (n) =>
      generateMessage({
        created_at: msToNs(n),
        id: `m${n}`,
        message_text_updated_at: undefined,
        user,
      }) as LocalMessage,
  );

  it('groups consecutive messages that are not played', () => {
    expect(getGroupStyle({ message: second, nextMessage: third, previousMessage: first })).toEqual([
      'middle',
    ]);
  });

  it('ends the group at a played message, so it gets a footer', () => {
    expect(
      getGroupStyle({
        message: { ...second, mark_groups: played },
        nextMessage: third,
        previousMessage: first,
      }),
    ).toEqual(['bottom']);
  });

  it('starts a new group after a played message', () => {
    expect(
      getGroupStyle({
        message: third,
        previousMessage: { ...second, mark_groups: played },
      }),
    ).toEqual(['single']);
  });
});
