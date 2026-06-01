import React from 'react';

import type { AccessibilityActionEvent } from 'react-native';

import { act, renderHook } from '@testing-library/react-native';

import { AccessibilityProvider } from '../../../../contexts/accessibilityContext/AccessibilityContext';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { usePollAccessibilityActions } from '../usePollAccessibilityActions';

const mockOpenAddComment = jest.fn();
const mockOpenAllComments = jest.fn();
const mockOpenAllOptions = jest.fn();
const mockOpenSuggestOption = jest.fn();
const mockOpenViewResults = jest.fn();
const mockEndVote = jest.fn();
const mockToggleVote = jest.fn();

jest.mock('../../contexts/PollUIStateContext', () => ({
  usePollUIStateContext: () => ({
    openAddComment: mockOpenAddComment,
    openAllComments: mockOpenAllComments,
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
  mockOpenAllComments.mockClear();
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

  it('every action uses the same human label for name and label', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'Pizza'), buildOption('o2', 'Pasta')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const actions = result.current.accessibilityActions;
    expect(actions).toBeDefined();
    for (const action of actions ?? []) {
      expect(action.name).toBe(action.label);
    }
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

    const labels = result.current.accessibilityActions?.map((a) => a.label);
    expect(labels).toEqual(['View Results']);
  });

  it('lists vote actions with the option text, plus End vote / Add comment / Suggest option for creator', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'Pizza'), buildOption('o2', 'Pasta')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const labels = result.current.accessibilityActions?.map((a) => a.label);
    expect(labels).toEqual([
      'View Results',
      'Vote on Pizza',
      'Vote on Pasta',
      'a11y/End vote',
      'Add a comment',
      'Suggest an option',
    ]);
  });

  it('omits End vote when the current user is not the creator', () => {
    setUserID('someone-else');
    setPollState({
      allow_answers: false,
      allow_user_suggested_options: false,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'Pizza')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const labels = result.current.accessibilityActions?.map((a) => a.label);
    expect(labels).toEqual(['View Results', 'Vote on Pizza']);
  });

  it('omits vote actions when the user lacks castPollVote capability', () => {
    setCastPollVote(false);
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: false,
      created_by: { id: 'somebody' },
      is_closed: false,
      options: [buildOption('o1', 'Pizza')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const labels = result.current.accessibilityActions?.map((a) => a.label);
    expect(labels?.some((l) => l?.startsWith('Vote on'))).toBe(false);
  });

  it('exposes "View N comments" when the poll has answers', () => {
    setPollState({
      allow_answers: false,
      allow_user_suggested_options: false,
      answers_count: 4,
      created_by: { id: 'somebody' },
      is_closed: true,
      options: [buildOption('o1', 'A')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const labels = result.current.accessibilityActions?.map((a) => a.label);
    expect(labels).toContain('View {{count}} comments');
  });

  it('omits "View N comments" when there are no answers', () => {
    setPollState({
      allow_answers: false,
      allow_user_suggested_options: false,
      answers_count: 0,
      created_by: { id: 'somebody' },
      is_closed: true,
      options: [buildOption('o1', 'A')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    const labels = result.current.accessibilityActions?.map((a) => a.label);
    expect(labels?.some((l) => l?.includes('comments'))).toBe(false);
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

    const labels = result.current.accessibilityActions?.map((a) => a.label);
    expect(labels).toContain('a11y/Show all options');
  });

  it('routes each action to the right side effect', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'Pizza'), buildOption('o2', 'Pasta')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    act(() => {
      fireAction(result.current.onAccessibilityAction, 'View Results');
    });
    expect(mockOpenViewResults).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, 'a11y/End vote');
    });
    expect(mockEndVote).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, 'Add a comment');
    });
    expect(mockOpenAddComment).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, 'Suggest an option');
    });
    expect(mockOpenSuggestOption).toHaveBeenCalledTimes(1);

    act(() => {
      fireAction(result.current.onAccessibilityAction, 'Vote on Pasta');
    });
    expect(mockToggleVote).toHaveBeenCalledWith('o2');
  });

  it('routes the "View N comments" action to openAllComments', () => {
    setPollState({
      allow_answers: false,
      allow_user_suggested_options: false,
      answers_count: 7,
      created_by: { id: 'somebody' },
      is_closed: true,
      options: [buildOption('o1', 'A')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    act(() => {
      fireAction(result.current.onAccessibilityAction, 'View {{count}} comments');
    });
    expect(mockOpenAllComments).toHaveBeenCalledTimes(1);
  });

  it('ignores unknown action names', () => {
    setPollState({
      allow_answers: true,
      allow_user_suggested_options: true,
      created_by: { id: 'me' },
      is_closed: false,
      options: [buildOption('o1', 'Pizza')],
    });

    const { result } = renderHook(() => usePollAccessibilityActions(), {
      wrapper: wrapper(true),
    });

    act(() => {
      fireAction(result.current.onAccessibilityAction, 'streamPollVoteOption_o1');
    });
    expect(mockToggleVote).not.toHaveBeenCalled();
    expect(mockOpenViewResults).not.toHaveBeenCalled();
  });
});
