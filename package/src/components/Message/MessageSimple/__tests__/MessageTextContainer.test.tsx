import React from 'react';
import { Text } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../../../contexts/translationContext/TranslationContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { MessageTextContainer } from '../MessageTextContainer';
import type { MessageType } from '../../../MessageList/hooks/useMessageList';

afterEach(cleanup);

describe('MessageTextContainer', () => {
  it('should render message text container', async () => {
    const staticUser = generateStaticUser(1);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    const { getByTestId, getByText, rerender, toJSON } = render(
      <ThemeProvider style={defaultTheme}>
        <MessageTextContainer message={message as any} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-text-container')).toBeTruthy();
      expect(getByText(message.text)).toBeTruthy();
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageTextContainer
          message={message as any}
          MessageText={({ message }) => (
            <Text testID='message-text'>{message?.text as string}</Text>
          )}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-text-container')).toBeTruthy();
      expect(getByTestId('message-text')).toBeTruthy();
      expect(getByText(message.text)).toBeTruthy();
    });

    const staticMessage = generateStaticMessage('Hello World', {
      user: staticUser,
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageTextContainer message={staticMessage as any} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });

  it('should not render if there is no message text', async () => {
    const TestComponent = () => <MessageTextContainer message={{} as MessageType} />;

    const { toJSON } = render(
      <ThemeProvider style={defaultTheme}>
        <TestComponent />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toBe(null);
    });
  });

  it('should render ¡Hello mundo! when userLanguage is `es` and the message contains a translation', async () => {
    const userLanguage = 'es';
    const expectedResult = '¡Hola mundo!';

    const TestComponent = () => (
      <MessageTextContainer
        message={{ i18n: { es_text: expectedResult }, text: 'Hello world!' } as MessageType}
      />
    );

    const { getByText } = render(
      <ThemeProvider style={defaultTheme}>
        <TranslationProvider value={{ userLanguage } as TranslationContextValue}>
          <TestComponent />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByText(expectedResult)).toBeTruthy();
    });
  });
});
