import { useMemo } from 'react';

import { PollState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks/useStateStore';

export type UseChannelPreviewPollLabelProps = {
  pollId: string;
};

const selector = (nextValue: PollState) => ({
  latest_votes_by_option: nextValue.latest_votes_by_option,
  options: nextValue.options,
});

/**
 * Hook to get the label of the poll
 * @param pollId - The id of the poll
 * @returns The label of the poll
 */
export const useChannelPreviewPollLabel = ({ pollId }: UseChannelPreviewPollLabelProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const poll = client.polls.fromState(pollId);
  const pollState = useStateStore(poll?.state, selector) ?? ({} as PollState);
  const { latest_votes_by_option: latestVotesByOption, options: pollOptions } = pollState;

  const latestVotes = useMemo(
    () =>
      latestVotesByOption
        ? Object.values(latestVotesByOption)
            .map((votes) => votes?.[0])
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [],
    [latestVotesByOption],
  );

  return useMemo(() => {
    if (!(latestVotes && latestVotes.length && latestVotes[0].user)) return;
    {
      const option = pollOptions?.find((option) => option.id === latestVotes[0].option_id);
      const voteUser = latestVotes[0].user;
      if (voteUser.id === client.user?.id) {
        return t('You voted: {{ option }}', { option: option?.text });
      } else {
        return t('{{ user }} voted: {{ option }}', {
          user: voteUser.name || voteUser.id,
          option: option?.text,
        });
      }
    }
  }, [latestVotes, pollOptions, client.user?.id, t]);
};
