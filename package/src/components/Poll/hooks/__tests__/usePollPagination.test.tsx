import React, { PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { PollVoteResponseData, StreamChat } from 'stream-chat';

import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { PollContextProvider } from '../../../../contexts/pollContext/pollContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { usePollAnswersPagination } from '../usePollAnswersPagination';
import { usePollOptionVotesPagination } from '../usePollOptionVotesPagination';

const answer = (id: string) =>
  ({ answer_text: id, id, is_answer: true, poll_id: 'poll-1' }) as unknown as PollVoteResponseData;
const vote = (id: string) =>
  ({ id, option_id: 'option-1', poll_id: 'poll-1' }) as unknown as PollVoteResponseData;

describe('poll pagination hooks', () => {
  let client: StreamChat;
  const emptyPage = { next: undefined, votes: [] };
  const poll = {
    id: 'poll-1',
    queryAnswers: jest.fn(() => Promise.resolve(emptyPage)),
    queryOptionVotes: jest.fn(() => Promise.resolve(emptyPage)),
  };

  const wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>
      <PollContextProvider value={{ message: generateMessage(), poll: poll as never }}>
        {children}
      </PollContextProvider>
    </ChatProvider>
  );

  const castInOneBatch = (votes: PollVoteResponseData[]) =>
    act(() => {
      votes.forEach((pollVote) =>
        client.dispatchEvent({
          poll: { id: 'poll-1' },
          poll_vote: pollVote,
          type: 'poll.vote_casted',
        } as never),
      );
    });

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
  });

  it('keeps every answer cast in the same batch', async () => {
    const { result } = renderHook(() => usePollAnswersPagination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    castInOneBatch([answer('a1'), answer('a2')]);

    expect(result.current.pollAnswers.map(({ id }) => id)).toEqual(['a2', 'a1']);
  });

  it('keeps every option vote cast in the same batch', async () => {
    const { result } = renderHook(
      () => usePollOptionVotesPagination({ option: { id: 'option-1', text: 'One' } as never }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    castInOneBatch([vote('v1'), vote('v2')]);

    expect(result.current.votes.map(({ id }) => id)).toEqual(['v2', 'v1']);
  });
});
