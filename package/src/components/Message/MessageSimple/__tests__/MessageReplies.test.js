import React from 'react';

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';


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
    const t = jest.fn((key) => key);
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      reply_count: 2,
      user: staticUser,
    });
    const { getByTestId, getByText, queryAllByTestId, rerender, toJSON } = render(
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
      expect(getByTestId('message-replies')).toBeTruthy();
      expect(getByTestId('message-replies-right')).toBeTruthy();
      expect(queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(t).toHaveBeenCalledWith('{{ replyCount }} Thread Replies', {
        replyCount: message.reply_count,
      });
      expect(getByText('{{ replyCount }} Thread Replies')).toBeTruthy();
    });

    const message2 = generateMessage({
      reply_count: 1,
      user: staticUser,
    });

    rerender(
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

    fireEvent.press(getByTestId('message-replies'));

    await waitFor(() => {
      expect(onPressMock).toHaveBeenCalled();
      expect(getByTestId('message-replies')).toBeTruthy();
      expect(getByTestId('message-replies-left')).toBeTruthy();
      expect(queryAllByTestId('message-replies-right')).toHaveLength(0);
      expect(t).toHaveBeenCalledWith('1 Thread Reply');
      expect(getByText('1 Thread Reply')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });

  it('should not render message replies', async () => {
    const t = jest.fn((key) => key);
    const user = generateUser();
    const message = generateMessage({
      user,
    });
    const { queryAllByTestId, rerender } = render(
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
      expect(queryAllByTestId('message-replies')).toHaveLength(0);
      expect(queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(queryAllByTestId('message-replies-right')).toHaveLength(0);
    });

    const message2 = generateMessage({
      reply_count: 1,
      user,
    });

    rerender(
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
      expect(queryAllByTestId('message-replies')).toHaveLength(0);
      expect(queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(queryAllByTestId('message-replies-right')).toHaveLength(0);
    });
  });
});
