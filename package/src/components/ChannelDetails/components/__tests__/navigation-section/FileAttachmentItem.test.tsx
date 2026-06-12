import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Channel, MessageResponse } from 'stream-chat';

import { ThemeProvider } from '../../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
} from '../../../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../../../mock-builders/generator/message';
import { FileAttachmentItem } from '../../navigation-section/FileAttachmentItem';

const mockOpenUrlSafely = jest.fn();

jest.mock('../../../../Attachment/utils/openUrlSafely', () => ({
  openUrlSafely: (url?: string) => mockOpenUrlSafely(url),
}));

const mockFilePreviewProbe: { title?: string }[] = [];

jest.mock('../../../../Attachment/FilePreview', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    FilePreview: ({ attachment }: { attachment: { title?: string } }) => {
      mockFilePreviewProbe.push({ title: attachment.title });
      return ReactLib.createElement(Text, null, attachment.title);
    },
  };
});

const mockChannel = { cid: 'messaging:1' } as unknown as Channel;

const tree = (
  message: MessageResponse,
  onPress?: React.ComponentProps<typeof FileAttachmentItem>['onPress'],
) => (
  <ThemeProvider theme={defaultTheme}>
    <FileAttachmentItem channel={mockChannel} message={message} onPress={onPress} />
  </ThemeProvider>
);

describe('FileAttachmentItem', () => {
  beforeEach(() => {
    mockFilePreviewProbe.length = 0;
  });

  afterEach(() => jest.clearAllMocks());

  it('renders only file and audio attachments, skipping images', () => {
    const file = generateFileAttachment({ title: 'a-file.pdf' });
    const audio = generateAudioAttachment({ title: 'a-clip.mp3' });
    const image = generateImageAttachment({ title: 'a-photo.png' });
    const message = generateMessage({
      attachments: [file, image, audio],
      id: 'm-1',
    }) as unknown as MessageResponse;

    render(tree(message));

    expect(mockFilePreviewProbe.map((p) => p.title)).toEqual(['a-file.pdf', 'a-clip.mp3']);
    expect(screen.getByTestId('file-attachment-item-m-1')).toBeTruthy();
    expect(screen.queryByText('a-photo.png')).toBeNull();
  });

  it('renders nothing when the message has no file or audio attachments', () => {
    const message = generateMessage({
      attachments: [generateImageAttachment()],
      id: 'm-2',
    }) as unknown as MessageResponse;

    render(tree(message));

    expect(mockFilePreviewProbe).toHaveLength(0);
    expect(screen.queryByTestId('file-attachment-item-m-2')).toBeNull();
  });

  it('opens the attachment url when a row is pressed', () => {
    const file = generateFileAttachment({ asset_url: 'https://example.com/a.pdf', title: 'a.pdf' });
    const message = generateMessage({
      attachments: [file],
      id: 'm-3',
    }) as unknown as MessageResponse;

    render(tree(message));

    fireEvent.press(screen.getByTestId('file-attachment-row-m-3-0'));
    expect(mockOpenUrlSafely).toHaveBeenCalledWith('https://example.com/a.pdf');
  });

  it('calls the provided onPress with the attachment and message, overriding the default', () => {
    const file = generateFileAttachment({ asset_url: 'https://example.com/a.pdf', title: 'a.pdf' });
    const message = generateMessage({
      attachments: [file],
      id: 'm-4',
    }) as unknown as MessageResponse;
    const onPress = jest.fn();

    render(tree(message, onPress));

    fireEvent.press(screen.getByTestId('file-attachment-row-m-4-0'));
    expect(onPress).toHaveBeenCalledWith({ attachment: file, message });
    expect(mockOpenUrlSafely).not.toHaveBeenCalled();
  });
});
