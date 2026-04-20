import React from 'react';

import { cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import type { DeepPartial } from '../../../../contexts/themeContext/ThemeContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../../../contexts/themeContext/utils/theme';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import type { TranslationContextValue } from '../../../../contexts/translationContext/TranslationContext';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateStaticUser, generateUser } from '../../../../mock-builders/generator/user';
import { MessageReplies } from '../MessageReplies';

afterEach(cleanup);

describe('MessageReplies', () => {
  it('should render message replies', async () => {
    const onPressMock = jest.fn(() => null);
    const user = userEvent.setup();
    const t = jest.fn((key) => key);
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      reply_count: 2,
      user: staticUser,
    });
    render(
      <TranslationProvider value={{ t } as unknown as TranslationContextValue}>
        <ThemeProvider style={defaultTheme as DeepPartial<Theme>}>
          <MessageReplies alignment='right' message={message} />
        </ThemeProvider>
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-replies')).toBeTruthy();
      expect(t).toHaveBeenCalledWith('{{ replyCount }} Replies', {
        replyCount: message.reply_count,
      });
      expect(screen.getByText('{{ replyCount }} Replies')).toBeTruthy();
    });

    const message2 = generateMessage({
      reply_count: 1,
      user: staticUser,
    });

    screen.rerender(
      <TranslationProvider value={{ t } as unknown as TranslationContextValue}>
        <ThemeProvider style={defaultTheme as DeepPartial<Theme>}>
          <MessageReplies alignment='left' message={message2} onPress={onPressMock} />
        </ThemeProvider>
      </TranslationProvider>,
    );

    user.press(screen.getByTestId('message-replies'));

    await waitFor(() => {
      expect(onPressMock).toHaveBeenCalled();
      expect(screen.getByTestId('message-replies')).toBeTruthy();
      expect(t).toHaveBeenCalledWith('1 Reply');
      expect(screen.getByText('1 Reply')).toBeTruthy();
    });
  });

  it('should not render message replies', async () => {
    const t = jest.fn((key) => key);
    const user = generateUser();
    const message = generateMessage({
      user,
    });
    render(
      <TranslationProvider value={{ t } as unknown as TranslationContextValue}>
        <ThemeProvider style={defaultTheme as DeepPartial<Theme>}>
          <MessageReplies alignment='right' message={message} onPress={() => null} />
        </ThemeProvider>
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(screen.queryAllByTestId('message-replies')).toHaveLength(0);
    });

    const message2 = generateMessage({
      reply_count: 1,
      user,
    });

    screen.rerender(
      <TranslationProvider value={{ t } as unknown as TranslationContextValue}>
        <ThemeProvider style={defaultTheme as DeepPartial<Theme>}>
          <MessageReplies alignment='right' message={message2} onPress={() => null} threadList />
        </ThemeProvider>
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(screen.queryAllByTestId('message-replies')).toHaveLength(0);
    });
  });
});
