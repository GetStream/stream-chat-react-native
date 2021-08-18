import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ImageURISource } from 'react-native';

import {
  checkIfLocalAttachment,
  getStreamChannelMessageAttachmentDir,
  saveAttachment,
} from '../../StreamAttachmentStorage';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

const GalleryImage: React.FC<
  Omit<ImageProps, 'source'> & {
    cacheConfig: GalleryImageCacheConfig;
    source: ImageURISource;
  }
> = (props) => {
  const [cachedSource, setCachedSource] = useState({
    ...props.source,
    uri: '',
  });

  const setCachedSourceIfExists = async () => {
    const { channelId, messageId } = props.cacheConfig;
    const parsedUrl = props.source.uri?.split('?')?.[0];
    const attachmentId = parsedUrl?.split(/(images|media)\//)[2];

    if (!messageId || !props.source.uri || !channelId || !attachmentId) {
      return setCachedSource((src) => ({
        ...src,
        uri: props.source.uri as string,
      }));
    }

    if (!(await checkIfLocalAttachment(channelId, messageId, attachmentId))) {
      await saveAttachment(channelId, messageId, attachmentId, props.source.uri as string);
    }

    return setCachedSource((src) => ({
      ...src,
      uri: `file://${getStreamChannelMessageAttachmentDir(channelId, messageId, attachmentId)}`,
    }));
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, []);

  return cachedSource.uri ? <Image {...props} source={cachedSource} /> : null;
};

export default GalleryImage;
