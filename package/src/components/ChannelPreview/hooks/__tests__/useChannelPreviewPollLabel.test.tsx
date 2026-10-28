import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import { Poll, PollResponse, PollVote, StreamChat } from 'stream-chat';

import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { useChannelPreviewPollLabel } from '../useChannelPreviewPollLabel';

const OWN_USER = { id: 'own-user' };
const MESSAGE_ID = 'message-id';
const POLL_ID = 'poll-id';

const generateVote = (id: string, optionId: string, createdAt: string): PollVote => ({
  created_at: createdAt,
  id,
  option_id: optionId,
  poll_id: POLL_ID,
  updated_at: createdAt,
  user: OWN_USER,
  user_id: OWN_USER.id,
});

const setup = (ownVotes: PollVote[]) => {
  const client = {
    removePollVote: jest.fn(() => new Promise(() => {})),
    user: OWN_USER,
    userID: OWN_USER.id,
  } as unknown as StreamChat;
  const latestVotesByOption: Record<string, PollVote[]> = {};
  const voteCountsByOption: Record<string, number> = {};
  ownVotes.forEach((vote) => {
    latestVotesByOption[vote.option_id as string] = [vote];
    voteCountsByOption[vote.option_id as string] = 1;
  });
  const poll = new Poll({
    client,
    poll: {
      enforce_unique_vote: false,
      id: POLL_ID,
      latest_answers: [],
      latest_votes_by_option: latestVotesByOption,
      name: 'Poll',
      options: [
        { id: 'option-a', text: 'A' },
        { id: 'option-b', text: 'B' },
      ],
      own_votes: ownVotes,
      vote_count: ownVotes.length,
      vote_counts_by_option: voteCountsByOption,
    } as unknown as PollResponse,
  });
  (client as unknown as { polls: unknown }).polls = { fromState: () => poll };

  const wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>{children}</ChatProvider>
  );
  const hook = renderHook(() => useChannelPreviewPollLabel({ pollId: POLL_ID }), { wrapper });
  return { ...hook, poll };
};

describe('useChannelPreviewPollLabel', () => {
  it('returns no label once the only vote is removed', () => {
    const vote = generateVote('vote-a', 'option-a', '2026-10-27T10:00:00.000Z');
    const { poll, result } = setup([vote]);
    expect(result.current).toBe('You voted: {{ option }}');

    act(() => {
      poll.removeVote(vote.id, MESSAGE_ID);
    });

    expect(result.current).toBeUndefined();
  });

  it('labels the remaining latest vote once another option loses its only vote', () => {
    const voteA = generateVote('vote-a', 'option-a', '2026-10-27T10:00:00.000Z');
    const voteB = generateVote('vote-b', 'option-b', '2026-10-27T09:00:00.000Z');
    const { poll, result } = setup([voteA, voteB]);

    act(() => {
      poll.removeVote(voteA.id, MESSAGE_ID);
    });

    expect(poll.data.latest_votes_by_option['option-a']).toBeUndefined();
    expect(result.current).toBe('You voted: {{ option }}');
  });
});
