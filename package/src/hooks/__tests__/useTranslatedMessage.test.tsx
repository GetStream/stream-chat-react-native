import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { useTranslatedMessage } from '../useTranslatedMessage';
import {
  TranslationProvider,
  TranslationContextValue,
} from '../../contexts/translationContext/TranslationContext';
import type { MessageResponse } from 'stream-chat';

type TestComponentProps = {
  message: MessageResponse;
};

const TestComponent = ({ message }: TestComponentProps) => {
  const translatedMessage = useTranslatedMessage(message);
  return <Text>{translatedMessage.text}</Text>;
};

describe('useTranslatedMessage', () => {
  it("doesn't translate a message if there isn't a translation available for the userLanguage", async () => {
    const message = {
      text: 'Hello world!',
      i18n: {
        nl_text: 'Hallo wereld!',
      },
    } as MessageResponse;

    const { getByText } = render(
      <TranslationProvider value={{ userLanguage: 'es' } as TranslationContextValue}>
        <TestComponent message={message} />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(getByText(message.text!)).toBeTruthy();
    });
  });

  it('returns a new message with the text translated if userLanguage is set and the translation exists', async () => {
    const message = {
      text: 'Hello world!',
      i18n: {
        no_text: 'Hallo verden!',
      },
    } as MessageResponse;

    const { getByText } = render(
      <TranslationProvider value={{ userLanguage: 'no' } as TranslationContextValue}>
        <TestComponent message={message} />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(getByText(message.i18n!.no_text!)).toBeTruthy();
    });
  });

  it("returns the original text if the message doesn't contain any translations", async () => {
    const message = {
      text: 'Hello world!',
    } as MessageResponse;

    const { getByText } = render(<TestComponent message={message} />);

    await waitFor(() => {
      expect(getByText(message.text!)).toBeTruthy();
    });
  });
});
