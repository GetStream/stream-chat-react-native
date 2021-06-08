import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { MessageSystem } from '../MessageSystem';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { Streami18n } from '../../../utils/Streami18n';

import { generateMessage, generateStaticMessage } from '../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../mock-builders/generator/user';

afterEach(cleanup);

describe('MessageSystem', () => {
  it('should render the message system', async () => {
    const i18nInstance = new Streami18n();
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
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const user = generateStaticUser(0);
    const message = generateStaticMessage('Hello World', { user });
    const { toJSON } = render(
      <ThemeProvider style={defaultTheme}>
        <TranslationProvider value={translators}>
          <MessageSystem message={message} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
