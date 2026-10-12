import React, { PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { LocalMessage, ReactionResponse, StreamChat } from 'stream-chat';

import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateReaction } from '../../../../mock-builders/generator/reaction';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import {
  reconcileUpdatedReactionInList,
  removeReactionFromList,
  upsertReactionInList,
  useFetchReactions,
} from '../useFetchReactions';

const makeReaction = (
  params: Partial<ReactionResponse> & Pick<ReactionResponse, 'type' | 'user_id'>,
) =>
  ({
    type: params.type,
    user_id: params.user_id,
    user: params.user ?? { id: params.user_id, name: params.user_id },
  }) as ReactionResponse;

describe('useFetchReactions helpers', () => {
  it('upserts reactions in the unfiltered list without duplicating the same user/type pair', () => {
    const existing = makeReaction({ type: 'like', user_id: 'user-1' });
    const updated = makeReaction({ type: 'like', user_id: 'user-1' });

    const result = upsertReactionInList({
      prevReactions: [existing],
      reaction: updated,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(updated);
  });

  it('removes only the matching user/type pair in the unfiltered list', () => {
    const likeReaction = makeReaction({ type: 'like', user_id: 'user-1' });
    const loveReaction = makeReaction({ type: 'love', user_id: 'user-1' });

    const result = removeReactionFromList({
      prevReactions: [likeReaction, loveReaction],
      reaction: likeReaction,
    });

    expect(result).toEqual([loveReaction]);
  });

  it('removes the previous filtered reaction when an updated event moves that user to another type', () => {
    const existing = makeReaction({ type: 'like', user_id: 'user-1' });
    const updated = makeReaction({ type: 'love', user_id: 'user-1' });

    const result = reconcileUpdatedReactionInList({
      prevReactions: [existing],
      reaction: updated,
      reactionType: 'like',
    });

    expect(result).toEqual([]);
  });
});

describe('useFetchReactions', () => {
  let client: StreamChat;
  let queryReactions: jest.SpyInstance;
  const message = generateMessage({ id: 'message-1' }) as unknown as LocalMessage;
  const fetched = generateReaction({ message_id: 'message-1', type: 'like' });

  const wrapper = ({ children }: PropsWithChildren) =>
    React.createElement(ChatProvider, { value: { client } as never }, children);

  const renderUseFetchReactions = () =>
    renderHook((props: { message: LocalMessage }) => useFetchReactions(props), {
      initialProps: { message },
      wrapper,
    });

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
    queryReactions = jest
      .spyOn(client, 'queryReactionsAndHydrate')
      .mockResolvedValue({ duration: '1ms', reactions: [fetched] } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('queries through the offline-hydrating client method', async () => {
    const { result } = renderUseFetchReactions();

    await waitFor(() => expect(result.current.reactions).toEqual([fetched]));
    expect(queryReactions).toHaveBeenCalledWith({ id: 'message-1' }, expect.anything());
  });

  it('applies reaction events for its own message only', async () => {
    const { result } = renderUseFetchReactions();
    await waitFor(() => expect(result.current.reactions).toEqual([fetched]));

    const otherMessageReaction = generateReaction({ message_id: 'message-2', type: 'love' });
    const ownMessageReaction = generateReaction({ message_id: 'message-1', type: 'love' });

    act(() => {
      client.dispatchEvent({ reaction: otherMessageReaction, type: 'reaction.new' } as never);
    });
    expect(result.current.reactions).toEqual([fetched]);

    act(() => {
      client.dispatchEvent({ reaction: ownMessageReaction, type: 'reaction.new' } as never);
    });
    expect(result.current.reactions).toEqual([ownMessageReaction, fetched]);

    act(() => {
      client.dispatchEvent({
        reaction: { ...fetched, message_id: 'message-2' },
        type: 'reaction.deleted',
      } as never);
    });
    expect(result.current.reactions).toEqual([ownMessageReaction, fetched]);
  });

  it('applies offline reactions queried for its own message only', async () => {
    const { result } = renderUseFetchReactions();
    await waitFor(() => expect(result.current.reactions).toEqual([fetched]));

    const otherMessageReaction = generateReaction({ message_id: 'message-2', type: 'love' });
    const ownMessageReaction = generateReaction({ message_id: 'message-1', type: 'love' });

    act(() => {
      client.dispatchEvent({
        offlineReactions: [otherMessageReaction],
        type: 'offline_reactions.queried',
      });
    });
    expect(result.current.reactions).toEqual([fetched]);

    act(() => {
      client.dispatchEvent({
        offlineReactions: [ownMessageReaction],
        type: 'offline_reactions.queried',
      });
    });
    expect(result.current.reactions).toEqual([ownMessageReaction]);
  });

  it('does not refetch when the message object changes', async () => {
    const { rerender, result } = renderUseFetchReactions();
    await waitFor(() => expect(result.current.reactions).toEqual([fetched]));

    rerender({ message: { ...message, reaction_groups: { like: { count: 2 } } } as never });
    await act(async () => {
      await Promise.resolve();
    });

    expect(queryReactions).toHaveBeenCalledTimes(1);
    expect(result.current.reactions).toEqual([fetched]);
  });
});
