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

afterEach(cleanup);

describe('DateSeparator', () => {
  it('should render date separator', async () => {
    const i18nInstance = new Streami18n();
    const { tDateTimeParser } = await i18nInstance.getTranslators();
    const user = generateUser();
    const message = generateMessage({ user });
    const { queryByTestId } = render(
      <DateSeparator message={message} tDateTimeParser={tDateTimeParser} />,
    );

    await waitFor(() => {
      expect(queryByTestId('date-separator')).toBeTruthy();
    });
  });

  it('should render date separator with custom date format', async () => {
    const i18nInstance = new Streami18n();
    const { tDateTimeParser } = await i18nInstance.getTranslators();
    const user = generateUser();
    const message = generateMessage({ user });
    const { getByText } = render(
      <DateSeparator
        message={{ ...message, date: 'Hello World' }}
        tDateTimeParser={tDateTimeParser}
        formatDate={(date) => date}
      />,
    );

    await waitFor(() => {
      expect(getByText('Hello World')).toBeTruthy();
    });
  });

  it('should match date separator snapshot', async () => {
    const i18nInstance = new Streami18n();
    const { tDateTimeParser } = await i18nInstance.getTranslators();
    const user = generateStaticUser(0);
    const message = generateStaticMessage('Hello World', { user });
    const { toJSON } = render(
      <DateSeparator
        message={{ ...message, date: message.created_at }}
        tDateTimeParser={tDateTimeParser}
      />,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
