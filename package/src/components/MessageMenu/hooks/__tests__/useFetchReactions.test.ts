import { ReactionResponse } from 'stream-chat';

import {
  reconcileUpdatedReactionInList,
  removeReactionFromList,
  upsertReactionInList,
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
