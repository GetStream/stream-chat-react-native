import React, { useEffect, useState } from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { ImageGalleryStateStore } from '../../../state-store/image-gallery-state-store';
import { ImageGalleryGrid, ImageGalleryGridProps } from '../components/ImageGrid';

const ImageGalleryGridComponent = (
  props: Partial<ImageGalleryGridProps> & { message: LocalMessage },
) => {
  const { message, closeGridView = jest.fn(), ...rest } = props;
  const [imageGalleryStateStore] = useState(() => new ImageGalleryStateStore());

  useEffect(() => {
    const unsubscribe = imageGalleryStateStore.registerSubscriptions();

    return () => {
      unsubscribe();
    };
  }, [imageGalleryStateStore]);

  imageGalleryStateStore.openImageGallery({
    messages: [message],
    selectedAttachmentUrl:
      message.attachments?.[0]?.asset_url || message.attachments?.[0]?.image_url || '',
  });

  return (
    <OverlayProvider value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}>
      <ImageGalleryContext.Provider
        value={{ imageGalleryStateStore } as unknown as ImageGalleryContextValue}
      >
        <ImageGalleryGrid closeGridView={closeGridView} {...rest} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

describe('ImageGalleryGrid', () => {
  it('should render ImageGalleryGrid', async () => {
    const message = generateMessage({
      attachments: [generateImageAttachment(), generateImageAttachment()],
    }) as unknown as LocalMessage;

    render(<ImageGalleryGridComponent message={message} />);

    await waitFor(() => {
      expect(screen.queryAllByLabelText('Image Grid')).toHaveLength(1);
    });
  });

  it('should render ImageGalleryGrid individual images', async () => {
    const message = generateMessage({
      attachments: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
    }) as unknown as LocalMessage;

    render(<ImageGalleryGridComponent message={message} />);

    await waitFor(() => {
      expect(screen.queryAllByLabelText('Grid Image')).toHaveLength(2);
    });
  });

  it('should trigger the selectAndClose when the Image item is pressed', async () => {
    const closeGridViewMock = jest.fn();
    const user = userEvent.setup();

    const message = generateMessage({
      attachments: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
    }) as unknown as LocalMessage;

    render(<ImageGalleryGridComponent closeGridView={closeGridViewMock} message={message} />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Grid Image')).toHaveLength(2);
    });

    await user.press(screen.getAllByLabelText('Grid Image')[0]);

    await waitFor(() => {
      expect(closeGridViewMock).toHaveBeenCalledTimes(1);
    });
  });
});
