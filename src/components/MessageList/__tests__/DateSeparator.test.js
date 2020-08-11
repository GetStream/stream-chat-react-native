import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import DateSeparator from '../DateSeparator';
import {
  generateUser,
  generateMessage,
  generateStaticMessage,
  generateStaticUser,
} from '../../../mock-builders';
import { Streami18n } from '../../../utils';
import { TranslationContext } from '../../../context';

afterEach(cleanup);

describe('DateSeparator', () => {
  it('should render date separator', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const user = generateUser();
    const message = generateMessage({ user });
    const { queryByTestId } = render(
      <TranslationContext.Provider value={translators}>
        <DateSeparator message={message} />
      </TranslationContext.Provider>,
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
      <TranslationContext.Provider value={translators}>
        <DateSeparator
          message={{ ...message, date: 'Hello World' }}
          formatDate={(date) => date}
        />
      </TranslationContext.Provider>,
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
      <TranslationContext.Provider value={translators}>
        <DateSeparator message={{ ...message, date: message.created_at }} />
      </TranslationContext.Provider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
