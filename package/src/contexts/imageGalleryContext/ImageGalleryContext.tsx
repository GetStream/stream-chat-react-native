import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';

import { ImageGalleryStateStore } from '../../state-store/image-gallery-state-store';
import type { UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ImageGalleryContextValue = {
  imageGalleryStateStore: ImageGalleryStateStore;
};

export const ImageGalleryContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ImageGalleryContextValue,
);

export const ImageGalleryProvider = ({ children }: PropsWithChildren<UnknownType>) => {
  const [imageGalleryStateStore] = useState(
    () => new ImageGalleryStateStore({ autoPlayVideo: false, giphyVersion: 'fixed_height' }),
  );

  useEffect(() => {
    const unsubscribe = imageGalleryStateStore.registerSubscriptions();
    return () => {
      unsubscribe();
    };
  }, [imageGalleryStateStore]);

  return (
    <ImageGalleryContext.Provider
      value={
        {
          imageGalleryStateStore,
        } as unknown as ImageGalleryContextValue
      }
    >
      {children}
    </ImageGalleryContext.Provider>
  );
};

export const useImageGalleryContext = () => {
  const contextValue = useContext(ImageGalleryContext) as unknown as ImageGalleryContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useImageGalleryContext hook was called outside the ImageGalleryContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }

  return contextValue as ImageGalleryContextValue;
};
