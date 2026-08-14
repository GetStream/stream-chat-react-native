import React from 'react';

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import { ChannelProvider } from '../../../contexts/channelContext/ChannelContext';
import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateChannelState } from '../../../mock-builders/generator/channelState';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { ScrollToBottomButton } from '../ScrollToBottomButton';

afterEach(cleanup);

describe('ScrollToBottomButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render nothing if showNotification is false', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <ThemeProvider>
        <TranslationProvider value={translators as TranslationContextValue}>
          <ScrollToBottomButton onPress={() => null} showNotification={false} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('scroll-to-bottom-button')).toBeFalsy();
    });
  });

  it('should render if showNotification is true', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <ThemeProvider>
        <TranslationProvider value={translators as TranslationContextValue}>
          <ScrollToBottomButton onPress={() => null} showNotification={true} />
        </TranslationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('scroll-to-bottom-button')).toBeTruthy();
    });
  });

  it('should trigger onPress when pressed', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <TranslationProvider value={translators as TranslationContextValue}>
          <ScrollToBottomButton onPress={onPress} showNotification={true} />
        </TranslationProvider>
      </ThemeProvider>,
    );
    fireEvent.press(getByTestId('scroll-to-bottom-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should display the unread count', async () => {
    const t = jest.fn((key: string) => key);
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    // The button reads OUR user's count from `channel.state` (a v10 reactive StateStore) via
    // `useStateStore`, keyed by the chat client's userID. Seed the `read` slice with 3 unread
    // for that user.
    const channel = {
      state: generateChannelState({
        read: {
          me: {
            last_read: new Date(),
            unread_messages: 3,
            user: { id: 'me' },
          },
        },
      }),
    };
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <TranslationProvider value={{ ...translators, t } as unknown as TranslationContextValue}>
          <ChatProvider value={{ client: { userID: 'me' } } as unknown as ChatContextValue}>
            <ChannelProvider
              value={{ channel, threadList: false } as unknown as ChannelContextValue}
            >
              <ScrollToBottomButton onPress={() => null} showNotification={true} />
            </ChannelProvider>
          </ChatProvider>
        </TranslationProvider>
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(getByTestId('unread-count', { includeHiddenElements: true })).toBeTruthy();
      expect(getByText('3', { includeHiddenElements: true })).toBeTruthy();
    });
  });

  it('should render the message notification and match snapshot', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { toJSON } = render(
      <ThemeProvider>
        <TranslationProvider value={translators as TranslationContextValue}>
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
