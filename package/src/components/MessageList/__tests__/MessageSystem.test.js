import React from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';

import { generateMessage, generateStaticMessage } from '../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../mock-builders/generator/user';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { MessageSystem } from '../MessageSystem';

afterEach(cleanup);

let i18nInstance;

describe('MessageSystem', () => {
  beforeAll(() => {
    i18nInstance = new Streami18n();
  });
  afterEach(cleanup);

  it('should render the message system', async () => {
    const translators = await i18nInstance.getTranslators();
    const message = generateMessage();
    const { queryByTestId } = render(
      <ThemeProvider style={defaultTheme}>
        <TranslationProvider value={translators}>
          <MessageSystem message={message} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('message-system')).toBeTruthy();
    });
  });

  it('should match the snapshot for message system', async () => {
    const translators = await i18nInstance.getTranslators();
    const user = generateStaticUser(0);
    const message = generateStaticMessage('Hello World', { user });
    render(
      <ThemeProvider style={defaultTheme}>
        <TranslationProvider value={translators}>
          <MessageSystem message={message} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.toJSON()).toMatchSnapshot();
    });
  });
});
