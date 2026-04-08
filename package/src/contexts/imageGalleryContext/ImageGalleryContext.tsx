import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';

import {
  ImageGalleryContext,
  type ImageGalleryContextValue,
  type ImageGalleryProviderProps,
  useImageGalleryContext,
} from './ImageGalleryContextBase';

import { ImageGalleryFooter as ImageGalleryFooterDefault } from '../../components/ImageGallery/components/ImageGalleryFooter';
import { ImageGalleryHeader as ImageGalleryHeaderDefault } from '../../components/ImageGallery/components/ImageGalleryHeader';
import { ImageGalleryGrid as ImageGalleryGridDefault } from '../../components/ImageGallery/components/ImageGrid';
import { ImageGalleryStateStore } from '../../state-store/image-gallery-state-store';

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
export { ImageGalleryContext, useImageGalleryContext };
export type { ImageGalleryContextValue, ImageGalleryProviderProps };
