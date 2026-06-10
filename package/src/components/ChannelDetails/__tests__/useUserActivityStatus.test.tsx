import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';
import type { UserResponse } from 'stream-chat';

import {
  TranslationProvider,
  type TranslationContextValue,
} from '../../../contexts/translationContext/TranslationContext';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { useUserActivityStatus } from '../hooks/useUserActivityStatus';

let translators: TranslationContextValue;

beforeAll(async () => {
  const i18nInstance = new Streami18n();
  translators = (await i18nInstance.getTranslators()) as unknown as TranslationContextValue;
});

const wrapper = ({ children }: PropsWithChildren) => (
  <TranslationProvider value={translators}>{children}</TranslationProvider>
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
