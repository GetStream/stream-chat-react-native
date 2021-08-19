import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ImageURISource } from 'react-native';

import { checkIfLocalAvatar, getStreamChannelAvatarDir, saveAvatar } from '../../StreamMediaCache';

const GalleryImage: React.FC<
  Omit<ImageProps, 'source'> & {
    channelId: string | undefined;
    source: ImageURISource;
  }
> = (props) => {
  const [cachedSource, setCachedSource] = useState({
    ...props.source,
    uri: '',
  });

  const setCachedSourceIfExists = async () => {
    const { channelId } = props;
    const url = props.source.uri;
    const parsedUrl = url?.includes('?') ? url.split('?')[0] : url;

    if (!props.source.uri || !channelId || !parsedUrl) {
      return setCachedSource((src) => ({
        ...src,
        uri: props.source.uri as string,
      }));
    }

    if (!(await checkIfLocalAvatar(channelId, parsedUrl))) {
      await saveAvatar(channelId, parsedUrl, props.source.uri as string);
    }

    setCachedSource((src) => ({
      ...src,
      uri: `file://${getStreamChannelAvatarDir(channelId, parsedUrl)}`,
    }));
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, []);

  return cachedSource.uri ? <Image {...props} source={cachedSource} /> : null;
};

export default GalleryImage;
