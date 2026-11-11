import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';

import {
  TranslationProvider as ChatTranslationProvider,
  type TranslationContextValue,
} from '../../contexts/translationContext';
import { Streami18n } from '../../utils/i18n/Streami18n';
import { TranslationProvider, useAITranslation } from '../contexts';

const withValue =
  (value: TranslationContextValue) =>
  ({ children }: PropsWithChildren) => (
    <ChatTranslationProvider value={value}>{children}</ChatTranslationProvider>
  );

describe('AI translation', () => {
  it('is English without <Chat>', () => {
    const { result } = renderHook(() => useAITranslation());
    expect(
      result.current.t('aiComponents.reasoning.thinkingFor.title', 'Thinking... {{ duration }}', {
        duration: '4s',
      }),
    ).toBe('Thinking... 4s');
    expect(result.current.t('aiComponents.reasoning.thoughtProcess.title', 'Thought process')).toBe(
      'Thought process',
    );
    expect(result.current.userLanguage).toBe('en');
  });

  it('follows the chat SDK translator, as inside <Chat>', async () => {
    const i18n = new Streami18n({ language: 'fr' });
    i18n.registerTranslation('fr', {
      'aiComponents.reasoning.thoughtFor.title': 'Réfléchi pendant {{ duration }}',
    });
    const { t, tDateTimeParser } = await i18n.init();

    const { result } = renderHook(() => useAITranslation(), {
      wrapper: withValue({ t, tDateTimeParser, userLanguage: 'fr' }),
    });
    expect(
      result.current.t('aiComponents.reasoning.thoughtFor.title', 'Thought for {{ duration }}', {
        duration: '12s',
      }),
    ).toBe('Réfléchi pendant 12s');
    // A key the language has no translation for falls back to its English copy.
    expect(result.current.t('aiComponents.toolApproval.allow.label', 'Allow')).toBe('Allow');
    expect(result.current.userLanguage).toBe('fr');
  });

  it('is the same provider as the chat SDK, for apps without <Chat>', () => {
    expect(TranslationProvider).toBe(ChatTranslationProvider);
    const t = ((key: string) => `[es] ${key}`) as unknown as TranslationContextValue['t'];
    const { result } = renderHook(() => useAITranslation(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <TranslationProvider
          value={{ t, tDateTimeParser: (input) => input ?? 0, userLanguage: 'es' }}
        >
          {children}
        </TranslationProvider>
      ),
    });
    expect(result.current.t('aiComponents.toolApproval.allow.label', 'Allow')).toBe(
      '[es] aiComponents.toolApproval.allow.label',
    );
  });
});
