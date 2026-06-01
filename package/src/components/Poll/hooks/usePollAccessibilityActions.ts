import { useMemo } from 'react';

import type { AccessibilityActionEvent, AccessibilityProps } from 'react-native';

import { PollOption, PollState, UserResponse } from 'stream-chat';

import { useEndVote } from './useEndVote';

import { usePollStateStore } from './usePollStateStore';

import { usePollVoteToggle } from './usePollVoteToggle';

import {
  useChatContext,
  useOwnCapabilitiesContext,
  useTranslationContext,
} from '../../../contexts';
import { useAccessibilityContext } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { useStableCallback } from '../../../hooks';
import { defaultPollOptionCount } from '../../../utils/constants';
import { usePollUIStateContext } from '../contexts/PollUIStateContext';

export const POLL_VIEW_RESULTS_ACTION_NAME = 'streamPollViewResults';
export const POLL_VOTE_OPTION_ACTION_PREFIX = 'streamPollVoteOption_';
export const POLL_SHOW_ALL_OPTIONS_ACTION_NAME = 'streamPollShowAllOptions';
export const POLL_END_VOTE_ACTION_NAME = 'streamPollEndVote';
export const POLL_ADD_COMMENT_ACTION_NAME = 'streamPollAddComment';
export const POLL_SUGGEST_OPTION_ACTION_NAME = 'streamPollSuggestOption';

type AccessibilityAction = NonNullable<AccessibilityProps['accessibilityActions']>[number];
type OnAccessibilityAction = NonNullable<AccessibilityProps['onAccessibilityAction']>;

type PollA11yActionsSelectorResult = {
  allowAnswers: boolean | undefined;
  allowUserSuggestedOptions: boolean | undefined;
  createdBy: UserResponse | null;
  isClosed: boolean | undefined;
  options: PollOption[];
};

const a11yActionsSelector = (state: PollState): PollA11yActionsSelectorResult => ({
  allowAnswers: state.allow_answers,
  allowUserSuggestedOptions: state.allow_user_suggested_options,
  createdBy: state.created_by,
  isClosed: state.is_closed,
  options: state.options,
});

export type UsePollAccessibilityActionsResult = {
  accessibilityActions: readonly AccessibilityAction[] | undefined;
  onAccessibilityAction: OnAccessibilityAction | undefined;
};

/**
 * Returns the `accessibilityActions` array and `onAccessibilityAction` handler
 * for the poll composite container. Action set is gated by poll state +
 * capabilities so each rotor entry corresponds to an interaction the user is
 * actually allowed to perform. Returns `undefined`s when a11y is disabled.
 */
export const usePollAccessibilityActions = (): UsePollAccessibilityActionsResult => {
  const { enabled } = useAccessibilityContext();
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { castPollVote } = useOwnCapabilitiesContext();
  const { allowAnswers, allowUserSuggestedOptions, createdBy, isClosed, options } =
    usePollStateStore(a11yActionsSelector);
  const { openAddComment, openAllOptions, openSuggestOption, openViewResults } =
    usePollUIStateContext();
  const toggleVote = usePollVoteToggle();
  const endVote = useEndVote();

  const canVote = !isClosed && !!castPollVote;
  const canEnd = !isClosed && createdBy?.id === client.userID;
  const canComment = !isClosed && !!allowAnswers;
  const canSuggest = !isClosed && !!allowUserSuggestedOptions;
  const hasMoreOptions = !!options && options.length > defaultPollOptionCount;

  const accessibilityActions = useMemo<readonly AccessibilityAction[] | undefined>(() => {
    if (!enabled) return undefined;

    const actions: AccessibilityAction[] = [
      { label: t('View Results'), name: POLL_VIEW_RESULTS_ACTION_NAME },
    ];

    if (canVote && options) {
      for (const option of options.slice(0, defaultPollOptionCount)) {
        actions.push({
          label: t('a11y/Vote on {{option}}', { option: option.text }),
          name: `${POLL_VOTE_OPTION_ACTION_PREFIX}${option.id}`,
        });
      }
    }

    if (hasMoreOptions) {
      actions.push({
        label: t('a11y/Show all options'),
        name: POLL_SHOW_ALL_OPTIONS_ACTION_NAME,
      });
    }

    if (canEnd) {
      actions.push({ label: t('a11y/End vote'), name: POLL_END_VOTE_ACTION_NAME });
    }

    if (canComment) {
      actions.push({ label: t('Add a comment'), name: POLL_ADD_COMMENT_ACTION_NAME });
    }

    if (canSuggest) {
      actions.push({ label: t('Suggest an option'), name: POLL_SUGGEST_OPTION_ACTION_NAME });
    }

    return actions;
  }, [canComment, canEnd, canSuggest, canVote, enabled, hasMoreOptions, options, t]);

  const onAccessibilityAction = useStableCallback((event: AccessibilityActionEvent) => {
    const { actionName } = event.nativeEvent;

    if (actionName === POLL_VIEW_RESULTS_ACTION_NAME) {
      openViewResults();
      return;
    }
    if (actionName === POLL_SHOW_ALL_OPTIONS_ACTION_NAME) {
      openAllOptions();
      return;
    }
    if (actionName === POLL_END_VOTE_ACTION_NAME) {
      void endVote();
      return;
    }
    if (actionName === POLL_ADD_COMMENT_ACTION_NAME) {
      openAddComment();
      return;
    }
    if (actionName === POLL_SUGGEST_OPTION_ACTION_NAME) {
      openSuggestOption();
      return;
    }
    if (actionName.startsWith(POLL_VOTE_OPTION_ACTION_PREFIX)) {
      const optionId = actionName.slice(POLL_VOTE_OPTION_ACTION_PREFIX.length);
      void toggleVote(optionId);
    }
  });

  return useMemo(
    () => ({
      accessibilityActions,
      onAccessibilityAction: enabled ? onAccessibilityAction : undefined,
    }),
    [accessibilityActions, enabled, onAccessibilityAction],
  );
};
