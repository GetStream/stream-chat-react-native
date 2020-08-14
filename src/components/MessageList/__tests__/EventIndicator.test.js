import React from 'react';
import { ThemeProvider } from '@stream-io/styled-components';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import { generateStaticUser } from 'mock-builders';

import { TranslationContext } from '../../../context';
import EventIndicator from '../EventIndicator';
import { defaultTheme } from '../../../styles/theme';
import { Streami18n } from '../../../utils';

afterEach(cleanup);

describe('EventIndicator', () => {
  it('should render event indicator', async () => {
    const t = jest.fn((key) => key);
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const event = {
      received_at: new Date().toString(),
      type: 'member.added',
      user: generateStaticUser(0),
    };
    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <TranslationContext.Provider value={{ ...translators, t }}>
          <EventIndicator event={event} />
        </TranslationContext.Provider>
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
    const translators = await i18nInstance.getTranslators();
    const event = {
      received_at: new Date().toString(),
      type: 'member.whatever',
      user: generateStaticUser(0),
    };
    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <TranslationContext.Provider value={translators}>
          <EventIndicator event={event} />
        </TranslationContext.Provider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('event-indicator')).toBeFalsy();
    });
  });

  it('should match the snapshot for member removed', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const event = {
      received_at: '2020-05-05T14:50:00',
      type: 'member.removed',
      user: generateStaticUser(1),
    };
    const { toJSON } = render(
      <ThemeProvider theme={defaultTheme}>
        <TranslationContext.Provider value={translators}>
          <EventIndicator event={event} />
        </TranslationContext.Provider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
