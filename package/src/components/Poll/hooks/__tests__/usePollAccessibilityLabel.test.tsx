import React from 'react';

import { renderHook } from '@testing-library/react-native';

import { AccessibilityProvider } from '../../../../contexts/accessibilityContext/AccessibilityContext';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { usePollAccessibilityLabel } from '../usePollAccessibilityLabel';

jest.mock('../usePollStateStore', () => ({
  usePollStateStore: (selector: (state: unknown) => unknown) => selector(mockPollState),
}));

let mockPollState: Record<string, unknown> = {};

const setPollState = (state: Record<string, unknown>) => {
  mockPollState = state;
};

const t = (key: string, vars?: Record<string, unknown>) => {
  if (!vars) return key;
  if (key === '{{count}} votes') return `${vars.count} votes`;
  if (key === 'Select up to {{count}}') return `Select up to ${vars.count}`;
  if (key === '+{{count}} More Options') return `+${vars.count} More Options`;
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

describe('usePollAccessibilityLabel', () => {
  it('returns undefined when accessibility is disabled', () => {
    setPollState({
      enforce_unique_vote: false,
      is_closed: true,
      max_votes_allowed: 0,
      name: 'Lunch?',
      options: [buildOption('o1', 'Pizza')],
      vote_counts_by_option: { o1: 3 },
    });

    const { result } = renderHook(() => usePollAccessibilityLabel(), {
      wrapper: wrapper(false),
    });

    expect(result.current).toBeUndefined();
  });

  it('builds composite label for an ended poll', () => {
    setPollState({
      enforce_unique_vote: false,
      is_closed: true,
      max_votes_allowed: 0,
      name: 'Test',
      options: [buildOption('o1', 'Option 1'), buildOption('o2', 'Option 2')],
      vote_counts_by_option: { o1: 0, o2: 0 },
    });

    const { result } = renderHook(() => usePollAccessibilityLabel(), {
      wrapper: wrapper(true),
    });

    expect(result.current).toBe(
      'Test, Poll has ended, Option 1: 0 votes, Option 2: 0 votes, a11y/Activate to view results',
    );
  });

  it('uses "Select one" for an open enforce-unique-vote poll', () => {
    setPollState({
      enforce_unique_vote: true,
      is_closed: false,
      max_votes_allowed: 0,
      name: 'Pick a venue',
      options: [buildOption('o1', 'Cafe')],
      vote_counts_by_option: { o1: 2 },
    });

    const { result } = renderHook(() => usePollAccessibilityLabel(), {
      wrapper: wrapper(true),
    });

    expect(result.current).toBe(
      'Pick a venue, Select one, Cafe: 2 votes, a11y/Activate to view results',
    );
  });

  it('uses "Select up to N" when maxVotesAllowed is set', () => {
    setPollState({
      enforce_unique_vote: false,
      is_closed: false,
      max_votes_allowed: 3,
      name: 'Top picks',
      options: [buildOption('o1', 'A')],
      vote_counts_by_option: { o1: 1 },
    });

    const { result } = renderHook(() => usePollAccessibilityLabel(), {
      wrapper: wrapper(true),
    });

    expect(result.current).toBe(
      'Top picks, Select up to 3, A: 1 votes, a11y/Activate to view results',
    );
  });

  it('appends overflow hint when options exceed the visible cap', () => {
    const manyOptions = Array.from({ length: 12 }, (_, i) => buildOption(`o${i}`, `Option ${i}`));
    const counts = Object.fromEntries(manyOptions.map((o) => [o.id, 0]));

    setPollState({
      enforce_unique_vote: false,
      is_closed: false,
      max_votes_allowed: 0,
      name: 'Big poll',
      options: manyOptions,
      vote_counts_by_option: counts,
    });

    const { result } = renderHook(() => usePollAccessibilityLabel(), {
      wrapper: wrapper(true),
    });

    expect(result.current).toContain('+7 More Options');
    expect(result.current).toContain('Option 0: 0 votes');
    expect(result.current).not.toContain('Option 5:');
  });
});
