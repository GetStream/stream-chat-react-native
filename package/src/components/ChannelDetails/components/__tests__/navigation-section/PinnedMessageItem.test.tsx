import React from 'react';

import { render, screen } from '@testing-library/react-native';
import type { MessageResponse } from 'stream-chat';

import { ThemeProvider } from '../../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../../contexts/translationContext/TranslationContext';
import { generateMessage } from '../../../../../mock-builders/generator/message';
import { generateUser } from '../../../../../mock-builders/generator/user';
import { PinnedMessageItem } from '../../navigation-section/PinnedMessageItem';

jest.mock('../../../../ChannelPreview/ChannelLastMessagePreview', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    ChannelLastMessagePreview: ({ message }: { message: MessageResponse }) =>
      ReactLib.createElement(ReactLib.Fragment, null, [
        ReactLib.createElement(Text, { key: 'id', testID: 'preview-message' }, message.id),
        ReactLib.createElement(Text, { key: 'text', testID: 'preview-message-text' }, message.text),
      ]),
  };
});

const mockChannelPreviewStatusSpy = jest.fn();

jest.mock('../../../../ChannelPreview/ChannelPreviewStatus', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    ChannelPreviewStatus: (props: { lastMessage: MessageResponse }) => {
      mockChannelPreviewStatusSpy(props);
      return ReactLib.createElement(Text, { testID: 'preview-status' }, props.lastMessage.id);
    },
  };
});

const channel = { cid: 'messaging:1' } as never;

const renderItem = (
  message: MessageResponse,
  formatMessageDate?: (date?: string | Date) => string,
  userLanguage = 'en',
) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: userLanguage as never,
        }}
      >
        <PinnedMessageItem
          channel={channel}
          formatMessageDate={formatMessageDate as never}
          message={message}
        />
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('PinnedMessageItem', () => {
  afterEach(() => jest.clearAllMocks());

  it("renders the sender's avatar and name", () => {
    const message = generateMessage({
      id: 'm-1',
      user: generateUser({ id: 'u-1', name: 'Maya Ross' }),
    }) as unknown as MessageResponse;

    renderItem(message);

    expect(screen.getByText('Maya Ross')).toBeTruthy();
    expect(screen.getByTestId('user-avatar')).toBeTruthy();
  });

  it('falls back to the user id when the sender has no name', () => {
    const message = generateMessage({
      id: 'm-1',
      user: generateUser({ id: 'just-an-id', name: undefined }),
    }) as unknown as MessageResponse;

    renderItem(message);

    expect(screen.getByText('just-an-id')).toBeTruthy();
  });

  it('passes the message to the preview status and message components', () => {
    const message = generateMessage({ id: 'm-42' }) as unknown as MessageResponse;

    renderItem(message);

    expect(screen.getByTestId('preview-status')).toHaveTextContent('m-42');
    expect(screen.getByTestId('preview-message')).toHaveTextContent('m-42');
  });

  it('forwards the formatMessageDate prop to the preview status as formatLatestMessageDate', () => {
    const message = generateMessage({ id: 'm-1' }) as unknown as MessageResponse;
    const formatMessageDate = jest.fn(() => 'formatted-date');

    renderItem(message, formatMessageDate);

    expect(mockChannelPreviewStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({ formatLatestMessageDate: formatMessageDate }),
    );
  });

  it('renders a row keyed by the message id', () => {
    const message = generateMessage({ id: 'm-1' }) as unknown as MessageResponse;

    renderItem(message);

    expect(screen.getByTestId('pinned-message-item-m-1')).toBeTruthy();
  });

  it('renders the translated text for the user language in the last message preview', () => {
    const message = generateMessage({
      i18n: { es_text: '¡Hola mundo!' } as never,
      id: 'm-es',
      text: 'Hello world!',
    }) as unknown as MessageResponse;

    renderItem(message, undefined, 'es');

    expect(screen.getByTestId('preview-message-text')).toHaveTextContent('¡Hola mundo!');
  });

  it('renders the original text when no translation exists for the user language', () => {
    const message = generateMessage({
      i18n: { es_text: '¡Hola mundo!' } as never,
      id: 'm-en',
      text: 'Hello world!',
    }) as unknown as MessageResponse;

    renderItem(message, undefined, 'en');

    expect(screen.getByTestId('preview-message-text')).toHaveTextContent('Hello world!');
  });
});
