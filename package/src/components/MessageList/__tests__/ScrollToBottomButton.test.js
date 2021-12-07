import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import { ScrollToBottomButton } from '../ScrollToBottomButton';

import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { Streami18n } from '../../../utils/Streami18n';

afterEach(cleanup);

describe('ScrollToBottomButton', () => {
  it('should render nothing if showNotification is false', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <ThemeProvider>
        <TranslationProvider value={translators}>
          <ScrollToBottomButton onPress={() => null} showNotification={false} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('message-notification')).toBeFalsy();
    });
  });

  it('should render if showNotification is true', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <ThemeProvider>
        <TranslationProvider value={translators}>
          <ScrollToBottomButton onPress={() => null} showNotification={true} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('message-notification')).toBeTruthy();
    });
  });

  it('should trigger onPress when pressed', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <TranslationProvider value={translators}>
          <ScrollToBottomButton onPress={onPress} showNotification={true} />
        </TranslationProvider>
      </ThemeProvider>,
    );
    fireEvent.press(getByTestId('message-notification'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should display the unread count', async () => {
    const t = jest.fn((key) => key);
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <TranslationProvider value={{ ...translators, t }}>
          <ScrollToBottomButton
            onPress={() => null}
            showNotification={true}
            t={t}
            unreadCount={3}
          />
        </TranslationProvider>
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(getByTestId('unread-count')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });
  });

  it('should render the message notification and match snapshot', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { toJSON } = render(
      <ThemeProvider>
        <TranslationProvider value={translators}>
          <ScrollToBottomButton onPress={() => null} showNotification={true} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    /**
     * Wait for animation to finish
     */
    await new Promise((r) => setTimeout(r, 500));
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
