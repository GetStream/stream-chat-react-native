import React from 'react';

import type { AccessibilityActionEvent } from 'react-native';

import { renderHook, act } from '@testing-library/react-native';

import { AccessibilityProvider } from '../../../../contexts/accessibilityContext/AccessibilityContext';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import {
  POLL_ADD_COMMENT_ACTION_NAME,
  POLL_END_VOTE_ACTION_NAME,
  POLL_SHOW_ALL_OPTIONS_ACTION_NAME,
  POLL_SUGGEST_OPTION_ACTION_NAME,
  POLL_VIEW_RESULTS_ACTION_NAME,
  POLL_VOTE_OPTION_ACTION_PREFIX,
  usePollAccessibilityActions,
} from '../usePollAccessibilityActions';

const mockOpenAddComment = jest.fn();
const mockOpenAllOptions = jest.fn();
const mockOpenSuggestOption = jest.fn();
const mockOpenViewResults = jest.fn();
const mockEndVote = jest.fn();
const mockToggleVote = jest.fn();

jest.mock('../../contexts/PollUIStateContext', () => ({
  usePollUIStateContext: () => ({
    openAddComment: mockOpenAddComment,
    openAllOptions: mockOpenAllOptions,
    openSuggestOption: mockOpenSuggestOption,
    openViewResults: mockOpenViewResults,
  }),
}));

jest.mock('../usePollStateStore', () => ({
  usePollStateStore: (selector: (state: unknown) => unknown) => selector(mockPollState),
}));

jest.mock('../useEndVote', () => ({
  useEndVote: () => mockEndVote,
}));

jest.mock('../usePollVoteToggle', () => ({
  usePollVoteToggle: () => mockToggleVote,
}));

const mockChatContext = { client: { userID: 'me' } };
const mockOwnCapabilities = { castPollVote: true };

jest.mock('../../../../contexts', () => {
  const actual = jest.requireActual('../../../../contexts');
  return {
    ...actual,
    useChatContext: () => mockChatContext,
    useOwnCapabilitiesContext: () => mockOwnCapabilities,
  };
});

let mockPollState: Record<string, unknown> = {};

const setPollState = (state: Record<string, unknown>) => {
  mockPollState = state;
};

const setCastPollVote = (allowed: boolean) => {
  mockOwnCapabilities.castPollVote = allowed;
};

const setUserID = (id: string) => {
  mockChatContext.client.userID = id;
};

const t = (key: string, vars?: Record<string, unknown>) => {
  if (!vars) return key;
  if (key === 'a11y/Vote on {{option}}') return `Vote on ${vars.option}`;
  return key;
};

const wrapper =
  (enabled: boolean) =>
  ({ children }: { children: React.ReactNode }) => (
    <AccessibilityProvider value={{ enabled }}>
      <TranslationProvider
        value={
          {
            t,
            tDateTimeParser: () => null,
          } as never
        }
      >
        {children}
      </TranslationProvider>
    </AccessibilityProvider>
  );

const buildOption = (id: string, text: string) => ({ id, text });

const fireAction = (
  handler: ((event: AccessibilityActionEvent) => void) | undefined,
  actionName: string,
) => {
  handler?.({ nativeEvent: { actionName } } as AccessibilityActionEvent);
};

beforeEach(() => {
  mockOpenAddComment.mockClear();
  mockOpenAllOptions.mockClear();
  mockOpenSuggestOption.mockClear();
  mockOpenViewResults.mockClear();
  mockEndVote.mockClear();
  mockToggleVote.mockClear();
  setCastPollVote(true);
  setUserID('me');
});

describe('usePollAccessibilityActions', () => {
  it('returns undefined when accessibility is disabled', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'A')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(false),
    });

    expect(result.current.accessibilityActions).toBeUndefined();
    expect(result.current.onAccessibilityAction).toBeUndefined();
  });

  it('exposes only View Results for an ended poll', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: true,
      options: [buildOption('o1', 'A'), buildOption('o2', 'B')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const names = result.current.accessibilityActions?.map((a) => a.name);
    expect(names).toEqual([POLL_VIEW_RESULTS_ACTION_NAME]);
  });

  it('exposes vote actions per visible option, End vote for creator, comment and suggest when allowed', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'A'), buildOption('o2', 'B')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const names = result.current.accessibilityActions?.map((a) => a.name);
    expect(names).toEqual([
      POLL_VIEW_RESULTS_ACTION_NAME,
      `${POLL_VOTE_OPTION_ACTION_PREFIX}o1`,
      `${POLL_VOTE_OPTION_ACTION_PREFIX}o2`,
      POLL_END_VOTE_ACTION_NAME,
      POLL_ADD_COMMENT_ACTION_NAME,
      POLL_SUGGEST_OPTION_ACTION_NAME,
    ]);
  });

  it('omits End vote when the current user is not the creator', () => {
    setUserID('someone-else');
    setPollState({
      allow_answers: false,
      allow_user_suggested_options: false,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'A')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const names = result.current.accessibilityActions?.map((a) => a.name);
    expect(names).not.toContain(POLL_END_VOTE_ACTION_NAME);
    expect(names).not.toContain(POLL_ADD_COMMENT_ACTION_NAME);
    expect(names).not.toContain(POLL_SUGGEST_OPTION_ACTION_NAME);
    expect(names).toContain(`${POLL_VOTE_OPTION_ACTION_PREFIX}o1`);
  });

  it('omits vote actions when the user lacks castPollVote capability', () => {
    setCastPollVote(false);
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: false,
      created_by: { id: 'somebody' },
      is_closed: false,
      options: [buildOption('o1', 'A')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const names = result.current.accessibilityActions?.map((a) => a.name);
    expect(names?.some((n) => n.startsWith(POLL_VOTE_OPTION_ACTION_PREFIX))).toBe(false);
  });

  it('exposes Show all options when options exceed the visible cap', () => {
    const manyOptions = Array.from({ length: 12 }, (_, i) => buildOption(`o${i}`, `Option ${i}`));
    setPollState({
      allow_answers: false,
      allow_user_suggested_options: false,
      created_by: { id: 'somebody' },
      is_closed: true,
      options: manyOptions,
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const names = result.current.accessibilityActions?.map((a) => a.name);
    expect(names).toContain(POLL_SHOW_ALL_OPTIONS_ACTION_NAME);
  });

  it('routes each action to the right side effect', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'A'), buildOption('o2', 'B')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    act(() => {
      fireAction(result.current.onAccessibilityAction, POLL_VIEW_RESULTS_ACTION_NAME);
    });
    expect(mockOpenViewResults).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, POLL_SHOW_ALL_OPTIONS_ACTION_NAME);
    });
    expect(mockOpenAllOptions).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, POLL_END_VOTE_ACTION_NAME);
    });
    expect(mockEndVote).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, POLL_ADD_COMMENT_ACTION_NAME);
    });
    expect(mockOpenAddComment).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, POLL_SUGGEST_OPTION_ACTION_NAME);
    });
    expect(mockOpenSuggestOption).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, `${POLL_VOTE_OPTION_ACTION_PREFIX}o2`);
    });
    expect(mockToggleVote).toHaveBeenCalledWith('o2');
  });
});
