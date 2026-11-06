import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';
import type { TFunction } from 'i18next';

import {
  TranslationProvider as ChatTranslationProvider,
  type TranslationContextValue,
} from '../../contexts/translationContext';
import { Streami18n } from '../../utils/i18n/Streami18n';
import {
  type AITranslate,
  defaultAITranslate,
  interpolateAIString,
  TranslationProvider,
  useAITranslation,
} from '../contexts';

const withValue =
  (value: TranslationContextValue) =>
  ({ children }: PropsWithChildren) => (
    <ChatTranslationProvider value={value}>{children}</ChatTranslationProvider>
  );

describe('AI translation', () => {
  it('fills placeholders and leaves unknown ones', () => {
    expect(interpolateAIString('Thought for {{ duration }}', { duration: '12s' })).toBe(
      'Thought for 12s',
    );
    expect(interpolateAIString('Connected to {{provider}}', { provider: 'Linear' })).toBe(
      'Connected to Linear',
    );
    expect(interpolateAIString('Thought for {{ duration }}', {})).toBe(
      'Thought for {{ duration }}',
    );
    expect(interpolateAIString('Thinking...')).toBe('Thinking...');
    expect(interpolateAIString('{{ count }} files', { count: 0 })).toBe('0 files');
  });

  it('is English without <Chat>', () => {
    const { result } = renderHook(() => useAITranslation());
    expect(result.current.t).toBe(defaultAITranslate);
    expect(result.current.t('Thinking... {{ duration }}', { duration: '4s' })).toBe(
      'Thinking... 4s',
    );
  });

  it('follows the chat SDK translator, as inside <Chat>', async () => {
    const i18n = new Streami18n({ language: 'fr' });
    // `registerTranslation` only takes keys in `en.json`; the AI keys join it with the views.
    i18n.registerTranslation('fr', {
      'Thought for {{ duration }}': 'Réfléchi pendant {{ duration }}',
    } as Parameters<typeof i18n.registerTranslation>[1]);
    const translators = (await i18n.getTranslators()) as unknown as TranslationContextValue;

    const { result } = renderHook(() => useAITranslation(), {
      wrapper: withValue({ ...translators, userLanguage: 'fr' }),
    });
    expect(result.current.t('Thought for {{ duration }}', { duration: '12s' })).toBe(
      'Réfléchi pendant 12s',
    );
  });

  it('is the same provider as the chat SDK, for apps without <Chat>', () => {
    expect(TranslationProvider).toBe(ChatTranslationProvider);
    const t = ((key: string) => `[es] ${key}`) as unknown as TFunction;
    const { result } = renderHook(() => useAITranslation(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <TranslationProvider
          value={{ t, tDateTimeParser: (input) => input ?? 0, userLanguage: 'es' }}
        >
          {children}
        </TranslationProvider>
      ),
    });
    expect(result.current.t('Allow')).toBe('[es] Allow');
  });

  it('takes the chat SDK translator as it is', () => {
    // A compile-time check: core's `t` (i18next's TFunction) must be assignable without a cast.
    const coreT = ((key: string) => key) as unknown as TFunction;
    const t: AITranslate = coreT;
    expect(t('Allow')).toBe('Allow');
  });
});
