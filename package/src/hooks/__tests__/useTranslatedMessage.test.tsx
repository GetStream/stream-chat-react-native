import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../contexts/translationContext/TranslationContext';
import { useTranslatedMessage } from '../useTranslatedMessage';
import type { MessageType } from '../../components/MessageList/hooks/useMessageList';

describe('useTranslatedMessage', () => {
  it.each([
    // userLanguage, messageObject, expectedResult
    [
      'es',
      {
        i18n: {
          es_text: '¡Hola mundo!',
        },
      },
      '¡Hola mundo!',
    ],
    [
      'es',
      {
        text: 'Hello world!',
      },
      'Hello world!',
    ],
    [
      'es',
      {
        text: 'Hello world!',
        i18n: {
          nl_text: 'Hallo wereld!',
        },
      },
      'Hello world!',
    ],
  ])(
    'Should translate to %s if a translation key exists (Message: %o)',
    async (userLanguage, message, expectedResult) => {
      const TestComponent = () => {
        const result = useTranslatedMessage(message as MessageType);

        return <Text>{result}</Text>;
      };

      const { getByText } = render(
        <TranslationProvider value={{ userLanguage } as TranslationContextValue}>
          <TestComponent />
        </TranslationProvider>,
      );

      await waitFor(() => {
        expect(getByText(expectedResult)).toBeTruthy();
      });
    },
  );
});
