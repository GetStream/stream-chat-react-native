import React from 'react';
import { ImageBackground, ImageProps } from 'react-native';

import { makeImageCompatibleUrl } from '../../utils/utils';

export const GalleryImage: React.FC<
  Omit<ImageProps, 'height' | 'source'> & {
    uri: string;
  }
> = (props) => {
  const { uri, ...rest } = props;

  return (
    <ImageBackground
      {...rest}
      source={{
        uri: makeImageCompatibleUrl(uri),
      }}
      testID='image-attachment-single'
    />
  );
};
