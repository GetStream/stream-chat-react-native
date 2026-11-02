import type { ChannelAPIResponse, PollResponse } from 'stream-chat';

import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { BetterSqlite } from '../../../test-utils/BetterSqlite';
import { SqliteClient } from '../../SqliteClient';
import { getChannels } from '../getChannels';
import { upsertChannels } from '../upsertChannels';
import { upsertPoll } from '../upsertPoll';

const POLL_ID = 'poll-id';

const translatedPoll = {
  answers_count: 0,
  created_at: '2026-10-27T10:00:00.000Z',
  created_by: { id: 'other-user' },
  created_by_id: 'other-user',
  description: 'For the team dinner',
  description_i18n: { es_text: 'Para la cena del equipo', language: 'en' },
  enforce_unique_vote: true,
  id: POLL_ID,
  latest_answers: [],
  latest_votes_by_option: {},
  max_votes_allowed: 1,
  name: 'Favourite colour?',
  name_i18n: { es_text: '¿Color favorito?', language: 'en' },
  options: [
    {
      id: 'option-red',
      poll_id: POLL_ID,
      text: 'Red',
      text_i18n: { es_text: 'Rojo', language: 'en' },
    },
  ],
  updated_at: '2026-10-27T10:00:00.000Z',
  vote_count: 0,
  vote_counts_by_option: {},
} as unknown as PollResponse;

/**
 * The backend translates poll texts. The offline DB has to keep those translations, so a cold start
 * offline shows the poll in the user's language, the same way message translations are kept.
 */
describe('poll translations in the offline DB', () => {
  let cid: string;

  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();

    const channelResponse = generateChannelResponse({ members: [], messages: [] });
    cid = channelResponse.channel.cid as string;
    channelResponse.messages = [
      generateMessage({ cid, poll: translatedPoll, poll_id: POLL_ID, text: '' }),
    ] as unknown as typeof channelResponse.messages;
    await upsertChannels({
      channels: [channelResponse] as unknown as ChannelAPIResponse[],
      isLatestMessagesSet: true,
    });
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
  });

  const getStoredPoll = async () => {
    const [channel] = await getChannels({ channelIds: [cid], currentUserId: 'some-user' });
    return channel.messages[0].poll;
  };

  it("keeps the question's, description's and options' translations", async () => {
    const poll = await getStoredPoll();

    expect(poll?.name_i18n).toEqual(translatedPoll.name_i18n);
    expect(poll?.description_i18n).toEqual(translatedPoll.description_i18n);
    expect(poll?.options[0].text_i18n).toEqual(translatedPoll.options[0].text_i18n);
  });

  it('replaces the translations when the poll is stored again', async () => {
    const name_i18n = { de_text: 'Lieblingsfarbe?', language: 'en' };
    await upsertPoll({ poll: { ...translatedPoll, name_i18n } as PollResponse });

    expect((await getStoredPoll())?.name_i18n).toEqual(name_i18n);
  });

  it('stores a poll without translations unchanged', async () => {
    const {
      description_i18n: _description_i18n,
      name_i18n: _name_i18n,
      ...untranslatedPoll
    } = translatedPoll;
    const untranslatedChannel = generateChannelResponse({ members: [], messages: [] });
    const untranslatedCid = untranslatedChannel.channel.cid as string;
    untranslatedChannel.messages = [
      generateMessage({
        cid: untranslatedCid,
        poll: {
          ...untranslatedPoll,
          id: 'untranslated-poll-id',
          options: [{ id: 'option-red', poll_id: 'untranslated-poll-id', text: 'Red' }],
        } as unknown as PollResponse,
        poll_id: 'untranslated-poll-id',
        text: '',
      }),
    ] as unknown as typeof untranslatedChannel.messages;
    await upsertChannels({
      channels: [untranslatedChannel] as unknown as ChannelAPIResponse[],
      isLatestMessagesSet: true,
    });

    const [channel] = await getChannels({
      channelIds: [untranslatedCid],
      currentUserId: 'some-user',
    });
    const poll = channel.messages[0].poll;

    expect(poll?.name).toBe('Favourite colour?');
    expect(poll?.description).toBe('For the team dinner');
    expect(poll?.options).toEqual([
      { id: 'option-red', poll_id: 'untranslated-poll-id', text: 'Red' },
    ]);
    expect(poll?.name_i18n).toBeUndefined();
    expect(poll?.description_i18n).toBeUndefined();
  });

  it('clears translations that the poll no longer has', async () => {
    await upsertPoll({
      poll: { ...translatedPoll, description_i18n: undefined, name_i18n: undefined },
    });

    const poll = await getStoredPoll();
    expect(poll?.name_i18n).toBeUndefined();
    expect(poll?.description_i18n).toBeUndefined();
  });
});
