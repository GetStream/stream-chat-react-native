import { useMemo } from 'react';

import { PollOption, PollState } from 'stream-chat';

import { usePollStateStore } from './usePollStateStore';

import { composeAccessibilityLabel } from '../../../a11y/a11yUtils';
import { useTranslationContext } from '../../../contexts';
import { useAccessibilityContext } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { defaultPollOptionCount } from '../../../utils/constants';

type PollA11yLabelSelectorResult = {
  enforceUniqueVote: boolean;
  isClosed: boolean | undefined;
  maxVotesAllowed: number;
  name: string;
  options: PollOption[];
  voteCountsByOption: Record<string, number>;
};

const a11yLabelSelector = (state: PollState): PollA11yLabelSelectorResult => ({
  enforceUniqueVote: state.enforce_unique_vote,
  isClosed: state.is_closed,
  maxVotesAllowed: state.max_votes_allowed,
  name: state.name,
  options: state.options,
  voteCountsByOption: state.vote_counts_by_option,
});

/**
 * Builds the composite accessibility label for a poll bubble: name, status,
 * up to `defaultPollOptionCount` options with vote counts, an overflow hint,
 * and the primary-tap hint. Returns `undefined` when a11y is disabled so the
 * Poll container can leave its `accessibilityLabel` unset.
 */
export const usePollAccessibilityLabel = (): string | undefined => {
  const { enabled } = useAccessibilityContext();
  const { t } = useTranslationContext();
  const { enforceUniqueVote, isClosed, maxVotesAllowed, name, options, voteCountsByOption } =
    usePollStateStore(a11yLabelSelector);

  return useMemo(() => {
    if (!enabled) return undefined;

    let status: string;
    if (isClosed) {
      status = t('Poll has ended');
    } else if (enforceUniqueVote) {
      status = t('Select one');
    } else if (maxVotesAllowed) {
      status = t('Select up to {{count}}', { count: maxVotesAllowed });
    } else {
      status = t('Select one or more');
    }

    const visibleOptions = options?.slice(0, defaultPollOptionCount) ?? [];
    const optionParts = visibleOptions.map((option) => {
      const count = voteCountsByOption?.[option.id] ?? 0;
      return `${option.text}: ${t('{{count}} votes', { count })}`;
    });

    const overflow =
      options && options.length > defaultPollOptionCount
        ? t('+{{count}} More Options', { count: options.length - defaultPollOptionCount })
        : null;

    return composeAccessibilityLabel(
      name,
      status,
      ...optionParts,
      overflow,
      t('a11y/Activate to view results'),
    );
  }, [enabled, enforceUniqueVote, isClosed, maxVotesAllowed, name, options, t, voteCountsByOption]);
};
