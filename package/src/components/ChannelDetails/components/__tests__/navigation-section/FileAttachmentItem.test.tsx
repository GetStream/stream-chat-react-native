import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Attachment, MessageResponse } from 'stream-chat';

import { ThemeProvider } from '../../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import { generateFileAttachment } from '../../../../../mock-builders/generator/attachment';
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

const tree = (
  attachment: Attachment,
  message: MessageResponse,
  onPress?: React.ComponentProps<typeof FileAttachmentItem>['onPress'],
) => (
  <ThemeProvider theme={defaultTheme}>
    <FileAttachmentItem attachment={attachment} message={message} onPress={onPress} />
  </ThemeProvider>
);

describe('FileAttachmentItem', () => {
  beforeEach(() => {
    mockFilePreviewProbe.length = 0;
  });

  afterEach(() => jest.clearAllMocks());

  it('renders the attachment preview', () => {
    const file = generateFileAttachment({ title: 'a-file.pdf' });
    const message = generateMessage({ id: 'm-1' }) as unknown as MessageResponse;

    render(tree(file, message));

    expect(mockFilePreviewProbe.map((p) => p.title)).toEqual(['a-file.pdf']);
    expect(screen.getByTestId('file-attachment-item-m-1')).toBeTruthy();
  });

  it('opens the attachment url when a row is pressed', () => {
    const file = generateFileAttachment({ asset_url: 'https://example.com/a.pdf', title: 'a.pdf' });
    const message = generateMessage({ id: 'm-3' }) as unknown as MessageResponse;

    render(tree(file, message));

    fireEvent.press(screen.getByTestId('file-attachment-row-m-3'));
    expect(mockOpenUrlSafely).toHaveBeenCalledWith('https://example.com/a.pdf');
  });

  it('calls the provided onPress with the attachment and message, overriding the default', () => {
    const file = generateFileAttachment({ asset_url: 'https://example.com/a.pdf', title: 'a.pdf' });
    const message = generateMessage({ id: 'm-4' }) as unknown as MessageResponse;
    const onPress = jest.fn();

    render(tree(file, message, onPress));

    fireEvent.press(screen.getByTestId('file-attachment-row-m-4'));
    expect(onPress).toHaveBeenCalledWith({ attachment: file, message });
    expect(mockOpenUrlSafely).not.toHaveBeenCalled();
  });
});
