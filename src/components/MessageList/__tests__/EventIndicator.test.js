import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import EventIndicator from '../EventIndicator';
import { generateStaticUser } from '../../../mock-builders';
import { Streami18n } from '../../../utils';
import { ThemeProvider } from '@stream-io/styled-components';
import { defaultTheme } from '../../../styles/theme';

afterEach(cleanup);

describe('EventIndicator', () => {
  it('should render event indicator', async () => {
    const t = jest.fn((key) => key);
    const i18nInstance = new Streami18n();
    const { tDateTimeParser } = await i18nInstance.getTranslators();
    const event = {
      user: generateStaticUser(0),
      type: 'member.added',
      received_at: new Date().toString(),
    };
    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <EventIndicator t={t} tDateTimeParser={tDateTimeParser} event={event} />
      </ThemeProvider>,
    );

    expect(t).toHaveBeenCalledWith('{{ username }} joined the chat', {
      username: event.user.name,
    });
    await waitFor(() => {
      expect(queryByTestId('event-indicator')).toBeTruthy();
    });
  });

  it('should not render', async () => {
    const i18nInstance = new Streami18n();
    const { t, tDateTimeParser } = await i18nInstance.getTranslators();
    const event = {
      user: generateStaticUser(0),
      type: 'member.whatever',
      received_at: new Date().toString(),
    };
    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <EventIndicator t={t} tDateTimeParser={tDateTimeParser} event={event} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('event-indicator')).toBeFalsy();
    });
  });

  it('should match the snapshot for member removed', async () => {
    const i18nInstance = new Streami18n();
    const { t, tDateTimeParser } = await i18nInstance.getTranslators();
    const event = {
      user: generateStaticUser(1),
      type: 'member.removed',
      received_at: '2020-05-05T14:50:00',
    };
    const { toJSON } = render(
      <ThemeProvider theme={defaultTheme}>
        <EventIndicator t={t} tDateTimeParser={tDateTimeParser} event={event} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
