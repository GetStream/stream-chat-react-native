import React, { useContext } from 'react';

import type { Attachment } from 'stream-chat';

import { ImageGalleryStateStore } from '../../state-store/image-gallery-state-store';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ImageGalleryProviderProps = {
  autoPlayVideo?: boolean;
  giphyVersion?: keyof NonNullable<Attachment['giphy']>;
  numberOfImageGalleryGridColumns?: number;
};

export type ImageGalleryContextValue = ImageGalleryProviderProps & {
  imageGalleryStateStore: ImageGalleryStateStore;
};

export const ImageGalleryContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ImageGalleryContextValue,
);

export const useImageGalleryContext = () => {
  const contextValue = useContext(ImageGalleryContext) as unknown as ImageGalleryContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useImageGalleryContext hook was called outside the ImageGalleryContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }

  return contextValue as ImageGalleryContextValue;
};
