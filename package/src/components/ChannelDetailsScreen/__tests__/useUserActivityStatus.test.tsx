import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';
import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { UserResponse } from 'stream-chat';

import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { useUserActivityStatus } from '../hooks/useUserActivityStatus';

Dayjs.extend(relativeTime);

const wrapper = ({ children }: PropsWithChildren) => (
  <TranslationProvider
    value={{
      t: ((key: string, options?: Record<string, unknown>) => {
        if (options && 'relativeTime' in options) {
          return `${key.replace('{{relativeTime}}', String(options.relativeTime))}`;
        }
        return key;
      }) as never,
      tDateTimeParser: (input) => Dayjs(input),
      userLanguage: 'en',
    }}
  >
    {children}
  </TranslationProvider>
);

const userFor = (overrides: Partial<UserResponse> = {}): UserResponse =>
  ({ id: 'u-1', ...overrides }) as UserResponse;

describe('useUserActivityStatus', () => {
  it('returns "Online" when the user is online', () => {
    const { result } = renderHook(() => useUserActivityStatus(userFor({ online: true })), {
      wrapper,
    });
    expect(result.current).toBe('Online');
  });

  it('returns "Offline" when the user is offline and has no last_active', () => {
    const { result } = renderHook(() => useUserActivityStatus(userFor({ online: false })), {
      wrapper,
    });
    expect(result.current).toBe('Offline');
  });

  it('returns "Offline" when no user is provided', () => {
    const { result } = renderHook(() => useUserActivityStatus(undefined), { wrapper });
    expect(result.current).toBe('Offline');
  });

  it('returns a relative "Last seen ..." string when offline with a valid last_active', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-13T12:00:00Z'));
    const tenMinutesAgo = new Date('2026-05-13T11:50:00Z').toISOString();

    const { result } = renderHook(
      () => useUserActivityStatus(userFor({ last_active: tenMinutesAgo, online: false })),
      { wrapper },
    );

    expect(result.current).toMatch(/^Last seen /);
    expect(result.current).toContain('minutes ago');

    jest.useRealTimers();
  });

  it('falls back to "Offline" when last_active is unparseable', () => {
    const { result } = renderHook(
      () => useUserActivityStatus(userFor({ last_active: 'not-a-date' as never, online: false })),
      { wrapper },
    );
    expect(result.current).toBe('Offline');
  });
});
