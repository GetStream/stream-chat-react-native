import { PollState } from 'stream-chat';

import { usePollStateStore } from './usePollStateStore';

import { usePollContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';
import { useNotificationApi } from '../../Notifications';

const ownVotesSelector = (state: PollState) => ({
  ownVotesByOptionId: state.ownVotesByOptionId,
});

/**
 * Returns a stable callback that toggles the current user's vote on a poll option
 * by id: casts a vote if none exists, removes it if one does. Shared by the
 * visible vote button and the rotor accessibility action so both paths use
 * identical logic.
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
