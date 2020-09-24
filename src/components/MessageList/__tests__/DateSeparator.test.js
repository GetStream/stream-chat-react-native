import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import {
  generateMessage,
  generateStaticMessage,
} from 'mock-builders/generator/message';
import { generateStaticUser, generateUser } from 'mock-builders/generator/user';

import DateSeparator from '../DateSeparator';

import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { Streami18n } from '../../../utils/Streami18n';

afterEach(cleanup);

describe('DateSeparator', () => {
  it('should render date separator', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const user = generateUser();
    const message = generateMessage({ user });
    const { queryByTestId } = render(
      <TranslationProvider value={translators}>
        <DateSeparator message={message} />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('date-separator')).toBeTruthy();
    });
  });

  it('should render date separator with custom date format', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const user = generateUser();
    const message = generateMessage({ user });
    const { getByText } = render(
      <TranslationProvider value={translators}>
        <DateSeparator
          formatDate={(date) => date}
          message={{ ...message, date: 'Hello World' }}
        />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(getByText('Hello World')).toBeTruthy();
    });
  });

  it('should match date separator snapshot', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const user = generateStaticUser(0);
    const message = generateStaticMessage('Hello World', { user });
    const { toJSON } = render(
      <TranslationProvider value={translators}>
        <DateSeparator message={{ ...message, date: message.created_at }} />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
