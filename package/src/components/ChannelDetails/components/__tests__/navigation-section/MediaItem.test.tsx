import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Attachment, MessageResponse } from 'stream-chat';

import { ThemeProvider } from '../../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../../contexts/translationContext/TranslationContext';
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../../../mock-builders/generator/message';
import { generateUser } from '../../../../../mock-builders/generator/user';
import { MediaItem, type MediaItemProps } from '../../navigation-section/MediaItem';

const renderItem = (props: Partial<MediaItemProps> & { attachment: Attachment }) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <MediaItem
          attachment={props.attachment}
          message={props.message ?? (generateMessage({ id: 'm-1' }) as unknown as MessageResponse)}
          onPress={props.onPress}
          size={120}
        />
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('MediaItem', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the thumbnail from the attachment url', () => {
    renderItem({
      attachment: generateImageAttachment({ thumb_url: 'https://example.com/a.jpg' }),
    });

    expect(screen.getByTestId('media-item-thumbnail').props.source.uri).toBe(
      'https://example.com/a.jpg',
    );
  });

  it("renders the sender's avatar overlay", () => {
    renderItem({
      attachment: generateImageAttachment({ thumb_url: 'https://example.com/a.jpg' }),
      message: generateMessage({
        id: 'm-1',
        user: generateUser({ id: 'u-1', name: 'Maya Ross' }),
      }) as unknown as MessageResponse,
    });

    expect(screen.getByTestId('user-avatar')).toBeTruthy();
  });

  it('renders the duration badge for video attachments', () => {
    renderItem({
      attachment: generateVideoAttachment({ duration: 8000 }),
    });

    expect(screen.getByText('0:08')).toBeTruthy();
  });

  it('does not render a duration badge for image attachments', () => {
    renderItem({
      attachment: generateImageAttachment({ thumb_url: 'https://example.com/a.jpg' }),
    });

    expect(screen.queryByText('0:08')).toBeNull();
  });

  it('fires onPress with the attachment and message', () => {
    const onPress = jest.fn();
    const attachment = generateImageAttachment({ thumb_url: 'https://example.com/a.jpg' });
    const message = generateMessage({ id: 'm-1' }) as unknown as MessageResponse;

    renderItem({ attachment, message, onPress });

    fireEvent.press(screen.getByTestId('media-item-m-1'));
    expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ attachment, message }));
  });

  it('renders a tile keyed by the message id', () => {
    renderItem({
      attachment: generateImageAttachment({ thumb_url: 'https://example.com/a.jpg' }),
      message: generateMessage({ id: 'm-99' }) as unknown as MessageResponse,
    });

    expect(screen.getByTestId('media-item-m-99')).toBeTruthy();
  });
});
