import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { v4 as uuidv4 } from 'uuid';

import { MessageProvider } from '../../../contexts/messageContext/MessageContext';
import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import {
  generateAttachmentAction,
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import * as NativeUtils from '../../../native';

import { ImageLoadingFailedIndicator } from '../../Attachment/ImageLoadingFailedIndicator';
import { ImageLoadingIndicator } from '../../Attachment/ImageLoadingIndicator';
import { Attachment } from '../Attachment';
import { AttachmentActions } from '../AttachmentActions';

const getAttachmentComponent = (props) => {
  const message = generateMessage();
  return (
    <ThemeProvider>
      <MessagesProvider value={{ ImageLoadingFailedIndicator, ImageLoadingIndicator }}>
        <MessageProvider value={{ message }}>
          <Attachment {...props} />
        </MessageProvider>
      </MessagesProvider>
    </ThemeProvider>
  );
};
const getActionComponent = (props) => (
  <ThemeProvider>
    <AttachmentActions {...props} />;
  </ThemeProvider>
);

describe('Attachment', () => {
  it('should render File component for "audio" type attachment', async () => {
    const attachment = generateAudioAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render File component for "video" type attachment', async () => {
    jest.spyOn(NativeUtils, 'isVideoPackageAvailable').mockImplementation(jest.fn(() => false));
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

  it('should render AttachmentActions component if attachment has actions', async () => {
    const attachment = generateImageAttachment({
      actions: [generateAttachmentAction(), generateAttachmentAction()],
      title_link: null,
    });
    const { getByTestId } = render(getAttachmentComponent({ actionHandler: () => {}, attachment }));

    await waitFor(() => {
      expect(getByTestId('attachment-actions')).toBeTruthy();
    });
  });

  it('should call actionHandler on click', async () => {
    const handleAction = jest.fn();
    const action = generateAttachmentAction();
    const { getByTestId } = render(
      getActionComponent({
        actions: [action],
        handleAction,
      }),
    );

    await waitFor(() => getByTestId(`attachment-actions-button-${action.name}`));

    expect(getByTestId('attachment-actions')).toContainElement(
      getByTestId(`attachment-actions-button-${action.name}`),
    );

    fireEvent.press(getByTestId(`attachment-actions-button-${action.name}`));
    fireEvent.press(getByTestId(`attachment-actions-button-${action.name}`));

    await waitFor(() => {
      expect(handleAction).toHaveBeenCalledTimes(2);
    });
  });
});
