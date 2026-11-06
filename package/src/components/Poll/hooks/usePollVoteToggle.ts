import { PollState } from 'stream-chat';

import { usePollStateStore } from './usePollStateStore';

import { usePollContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';
import { useNotificationApi } from '../../Notifications';

const ownVotesSelector = (state: PollState) => ({
  ownVotesByOptionId: state.ownVotesByOptionId,
});

/**
 * Returns a stable callback that toggles the current user's vote on an option, by option ID: it
 * removes the vote if one exists and casts it otherwise. Shared by the vote button and its
 * accessibility action.
 *
 * @returns An async callback taking the option ID.
 */
export const usePollVoteToggle = () => {
  const { message, poll } = usePollContext();
  const { runWithNotificationTarget } = useNotificationApi();
  const { ownVotesByOptionId } = usePollStateStore(ownVotesSelector);

  return useStableCallback(async (optionId: string) => {
    await runWithNotificationTarget(async () => {
      const existingVoteId = ownVotesByOptionId[optionId]?.id;
      if (existingVoteId) {
        await poll.removeVote(existingVoteId, message.id);
      } else {
        await poll.castVote(optionId, message.id);
      }
    });
  });
};
