import React from 'react';

import { Linking } from 'react-native';

import { act, renderHook } from '@testing-library/react-hooks';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { v4 as uuidv4 } from 'uuid';

import { MessageProvider } from '../../../contexts/messageContext/MessageContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import {
  generateAttachmentAction,
  generateAudioAttachment,
  generateCardAttachment,
  generateFileAttachment,
  generateImageAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { Attachment } from '../Attachment';
import { AttachmentActions } from '../AttachmentActions';
import { useGoToURL } from '../hooks/useGoToURL';

const getAttachmentComponent = (props) => {
  const message = generateMessage();
  return (
    <ThemeProvider>
      <MessageProvider value={{ message }}>
        <Attachment {...props} />
      </MessageProvider>
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

  it('should render "Card" if attachment type is not recognized', async () => {
    const { getByTestId } = render(
      getAttachmentComponent({
        attachment: generateCardAttachment({
          type: Date.now().toString(),
        }),
      }),
    );
    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeTruthy();
    });
  });

  it('should open the URL in the browser', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockImplementation(jest.fn().mockResolvedValue(true));

    jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn().mockResolvedValue(false));

    const { result, waitFor } = renderHook(() => useGoToURL('www.google.com'));

    const [error, openURL] = result.current;

    await act(openURL);

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(error).not.toBeTruthy();
      expect(Linking.openURL).toHaveBeenCalled();
    });
  });

  it('should open the URL in the browser when no url', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockImplementation(jest.fn().mockResolvedValue(false));

    jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn().mockResolvedValue(true));

    const { result } = await renderHook(() => useGoToURL());
    const [, openURL] = result.current;
    await act(openURL);
    const [error] = result.current;

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(error).toBeTruthy();
      expect(Linking.openURL).toHaveBeenCalled();
    });
  });
});
