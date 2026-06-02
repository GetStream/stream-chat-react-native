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

type AccessibilityAction = NonNullable<AccessibilityProps['accessibilityActions']>[number];
type OnAccessibilityAction = NonNullable<AccessibilityProps['onAccessibilityAction']>;

type PollA11yActionsSelectorResult = {
  allowAnswers: boolean | undefined;
  allowUserSuggestedOptions: boolean | undefined;
  answersCount: number;
  createdBy: UserResponse | null;
  isClosed: boolean | undefined;
  options: PollOption[];
};

const a11yActionsSelector = (state: PollState): PollA11yActionsSelectorResult => ({
  allowAnswers: state.allow_answers,
  allowUserSuggestedOptions: state.allow_user_suggested_options,
  answersCount: state.answers_count,
  createdBy: state.created_by,
  isClosed: state.is_closed,
  options: state.options,
});

export type UsePollAccessibilityActionsResult = {
  accessibilityActions: readonly AccessibilityAction[] | undefined;
  onAccessibilityAction: OnAccessibilityAction | undefined;
};

type ActionKind =
  | { type: 'addComment' }
  | { type: 'endVote' }
  | { type: 'showAllComments' }
  | { type: 'showAllOptions' }
  | { type: 'suggestOption' }
  | { type: 'viewResults' }
  | { type: 'vote'; optionId: string };

/**
 * Returns the `accessibilityActions` array and `onAccessibilityAction` handler
 * for the poll composite container. Action set is gated by poll state +
 * capabilities so each rotor entry corresponds to an interaction the user is
 * actually allowed to perform. Returns `undefined`s when a11y is disabled.
 *
 * NOTE: We set both `name` and `label` to the same human-readable string on
 * every action. iOS Fabric (new architecture, on by default in RN 0.81+) uses
 * `accessibilityAction.name` as the string VoiceOver reads — `label` is
 * ignored on that path (RCTViewComponentView.mm). iOS legacy (Paper) and
 * Android both read `label`. Using the same value for both fields means the
 * announcement is human-readable on every platform/architecture. Dispatch
 * uses the action name as the lookup key into an internal kind map, so the
 * raw strings never need to be exposed to consumers.
 */
export const usePollAccessibilityActions = (): UsePollAccessibilityActionsResult => {
  const { enabled } = useAccessibilityContext();
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { castPollVote } = useOwnCapabilitiesContext();
  const { allowAnswers, allowUserSuggestedOptions, answersCount, createdBy, isClosed, options } =
    usePollStateStore(a11yActionsSelector);
  const { openAddComment, openAllComments, openAllOptions, openSuggestOption, openViewResults } =
    usePollUIStateContext();
  const toggleVote = usePollVoteToggle();
  const endVote = useEndVote();

  const canVote = !isClosed && !!castPollVote;
  const canEnd = !isClosed && createdBy?.id === client.userID;
  const canComment = !isClosed && !!allowAnswers;
  const canSuggest = !isClosed && !!allowUserSuggestedOptions;
  const hasMoreOptions = !!options && options.length > defaultPollOptionCount;
  const hasComments = answersCount > 0;

  const { accessibilityActions, actionKindByName } = useMemo<{
    accessibilityActions: readonly AccessibilityAction[] | undefined;
    actionKindByName: Map<string, ActionKind> | undefined;
  }>(() => {
    if (!enabled) {
      return { accessibilityActions: undefined, actionKindByName: undefined };
    }

    const actions: AccessibilityAction[] = [];
    const kindByName = new Map<string, ActionKind>();

    const push = (name: string, kind: ActionKind) => {
      actions.push({ label: name, name });
      kindByName.set(name, kind);
    };

    push(t('View Results'), { type: 'viewResults' });

    if (canVote && options) {
      for (const option of options.slice(0, defaultPollOptionCount)) {
        push(t('a11y/Vote on {{option}}', { option: option.text }), {
          optionId: option.id,
          type: 'vote',
        });
      }
    }

    if (hasMoreOptions) {
      push(t('a11y/Show all options'), { type: 'showAllOptions' });
    }

    if (canEnd) {
      push(t('a11y/End vote'), { type: 'endVote' });
    }

    if (canComment) {
      push(t('Add a comment'), { type: 'addComment' });
    }

    if (canSuggest) {
      push(t('Suggest an option'), { type: 'suggestOption' });
    }

    if (hasComments) {
      push(t('View {{count}} comments', { count: answersCount }), { type: 'showAllComments' });
    }

    return { accessibilityActions: actions, actionKindByName: kindByName };
  }, [
    answersCount,
    canComment,
    canEnd,
    canSuggest,
    canVote,
    enabled,
    hasComments,
    hasMoreOptions,
    options,
    t,
  ]);

  const onAccessibilityAction = useStableCallback((event: AccessibilityActionEvent) => {
    const kind = actionKindByName?.get(event.nativeEvent.actionName);
    if (!kind) return;

    switch (kind.type) {
      case 'viewResults':
        openViewResults();
        return;
      case 'showAllOptions':
        openAllOptions();
        return;
      case 'endVote':
        void endVote();
        return;
      case 'addComment':
        openAddComment();
        return;
      case 'suggestOption':
        openSuggestOption();
        return;
      case 'showAllComments':
        openAllComments();
        return;
      case 'vote':
        void toggleVote(kind.optionId);
        return;
      default:
        return;
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
