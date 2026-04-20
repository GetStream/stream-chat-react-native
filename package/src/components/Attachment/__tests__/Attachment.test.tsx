import React from 'react';

import { render, waitFor } from '@testing-library/react-native';
import { v4 as uuidv4 } from 'uuid';

import { MessageProvider } from '../../../contexts/messageContext/MessageContext';
import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';

import { ImageLoadingFailedIndicator } from '../../Attachment/ImageLoadingFailedIndicator';
import { ImageLoadingIndicator } from '../../Attachment/ImageLoadingIndicator';
import { Attachment } from '../Attachment';
import { FilePreview as FilePreviewDefault } from '../FilePreview';

jest.mock('../../../native.ts', () => ({
  isVideoPlayerAvailable: jest.fn(() => false),
  isSoundPackageAvailable: jest.fn(() => false),
}));

const getAttachmentComponent = (props) => {
  const message = generateMessage();
  return (
    <ThemeProvider>
      <MessagesProvider
        value={{
          ImageLoadingFailedIndicator,
          ImageLoadingIndicator,
          FilePreview: FilePreviewDefault,
        }}
      >
        <MessageProvider value={{ message }}>
          <Attachment {...props} />
        </MessageProvider>
      </MessagesProvider>
    </ThemeProvider>
  );
};

describe('Attachment', () => {
  it('should render File component for "audio" type attachment', async () => {
    const attachment = generateAudioAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render File component for "video" type attachment', async () => {
    const attachment = generateVideoAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render File component for "file" type attachment', async () => {
    const attachment = generateFileAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render UrlPreview component if attachment has title_link or og_scrape_url', async () => {
    const attachment = generateImageAttachment({
      og_scrape_url: uuidv4(),
      title_link: uuidv4(),
    });
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeTruthy();
    });
  });

  it('should render Gallery component if image does not have title_link or og_scrape_url', async () => {
    const attachment = generateImageAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('gallery-container')).toBeTruthy();
    });
  });
});
