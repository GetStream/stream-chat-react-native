import React from 'react';
import { Text } from 'react-native';

import { render, waitFor } from '@testing-library/react-native';

import type { MessageResponse } from 'stream-chat';

import {
  MessageOverlayContextValue,
  MessageOverlayProvider,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../contexts/translationContext/TranslationContext';
import { useTranslatedMessage } from '../useTranslatedMessage';

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
      i18n: {
        nl_text: 'Hallo wereld!',
      },
      text: 'Hello world!',
    } as MessageResponse;

    const { getByText } = render(
      <TranslationProvider value={{ userLanguage: 'es' } as TranslationContextValue}>
        <TestComponent message={message} />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(getByText('Hello world!')).toBeTruthy();
    });
  });

  it('returns a new message with the text translated if userLanguage is set and the translation exists', async () => {
    const message = {
      i18n: {
        no_text: 'Hallo verden!',
      },
      text: 'Hello world!',
    } as MessageResponse;

    const { getByText } = render(
      <TranslationProvider value={{ userLanguage: 'no' } as TranslationContextValue}>
        <TestComponent message={message} />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(getByText('Hallo verden!')).toBeTruthy();
    });
  });

  it("returns the original text if the message doesn't contain any translations", async () => {
    const message = {
      text: 'Hello world!',
    } as MessageResponse;

    const { getByText } = render(<TestComponent message={message} />);

    await waitFor(() => {
      expect(getByText('Hello world!')).toBeTruthy();
    });
  });

  it('uses userLanguage from messageOverlayData if it is set', async () => {
    const message = {
      i18n: {
        nl_text: 'Hallo wereld!',
        no_text: 'Hallo verden!',
      },
      text: 'Hello world!',
    } as MessageResponse;

    /**
     * The reason for the as unknown as MessageOverlayContextValue is that the provider
     * uses useResettableState, wrapping the input to fit in the data structure.
     *
     * In practice, the userLanguage will be set with the setData call and not directly
     * in the provider.
     * */
    const { getByText } = render(
      <MessageOverlayProvider
        value={{ userLanguage: 'nl' } as unknown as MessageOverlayContextValue}
      >
        <TestComponent message={message} />
      </MessageOverlayProvider>,
    );

    await waitFor(() => {
      expect(getByText('Hallo wereld!')).toBeTruthy();
    });
  });
});
