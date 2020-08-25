import React from 'react';
import { ThemeProvider } from '@stream-io/styled-components';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import {
  generateMessage,
  generateStaticUser,
  generateUser,
} from 'mock-builders';

import { TranslationContext } from '../../../../context';
import MessageReplies from '../MessageReplies';
import { defaultTheme } from '../../../../styles/theme';

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
    const {
      getByTestId,
      getByText,
      queryAllByTestId,
      rerender,
      toJSON,
    } = render(
      <TranslationContext.Provider value={{ t }}>
        <ThemeProvider theme={defaultTheme}>
          <MessageReplies
            alignment='right'
            groupStyles={['bottom']}
            message={message}
            openThread={onPressMock}
          />
        </ThemeProvider>
      </TranslationContext.Provider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-replies')).toBeTruthy();
      expect(getByTestId('message-replies-right')).toBeTruthy();
      expect(queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(t).toHaveBeenCalledWith('{{ replyCount }} replies', {
        replyCount: message.reply_count,
      });
      expect(getByText('{{ replyCount }} replies')).toBeTruthy();
    });

    const message2 = generateMessage({
      reply_count: 1,
      user: staticUser,
    });

    rerender(
      <TranslationContext.Provider value={{ t }}>
        <ThemeProvider theme={defaultTheme}>
          <MessageReplies
            alignment='left'
            groupStyles={['bottom']}
            message={message2}
            openThread={onPressMock}
          />
        </ThemeProvider>
      </TranslationContext.Provider>,
    );

    fireEvent.press(getByTestId('message-replies'));
    await waitFor(() => {
      expect(onPressMock).toHaveBeenCalled();
      expect(getByTestId('message-replies')).toBeTruthy();
      expect(getByTestId('message-replies-left')).toBeTruthy();
      expect(queryAllByTestId('message-replies-right')).toHaveLength(0);
      expect(t).toHaveBeenCalledWith('1 reply');
      expect(getByText('1 reply')).toBeTruthy();
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
      <TranslationContext.Provider value={{ t }}>
        <ThemeProvider theme={defaultTheme}>
          <MessageReplies
            alignment='right'
            groupStyles={['bottom']}
            message={message}
            openThread={() => null}
          />
        </ThemeProvider>
      </TranslationContext.Provider>,
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
      <TranslationContext.Provider value={{ t }}>
        <ThemeProvider theme={defaultTheme}>
          <MessageReplies
            alignment='right'
            groupStyles={['bottom']}
            isThreadList
            message={message2}
            openThread={() => null}
          />
        </ThemeProvider>
      </TranslationContext.Provider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('message-replies')).toHaveLength(0);
      expect(queryAllByTestId('message-replies-left')).toHaveLength(0);
      expect(queryAllByTestId('message-replies-right')).toHaveLength(0);
    });
  });
});
