import React from 'react';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { InlineUnreadIndicator } from '../InlineUnreadIndicator';

describe('InlineUnreadIndicator', () => {
  it.each([
    [1, '1 new message'],
    [3, '3 new messages'],
  ])('labels %i unread messages as "%s"', async (unreadCount, label) => {
    const translators = await new Streami18n().init();
    render(
      <ThemeProvider>
        <TranslationProvider value={{ ...translators, userLanguage: 'en' }}>
          <InlineUnreadIndicator unreadCount={unreadCount} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText(label)).toBeTruthy();
  });
});
