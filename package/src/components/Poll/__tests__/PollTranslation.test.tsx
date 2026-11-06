import React from 'react';

import { act, render, screen } from '@testing-library/react-native';
import dayjs from 'dayjs';
import { Poll, PollResponseData, PollVoteResponseData, StreamChat } from 'stream-chat';

import {
  ChatProvider,
  OwnCapabilitiesProvider,
  PollContextProvider,
  ThemeProvider,
  TranslationProvider,
} from '../../../contexts';
import { generateMessage } from '../../../mock-builders/generator/message';
import { PollAnswerListItem } from '../components/PollAnswersList';
import { PollAllOptionsContent, PollOption } from '../components/PollOption';
import { PollResultsContent } from '../components/PollResults/PollResults';
import { PollHeader } from '../Poll';

const POLL_ID = 'poll-id';

const pollResponse = {
  created_by: { id: 'other-user' },
  enforce_unique_vote: true,
  id: POLL_ID,
  latest_answers: [],
  latest_votes_by_option: {},
  name: 'Favourite colour?',
  name_i18n: { es_text: '¿Color favorito?', language: 'en' },
  options: [
    { id: 'option-red', text: 'Red', text_i18n: { es_text: 'Rojo', language: 'en' } },
    { id: 'option-blue', text: 'Blue' },
  ],
  vote_count: 0,
  vote_counts_by_option: {},
} as unknown as PollResponseData;

const answer = {
  answer_text: 'Green, actually',
  answer_text_i18n: { es_text: 'Verde, en realidad', language: 'en' },
  created_at: new Date('2026-10-27T10:00:00.000Z').getTime(),
  id: 'answer-id',
  is_answer: true,
  poll_id: POLL_ID,
  updated_at: new Date('2026-10-27T10:00:00.000Z').getTime(),
  user: { id: 'other-user', name: 'Other' },
} as unknown as PollVoteResponseData;

const setup = (userLanguage: string) => {
  const client = { user: { id: 'own-user' }, userID: 'own-user' } as unknown as StreamChat;
  const poll = new Poll({ client, poll: pollResponse });
  const [red, blue] = poll.data.options;

  render(
    <ThemeProvider>
      <ChatProvider value={{ client } as never}>
        <TranslationProvider
          value={{ t: (key: string) => key, tDateTimeParser: dayjs, userLanguage } as never}
        >
          <OwnCapabilitiesProvider value={{ castPollVote: true } as never}>
            <PollContextProvider value={{ message: generateMessage(), poll }}>
              <PollHeader />
              <PollOption option={red} />
              <PollOption option={blue} />
              <PollAnswerListItem answer={answer} />
            </PollContextProvider>
          </OwnCapabilitiesProvider>
        </TranslationProvider>
      </ChatProvider>
    </ThemeProvider>,
  );

  return { poll };
};

const renderDialogs = (userLanguage: string) => {
  const client = { user: { id: 'own-user' }, userID: 'own-user' } as unknown as StreamChat;
  const poll = new Poll({ client, poll: pollResponse });

  return render(
    <ThemeProvider>
      <ChatProvider value={{ client } as never}>
        <TranslationProvider value={{ t: (key: string) => key, userLanguage } as never}>
          <OwnCapabilitiesProvider value={{} as never}>
            <PollContextProvider value={{ message: generateMessage(), poll }}>
              <PollResultsContent />
              <PollAllOptionsContent />
            </PollContextProvider>
          </OwnCapabilitiesProvider>
        </TranslationProvider>
      </ChatProvider>
    </ThemeProvider>,
  );
};

describe('Poll translations', () => {
  it("renders the question, options and answers in the user's language", () => {
    setup('es');

    expect(screen.getByText('¿Color favorito?')).toBeTruthy();
    expect(screen.getByText('Rojo')).toBeTruthy();
    expect(screen.getByLabelText('Rojo')).toBeTruthy();
    expect(screen.getByText('Verde, en realidad')).toBeTruthy();
    expect(screen.queryByText('Favourite colour?')).toBeNull();
    expect(screen.queryByText('Red')).toBeNull();
  });

  it('falls back to the original text when a text has no translation', () => {
    setup('es');

    expect(screen.getByText('Blue')).toBeTruthy();
    expect(screen.getByLabelText('Blue')).toBeTruthy();
  });

  it("renders the original texts when nothing is translated into the user's language", () => {
    setup('de');

    expect(screen.getByText('Favourite colour?')).toBeTruthy();
    expect(screen.getByText('Red')).toBeTruthy();
    expect(screen.getByText('Blue')).toBeTruthy();
    expect(screen.getByText('Green, actually')).toBeTruthy();
  });

  it('shows a translation that arrives later through poll.updated', () => {
    const { poll } = setup('de');
    expect(screen.getByText('Favourite colour?')).toBeTruthy();

    act(() => {
      poll.handlePollUpdated({
        created_at: '2026-10-27T11:00:00.000Z',
        poll: {
          ...pollResponse,
          name_i18n: { de_text: 'Lieblingsfarbe?', language: 'en' },
        },
        type: 'poll.updated',
      } as never);
    });

    expect(screen.getByText('Lieblingsfarbe?')).toBeTruthy();
    expect(screen.queryByText('Favourite colour?')).toBeNull();
  });

  it('translates the question and options in the results and all-options dialogs', () => {
    renderDialogs('es');

    // Each dialog shows the question once and every option once.
    expect(screen.getAllByText('¿Color favorito?')).toHaveLength(2);
    expect(screen.getAllByText('Rojo')).toHaveLength(2);
    expect(screen.getAllByText('Blue')).toHaveLength(2);
    expect(screen.queryByText('Favourite colour?')).toBeNull();
  });
});
