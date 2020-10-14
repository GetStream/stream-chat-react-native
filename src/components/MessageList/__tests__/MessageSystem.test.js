import React from 'react';
import { ThemeProvider } from 'styled-components/native';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { MessageSystem } from '../MessageSystem';

import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../mock-builders/generator/user';
import { defaultTheme } from '../../../styles/themeConstants';
import { Streami18n } from '../../../utils/Streami18n';

afterEach(cleanup);

describe('MessageSystem', () => {
  it('should render the message system', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const message = generateMessage();
    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
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
      <ThemeProvider theme={defaultTheme}>
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
