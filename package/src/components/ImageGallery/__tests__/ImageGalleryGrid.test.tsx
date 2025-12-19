import React, { useEffect, useState } from 'react';

import { Text, View } from 'react-native';

import { SharedValue } from 'react-native-reanimated';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { LocalMessage } from '../../../../../../stream-chat-js/dist/types/types';
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
import { ImageGrid, ImageGridType } from '../components/ImageGrid';

const ImageGalleryGridComponent = (props: Partial<ImageGridType> & { message: LocalMessage }) => {
  const { message } = props;
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
        <ImageGrid {...(props as unknown as ImageGridType)} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

describe('ImageGalleryOverlay', () => {
  it('should render ImageGalleryGrid', () => {
    const message = generateMessage({
      attachments: [generateImageAttachment(), generateImageAttachment()],
    }) as unknown as LocalMessage;

    render(<ImageGalleryGridComponent message={message} />);

    expect(screen.queryAllByLabelText('Image Grid')).toHaveLength(1);
  });

  it('should render ImageGalleryGrid individual images', () => {
    const message = generateMessage({
      attachments: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
    }) as unknown as LocalMessage;

    render(<ImageGalleryGridComponent message={message} />);

    expect(screen.queryAllByLabelText('Grid Image')).toHaveLength(2);
  });

  it('should render ImageGalleryGrid with custom image component', () => {
    const CustomImageComponent = () => (
      <View>
        <Text>Image Attachment</Text>
      </View>
    );

    const message = generateMessage({
      attachments: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
    }) as unknown as LocalMessage;

    render(<ImageGalleryGridComponent imageComponent={CustomImageComponent} message={message} />);

    expect(screen.queryAllByText('Image Attachment')).toHaveLength(2);
  });

  it('should trigger the selectAndClose when the Image item is pressed', () => {
    const closeGridViewMock = jest.fn();

    const message = generateMessage({
      attachments: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
    }) as unknown as LocalMessage;

    render(<ImageGalleryGridComponent closeGridView={closeGridViewMock} message={message} />);

    const component = screen.getAllByLabelText('Grid Image');

    act(() => {
      fireEvent(component[0], 'onPress');
    });

    expect(closeGridViewMock).toHaveBeenCalledTimes(1);
  });
});
