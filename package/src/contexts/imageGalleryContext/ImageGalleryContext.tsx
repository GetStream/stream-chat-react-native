import React, { PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { Attachment } from 'stream-chat';

import {
  ImageGalleryFooterProps,
  ImageGalleryVideoControlProps,
} from '../../components/ImageGallery/components/ImageGalleryFooter';
import { ImageGalleryFooter as ImageGalleryFooterDefault } from '../../components/ImageGallery/components/ImageGalleryFooter';
import { ImageGalleryHeaderProps } from '../../components/ImageGallery/components/ImageGalleryHeader';
import { ImageGalleryHeader as ImageGalleryHeaderDefault } from '../../components/ImageGallery/components/ImageGalleryHeader';
import { ImageGalleryVideoControl as ImageGalleryVideoControlDefault } from '../../components/ImageGallery/components/ImageGalleryVideoControl';
import { ImageGalleryGridProps } from '../../components/ImageGallery/components/ImageGrid';
import { ImageGalleryGrid as ImageGalleryGridDefault } from '../../components/ImageGallery/components/ImageGrid';
import { ImageGalleryStateStore } from '../../state-store/image-gallery-state-store';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ImageGalleryProviderProps = {
  autoPlayVideo?: boolean;
  /**
   * The giphy version to render - check the keys of the [Image Object](https://developers.giphy.com/docs/api/schema#image-object) for possible values. Uses 'fixed_height' by default
   * */
  giphyVersion?: keyof NonNullable<Attachment['giphy']>;
  numberOfImageGalleryGridColumns?: number;
  ImageGalleryHeader?: React.ComponentType<ImageGalleryHeaderProps>;
  ImageGalleryFooter?: React.ComponentType<ImageGalleryFooterProps>;
  ImageGalleryVideoControls?: React.ComponentType<ImageGalleryVideoControlProps>;
  ImageGalleryGrid?: React.ComponentType<ImageGalleryGridProps>;
};

export type ImageGalleryContextValue = ImageGalleryProviderProps & {
  imageGalleryStateStore: ImageGalleryStateStore;
};

export const ImageGalleryContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ImageGalleryContextValue,
);

export const ImageGalleryProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: ImageGalleryProviderProps }>) => {
  const [imageGalleryStateStore] = useState(() => new ImageGalleryStateStore(value));

  useEffect(() => {
    const unsubscribe = imageGalleryStateStore.registerSubscriptions();
    return () => {
      unsubscribe();
    };
  }, [imageGalleryStateStore]);

  const imageGalleryContextValue = useMemo(
    () => ({
      autoPlayVideo: value?.autoPlayVideo,
      imageGalleryStateStore,
      ImageGalleryHeader: ImageGalleryHeaderDefault,
      ImageGalleryFooter: ImageGalleryFooterDefault,
      ImageGalleryVideoControls: ImageGalleryVideoControlDefault,
      ImageGalleryGrid: ImageGalleryGridDefault,
      ...value,
    }),
    [imageGalleryStateStore, value],
  );

  return (
    <ImageGalleryContext.Provider
      value={imageGalleryContextValue as unknown as ImageGalleryContextValue}
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
