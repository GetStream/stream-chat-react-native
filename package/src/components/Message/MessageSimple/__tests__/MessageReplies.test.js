import React from 'react';

import { cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateStaticUser, generateUser } from '../../../../mock-builders/generator/user';
import { MessageReplies } from '../MessageReplies';
import { MessageRepliesAvatars } from '../MessageRepliesAvatars';

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
      <TranslationProvider value={{ t }}>
        <ThemeProvider style={defaultTheme}>
          <MessageReplies
            alignment='right'
            groupStyles={['bottom']}
            message={message}
            MessageRepliesAvatars={MessageRepliesAvatars}
            openThread={onPressMock}
          />
        </ThemeProvider>
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-replies')).toBeTruthy();
      expect(screen.getByTestId('message-replies-right')).toBeTruthy();
      expect(screen.queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(t).toHaveBeenCalledWith('{{ replyCount }} Thread Replies', {
        replyCount: message.reply_count,
      });
      expect(screen.getByText('{{ replyCount }} Thread Replies')).toBeTruthy();
    });

    const message2 = generateMessage({
      reply_count: 1,
      user: staticUser,
    });

    screen.rerender(
      <TranslationProvider value={{ t }}>
        <ThemeProvider style={defaultTheme}>
          <MessageReplies
            alignment='left'
            groupStyles={['bottom']}
            message={message2}
            MessageRepliesAvatars={MessageRepliesAvatars}
            onPress={onPressMock}
          />
        </ThemeProvider>
      </TranslationProvider>,
    );

    user.press(screen.getByTestId('message-replies'));

    await waitFor(() => {
      expect(onPressMock).toHaveBeenCalled();
      expect(screen.getByTestId('message-replies')).toBeTruthy();
      expect(screen.getByTestId('message-replies-left')).toBeTruthy();
      expect(screen.queryAllByTestId('message-replies-right')).toHaveLength(0);
      expect(t).toHaveBeenCalledWith('1 Thread Reply');
      expect(screen.getByText('1 Thread Reply')).toBeTruthy();
    });
  });

  it('should not render message replies', async () => {
    const t = jest.fn((key) => key);
    const user = generateUser();
    const message = generateMessage({
      user,
    });
    render(
      <TranslationProvider value={{ t }}>
        <ThemeProvider style={defaultTheme}>
          <MessageReplies
            alignment='right'
            groupStyles={['bottom']}
            message={message}
            onPress={() => null}
          />
        </ThemeProvider>
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(screen.queryAllByTestId('message-replies')).toHaveLength(0);
      expect(screen.queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(screen.queryAllByTestId('message-replies-right')).toHaveLength(0);
    });

    const message2 = generateMessage({
      reply_count: 1,
      user,
    });

    screen.rerender(
      <TranslationProvider value={{ t }}>
        <ThemeProvider style={defaultTheme}>
          <MessageReplies
            alignment='right'
            groupStyles={['bottom']}
            message={message2}
            onPress={() => null}
            threadList
          />
        </ThemeProvider>
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(screen.queryAllByTestId('message-replies')).toHaveLength(0);
      expect(screen.queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(screen.queryAllByTestId('message-replies-right')).toHaveLength(0);
    });
  });
});
