import React from 'react';
import {
  fireEvent,
  render,
  wait,
  waitForElement,
} from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { v4 as uuidv4 } from 'uuid';

import {
  generateAttachmentAction,
  generateAudioAttachment,
  generateCardAttachment,
  generateFileAttachment,
  generateGiphyAttachment,
  generateImageAttachment,
  generateImgurAttachment,
} from 'mock-builders';

import Attachment from '../Attachment';
import AttachmentActions from '../AttachmentActions';

const getAttachmentComponent = (props) => <Attachment {...props} />;
const getActionComponent = (props) => <AttachmentActions {...props} />;

describe('Attachment', () => {
  it('should render File component for "audio" type attachment', async () => {
    const attachment = generateAudioAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await wait(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render File component for "file" type attachment', async () => {
    const attachment = generateFileAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await wait(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render Card component for "imgur" type attachment', async () => {
    const attachment = generateImgurAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await wait(() => {
      expect(getByTestId('card-attachment')).toBeTruthy();
    });
  });

  it('should render Card component for "giphy" type attachment', async () => {
    const attachment = generateGiphyAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await wait(() => {
      expect(getByTestId('card-attachment')).toBeTruthy();
    });
  });

  it('should render UrlPreview component if attachment has title_link or og_scrape_url', async () => {
    const attachment = generateImageAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await wait(() => {
      expect(getByTestId('card-attachment')).toBeTruthy();
    });
  });

  it('should render Gallery component if image does not have title_link or og_scrape_url', async () => {
    const attachment = generateImageAttachment({
      title_link: undefined,
      og_scrape_url: undefined,
    });
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await wait(() => {
      expect(getByTestId('image-attachment-single')).toBeTruthy();
    });
  });

  it('should render AttachmentActions component if attachment has actions', async () => {
    const attachment = generateImageAttachment({
      actions: [generateAttachmentAction(), generateAttachmentAction()],
      title_link: null,
    });
    const { getByTestId } = render(
      getAttachmentComponent({ attachment, actionHandler: () => {} }),
    );

    await wait(() => {
      expect(getByTestId('attachment-actions')).toBeTruthy();
    });
  });

  it('should call actionHandler on click', async () => {
    const actionHandler = jest.fn();
    const { getByTestId } = render(
      getActionComponent({
        actions: [generateAttachmentAction()],
        actionHandler,
      }),
    );

    await waitForElement(() => getByTestId('attachment-actions-button'));
    fireEvent.press(getByTestId('attachment-actions-button'));
    fireEvent.press(getByTestId('attachment-actions-button'));

    await wait(() => {
      expect(actionHandler).toHaveBeenCalledTimes(2);
    });
  });

  it('should render "Card" if attachment type is not recognized', async () => {
    const { getByTestId } = render(
      getAttachmentComponent({
        attachment: generateCardAttachment({ type: uuidv4() }),
      }),
    );
    await wait(() => {
      expect(getByTestId('card-attachment')).toBeTruthy();
    });
  });
});
